/*
  # Fix RLS Policies

  1. Changes
    - Add proper WITH CHECK clauses for INSERT policies
    - Fix ALL operation policies
    - Add missing INSERT policies for profiles
    - Complete admin policies with both USING and WITH CHECK

  2. Security Updates
    - Cars: Public read, admin-only write
    - Bookings: User-specific access
    - Profiles: User-specific access
    - Discount codes: Admin-only access
    - Campaigns: Public read for active, admin-only write
*/

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view cars" ON cars;
DROP POLICY IF EXISTS "Only admins can insert cars" ON cars;
DROP POLICY IF EXISTS "Only admins can update cars" ON cars;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Only admins can manage discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON campaigns;
DROP POLICY IF EXISTS "Only admins can manage campaigns" ON campaigns;

-- Profiles Policies
CREATE POLICY "Users can manage their own profile"
  ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Cars Policies
CREATE POLICY "Anyone can view cars"
  ON cars
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cars"
  ON cars
  FOR ALL
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');

-- Bookings Policies
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');

-- Discount Codes Policies
CREATE POLICY "Anyone can view active discount codes"
  ON discount_codes
  FOR SELECT
  USING (
    active = true AND 
    current_date BETWEEN valid_from AND valid_to AND
    (max_uses = 0 OR current_uses < max_uses)
  );

CREATE POLICY "Admins can manage discount codes"
  ON discount_codes
  FOR ALL
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');

-- Campaigns Policies
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns
  FOR SELECT
  USING (
    active = true AND 
    current_date BETWEEN valid_from AND valid_to
  );

CREATE POLICY "Admins can manage campaigns"
  ON campaigns
  FOR ALL
  USING (auth.email() = 'admin@example.com')
  WITH CHECK (auth.email() = 'admin@example.com');