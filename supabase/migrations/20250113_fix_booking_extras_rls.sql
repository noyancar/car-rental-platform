-- Fix RLS policies for booking_extras to support guest bookings
-- Guest users need to be able to add extras to their bookings

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own booking extras" ON booking_extras;
DROP POLICY IF EXISTS "Users can create booking extras" ON booking_extras;

-- Create new policy that allows both registered and guest users
CREATE POLICY "Users can create booking extras"
ON booking_extras FOR INSERT
WITH CHECK (
  -- Check if this booking belongs to the current user (registered)
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_extras.booking_id
    AND bookings.user_id = auth.uid()
  )
  OR
  -- OR if this is a guest booking (user_id is null)
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_extras.booking_id
    AND bookings.user_id IS NULL
  )
);

-- Also update SELECT policy for viewing extras
DROP POLICY IF EXISTS "Users can view their own booking extras" ON booking_extras;
DROP POLICY IF EXISTS "Users can view booking extras" ON booking_extras;

CREATE POLICY "Users can view booking extras"
ON booking_extras FOR SELECT
USING (
  -- Registered users can see their booking extras
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_extras.booking_id
    AND bookings.user_id = auth.uid()
  )
  OR
  -- Guest bookings are viewable
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_extras.booking_id
    AND bookings.user_id IS NULL
  )
);

-- Update UPDATE policy
DROP POLICY IF EXISTS "Users can update their own booking extras" ON booking_extras;
DROP POLICY IF EXISTS "Users can update booking extras" ON booking_extras;

CREATE POLICY "Users can update booking extras"
ON booking_extras FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_extras.booking_id
    AND (bookings.user_id = auth.uid() OR bookings.user_id IS NULL)
  )
);

-- Delete policy
DROP POLICY IF EXISTS "Users can delete their own booking extras" ON booking_extras;
DROP POLICY IF EXISTS "Users can delete booking extras" ON booking_extras;

CREATE POLICY "Users can delete booking extras"
ON booking_extras FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_extras.booking_id
    AND (bookings.user_id = auth.uid() OR bookings.user_id IS NULL)
  )
);
