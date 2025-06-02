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
    const startTime = url.searchParams.get("start_time") || "10:00";
    const endTime = url.searchParams.get("end_time") || "10:00";

    if (!carId || !startDate || !endDate) {
      throw new Error("Car ID, start date, and end date are required");
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error("Invalid time format. Use HH:MM format (e.g., 10:00)");
    }

    // Create full datetime for comparison
    const requestStartDateTime = new Date(`${startDate}T${startTime}:00`);
    const requestEndDateTime = new Date(`${endDate}T${endTime}:00`);

    if (requestStartDateTime >= requestEndDateTime) {
      throw new Error("Start datetime must be before end datetime");
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
          requestedPeriod: {
            startDate,
            startTime,
            endDate,
            endTime
          },
          message: "This car is currently unavailable for booking"
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

    // Check for overlapping bookings with datetime precision
    const { data: overlappingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("car_id", carId)
      .neq("status", "cancelled")
      .or(
        `and(start_date.lt.${endDate},end_date.gt.${startDate}),` +
        `and(start_date.eq.${endDate},start_time.lt.${endTime}),` +
        `and(end_date.eq.${startDate},end_time.gt.${startTime})`
      );

    if (bookingsError) {
      throw new Error(bookingsError.message);
    }

    const available = overlappingBookings.length === 0;

    return new Response(
      JSON.stringify({
        available,
        requestedPeriod: {
          startDate,
          startTime,
          endDate,
          endTime
        },
        message: available
          ? `Car is available from ${startDate} ${startTime} to ${endDate} ${endTime}`
          : "Car is already booked during the requested period"
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