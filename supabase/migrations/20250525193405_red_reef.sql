/*
  # Car Rental Application Schema

  1. New Tables
     - `cars` - Stores vehicle information and availability
     - `bookings` - Stores rental booking information
     - `discount_codes` - Stores promotional discount codes
     - `campaigns` - Stores marketing campaigns
     - `profiles` - Stores user profile information

  2. Security
     - Enable RLS on all tables
     - Add policies for authenticated users to read/write their own data
     - Add admin-specific policies
*/

-- Create profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  avatar_url TEXT
);

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  price_per_day DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '[]'::JSONB,
  description TEXT NOT NULL
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  car_id INT REFERENCES cars(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  discount_code_id INT,
  payment_intent_id TEXT
);

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  code TEXT UNIQUE NOT NULL,
  discount_percentage INT NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  max_uses INT NOT NULL,
  current_uses INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_percentage INT NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  featured_image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Add foreign key constraint for discount_code_id in bookings
ALTER TABLE IF EXISTS bookings
  ADD CONSTRAINT fk_discount_code 
  FOREIGN KEY (discount_code_id) 
  REFERENCES discount_codes(id) 
  ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Cars Policies
CREATE POLICY "Anyone can view cars"
  ON cars
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can insert cars"
  ON cars
  FOR INSERT
  TO authenticated
  USING (auth.email() = 'admin@example.com');

CREATE POLICY "Only admins can update cars"
  ON cars
  FOR UPDATE
  TO authenticated
  USING (auth.email() = 'admin@example.com');

-- Bookings Policies
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'admin@example.com');

CREATE POLICY "Admins can update all bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.email() = 'admin@example.com');

-- Discount Codes Policies
CREATE POLICY "Anyone can view active discount codes"
  ON discount_codes
  FOR SELECT
  TO authenticated
  USING (active = true AND current_date BETWEEN valid_from AND valid_to);

CREATE POLICY "Only admins can manage discount codes"
  ON discount_codes
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@example.com');

-- Campaigns Policies
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated, anon
  USING (active = true AND current_date BETWEEN valid_from AND valid_to);

CREATE POLICY "Only admins can manage campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@example.com');