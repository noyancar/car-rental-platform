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
    const includeDetails = url.searchParams.get("include_details") === "true";

    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }

    const requestStart = new Date(`${startDate}T00:00:00`);
    const requestEnd = new Date(`${endDate}T23:59:59`);
    
    if (requestStart >= requestEnd) {
      throw new Error("Start date must be before end date");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Eğer belirli bir araç için kontrol yapılıyorsa
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

      // Sadece aktif rezervasyonları kontrol et (confirmed veya pending)
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("start_date, end_date, status")
        .eq("car_id", carId)
        .in("status", ["confirmed", "pending"]);

      if (bookingsError) throw new Error(bookingsError.message);

      const isOverlapping = bookings.some((booking) => {
        const bookingStart = new Date(`${booking.start_date}T00:00:00`);
        const bookingEnd = new Date(`${booking.end_date}T23:59:59`);
        return bookingStart <= requestEnd && bookingEnd >= requestStart;
      });

      const available = !isOverlapping;

      return new Response(JSON.stringify({
        available,
        message: available 
          ? `Car is available between ${startDate} and ${endDate}` 
          : "Car is already booked during the requested period"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    } 
    // Tüm müsait araçları getir
    else {
      // Önce tüm müsait araçları getir
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
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 200
        });
      }

      // Tüm aktif rezervasyonları getir
      const carIds = availableCars.map(car => car.id);
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("car_id, start_date, end_date")
        .in("car_id", carIds)
        .in("status", ["confirmed", "pending"]);

      if (bookingsError) throw new Error(bookingsError.message);

      // Çakışan rezervasyonları olan araçları filtrele
      const unavailableCarIds = new Set();
      
      if (bookings && bookings.length > 0) {
        bookings.forEach(booking => {
          const bookingStart = new Date(`${booking.start_date}T00:00:00`);
          const bookingEnd = new Date(`${booking.end_date}T23:59:59`);
          
          if (bookingStart <= requestEnd && bookingEnd >= requestStart) {
            unavailableCarIds.add(booking.car_id);
          }
        });
      }

      // Müsait araçları filtrele
      const availableCarIds = availableCars
        .filter(car => !unavailableCarIds.has(car.id))
        .map(car => includeDetails ? car : car.id);

      return new Response(JSON.stringify({
        cars: availableCarIds,
        count: availableCarIds.length,
        message: `Found ${availableCarIds.length} available cars for the selected dates`
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
