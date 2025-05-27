/*
  # Fix RLS Policies for Car Rental Application

  1. Drop existing policies
  2. Re-create policies with correct syntax:
    - INSERT: WITH CHECK only
    - UPDATE: Both USING and WITH CHECK
    - SELECT: USING only
    - FOR ALL: Both USING and WITH CHECK
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Cars policies
  DROP POLICY IF EXISTS "Anyone can view cars" ON cars;
  DROP POLICY IF EXISTS "Only admins can insert cars" ON cars;
  DROP POLICY IF EXISTS "Only admins can update cars" ON cars;
  
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  
  -- Bookings policies
  DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
  DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
  
  -- Discount codes policies
  DROP POLICY IF EXISTS "Anyone can view active discount codes" ON discount_codes;
  DROP POLICY IF EXISTS "Only admins can manage discount codes" ON discount_codes;
  
  -- Campaigns policies
  DROP POLICY IF EXISTS "Anyone can view active campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Only admins can manage campaigns" ON campaigns;
END $$;

-- Re-create policies with correct syntax

-- Cars Policies
CREATE POLICY "Anyone can view cars"
  ON cars
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert cars"
  ON cars
  FOR INSERT
  WITH CHECK (auth.email() = 'admin@example.com');

CREATE POLICY "Only admins can update cars"
  ON cars
  FOR UPDATE
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');

-- Profiles Policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Bookings Policies
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings
  FOR SELECT
  USING (auth.email() = 'admin@example.com');

CREATE POLICY "Admins can update all bookings"
  ON bookings
  FOR UPDATE
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');

-- Discount Codes Policies
CREATE POLICY "Anyone can view active discount codes"
  ON discount_codes
  FOR SELECT
  USING (active = true AND current_date BETWEEN valid_from AND valid_to);

CREATE POLICY "Only admins can manage discount codes"
  ON discount_codes
  FOR ALL
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');

-- Campaigns Policies
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns
  FOR SELECT
  USING (active = true AND current_date BETWEEN valid_from AND valid_to);

CREATE POLICY "Only admins can manage campaigns"
  ON campaigns
  FOR ALL
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');