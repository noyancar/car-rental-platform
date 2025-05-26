import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const url = new URL(req.url);
    const carId = url.searchParams.get("car_id");
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    if (!carId || !startDate || !endDate) {
      throw new Error("Car ID, start date, and end date are required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if car exists and is available
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("available")
      .eq("id", carId)
      .single();

    if (carError || !car) {
      throw new Error(carError?.message || "Car not found");
    }

    if (!car.available) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "This car is currently unavailable for booking",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        }
      );
    }

    // Check for overlapping bookings
    const { data: overlappingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("car_id", carId)
      .neq("status", "cancelled")
      .or(`start_date,lte,${endDate},end_date,gte,${startDate}`);

    if (bookingsError) {
      throw new Error(bookingsError.message);
    }

    const available = overlappingBookings.length === 0;

    return new Response(
      JSON.stringify({
        available,
        message: available
          ? "Car is available for the selected dates"
          : "Car is already booked for the selected dates",
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
        available: false,
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