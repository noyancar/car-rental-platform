import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

/**
 * Helper function to check if two time ranges overlap
 * Returns true if there is any overlap between the ranges
 */
function hasTimeOverlap(
  range1Start: Date,
  range1End: Date,
  range2Start: Date,
  range2End: Date
): boolean {
  return !(range1End <= range2Start || range1Start >= range2End);
}

/**
 * Check if a car has any overlapping unavailability periods
 */
async function hasUnavailabilityOverlap(
  supabase: ReturnType<typeof createClient>,
  carId: string,
  requestStart: Date,
  requestEnd: Date
): Promise<boolean> {
  // Now uses same structure as bookings: start_date, end_date, start_time, end_time
  const { data: unavailabilities, error } = await supabase
    .from("car_unavailability")
    .select("start_date, end_date, start_time, end_time")
    .eq("car_id", carId);

  if (error) {
    console.error("Error fetching unavailabilities:", error.message);
    return false; // Fail open - don't block if we can't check
  }

  if (!unavailabilities || unavailabilities.length === 0) {
    return false;
  }

  return unavailabilities.some((unavail) => {
    const unavailStart = new Date(`${unavail.start_date}T${unavail.start_time || "10:00"}:00`);
    const unavailEnd = new Date(`${unavail.end_date}T${unavail.end_time || "10:00"}:00`);
    return hasTimeOverlap(requestStart, requestEnd, unavailStart, unavailEnd);
  });
}

/**
 * Check if a booking overlaps with the requested time range
 * Handles draft booking expiration
 */
function isBookingOverlapping(
  booking: {
    start_date: string;
    end_date: string;
    pickup_time?: string;
    return_time?: string;
    status: string;
    expires_at?: string;
  },
  requestStart: Date,
  requestEnd: Date
): boolean {
  // Skip expired draft bookings
  if (booking.status === 'draft' && booking.expires_at) {
    const expiryDate = new Date(booking.expires_at);
    if (expiryDate < new Date()) {
      return false;
    }
  }

  const bookingStart = new Date(`${booking.start_date}T${booking.pickup_time || "10:00"}:00`);
  const bookingEnd = new Date(`${booking.end_date}T${booking.return_time || "10:00"}:00`);

  return hasTimeOverlap(requestStart, requestEnd, bookingStart, bookingEnd);
}

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

    // Location parameters (for future use)
    const pickupLocationId = url.searchParams.get("pickup_location_id");
    const returnLocationId = url.searchParams.get("return_location_id");
    const pickupLocationValue = url.searchParams.get("pickup_location");
    const returnLocationValue = url.searchParams.get("return_location");

    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }

    // Create full date-time objects (no timezone suffix to match stored format)
    const requestStart = new Date(`${startDate}T${pickupTime}:00`);
    const requestEnd = new Date(`${endDate}T${returnTime}:00`);

    if (requestStart >= requestEnd) {
      throw new Error("Start date and time must be before end date and time");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Always use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert location values to IDs if needed (for future location-based filtering)
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

    // =========================================================================
    // SINGLE CAR AVAILABILITY CHECK
    // =========================================================================
    if (carId) {
      // 1. Check if car exists and is generally available
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }

      // 2. Check for manual unavailability blocks (Turo, maintenance, etc.)
      const hasUnavailability = await hasUnavailabilityOverlap(
        supabase,
        carId,
        requestStart,
        requestEnd
      );

      if (hasUnavailability) {
        return new Response(JSON.stringify({
          available: false,
          message: "Car is blocked during the requested period"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }

      // 3. Check for overlapping bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("start_date, end_date, pickup_time, return_time, status, expires_at")
        .eq("car_id", carId)
        .in("status", ["confirmed", "pending", "draft"]);

      if (bookingsError) throw new Error(bookingsError.message);

      const hasBookingOverlap = bookings?.some((booking) =>
        isBookingOverlapping(booking, requestStart, requestEnd)
      ) ?? false;

      const available = !hasBookingOverlap;

      return new Response(JSON.stringify({
        available,
        message: available
          ? `Car is available between ${startDate} ${pickupTime} and ${endDate} ${returnTime}`
          : "Car is already booked during the requested period"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // =========================================================================
    // ALL AVAILABLE CARS CHECK
    // =========================================================================
    else {
      // 1. Get all generally available cars
      const { data: availableCars, error: carsError } = await supabase
        .from("cars")
        .select(includeDetails ? "*" : "id")
        .eq("available", true);

      if (carsError) throw new Error(carsError.message);

      if (!availableCars || availableCars.length === 0) {
        return new Response(JSON.stringify({
          cars: [],
          message: "No available cars found"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }

      const carIds = availableCars.map(car => car.id);

      // 2. Get all manual unavailability blocks for these cars (same structure as bookings)
      const { data: unavailabilities, error: unavailError } = await supabase
        .from("car_unavailability")
        .select("car_id, start_date, end_date, start_time, end_time")
        .in("car_id", carIds);

      if (unavailError) {
        console.error("Error fetching unavailabilities:", unavailError.message);
      }

      // 3. Get all active bookings for these cars
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("car_id, start_date, end_date, pickup_time, return_time, status, expires_at")
        .in("car_id", carIds)
        .in("status", ["confirmed", "pending", "draft"]);

      if (bookingsError) throw new Error(bookingsError.message);

      // 4. Build set of unavailable car IDs
      const unavailableCarIds = new Set<string>();

      // Check unavailability blocks (same structure as bookings now)
      if (unavailabilities && unavailabilities.length > 0) {
        unavailabilities.forEach(unavail => {
          const unavailStart = new Date(`${unavail.start_date}T${unavail.start_time || "10:00"}:00`);
          const unavailEnd = new Date(`${unavail.end_date}T${unavail.end_time || "10:00"}:00`);

          if (hasTimeOverlap(requestStart, requestEnd, unavailStart, unavailEnd)) {
            unavailableCarIds.add(unavail.car_id);
          }
        });
      }

      // Check bookings
      if (bookings && bookings.length > 0) {
        bookings.forEach(booking => {
          if (isBookingOverlapping(booking, requestStart, requestEnd)) {
            unavailableCarIds.add(booking.car_id);
          }
        });
      }

      // 5. Filter to get available cars
      const availableCarResults = availableCars
        .filter(car => !unavailableCarIds.has(car.id))
        .map(car => includeDetails ? car : car.id);

      return new Response(JSON.stringify({
        cars: availableCarResults,
        count: availableCarResults.length,
        message: `Found ${availableCarResults.length} available cars for the selected dates and times`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      available: false,
      cars: [],
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
