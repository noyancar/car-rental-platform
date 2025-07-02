-- Migration: Add Locations Management System
-- Description: Creates locations table and updates relationships for proper location management

-- 1. Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Basic information
  value TEXT UNIQUE NOT NULL, -- e.g., "base-office", "airport-hnl"
  label TEXT NOT NULL, -- e.g., "Main Office - Ke'eaumoku"
  address TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('base', 'airport', 'hotel', 'custom')),
  
  -- Pricing
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Status and ordering
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Additional data
  phone TEXT,
  email TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
  operating_hours JSONB, -- {monday: {open: "08:00", close: "18:00"}, ...}
  metadata JSONB -- parking instructions, special notes, etc.
);

-- 2. Create indexes for performance
CREATE INDEX idx_locations_value ON locations(value);
CREATE INDEX idx_locations_category ON locations(category);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_sort ON locations(sort_order);

-- 3. Create car_locations junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS car_locations (
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (car_id, location_id)
);

-- 4. Create indexes for car_locations
CREATE INDEX idx_car_locations_car ON car_locations(car_id);
CREATE INDEX idx_car_locations_location ON car_locations(location_id);

-- 5. Add location references to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS pickup_location_id UUID REFERENCES locations(id),
ADD COLUMN IF NOT EXISTS return_location_id UUID REFERENCES locations(id);

-- 6. Create indexes for booking location lookups
CREATE INDEX idx_bookings_pickup_location ON bookings(pickup_location_id);
CREATE INDEX idx_bookings_return_location ON bookings(return_location_id);

-- 7. Insert default locations based on constants
INSERT INTO locations (value, label, address, category, delivery_fee, sort_order) VALUES
  -- Base location
  ('base-office', 'Main Office - 711 Ke''eaumoku St', '711 Ke''eaumoku St, Honolulu HI 96814', 'base', 0, 0),
  
  -- Airport location
  ('airport-hnl', 'Daniel K. Inouye International Airport (HNL) - Terminal 1', '300 Rodgers Blvd, Honolulu, HI 96819', 'airport', 70, 10),
  
  -- Hotel locations
  ('hilton-hawaiian-village', 'Hilton Hawaiian Village - 2005 Kālia Rd', '2005 Kālia Rd, Honolulu, HI 96815', 'hotel', 50, 20),
  ('royal-hawaiian', 'The Royal Hawaiian - 2259 Kalākaua Ave', '2259 Kalākaua Ave, Honolulu, HI 96815', 'hotel', 50, 21),
  ('halekulani', 'Halekulani Hotel - 2199 Kālia Rd', '2199 Kālia Rd, Honolulu, HI 96815', 'hotel', 50, 22),
  ('hyatt-regency-waikiki', 'Hyatt Regency Waikiki - 2424 Kalākaua Ave', '2424 Kalākaua Ave, Honolulu, HI 96815', 'hotel', 50, 23),
  ('marriott-waikiki', 'Waikiki Beach Marriott - 2552 Kalākaua Ave', '2552 Kalākaua Ave, Honolulu, HI 96815', 'hotel', 50, 24),
  ('sheraton-waikiki', 'Sheraton Waikiki - 2255 Kalākaua Ave', '2255 Kalākaua Ave, Honolulu, HI 96815', 'hotel', 50, 25),
  ('ala-moana-hotel', 'Ala Moana Hotel - 410 Atkinson Dr', '410 Atkinson Dr, Honolulu, HI 96814', 'hotel', 50, 26),
  ('turtle-bay-resort', 'Turtle Bay Resort - 57-091 Kamehameha Hwy', '57-091 Kamehameha Hwy, Kahuku, HI 96731', 'hotel', 50, 27),
  ('four-seasons-oahu', 'Four Seasons Ko Olina - 92-1001 Olani St', '92-1001 Olani St, Kapolei, HI 96707', 'hotel', 50, 28)
ON CONFLICT (value) DO NOTHING;

-- 8. Migrate existing car available_locations to car_locations table
INSERT INTO car_locations (car_id, location_id)
SELECT DISTINCT 
  c.id as car_id,
  l.id as location_id
FROM cars c
CROSS JOIN LATERAL unnest(c.available_locations) AS loc_value
JOIN locations l ON l.value = loc_value
WHERE c.available_locations IS NOT NULL 
  AND array_length(c.available_locations, 1) > 0
ON CONFLICT DO NOTHING;

-- 9. Migrate existing booking locations to use location IDs
UPDATE bookings b
SET pickup_location_id = l.id
FROM locations l
WHERE b.pickup_location = l.value
  AND b.pickup_location_id IS NULL;

UPDATE bookings b
SET return_location_id = l.id
FROM locations l
WHERE b.return_location = l.value
  AND b.return_location_id IS NULL;

-- 10. Create views for easier querying
CREATE OR REPLACE VIEW car_with_locations AS
SELECT 
  c.*,
  COALESCE(
    array_agg(
      json_build_object(
        'id', l.id,
        'value', l.value,
        'label', l.label,
        'category', l.category,
        'delivery_fee', l.delivery_fee
      ) ORDER BY l.sort_order
    ) FILTER (WHERE l.id IS NOT NULL),
    ARRAY[]::json[]
  ) as locations
FROM cars c
LEFT JOIN car_locations cl ON c.id = cl.car_id
LEFT JOIN locations l ON cl.location_id = l.id AND l.is_active = true
GROUP BY c.id;

-- 11. Create function to check car availability at location
CREATE OR REPLACE FUNCTION is_car_available_at_location(
  p_car_id INTEGER,
  p_location_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM car_locations 
    WHERE car_id = p_car_id 
      AND location_id = p_location_id
  );
END;
$$ LANGUAGE plpgsql;

-- 12. Create RLS policies for locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active locations
CREATE POLICY "Anyone can view active locations" ON locations
  FOR SELECT USING (is_active = true);

-- Only authenticated users can manage locations (admin check should be added)
CREATE POLICY "Authenticated users can manage locations" ON locations
  FOR ALL USING (auth.role() = 'authenticated');

-- 13. Create RLS policies for car_locations table
ALTER TABLE car_locations ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read car locations
CREATE POLICY "Anyone can view car locations" ON car_locations
  FOR SELECT USING (true);

-- Only authenticated users can manage car locations
CREATE POLICY "Authenticated users can manage car locations" ON car_locations
  FOR ALL USING (auth.role() = 'authenticated');

-- 14. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 15. Add comments for documentation
COMMENT ON TABLE locations IS 'Stores all pickup and return locations for the car rental service';
COMMENT ON COLUMN locations.value IS 'Unique identifier used in the application (e.g., base-office)';
COMMENT ON COLUMN locations.coordinates IS 'GPS coordinates as {lat: number, lng: number}';
COMMENT ON COLUMN locations.operating_hours IS 'Operating hours by day of week';
COMMENT ON COLUMN locations.metadata IS 'Additional location-specific information';

COMMENT ON TABLE car_locations IS 'Junction table defining which cars are available at which locations';

-- Note: After running this migration, you may want to:
-- 1. Drop the available_locations column from cars table once you verify the migration worked
-- 2. Drop the old pickup_location and return_location string columns from bookings table
-- These are not done automatically to allow for rollback if needed