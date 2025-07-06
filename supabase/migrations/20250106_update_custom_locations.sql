-- Add distance_from_base column to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS distance_from_base DECIMAL(10,2);

-- Update existing locations with estimated distances (in miles)
UPDATE locations SET distance_from_base = CASE
  WHEN value = 'base-office' THEN 0
  WHEN category = 'airport' THEN 8.5  -- Airport is about 8.5 miles from base
  WHEN category = 'hotel' THEN 5  -- Most hotels are within 5 miles
  ELSE NULL
END;

-- Delete old custom location entry if exists
DELETE FROM locations WHERE value = 'custom-location';

-- Remove custom location options for now
DELETE FROM locations WHERE value IN ('custom-within-10mi', 'custom-outside-10mi');

-- Add comment for documentation
COMMENT ON COLUMN locations.distance_from_base IS 'Distance from base office in miles. NULL for locations requiring quote.';