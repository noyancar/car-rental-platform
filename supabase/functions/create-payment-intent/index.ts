import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get request body
    const { booking_id, payment_method_id } = await req.json();

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
      .select(`
        *,
        cars (make, model, year),
        profiles (first_name, last_name, email)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(bookingError?.message || "Booking not found");
    }

    // Use Stripe SDK to create a payment intent
    // This is a placeholder - you would replace this with actual Stripe integration code
    // const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");
    
    // For demo purposes, we're simulating a successful payment
    const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
    
    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_intent_id: paymentIntentId,
        status: "confirmed"
      })
      .eq("id", booking_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent_id: paymentIntentId,
        client_secret: "dummy_client_secret_for_demo",
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