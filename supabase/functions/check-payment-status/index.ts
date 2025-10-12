import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@11.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.nynrentals.com",
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
    const { booking_id } = await req.json();

    if (!booking_id) {
      throw new Error("Booking ID is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(bookingError?.message || "Booking not found");
    }

    if (!booking.stripe_payment_intent_id) {
      throw new Error("No payment intent ID found for this booking");
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
    
    console.log(`Payment Intent Status: ${paymentIntent.status} for booking ${booking_id}`);

    // Update booking based on payment intent status
    let updateData: any = {};
    
    switch (paymentIntent.status) {
      case 'succeeded':
        updateData = {
          status: 'confirmed',
          stripe_payment_status: 'succeeded',
          stripe_payment_method_id: paymentIntent.payment_method as string,
          expires_at: null // Clear expiry date when confirmed
        };
        break;
      case 'processing':
        updateData = {
          stripe_payment_status: 'processing',
        };
        break;
      case 'canceled':
        updateData = {
          status: 'cancelled',
          stripe_payment_status: 'canceled',
        };
        break;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        updateData = {
          stripe_payment_status: 'pending',
        };
        break;
      default:
        updateData = {
          stripe_payment_status: paymentIntent.status,
        };
    }

    // Update booking if needed
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", booking_id);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id,
        payment_intent_status: paymentIntent.status,
        updated: Object.keys(updateData).length > 0,
        update_data: updateData,
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
    console.error("Error checking payment status:", error);
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