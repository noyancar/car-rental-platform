import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@11.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("Stripe webhook called");
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get Stripe signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No Stripe signature found in headers");
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Stripe signature found");

    // Get raw request body
    const body = await req.text();

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Stripe configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
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
    console.log(`Handling event type: ${event.type}`);
    
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;
        
        console.log(`Payment intent succeeded: ${paymentIntent.id}, booking_id: ${bookingId}`);

        if (bookingId) {
          // First, check if booking exists
          const { data: existingBooking, error: fetchError } = await supabase
            .from("bookings")
            .select("id, status, stripe_payment_status")
            .eq("id", bookingId)
            .single();
          
          if (fetchError) {
            console.error("Error fetching booking:", fetchError);
            throw fetchError;
          }
          
          console.log("Existing booking:", existingBooking);
          
          // Update booking status to confirmed
          // First try to update with matching payment intent ID
          let { data: updatedBookings, error } = await supabase
            .from("bookings")
            .update({
              status: "confirmed",
              stripe_payment_status: "succeeded",
              stripe_payment_method_id: paymentIntent.payment_method as string,
              stripe_payment_intent_id: paymentIntent.id, // Update to new payment intent ID
              expires_at: null // Clear expiry date when confirmed
            })
            .eq("id", bookingId)
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .in("status", ["pending", "draft"]) // Only confirm if booking is in pending/draft state
            .select();

          // If no rows updated, it might be because of different payment intent ID
          // Try updating by booking ID only for draft bookings
          if ((!updatedBookings || updatedBookings.length === 0) && existingBooking?.status === "draft") {
            console.log(`First update attempt failed. Trying to update draft booking ${bookingId} with new payment intent ID`);
            
            const { data: secondAttempt, error: secondError } = await supabase
              .from("bookings")
              .update({
                status: "confirmed",
                stripe_payment_status: "succeeded",
                stripe_payment_method_id: paymentIntent.payment_method as string,
                stripe_payment_intent_id: paymentIntent.id, // Update to new payment intent ID
                expires_at: null // Clear expiry date when confirmed
              })
              .eq("id", bookingId)
              .eq("status", "draft") // Only update if still in draft
              .select();

            if (secondError) {
              console.error("Error in second update attempt:", secondError);
              error = secondError;
            } else {
              updatedBookings = secondAttempt;
              error = null;
            }
          }

          if (error) {
            console.error("Error updating booking:", error);
            throw error;
          }

          if (!updatedBookings || updatedBookings.length === 0) {
            console.log(`No booking updated - it may already be confirmed. Booking ID: ${bookingId}`);
          } else {
            console.log(`Booking ${bookingId} confirmed with payment ${paymentIntent.id}`, updatedBookings[0]);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          // Check if this is a draft booking - if so, delete it
          const { data: booking } = await supabase
            .from("bookings")
            .select("status")
            .eq("id", bookingId)
            .single();
          
          if (booking?.status === "draft") {
            // Delete draft bookings on payment failure
            const { error: deleteError } = await supabase
              .from("bookings")
              .delete()
              .eq("id", bookingId);
              
            if (deleteError) {
              console.error("Error deleting draft booking:", deleteError);
            } else {
              console.log(`Draft booking ${bookingId} deleted due to payment failure`);
            }
          } else {
            // Update non-draft bookings with failed status
            const { error } = await supabase
              .from("bookings")
              .update({
                stripe_payment_status: "failed",
              })
              .eq("id", bookingId)
              .eq("stripe_payment_intent_id", paymentIntent.id);

            if (error) {
              console.error("Error updating booking:", error);
              throw error;
            }

            console.log(`Payment failed for booking ${bookingId}`);
          }
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
              stripe_payment_status: "canceled",
            })
            .eq("id", bookingId)
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .in("status", ["pending", "draft"]); // Only cancel if still pending or draft

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