import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
serve(async (req)=>{
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }
  try {
    const url = new URL(req.url);
    const carId = url.searchParams.get("car_id");
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const pickupTime = url.searchParams.get("pickup_time") || "10:00";
    const returnTime = url.searchParams.get("return_time") || "10:00";
    if (!carId || !startDate || !endDate) {
      throw new Error("Car ID, start date, and end date are required");
    }
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(pickupTime) || !timeRegex.test(returnTime)) {
      throw new Error("Invalid time format. Use HH:MM format (e.g., 10:00)");
    }
    // Create full datetime for comparison
    const requestStartDateTime = new Date(`${startDate}T${pickupTime}:00`);
    const requestEndDateTime = new Date(`${endDate}T${returnTime}:00`);
    if (requestStartDateTime >= requestEndDateTime) {
      throw new Error("Pickup datetime must be before return datetime");
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Check if car exists and is available
    const { data: car, error: carError } = await supabase.from("cars").select("available").eq("id", carId).single();
    if (carError || !car) {
      throw new Error(carError?.message || "Car not found");
    }
    if (!car.available) {
      return new Response(JSON.stringify({
        available: false,
        requestedPeriod: {
          startDate,
          pickupTime,
          endDate,
          returnTime
        },
        message: "This car is currently unavailable for booking"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    // Get all potentially overlapping bookings
    const { data: overlappingBookings, error: bookingsError } = await supabase.from("bookings").select("id, start_date, pickup_time, end_date, return_time").eq("car_id", carId).neq("status", "cancelled");
    if (bookingsError) {
      throw new Error(bookingsError.message);
    }
    // Manual datetime overlap checking with correct column names
    const conflictingBookings = overlappingBookings.filter((booking)=>{
      const bookingStart = new Date(`${booking.start_date}T${booking.pickup_time || '10:00'}:00`);
      const bookingEnd = new Date(`${booking.end_date}T${booking.return_time || '10:00'}:00`);
      // Check for overlap: booking starts before request ends AND booking ends after request starts
      return bookingStart < requestEndDateTime && bookingEnd > requestStartDateTime;
    });
    const available = conflictingBookings.length === 0;
    // Enhanced logging for debugging
    console.log(`Availability check for car ${carId}: ${available ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
    console.log(`Requested: ${startDate} ${pickupTime} to ${endDate} ${returnTime}`);
    console.log(`Conflicting bookings found: ${conflictingBookings.length}`);
    if (conflictingBookings.length > 0) {
      console.log('Conflicting bookings:', conflictingBookings.map((b)=>`${b.start_date} ${b.pickup_time} - ${b.end_date} ${b.return_time}`));
    }
    return new Response(JSON.stringify({
      available,
      requestedPeriod: {
        startDate,
        pickupTime,
        endDate,
        returnTime
      },
      message: available ? `Car is available from ${startDate} ${pickupTime} to ${endDate} ${returnTime}` : "Car is already booked during the requested period"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      available: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }
});
