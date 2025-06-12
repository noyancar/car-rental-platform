import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
serve(async (req)=>{
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
    if (!carId || !startDate || !endDate) {
      throw new Error("Car ID, start date, and end date are required");
    }
    const requestStart = new Date(`${startDate}T00:00:00`);
    const requestEnd = new Date(`${endDate}T23:59:59`);
    if (requestStart >= requestEnd) {
      throw new Error("Start date must be before end date");
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: car, error: carError } = await supabase.from("cars").select("available").eq("id", carId).single();
    if (carError || !car) {
      throw new Error(carError?.message || "Car not found");
    }
    if (!car.available) {
      return new Response(JSON.stringify({
        available: false,
        message: "This car is currently marked as unavailable"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    const { data: bookings, error: bookingsError } = await supabase.from("bookings").select("start_date, end_date").eq("car_id", carId).neq("status", "cancelled");
    if (bookingsError) throw new Error(bookingsError.message);
    const isOverlapping = bookings.some((booking)=>{
      const bookingStart = new Date(`${booking.start_date}T00:00:00`);
      const bookingEnd = new Date(`${booking.end_date}T23:59:59`);
      return bookingStart <= requestEnd && bookingEnd >= requestStart;
    });
    const available = !isOverlapping;
    return new Response(JSON.stringify({
      available,
      message: available ? `Car is available between ${startDate} and ${endDate}` : "Car is already booked during the requested period"
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
