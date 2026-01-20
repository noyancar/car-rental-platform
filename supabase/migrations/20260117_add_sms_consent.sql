-- Add SMS consent fields to bookings table for Twilio A2P 10DLC compliance
-- This tracks explicit opt-in consent for SMS notifications
-- SMS consent is REQUIRED for all new bookings

-- Add SMS consent fields to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_consent_text TEXT;

-- Add SMS consent preference to profiles for registered users
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;

-- Create index for querying bookings with SMS consent
CREATE INDEX IF NOT EXISTS idx_bookings_sms_consent ON bookings(sms_consent) WHERE sms_consent = TRUE;

-- Create trigger function to enforce SMS consent on new bookings
CREATE OR REPLACE FUNCTION enforce_sms_consent()
RETURNS TRIGGER AS $$
BEGIN
  -- Require SMS consent for all new bookings
  IF NEW.sms_consent IS NOT TRUE THEN
    RAISE EXCEPTION 'SMS consent is required to create a booking. Please accept SMS notifications to proceed.';
  END IF;

  -- Auto-set consent timestamp if not provided
  IF NEW.sms_consent = TRUE AND NEW.sms_consent_at IS NULL THEN
    NEW.sms_consent_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger only for INSERT (new bookings), not for existing ones
DROP TRIGGER IF EXISTS require_sms_consent ON bookings;
CREATE TRIGGER require_sms_consent
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_sms_consent();

-- Comments for documentation
COMMENT ON COLUMN bookings.sms_consent IS 'Whether the customer has opted in to receive SMS notifications (REQUIRED for new bookings)';
COMMENT ON COLUMN bookings.sms_consent_at IS 'Timestamp when SMS consent was given (for Twilio A2P 10DLC compliance audit)';
COMMENT ON COLUMN bookings.sms_consent_text IS 'The exact consent text shown to the user at the time of opt-in';
COMMENT ON COLUMN profiles.sms_consent IS 'Default SMS preference for registered users';
COMMENT ON COLUMN profiles.sms_consent_at IS 'Timestamp when SMS preference was last updated';
