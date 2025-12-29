-- Refactor car_unavailability to match bookings table structure
-- bookings uses: start_date (DATE), end_date (DATE), pickup_time (VARCHAR), return_time (VARCHAR)

-- Add new columns
ALTER TABLE car_unavailability
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE,
  ADD COLUMN start_time VARCHAR(5) DEFAULT '10:00',
  ADD COLUMN end_time VARCHAR(5) DEFAULT '10:00';

-- Migrate existing data (extract date and time from datetime columns)
UPDATE car_unavailability SET
  start_date = start_datetime::date,
  end_date = end_datetime::date,
  start_time = to_char(start_datetime AT TIME ZONE 'UTC', 'HH24:MI'),
  end_time = to_char(end_datetime AT TIME ZONE 'UTC', 'HH24:MI');

-- Make new columns NOT NULL after migration
ALTER TABLE car_unavailability
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;

-- Drop old datetime columns
ALTER TABLE car_unavailability
  DROP COLUMN start_datetime,
  DROP COLUMN end_datetime;

-- Add constraint to ensure end_date >= start_date
ALTER TABLE car_unavailability
  ADD CONSTRAINT valid_date_range CHECK (end_date >= start_date);
