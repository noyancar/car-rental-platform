-- Make location IDs nullable for bookings
-- Some bookings may not have location IDs set yet

ALTER TABLE bookings
ALTER COLUMN pickup_location_id DROP NOT NULL;

ALTER TABLE bookings
ALTER COLUMN return_location_id DROP NOT NULL;
