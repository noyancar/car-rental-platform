-- Add new fields to cars table for CSV compatibility
ALTER TABLE cars
ADD COLUMN trim TEXT,
ADD COLUMN color TEXT,
ADD COLUMN license_plate TEXT UNIQUE,
ADD COLUMN doors INT CHECK (doors IN (2, 4, 5)),
ADD COLUMN fuel_type TEXT CHECK (fuel_type IN ('Gas', 'Electric', 'Hybrid')),
ADD COLUMN gas_grade TEXT CHECK (gas_grade IN ('Regular', 'Premium', 'N/A'));

-- Create index for license plate searches
CREATE INDEX idx_cars_license_plate ON cars(license_plate);

-- Update RLS policies if needed
-- Cars table already has RLS enabled, existing policies should work 