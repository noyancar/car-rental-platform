import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@13.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get request body
    const { booking_id, currency = 'usd', metadata = {}, customerEmail, customerName } = await req.json();

    if (!booking_id) {
      throw new Error("Booking ID is required");
    }

    // Get the authorization header to verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    // Initialize Supabase client with user's token for RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // First check if user owns this booking using RLS
    const { data: userBookingCheck, error: checkError } = await supabaseUser
      .from("bookings")
      .select("id")
      .eq("id", booking_id)
      .single();

    if (checkError || !userBookingCheck) {
      console.error("Unauthorized access attempt for booking:", booking_id);
      throw new Error("You are not authorized to pay for this booking");
    }

    // Now get full booking details with service role for payment processing
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get booking details with extras
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        cars (make, model, year),
        booking_extras (
          quantity,
          total_price,
          extras (name)
        )
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(bookingError?.message || "Booking not found");
    }

    // Security check: Ensure booking is in a payable state
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new Error(`Cannot process payment for ${booking.status} booking`);
    }

    // Initialize Stripe first
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      throw new Error("Stripe secret key not configured. Please set STRIPE_SECRET_KEY in Supabase secrets.");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get or create Stripe customer
    let stripeCustomerId = booking.stripe_customer_id;
    const email = customerEmail || booking.email || booking.customer_email;
    const name = customerName || `${booking.first_name} ${booking.last_name}`;

    if (!stripeCustomerId && email) {
      // Search for existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
        console.log(`Found existing Stripe customer: ${stripeCustomerId}`);
      } else {
        // Create new Stripe customer
        const newCustomer = await stripe.customers.create({
          email: email,
          name: name,
          metadata: {
            booking_id: booking_id,
            user_id: booking.user_id
          }
        });
        stripeCustomerId = newCustomer.id;
        console.log(`Created new Stripe customer: ${stripeCustomerId}`);
      }

      // Update booking with Stripe customer ID and email
      await supabase
        .from("bookings")
        .update({
          stripe_customer_id: stripeCustomerId,
          customer_email: email,
          customer_name: name
        })
        .eq("id", booking_id);
    }

    // Check if a payment intent already exists
    if (booking.stripe_payment_intent_id) {
      console.log(`Existing payment intent found: ${booking.stripe_payment_intent_id}`);
      
      // Retrieve the existing payment intent from Stripe
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        
        // Check if the payment intent is still valid
        if (existingIntent.status === 'succeeded') {
          // Payment already succeeded, return success
          console.log(`Payment already succeeded for booking ${booking_id}`);
          return new Response(
            JSON.stringify({
              success: true,
              payment_intent_id: existingIntent.id,
              client_secret: existingIntent.client_secret,
              amount: existingIntent.amount,
              currency: existingIntent.currency,
              status: 'succeeded',
              message: 'Payment already completed'
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
              status: 200,
            }
          );
        } else if (existingIntent.status === 'requires_payment_method' || 
                   existingIntent.status === 'requires_confirmation' ||
                   existingIntent.status === 'requires_action' ||
                   existingIntent.status === 'processing') {
          // Payment intent is still usable
          console.log(`Returning existing payment intent with status: ${existingIntent.status}`);
          
          return new Response(
            JSON.stringify({
              success: true,
              payment_intent_id: existingIntent.id,
              client_secret: existingIntent.client_secret,
              amount: existingIntent.amount,
              currency: existingIntent.currency,
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
              status: 200,
            }
          );
        } else {
          // Payment intent is canceled or failed, create a new one
          console.log(`Existing payment intent has status: ${existingIntent.status}, creating new one`);
        }
      } catch (error) {
        console.error('Error retrieving existing payment intent:', error);
        // Continue to create a new payment intent
      }
    }

    // Use grand_total if available, otherwise calculate manually for backward compatibility
    let totalAmount = booking.grand_total || booking.total_price;
    
    // If grand_total is not set or equals total_price, calculate extras manually
    if (!booking.grand_total || booking.grand_total === booking.total_price) {
      if (booking.booking_extras && booking.booking_extras.length > 0) {
        const extrasTotal = booking.booking_extras.reduce((sum: number, extra: any) => 
          sum + extra.total_price, 0
        );
        totalAmount = booking.total_price + extrasTotal;
      }
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);

    // Create payment intent with idempotency key
    // Use booking ID and a fixed string to ensure only ONE payment intent per booking
    // Even if user clicks multiple times, Stripe will return the same payment intent
    const idempotencyKey = `booking_${booking_id}_intent`;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      customer: stripeCustomerId, // Attach to customer for history
      receipt_email: email, // This triggers automatic receipt email from Stripe!
      metadata: {
        booking_id: booking_id.toString(),
        user_id: booking.user_id,
        car_id: booking.car_id.toString(),
        customer_email: email,
        customer_name: name,
        rental_dates: `${booking.start_date} to ${booking.end_date}`,
        ...metadata,
      },
      description: `Car Rental - Booking #${booking_id.slice(0, 8).toUpperCase()} - ${booking.cars.make} ${booking.cars.model} ${booking.cars.year}`,
      statement_descriptor_suffix: 'CAR RENTAL',
    }, {
      idempotencyKey: idempotencyKey
    });
    
    // Update booking with Stripe payment intent ID
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_status: "pending",
      })
      .eq("id", booking_id);

    if (updateError) {
      // If we can't update the booking, cancel the payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw new Error(updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: amountInCents,
        currency: paymentIntent.currency,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});