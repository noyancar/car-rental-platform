-- Add IP address and enhanced location tracking to analytics_sessions
-- This allows tracking visitor IP addresses and geographic location for marketing analysis

-- Add IP address and city columns to analytics_sessions
ALTER TABLE analytics_sessions
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Create index for IP address lookups
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_ip_address ON analytics_sessions(ip_address);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country ON analytics_sessions(country);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_city ON analytics_sessions(city);

-- Comments for documentation
COMMENT ON COLUMN analytics_sessions.ip_address IS 'Visitor IP address captured from request headers';
COMMENT ON COLUMN analytics_sessions.city IS 'City derived from IP geolocation';
COMMENT ON COLUMN analytics_sessions.region IS 'State/Region derived from IP geolocation';
COMMENT ON COLUMN analytics_sessions.country_code IS 'ISO country code (e.g., US, TR) derived from IP geolocation';
