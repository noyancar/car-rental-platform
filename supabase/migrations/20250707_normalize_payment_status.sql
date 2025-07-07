-- Migration: Normalize payment statuses
-- Description: Updates existing payment statuses to use normalized values

-- Update existing payment statuses to normalized values
UPDATE bookings
SET stripe_payment_status = CASE
  WHEN stripe_payment_status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'requires_capture') THEN 'pending'
  WHEN stripe_payment_status = 'succeeded' THEN 'succeeded'
  WHEN stripe_payment_status = 'canceled' THEN 'canceled'
  WHEN stripe_payment_status = 'processing' THEN 'processing'
  WHEN stripe_payment_status LIKE '%fail%' THEN 'failed'
  ELSE stripe_payment_status
END
WHERE stripe_payment_status IS NOT NULL;

-- Add constraint to ensure only valid payment statuses
ALTER TABLE bookings 
ADD CONSTRAINT check_stripe_payment_status 
CHECK (stripe_payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled') OR stripe_payment_status IS NULL);