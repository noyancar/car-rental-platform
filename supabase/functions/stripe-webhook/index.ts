import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@11.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.nynrentals.com",
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

            // Send admin notification email
            try {
              console.log('Sending admin notification email...');
              const emailResult = await supabase.functions.invoke('send-booking-notification', {
                body: { bookingId }
              });

              if (emailResult.error) {
                console.error('Failed to send admin notification:', emailResult.error);
              } else {
                console.log('Admin notification email sent successfully');
              }
            } catch (emailError) {
              console.error('Error sending admin notification:', emailError);
              // Don't throw - email failure shouldn't fail the webhook
            }

            // Send customer confirmation email
            try {
              console.log('Sending customer confirmation email...');
              const customerEmailResult = await supabase.functions.invoke('send-customer-confirmation', {
                body: { bookingId }
              });

              if (customerEmailResult.error) {
                console.error('Failed to send customer confirmation:', customerEmailResult.error);
              } else {
                console.log('Customer confirmation email sent successfully');
              }
            } catch (customerEmailError) {
              console.error('Error sending customer confirmation:', customerEmailError);
              // Don't throw - email failure shouldn't fail the webhook
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          // NEVER delete bookings on payment failure - just update the status
          // This allows users to retry payment with a different card
          const { error } = await supabase
            .from("bookings")
            .update({
              stripe_payment_status: "failed",
              // Keep the booking in draft/pending status so user can retry
              // Do NOT change the booking status itself
            })
            .eq("id", bookingId);

          if (error) {
            console.error("Error updating booking payment status:", error);
            throw error;
          }

          console.log(`Payment failed for booking ${bookingId} - booking preserved for retry`);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          // Only update payment status, not booking status
          // This allows users to retry with a new payment intent
          const { error } = await supabase
            .from("bookings")
            .update({
              stripe_payment_status: "canceled",
              // Do NOT change booking status - let user retry
            })
            .eq("id", bookingId)
            .eq("stripe_payment_intent_id", paymentIntent.id);

          if (error) {
            console.error("Error updating booking:", error);
            throw error;
          }

          console.log(`Payment canceled for booking ${bookingId} - booking preserved for retry`);
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