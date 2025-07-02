import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
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
    const includeDetails = url.searchParams.get("include_details") === "true";
    
    // New location parameters
    const pickupLocationId = url.searchParams.get("pickup_location_id");
    const returnLocationId = url.searchParams.get("return_location_id");
    
    // Legacy support for location values
    const pickupLocationValue = url.searchParams.get("pickup_location");
    const returnLocationValue = url.searchParams.get("return_location");

    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }

    // Create full date-time objects
    const requestStart = new Date(`${startDate}T${pickupTime}:00`);
    const requestEnd = new Date(`${endDate}T${returnTime}:00`);
    
    if (requestStart >= requestEnd) {
      throw new Error("Start date and time must be before end date and time");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Always use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If location values are provided but not IDs, convert them
    let actualPickupLocationId = pickupLocationId;
    let actualReturnLocationId = returnLocationId;
    
    if (!actualPickupLocationId && pickupLocationValue) {
      const { data: pickupLoc } = await supabase
        .from("locations")
        .select("id")
        .eq("value", pickupLocationValue)
        .single();
      
      if (pickupLoc) {
        actualPickupLocationId = pickupLoc.id;
      }
    }
    
    if (!actualReturnLocationId && returnLocationValue) {
      const { data: returnLoc } = await supabase
        .from("locations")
        .select("id")
        .eq("value", returnLocationValue)
        .single();
      
      if (returnLoc) {
        actualReturnLocationId = returnLoc.id;
      }
    }

    // Check availability for a specific car
    if (carId) {
      const { data: car, error: carError } = await supabase
        .from("cars")
        .select("available")
        .eq("id", carId)
        .single();

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

      // All cars are available at all locations - no need to check location availability

      // Check for overlapping bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("start_date, end_date, pickup_time, return_time, status")
        .eq("car_id", carId)
        .in("status", ["confirmed", "pending"]);

      if (bookingsError) throw new Error(bookingsError.message);

      // Check for overlaps
      const isOverlapping = bookings.some((booking) => {
        const bookingStart = new Date(`${booking.start_date}T${booking.pickup_time || "10:00"}:00`);
        const bookingEnd = new Date(`${booking.end_date}T${booking.return_time || "10:00"}:00`);
        
        return !(bookingEnd <= requestStart || bookingStart >= requestEnd);
      });

      const available = !isOverlapping;

      return new Response(JSON.stringify({
        available,
        message: available 
          ? `Car is available between ${startDate} ${pickupTime} and ${endDate} ${returnTime}` 
          : "Car is already booked during the requested period"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    } 
    // Get all available cars
    else {
      // Build the query
      let query = supabase
        .from("cars")
        .select(includeDetails ? "*" : "id")
        .eq("available", true);

      // All cars are available at all locations - no location filtering needed

      const { data: availableCars, error: carsError } = await query;

      if (carsError) throw new Error(carsError.message);
      
      if (!availableCars || availableCars.length === 0) {
        return new Response(JSON.stringify({
          cars: [],
          message: "No available cars found"
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 200
        });
      }

      // Get all active bookings for these cars
      const carIds = availableCars.map(car => car.id);
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("car_id, start_date, end_date, pickup_time, return_time")
        .in("car_id", carIds)
        .in("status", ["confirmed", "pending"]);

      if (bookingsError) throw new Error(bookingsError.message);

      // Filter out cars with overlapping bookings
      const unavailableCarIds = new Set();
      
      if (bookings && bookings.length > 0) {
        bookings.forEach(booking => {
          const bookingStart = new Date(`${booking.start_date}T${booking.pickup_time || "10:00"}:00`);
          const bookingEnd = new Date(`${booking.end_date}T${booking.return_time || "10:00"}:00`);
          
          if (!(bookingEnd <= requestStart || bookingStart >= requestEnd)) {
            unavailableCarIds.add(booking.car_id);
          }
        });
      }

      // Filter available cars
      const availableCarIds = availableCars
        .filter(car => !unavailableCarIds.has(car.id))
        .map(car => includeDetails ? car : car.id);

      return new Response(JSON.stringify({
        cars: availableCarIds,
        count: availableCarIds.length,
        message: `Found ${availableCarIds.length} available cars for the selected dates and times`
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      available: false,
      cars: [],
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