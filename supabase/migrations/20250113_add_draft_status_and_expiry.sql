-- Add draft status to bookings table
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text]));

-- Add expiry timestamp for draft bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Add index for expired draft bookings cleanup
CREATE INDEX IF NOT EXISTS idx_bookings_draft_expiry 
ON bookings(status, expires_at) 
WHERE status = 'draft';

-- Add comment to explain the new column
COMMENT ON COLUMN bookings.expires_at IS 'Expiry time for draft bookings. NULL for non-draft bookings.';

-- Function to automatically clean up expired draft bookings
CREATE OR REPLACE FUNCTION cleanup_expired_draft_bookings()
RETURNS void AS $$
BEGIN
  DELETE FROM bookings 
  WHERE status = 'draft' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup every 5 minutes (requires pg_cron extension)
-- Note: pg_cron needs to be enabled in Supabase dashboard
-- SELECT cron.schedule('cleanup-draft-bookings', '*/5 * * * *', 'SELECT cleanup_expired_draft_bookings();');