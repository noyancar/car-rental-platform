-- Add guest checkout support to bookings table
-- This allows users to create bookings without registering an account

-- Make user_id nullable to support guest bookings
ALTER TABLE bookings
ALTER COLUMN user_id DROP NOT NULL;

-- Add customer information fields for guest bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS guest_access_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for faster guest booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_token ON bookings(guest_access_token);

-- Add constraint: Either user_id OR customer_email must be present
ALTER TABLE bookings
ADD CONSTRAINT bookings_user_or_guest_check
CHECK (
  (user_id IS NOT NULL) OR
  (customer_email IS NOT NULL AND customer_name IS NOT NULL)
);

-- Update RLS policies to allow guest bookings to be created
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (
  -- Registered users can create bookings for themselves
  (auth.uid() = user_id) OR
  -- Guest users can create bookings (user_id is null)
  (user_id IS NULL AND customer_email IS NOT NULL)
);

-- Allow guest users to view their bookings via access token
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their bookings" ON bookings;

CREATE POLICY "Users can view their bookings"
ON bookings FOR SELECT
USING (
  -- Registered users can see their bookings
  auth.uid() = user_id OR
  -- Guest bookings are viewable by anyone (will be protected by token in application layer)
  user_id IS NULL
);

-- Allow updating guest bookings (for payment status, etc)
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their bookings" ON bookings;

CREATE POLICY "Users can update their bookings"
ON bookings FOR UPDATE
USING (
  -- Registered users can update their bookings
  auth.uid() = user_id OR
  -- System can update guest bookings (for payment webhooks)
  user_id IS NULL
);

-- Comment the changes
COMMENT ON COLUMN bookings.customer_email IS 'Email address for guest bookings (required if user_id is null)';
COMMENT ON COLUMN bookings.customer_name IS 'Full name for guest bookings (required if user_id is null)';
COMMENT ON COLUMN bookings.customer_phone IS 'Phone number for guest bookings (optional)';
COMMENT ON COLUMN bookings.guest_access_token IS 'Unique token for guest users to access their booking details via magic link';
