-- Migration: Add Stripe payment fields
-- Description: Adds Stripe-specific fields to bookings table for payment processing

-- Add Stripe-related columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_status TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10,2) DEFAULT 0;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_status ON bookings(stripe_payment_status);

-- Create payment_logs table for tracking payment history
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_event_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for payment_logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_booking ON payment_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_event ON payment_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created ON payment_logs(created_at DESC);

-- Add RLS policies for payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment logs
CREATE POLICY "Users can view their own payment logs" ON payment_logs
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

-- Only service role can insert payment logs (from webhooks)
CREATE POLICY "Service role can manage payment logs" ON payment_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON COLUMN bookings.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for tracking payment';
COMMENT ON COLUMN bookings.stripe_payment_status IS 'Current status of the Stripe payment';
COMMENT ON COLUMN bookings.stripe_payment_method_id IS 'Stripe PaymentMethod ID used for payment';
COMMENT ON COLUMN bookings.stripe_refund_id IS 'Stripe Refund ID if payment was refunded';
COMMENT ON COLUMN bookings.refunded_amount IS 'Amount refunded in case of partial or full refund';

COMMENT ON TABLE payment_logs IS 'Audit log for all payment-related events';
COMMENT ON COLUMN payment_logs.stripe_event_id IS 'Unique Stripe webhook event ID to prevent duplicate processing';