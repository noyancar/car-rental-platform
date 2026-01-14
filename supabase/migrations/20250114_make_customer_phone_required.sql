-- Make customer_phone required for guest bookings
-- This ensures all guest bookings have a phone number for contact purposes

-- First, update any existing NULL or placeholder phone numbers with a clear legacy marker
-- This ensures the migration succeeds if there are any legacy guest bookings without phone numbers
-- In production, admin should be notified to collect these phone numbers
UPDATE bookings
SET customer_phone = 'NOT_PROVIDED_LEGACY'
WHERE user_id IS NULL
  AND (customer_phone IS NULL OR customer_phone = 'PENDING')
  AND customer_email IS NOT NULL;

-- Update the constraint to include customer_phone as required for guest bookings
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_user_or_guest_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_user_or_guest_check
CHECK (
  (user_id IS NOT NULL) OR
  (customer_email IS NOT NULL AND customer_name IS NOT NULL AND customer_phone IS NOT NULL)
);

-- Update the comment to reflect phone is now required
COMMENT ON COLUMN bookings.customer_phone IS 'Phone number for guest bookings (required if user_id is null)';
