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
    const { booking_id, amount, currency = 'usd', metadata = {} } = await req.json();

    if (!booking_id) {
      throw new Error("Booking ID is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Calculate total amount including extras
    let totalAmount = booking.total_price;
    if (booking.booking_extras && booking.booking_extras.length > 0) {
      const extrasTotal = booking.booking_extras.reduce((sum: number, extra: any) => 
        sum + extra.total_price, 0
      );
      totalAmount += extrasTotal;
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      throw new Error("Stripe secret key not configured. Please set STRIPE_SECRET_KEY in Supabase secrets.");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_id: booking_id.toString(),
        user_id: booking.user_id,
        car_id: booking.car_id.toString(),
        ...metadata,
      },
      description: `Car rental - ${booking.cars.make} ${booking.cars.model} ${booking.cars.year}`,
    });
    
    // Update booking with Stripe payment intent ID
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_status: paymentIntent.status,
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