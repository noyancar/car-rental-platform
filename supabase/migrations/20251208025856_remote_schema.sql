

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."extra_category" AS ENUM (
    'services',
    'safety',
    'beach',
    'tech',
    'camping'
);


ALTER TYPE "public"."extra_category" OWNER TO "postgres";


CREATE TYPE "public"."extra_price_type" AS ENUM (
    'per_day',
    'one_time'
);


ALTER TYPE "public"."extra_price_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_delete_expired_drafts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete draft bookings that have passed their expiry time
  DELETE FROM bookings
  WHERE status = 'draft'
  AND expires_at IS NOT NULL
  AND expires_at < NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_delete_expired_drafts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_car_price"("p_car_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("total_price" numeric, "daily_breakdown" "jsonb", "base_price_days" integer, "special_price_days" integer, "average_per_day" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_current_date DATE;
  v_daily_price NUMERIC;
  v_total NUMERIC := 0;
  v_breakdown JSONB := '[]'::JSONB;
  v_base_days INTEGER := 0;
  v_special_days INTEGER := 0;
  v_day_count INTEGER := 0;
  v_pricing_name TEXT;
BEGIN
  -- Validate inputs
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date must be before or equal to end date';
  END IF;

  IF p_car_id IS NULL THEN
    RAISE EXCEPTION 'Car ID cannot be null';
  END IF;

  -- Loop through each day in the date range
  v_current_date := p_start_date;

  WHILE v_current_date <= p_end_date LOOP
    -- Find price for this specific day (highest priority wins)
    SELECT
      COALESCE(csp.price_per_day, c.price_per_day),
      csp.name
    INTO v_daily_price, v_pricing_name
    FROM cars c
    LEFT JOIN car_seasonal_pricing csp ON (
      csp.car_id = c.id
      AND csp.active = true
      AND v_current_date BETWEEN csp.valid_from AND csp.valid_to
    )
    WHERE c.id = p_car_id
    ORDER BY csp.priority DESC NULLS LAST
    LIMIT 1;

    -- If no price found, car doesn't exist
    IF v_daily_price IS NULL THEN
      RAISE EXCEPTION 'Car not found with id: %', p_car_id;
    END IF;

    -- Add to total
    v_total := v_total + v_daily_price;
    v_day_count := v_day_count + 1;

    -- Build daily breakdown
    v_breakdown := v_breakdown || jsonb_build_object(
      'date', v_current_date::TEXT,
      'price', v_daily_price,
      'pricing_name', COALESCE(v_pricing_name, 'Base Price'),
      'is_special_price', v_pricing_name IS NOT NULL
    );

    -- Count special vs base days
    IF v_pricing_name IS NOT NULL THEN
      v_special_days := v_special_days + 1;
    ELSE
      v_base_days := v_base_days + 1;
    END IF;

    -- Move to next day
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;

  -- Return results
  RETURN QUERY SELECT
    v_total,
    v_breakdown,
    v_base_days,
    v_special_days,
    CASE WHEN v_day_count > 0 THEN ROUND(v_total / v_day_count, 2) ELSE 0 END;
END;
$$;


ALTER FUNCTION "public"."calculate_car_price"("p_car_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_car_price"("p_car_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Calculates total price and daily breakdown for a car rental. Considers seasonal pricing with priority system. Returns total price, daily breakdown JSON, day counts, and average price per day.';



CREATE OR REPLACE FUNCTION "public"."check_extra_availability"("p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_date DATE;
  v_available INTEGER;
  v_stock_quantity INTEGER;
BEGIN
  -- Get the stock quantity for the extra
  SELECT stock_quantity INTO v_stock_quantity
  FROM extras
  WHERE id = p_extra_id AND active = true;
  
  -- If stock_quantity is NULL, it means unlimited stock
  IF v_stock_quantity IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check availability for each date in the range
  FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
  LOOP
    SELECT COALESCE(available_count, v_stock_quantity) INTO v_available
    FROM extras_inventory
    WHERE extra_id = p_extra_id AND date = v_date;
    
    -- If no inventory record exists, use the default stock quantity
    IF v_available IS NULL THEN
      v_available := v_stock_quantity;
    END IF;
    
    -- Check if requested quantity is available
    IF v_available < p_quantity THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."check_extra_availability"("p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_draft_bookings"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM bookings 
  WHERE status = 'draft' 
  AND expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_draft_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_car_pricing_preview"("p_car_id" "uuid", "p_date" "date") RETURNS TABLE("date" "date", "price_per_day" numeric, "pricing_name" "text", "is_special_price" boolean, "priority" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_date as date,
    COALESCE(csp.price_per_day, c.price_per_day) as price_per_day,
    COALESCE(csp.name, 'Base Price') as pricing_name,
    csp.id IS NOT NULL as is_special_price,
    COALESCE(csp.priority, 0) as priority
  FROM cars c
  LEFT JOIN car_seasonal_pricing csp ON (
    csp.car_id = c.id
    AND csp.active = true
    AND p_date BETWEEN csp.valid_from AND csp.valid_to
  )
  WHERE c.id = p_car_id
  ORDER BY csp.priority DESC NULLS LAST
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_car_pricing_preview"("p_car_id" "uuid", "p_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_car_pricing_preview"("p_car_id" "uuid", "p_date" "date") IS 'Returns pricing information for a specific car on a specific date. Useful for admin preview and debugging.';



CREATE OR REPLACE FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) RETURNS TABLE("user_id" "uuid", "email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access user emails';
  END IF;
  
  -- Return emails for the given user IDs
  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;


ALTER FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) 
  DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'Checks if current user has admin role. Uses SECURITY DEFINER to bypass RLS on profiles table.';



CREATE OR REPLACE FUNCTION "public"."prevent_role_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- If updating and role is being changed
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        -- Check if current user is admin
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        ) THEN
            -- Revert role change
            NEW.role = OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_role_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_extras_inventory"("p_booking_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_booking_record RECORD;
  v_extra_record RECORD;
BEGIN
  -- Get booking dates
  SELECT start_date, end_date INTO v_booking_record
  FROM bookings
  WHERE id = p_booking_id;
  
  -- Release inventory for each extra
  FOR v_extra_record IN 
    SELECT be.extra_id, be.quantity
    FROM booking_extras be
    JOIN extras e ON e.id = be.extra_id
    WHERE be.booking_id = p_booking_id
    AND e.stock_quantity IS NOT NULL
  LOOP
    UPDATE extras_inventory
    SET reserved_count = GREATEST(0, reserved_count - v_extra_record.quantity),
        updated_at = NOW()
    WHERE extra_id = v_extra_record.extra_id
    AND date BETWEEN v_booking_record.start_date AND v_booking_record.end_date;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."release_extras_inventory"("p_booking_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_extras_inventory"("p_booking_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_booking_record RECORD;
    v_extra_record RECORD;
BEGIN
    -- Get booking dates
    SELECT start_date, end_date INTO v_booking_record
    FROM bookings
    WHERE id = p_booking_id;
    
    -- Release inventory for each extra
    FOR v_extra_record IN 
        SELECT be.extra_id, be.quantity
        FROM booking_extras be
        JOIN extras e ON e.id = be.extra_id
        WHERE be.booking_id = p_booking_id
        AND e.stock_quantity IS NOT NULL
    LOOP
        UPDATE extras_inventory
        SET reserved_count = GREATEST(0, reserved_count - v_extra_record.quantity),
            updated_at = NOW()
        WHERE extra_id = v_extra_record.extra_id
        AND date BETWEEN v_booking_record.start_date AND v_booking_record.end_date;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."release_extras_inventory"("p_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_extras_inventory"("p_booking_id" integer, "p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_date DATE;
  v_stock_quantity INTEGER;
BEGIN
  -- Get the stock quantity for the extra
  SELECT stock_quantity INTO v_stock_quantity
  FROM extras
  WHERE id = p_extra_id;
  
  -- If stock_quantity is NULL, no need to track inventory
  IF v_stock_quantity IS NULL THEN
    RETURN;
  END IF;
  
  -- Reserve inventory for each date
  FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
  LOOP
    -- Insert or update inventory record
    INSERT INTO extras_inventory (extra_id, date, total_stock, reserved_count)
    VALUES (p_extra_id, v_date, v_stock_quantity, p_quantity)
    ON CONFLICT (extra_id, date) DO UPDATE
    SET reserved_count = extras_inventory.reserved_count + p_quantity,
        updated_at = NOW();
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."reserve_extras_inventory"("p_booking_id" integer, "p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_extras_inventory"("p_booking_id" "uuid", "p_extra_id" "uuid", "p_quantity" integer, "p_start_date" "date", "p_end_date" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_date DATE;
    v_stock_quantity INTEGER;
BEGIN
    -- Get the stock quantity for the extra
    SELECT stock_quantity INTO v_stock_quantity
    FROM extras
    WHERE id = p_extra_id;
    
    -- If stock_quantity is NULL, no need to track inventory
    IF v_stock_quantity IS NULL THEN
        RETURN;
    END IF;
    
    -- Reserve inventory for each date
    FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
    LOOP
        -- Insert or update inventory record
        INSERT INTO extras_inventory (extra_id, date, total_stock, reserved_count)
        VALUES (p_extra_id, v_date, v_stock_quantity, p_quantity)
        ON CONFLICT (extra_id, date) DO UPDATE
        SET reserved_count = extras_inventory.reserved_count + p_quantity,
            updated_at = NOW();
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."reserve_extras_inventory"("p_booking_id" "uuid", "p_extra_id" "uuid", "p_quantity" integer, "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_booking_extras_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE bookings 
    SET extras_total = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM booking_extras 
        WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
    )
    WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_booking_extras_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update customer stats when booking is confirmed (not completed)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE profiles
    SET 
      total_bookings = total_bookings + 1,
      total_spent = total_spent + COALESCE(NEW.grand_total, NEW.total_price, 0),
      last_booking_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  END IF;
  
  -- Decrease stats if booking is cancelled after being confirmed
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    UPDATE profiles
    SET 
      total_bookings = GREATEST(0, total_bookings - 1),
      total_spent = GREATEST(0, total_spent - COALESCE(OLD.grand_total, OLD.total_price, 0))
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."booking_extras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "extra_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "booking_id" "uuid",
    CONSTRAINT "booking_extras_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."booking_extras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "pickup_time" character varying,
    "return_time" character varying,
    "extras_total" numeric(10,2) DEFAULT 0,
    "grand_total" numeric(10,2) GENERATED ALWAYS AS (("total_price" + COALESCE("extras_total", (0)::numeric))) STORED,
    "pickup_location_id" "uuid",
    "return_location_id" "uuid",
    "stripe_payment_intent_id" "text",
    "stripe_payment_status" "text",
    "stripe_payment_method_id" "text",
    "stripe_refund_id" "text",
    "refunded_amount" numeric(10,2) DEFAULT 0,
    "expires_at" timestamp with time zone,
    "car_rental_subtotal" numeric DEFAULT 0,
    "pickup_delivery_fee" numeric DEFAULT 0,
    "return_delivery_fee" numeric DEFAULT 0,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "car_id" "uuid",
    "discount_code_id" "uuid",
    "stripe_customer_id" "text",
    "customer_email" "text",
    "customer_name" "text",
    "email" "text",
    "first_name" "text",
    "last_name" "text",
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text"]))),
    CONSTRAINT "check_stripe_payment_status" CHECK ((("stripe_payment_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'succeeded'::"text", 'failed'::"text", 'canceled'::"text"])) OR ("stripe_payment_status" IS NULL)))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."stripe_payment_intent_id" IS 'Stripe PaymentIntent ID for tracking payment';



COMMENT ON COLUMN "public"."bookings"."stripe_payment_status" IS 'Current status of the Stripe payment';



COMMENT ON COLUMN "public"."bookings"."stripe_payment_method_id" IS 'Stripe PaymentMethod ID used for payment';



COMMENT ON COLUMN "public"."bookings"."stripe_refund_id" IS 'Stripe Refund ID if payment was refunded';



COMMENT ON COLUMN "public"."bookings"."refunded_amount" IS 'Amount refunded in case of partial or full refund';



COMMENT ON COLUMN "public"."bookings"."expires_at" IS 'Expiry time for draft bookings. NULL for non-draft bookings.';



COMMENT ON COLUMN "public"."bookings"."car_rental_subtotal" IS 'Base car rental cost excluding delivery fees and extras';



COMMENT ON COLUMN "public"."bookings"."pickup_delivery_fee" IS 'Delivery fee for pickup location';



COMMENT ON COLUMN "public"."bookings"."return_delivery_fee" IS 'Delivery fee for return location (0 if same as pickup)';



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "discount_percentage" integer NOT NULL,
    "valid_from" "date" NOT NULL,
    "valid_to" "date" NOT NULL,
    "featured_image_url" "text" NOT NULL,
    "active" boolean DEFAULT true,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."car_seasonal_pricing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "car_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_per_day" numeric NOT NULL,
    "valid_from" "date" NOT NULL,
    "valid_to" "date" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "car_seasonal_pricing_price_per_day_check" CHECK (("price_per_day" >= (0)::numeric)),
    CONSTRAINT "valid_date_range" CHECK (("valid_to" >= "valid_from")),
    CONSTRAINT "valid_priority" CHECK (("priority" >= 0))
);


ALTER TABLE "public"."car_seasonal_pricing" OWNER TO "postgres";


COMMENT ON TABLE "public"."car_seasonal_pricing" IS 'Date-range based pricing for individual vehicles. Allows setting different prices for specific date ranges (e.g., holidays, peak seasons, promotions).';



COMMENT ON COLUMN "public"."car_seasonal_pricing"."name" IS 'Display name for the pricing period (e.g., "Black Friday Sale", "Christmas Season", "Summer Peak")';



COMMENT ON COLUMN "public"."car_seasonal_pricing"."priority" IS 'Higher priority takes precedence when date ranges overlap. Use 100+ for promotions, 50+ for peak seasons, 0-49 for off-peak.';



CREATE TABLE IF NOT EXISTS "public"."cars" (
    "created_at" timestamp with time zone DEFAULT "now"(),
    "make" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer NOT NULL,
    "price_per_day" numeric(10,2) NOT NULL,
    "category" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "available" boolean DEFAULT true,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "description" "text" NOT NULL,
    "seats" integer DEFAULT 5,
    "transmission" "text" DEFAULT 'Automatic'::"text",
    "mileage_type" "text" DEFAULT 'Unlimited'::"text",
    "image_urls" "text"[] DEFAULT '{}'::"text"[],
    "main_image_index" integer DEFAULT 0,
    "trim" "text",
    "color" "text",
    "license_plate" "text",
    "doors" integer,
    "fuel_type" "text",
    "gas_grade" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "cars_doors_check" CHECK (("doors" = ANY (ARRAY[2, 4, 5]))),
    CONSTRAINT "cars_fuel_type_check" CHECK (("fuel_type" = ANY (ARRAY['Gas'::"text", 'Electric'::"text", 'Hybrid'::"text"]))),
    CONSTRAINT "cars_gas_grade_check" CHECK (("gas_grade" = ANY (ARRAY['Regular'::"text", 'Premium'::"text", 'N/A'::"text"])))
);


ALTER TABLE "public"."cars" OWNER TO "postgres";


COMMENT ON TABLE "public"."cars" IS 'Cars table - min_rental_hours column removed as it was not being enforced';



COMMENT ON COLUMN "public"."cars"."image_urls" IS 'Array of image URLs for the car';



COMMENT ON COLUMN "public"."cars"."main_image_index" IS 'Index of the main image in the image_urls array';



CREATE TABLE IF NOT EXISTS "public"."customer_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discount_codes" (
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code" "text" NOT NULL,
    "discount_percentage" integer NOT NULL,
    "valid_from" "date" NOT NULL,
    "valid_to" "date" NOT NULL,
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."discount_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."extras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "price_type" "public"."extra_price_type" DEFAULT 'per_day'::"public"."extra_price_type" NOT NULL,
    "category" "public"."extra_category" NOT NULL,
    "stock_quantity" integer,
    "max_per_booking" integer DEFAULT 99,
    "icon_name" "text",
    "image_url" "text",
    "sort_order" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."extras" OWNER TO "postgres";


COMMENT ON COLUMN "public"."extras"."price_type" IS 'All extras use one_time pricing as of 2025-01-17';



CREATE TABLE IF NOT EXISTS "public"."extras_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "extra_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_stock" integer NOT NULL,
    "reserved_count" integer DEFAULT 0,
    "available_count" integer GENERATED ALWAYS AS (("total_stock" - "reserved_count")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."extras_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value" "text" NOT NULL,
    "label" "text" NOT NULL,
    "address" "text" NOT NULL,
    "category" "text" NOT NULL,
    "delivery_fee" numeric(10,2) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "phone" "text",
    "email" "text",
    "coordinates" "jsonb",
    "operating_hours" "jsonb",
    "metadata" "jsonb",
    "distance_from_base" numeric(10,2),
    CONSTRAINT "locations_category_check" CHECK (("category" = ANY (ARRAY['base'::"text", 'airport'::"text", 'hotel'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."locations" IS 'Stores all pickup and return locations for the car rental service';



COMMENT ON COLUMN "public"."locations"."value" IS 'Unique identifier used in the application (e.g., base-office)';



COMMENT ON COLUMN "public"."locations"."coordinates" IS 'GPS coordinates as {lat: number, lng: number}';



COMMENT ON COLUMN "public"."locations"."operating_hours" IS 'Operating hours by day of week';



COMMENT ON COLUMN "public"."locations"."metadata" IS 'Additional location-specific information';



COMMENT ON COLUMN "public"."locations"."distance_from_base" IS 'Distance from base office in miles. NULL for locations requiring quote.';



CREATE TABLE IF NOT EXISTS "public"."payment_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_event_id" "text",
    "event_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "amount" numeric(10,2),
    "currency" "text" DEFAULT 'usd'::"text",
    "error_message" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booking_id" "uuid"
);


ALTER TABLE "public"."payment_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."payment_logs" IS 'Audit log for all payment-related events';



COMMENT ON COLUMN "public"."payment_logs"."stripe_event_id" IS 'Unique Stripe webhook event ID to prevent duplicate processing';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "address" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "is_blacklisted" boolean DEFAULT false,
    "blacklist_reason" "text",
    "total_bookings" integer DEFAULT 0,
    "total_spent" numeric(10,2) DEFAULT 0,
    "last_booking_date" "date",
    "email" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'manager'::"text", 'support'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles - license fields removed to simplify booking process';



CREATE TABLE IF NOT EXISTS "public"."qr_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "qr_code" "text" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ip_address" "text",
    "user_agent" "text"
);


ALTER TABLE "public"."qr_scans" OWNER TO "postgres";


ALTER TABLE ONLY "public"."booking_extras"
    ADD CONSTRAINT "booking_extras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_uuid_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_uuid_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."car_seasonal_pricing"
    ADD CONSTRAINT "car_seasonal_pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_license_plate_key" UNIQUE ("license_plate");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_uuid_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."customer_notes"
    ADD CONSTRAINT "customer_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discount_codes"
    ADD CONSTRAINT "discount_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."discount_codes"
    ADD CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discount_codes"
    ADD CONSTRAINT "discount_codes_uuid_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."extras_inventory"
    ADD CONSTRAINT "extras_inventory_extra_id_date_key" UNIQUE ("extra_id", "date");



ALTER TABLE ONLY "public"."extras_inventory"
    ADD CONSTRAINT "extras_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extras"
    ADD CONSTRAINT "extras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."extras"
    ADD CONSTRAINT "extras_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."payment_logs"
    ADD CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_scans"
    ADD CONSTRAINT "qr_scans_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_booking_extras_booking_id" ON "public"."booking_extras" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_extras_extra" ON "public"."booking_extras" USING "btree" ("extra_id");



CREATE INDEX "idx_bookings_car_id" ON "public"."bookings" USING "btree" ("car_id");



CREATE INDEX "idx_bookings_customer_email" ON "public"."bookings" USING "btree" ("customer_email");



CREATE INDEX "idx_bookings_discount_code_id" ON "public"."bookings" USING "btree" ("discount_code_id");



CREATE INDEX "idx_bookings_draft_cleanup" ON "public"."bookings" USING "btree" ("status", "expires_at") WHERE (("status" = 'draft'::"text") AND ("expires_at" IS NOT NULL));



CREATE INDEX "idx_bookings_draft_expiry" ON "public"."bookings" USING "btree" ("status", "expires_at") WHERE ("status" = 'draft'::"text");



CREATE INDEX "idx_bookings_pickup_location" ON "public"."bookings" USING "btree" ("pickup_location_id");



CREATE INDEX "idx_bookings_return_location" ON "public"."bookings" USING "btree" ("return_location_id");



CREATE INDEX "idx_bookings_stripe_customer_id" ON "public"."bookings" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_bookings_stripe_payment_intent" ON "public"."bookings" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_bookings_stripe_payment_status" ON "public"."bookings" USING "btree" ("stripe_payment_status");



CREATE INDEX "idx_car_seasonal_pricing_active" ON "public"."car_seasonal_pricing" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_car_seasonal_pricing_car_id" ON "public"."car_seasonal_pricing" USING "btree" ("car_id");



CREATE INDEX "idx_car_seasonal_pricing_dates" ON "public"."car_seasonal_pricing" USING "btree" ("valid_from", "valid_to");



CREATE INDEX "idx_car_seasonal_pricing_priority" ON "public"."car_seasonal_pricing" USING "btree" ("priority" DESC);



CREATE INDEX "idx_cars_license_plate" ON "public"."cars" USING "btree" ("license_plate");



CREATE INDEX "idx_customer_notes_user_id" ON "public"."customer_notes" USING "btree" ("user_id");



CREATE INDEX "idx_extras_active" ON "public"."extras" USING "btree" ("active");



CREATE INDEX "idx_extras_category" ON "public"."extras" USING "btree" ("category");



CREATE INDEX "idx_extras_inventory_date" ON "public"."extras_inventory" USING "btree" ("date");



CREATE INDEX "idx_extras_inventory_extra_date" ON "public"."extras_inventory" USING "btree" ("extra_id", "date");



CREATE INDEX "idx_extras_slug" ON "public"."extras" USING "btree" ("slug");



CREATE INDEX "idx_locations_active" ON "public"."locations" USING "btree" ("is_active");



CREATE INDEX "idx_locations_category" ON "public"."locations" USING "btree" ("category");



CREATE INDEX "idx_locations_sort" ON "public"."locations" USING "btree" ("sort_order");



CREATE INDEX "idx_locations_value" ON "public"."locations" USING "btree" ("value");



CREATE INDEX "idx_payment_logs_booking_id" ON "public"."payment_logs" USING "btree" ("booking_id");



CREATE INDEX "idx_payment_logs_created" ON "public"."payment_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_logs_stripe_event" ON "public"."payment_logs" USING "btree" ("stripe_event_id");



CREATE INDEX "idx_profiles_blacklisted" ON "public"."profiles" USING "btree" ("is_blacklisted");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "qr_scans_qr_code_idx" ON "public"."qr_scans" USING "btree" ("qr_code");



CREATE INDEX "qr_scans_scanned_at_idx" ON "public"."qr_scans" USING "btree" ("scanned_at" DESC);



CREATE OR REPLACE TRIGGER "cleanup_expired_drafts_trigger" AFTER INSERT ON "public"."bookings" FOR EACH STATEMENT EXECUTE FUNCTION "public"."auto_delete_expired_drafts"();



CREATE OR REPLACE TRIGGER "prevent_role_change_trigger" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_role_change"();



CREATE OR REPLACE TRIGGER "set_car_seasonal_pricing_updated_at" BEFORE UPDATE ON "public"."car_seasonal_pricing" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "update_booking_total_on_extras_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."booking_extras" FOR EACH ROW EXECUTE FUNCTION "public"."update_booking_extras_total"();



CREATE OR REPLACE TRIGGER "update_customer_stats_trigger" AFTER INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_customer_stats"();



CREATE OR REPLACE TRIGGER "update_locations_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."booking_extras"
    ADD CONSTRAINT "booking_extras_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_extras"
    ADD CONSTRAINT "booking_extras_extra_id_fkey" FOREIGN KEY ("extra_id") REFERENCES "public"."extras"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_return_location_id_fkey" FOREIGN KEY ("return_location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."car_seasonal_pricing"
    ADD CONSTRAINT "car_seasonal_pricing_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_notes"
    ADD CONSTRAINT "customer_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."customer_notes"
    ADD CONSTRAINT "customer_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."extras_inventory"
    ADD CONSTRAINT "extras_inventory_extra_id_fkey" FOREIGN KEY ("extra_id") REFERENCES "public"."extras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "fk_discount_code" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_logs"
    ADD CONSTRAINT "payment_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all booking extras" ON "public"."booking_extras" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all bookings" ON "public"."bookings" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage campaigns" ON "public"."campaigns" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage customer notes" ON "public"."customer_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage discount codes" ON "public"."discount_codes" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage extras" ON "public"."extras" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage extras inventory" ON "public"."extras_inventory" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage locations" ON "public"."locations" USING ("public"."is_admin"());



CREATE POLICY "Admins can update any profile" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all payment logs" ON "public"."payment_logs" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Allow anonymous inserts" ON "public"."qr_scans" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anonymous reads" ON "public"."qr_scans" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anyone can view active campaigns" ON "public"."campaigns" FOR SELECT USING (("active" = true));



CREATE POLICY "Anyone can view active locations" ON "public"."locations" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active seasonal pricing" ON "public"."car_seasonal_pricing" FOR SELECT USING ((("active" = true) OR "public"."is_admin"()));



CREATE POLICY "Anyone can view all discount codes for validation" ON "public"."discount_codes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view available cars" ON "public"."cars" FOR SELECT USING (("available" = true));



CREATE POLICY "Anyone can view profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can manage locations" ON "public"."locations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Only admins can delete seasonal pricing" ON "public"."car_seasonal_pricing" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can insert seasonal pricing" ON "public"."car_seasonal_pricing" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can modify cars" ON "public"."cars" USING ("public"."is_admin"());



CREATE POLICY "Only admins can update seasonal pricing" ON "public"."car_seasonal_pricing" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Public can view active extras" ON "public"."extras" FOR SELECT USING (("active" = true));



CREATE POLICY "Public can view extras inventory" ON "public"."extras_inventory" FOR SELECT USING (true);



CREATE POLICY "Users can add extras to draft bookings" ON "public"."booking_extras" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_extras"."booking_id") AND ("bookings"."user_id" = "auth"."uid"()) AND ("bookings"."status" = 'draft'::"text")))));



CREATE POLICY "Users can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete extras from draft bookings" ON "public"."booking_extras" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_extras"."booking_id") AND ("bookings"."user_id" = "auth"."uid"()) AND ("bookings"."status" = 'draft'::"text")))));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((("auth"."uid"() = "id") AND (("role" IS NULL) OR ("role" = 'user'::"text"))));



CREATE POLICY "Users can update extras on draft bookings" ON "public"."booking_extras" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_extras"."booking_id") AND ("bookings"."user_id" = "auth"."uid"()) AND ("bookings"."status" = 'draft'::"text")))));



CREATE POLICY "Users can update own bookings" ON "public"."bookings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own booking extras" ON "public"."booking_extras" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "booking_extras"."booking_id") AND ("bookings"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment logs" ON "public"."payment_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "payment_logs"."booking_id") AND ("bookings"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."booking_extras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."car_seasonal_pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discount_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."extras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."extras_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."qr_scans" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bookings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."cars";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auto_delete_expired_drafts"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_delete_expired_drafts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_delete_expired_drafts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_car_price"("p_car_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_car_price"("p_car_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_car_price"("p_car_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_extra_availability"("p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_extra_availability"("p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_extra_availability"("p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_draft_bookings"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_draft_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_draft_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_car_pricing_preview"("p_car_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_car_pricing_preview"("p_car_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_car_pricing_preview"("p_car_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."moddatetime"() TO "postgres";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "anon";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_role_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_role_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_role_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."release_extras_inventory"("p_booking_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."release_extras_inventory"("p_booking_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_extras_inventory"("p_booking_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."release_extras_inventory"("p_booking_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."release_extras_inventory"("p_booking_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_extras_inventory"("p_booking_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_extras_inventory"("p_booking_id" integer, "p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_extras_inventory"("p_booking_id" integer, "p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_extras_inventory"("p_booking_id" integer, "p_extra_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_extras_inventory"("p_booking_id" "uuid", "p_extra_id" "uuid", "p_quantity" integer, "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_extras_inventory"("p_booking_id" "uuid", "p_extra_id" "uuid", "p_quantity" integer, "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_extras_inventory"("p_booking_id" "uuid", "p_extra_id" "uuid", "p_quantity" integer, "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_booking_extras_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_booking_extras_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_booking_extras_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."booking_extras" TO "anon";
GRANT ALL ON TABLE "public"."booking_extras" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_extras" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."car_seasonal_pricing" TO "anon";
GRANT ALL ON TABLE "public"."car_seasonal_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."car_seasonal_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."cars" TO "anon";
GRANT ALL ON TABLE "public"."cars" TO "authenticated";
GRANT ALL ON TABLE "public"."cars" TO "service_role";



GRANT ALL ON TABLE "public"."customer_notes" TO "anon";
GRANT ALL ON TABLE "public"."customer_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_notes" TO "service_role";



GRANT ALL ON TABLE "public"."discount_codes" TO "anon";
GRANT ALL ON TABLE "public"."discount_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."discount_codes" TO "service_role";



GRANT ALL ON TABLE "public"."extras" TO "anon";
GRANT ALL ON TABLE "public"."extras" TO "authenticated";
GRANT ALL ON TABLE "public"."extras" TO "service_role";



GRANT ALL ON TABLE "public"."extras_inventory" TO "anon";
GRANT ALL ON TABLE "public"."extras_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."extras_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."payment_logs" TO "anon";
GRANT ALL ON TABLE "public"."payment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_logs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."qr_scans" TO "anon";
GRANT ALL ON TABLE "public"."qr_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_scans" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow authenticated deletes"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'car-images'::text));



  create policy "Allow authenticated updates"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'car-images'::text));



  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'car-images'::text));



  create policy "Public access to car images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'car-images'::text));



