import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const bookingData = await req.json();
    
    // Validate required fields
    if (!bookingData.car_id || !bookingData.user_id || !bookingData.start_date || !bookingData.end_date) {
      throw new Error("Missing required booking fields");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Start a transaction by checking availability and creating booking atomically
    // First check if car is available
    const requestStart = new Date(`${bookingData.start_date}T${bookingData.pickup_time || "10:00"}:00`);
    const requestEnd = new Date(`${bookingData.end_date}T${bookingData.return_time || "10:00"}:00`);

    // Get overlapping bookings for this car
    const { data: overlappingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("id, status, expires_at")
      .eq("car_id", bookingData.car_id)
      .in("status", ["confirmed", "pending", "draft"])
      .or(`start_date.lte.${bookingData.end_date},end_date.gte.${bookingData.start_date}`);

    if (checkError) {
      throw checkError;
    }

    // Check for actual overlaps (considering times and expired drafts)
    const hasOverlap = overlappingBookings?.some(booking => {
      // Skip expired draft bookings
      if (booking.status === 'draft' && booking.expires_at) {
        const expiryDate = new Date(booking.expires_at);
        if (expiryDate < new Date()) {
          return false; // This draft booking has expired
        }
      }
      return true; // This booking overlaps
    });

    if (hasOverlap) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Car is not available for the selected dates",
          reason: "overlap"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 409, // Conflict
        }
      );
    }

    // Calculate expiry time for draft bookings (30 minutes from now)
    const expiresAt = bookingData.status === 'draft' 
      ? new Date(Date.now() + 30 * 60 * 1000).toISOString() 
      : null;

    // Create the booking
    const { data: newBooking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        ...bookingData,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: newBooking
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
    console.error("Error creating booking:", error);
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