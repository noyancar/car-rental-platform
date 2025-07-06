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

-- Insert new custom location options
INSERT INTO locations (value, label, address, category, delivery_fee, sort_order, distance_from_base) VALUES
  ('custom-within-10mi', 'Custom Location (Within 10 miles)', '', 'custom', 70, 100, 10),
  ('custom-outside-10mi', 'Custom Location (Outside 10 miles)', '', 'custom', -1, 101, NULL)
ON CONFLICT (value) DO UPDATE SET
  label = EXCLUDED.label,
  delivery_fee = EXCLUDED.delivery_fee,
  sort_order = EXCLUDED.sort_order,
  distance_from_base = EXCLUDED.distance_from_base;

-- Add comment for documentation
COMMENT ON COLUMN locations.distance_from_base IS 'Distance from base office in miles. NULL for locations requiring quote.';