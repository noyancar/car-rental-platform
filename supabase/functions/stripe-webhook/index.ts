import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@13.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get Stripe signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Get raw request body
    const body = await req.text();

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error("Stripe configuration missing");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          // Update booking status to confirmed
          const { error } = await supabase
            .from("bookings")
            .update({
              status: "confirmed",
              stripe_payment_status: paymentIntent.status,
              stripe_payment_method_id: paymentIntent.payment_method as string,
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId)
            .eq("stripe_payment_intent_id", paymentIntent.id);

          if (error) {
            console.error("Error updating booking:", error);
            throw error;
          }

          console.log(`Booking ${bookingId} confirmed with payment ${paymentIntent.id}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          // Update booking with failed status
          const { error } = await supabase
            .from("bookings")
            .update({
              stripe_payment_status: paymentIntent.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId)
            .eq("stripe_payment_intent_id", paymentIntent.id);

          if (error) {
            console.error("Error updating booking:", error);
            throw error;
          }

          console.log(`Payment failed for booking ${bookingId}`);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          // Update booking status to cancelled if payment was cancelled
          const { error } = await supabase
            .from("bookings")
            .update({
              status: "cancelled",
              stripe_payment_status: paymentIntent.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId)
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .eq("status", "pending"); // Only cancel if still pending

          if (error) {
            console.error("Error updating booking:", error);
            throw error;
          }

          console.log(`Booking ${bookingId} cancelled due to payment cancellation`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Find booking by payment intent ID
          const { data: booking } = await supabase
            .from("bookings")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single();

          if (booking) {
            // Update booking status to cancelled/refunded
            const { error } = await supabase
              .from("bookings")
              .update({
                status: "cancelled",
                updated_at: new Date().toISOString(),
              })
              .eq("id", booking.id);

            if (error) {
              console.error("Error updating booking for refund:", error);
              throw error;
            }

            console.log(`Booking ${booking.id} refunded`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
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