-- Remove old string-based location columns from bookings table
-- These have been replaced by pickup_location_id and return_location_id foreign keys

-- First, ensure all data has been migrated to the new columns
-- This query will show any bookings that still need migration
-- SELECT id, pickup_location, return_location, pickup_location_id, return_location_id 
-- FROM bookings 
-- WHERE (pickup_location IS NOT NULL OR return_location IS NOT NULL) 
-- AND (pickup_location_id IS NULL OR return_location_id IS NULL);

-- Drop the old columns
ALTER TABLE bookings 
DROP COLUMN IF EXISTS pickup_location,
DROP COLUMN IF EXISTS return_location;

-- Note: Make sure all existing bookings have been migrated to use 
-- pickup_location_id and return_location_id before running this migration