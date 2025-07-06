-- Drop the view that is no longer needed
DROP VIEW IF EXISTS car_with_locations;

-- Drop the car_locations junction table (cars don't have specific locations anymore)
DROP TABLE IF EXISTS car_locations;

-- Remove available_locations column from cars table
ALTER TABLE cars DROP COLUMN IF EXISTS available_locations;

-- Drop the function that checks car availability at location
DROP FUNCTION IF EXISTS is_car_available_at_location(INTEGER, UUID);