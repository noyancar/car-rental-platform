-- Add extras system tables

-- Extras categories enum
CREATE TYPE extra_category AS ENUM ('services', 'safety', 'beach', 'tech', 'camping');

-- Extras price type enum
CREATE TYPE extra_price_type AS ENUM ('per_day', 'one_time');

-- Main extras table
CREATE TABLE IF NOT EXISTS extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  price_type extra_price_type NOT NULL DEFAULT 'per_day',
  category extra_category NOT NULL,
  stock_quantity INTEGER, -- NULL means unlimited stock
  max_per_booking INTEGER DEFAULT 99,
  icon_name TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for slug lookup
CREATE INDEX idx_extras_slug ON extras(slug);
CREATE INDEX idx_extras_category ON extras(category);
CREATE INDEX idx_extras_active ON extras(active);

-- Extras inventory table for stock tracking
CREATE TABLE IF NOT EXISTS extras_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_stock INTEGER NOT NULL,
  reserved_count INTEGER DEFAULT 0,
  available_count INTEGER GENERATED ALWAYS AS (total_stock - reserved_count) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(extra_id, date)
);

-- Create index for date-based lookups
CREATE INDEX idx_extras_inventory_date ON extras_inventory(date);
CREATE INDEX idx_extras_inventory_extra_date ON extras_inventory(extra_id, date);

-- Booking extras junction table
CREATE TABLE IF NOT EXISTS booking_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for booking extras
CREATE INDEX idx_booking_extras_booking ON booking_extras(booking_id);
CREATE INDEX idx_booking_extras_extra ON booking_extras(extra_id);

-- Update bookings table to include extras total
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS extras_total DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS grand_total DECIMAL(10, 2) GENERATED ALWAYS AS (total_price + COALESCE(extras_total, 0)) STORED;

-- Function to update booking extras total
CREATE OR REPLACE FUNCTION update_booking_extras_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bookings 
  SET extras_total = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM booking_extras 
    WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
  )
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update booking total when extras change
CREATE TRIGGER update_booking_total_on_extras_change
AFTER INSERT OR UPDATE OR DELETE ON booking_extras
FOR EACH ROW
EXECUTE FUNCTION update_booking_extras_total();

-- Function to check extra availability
CREATE OR REPLACE FUNCTION check_extra_availability(
  p_extra_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_date DATE;
  v_available INTEGER;
  v_stock_quantity INTEGER;
BEGIN
  -- Get the stock quantity for the extra
  SELECT stock_quantity INTO v_stock_quantity
  FROM extras
  WHERE id = p_extra_id AND active = true;
  
  -- If stock_quantity is NULL, it means unlimited stock
  IF v_stock_quantity IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check availability for each date in the range
  FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
  LOOP
    SELECT COALESCE(available_count, v_stock_quantity) INTO v_available
    FROM extras_inventory
    WHERE extra_id = p_extra_id AND date = v_date;
    
    -- If no inventory record exists, use the default stock quantity
    IF v_available IS NULL THEN
      v_available := v_stock_quantity;
    END IF;
    
    -- Check if requested quantity is available
    IF v_available < p_quantity THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve extras inventory
CREATE OR REPLACE FUNCTION reserve_extras_inventory(
  p_booking_id INTEGER,
  p_extra_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_quantity INTEGER
) RETURNS VOID AS $$
DECLARE
  v_date DATE;
  v_stock_quantity INTEGER;
BEGIN
  -- Get the stock quantity for the extra
  SELECT stock_quantity INTO v_stock_quantity
  FROM extras
  WHERE id = p_extra_id;
  
  -- If stock_quantity is NULL, no need to track inventory
  IF v_stock_quantity IS NULL THEN
    RETURN;
  END IF;
  
  -- Reserve inventory for each date
  FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
  LOOP
    -- Insert or update inventory record
    INSERT INTO extras_inventory (extra_id, date, total_stock, reserved_count)
    VALUES (p_extra_id, v_date, v_stock_quantity, p_quantity)
    ON CONFLICT (extra_id, date) DO UPDATE
    SET reserved_count = extras_inventory.reserved_count + p_quantity,
        updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to release extras inventory (for cancellations)
CREATE OR REPLACE FUNCTION release_extras_inventory(
  p_booking_id INTEGER
) RETURNS VOID AS $$
DECLARE
  v_booking_record RECORD;
  v_extra_record RECORD;
BEGIN
  -- Get booking dates
  SELECT start_date, end_date INTO v_booking_record
  FROM bookings
  WHERE id = p_booking_id;
  
  -- Release inventory for each extra
  FOR v_extra_record IN 
    SELECT be.extra_id, be.quantity
    FROM booking_extras be
    JOIN extras e ON e.id = be.extra_id
    WHERE be.booking_id = p_booking_id
    AND e.stock_quantity IS NOT NULL
  LOOP
    UPDATE extras_inventory
    SET reserved_count = GREATEST(0, reserved_count - v_extra_record.quantity),
        updated_at = NOW()
    WHERE extra_id = v_extra_record.extra_id
    AND date BETWEEN v_booking_record.start_date AND v_booking_record.end_date;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for extras
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;

-- Everyone can view active extras
CREATE POLICY "Public can view active extras" ON extras
  FOR SELECT USING (active = true);

-- Only admins can manage extras
CREATE POLICY "Admins can manage extras" ON extras
  FOR ALL USING (auth.email() = 'admin@example.com');

-- Everyone can view extras inventory
CREATE POLICY "Public can view extras inventory" ON extras_inventory
  FOR SELECT USING (true);

-- Only admins can manage extras inventory
CREATE POLICY "Admins can manage extras inventory" ON extras_inventory
  FOR ALL USING (auth.email() = 'admin@example.com');

-- Users can view their own booking extras
CREATE POLICY "Users can view own booking extras" ON booking_extras
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_extras.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Users can add extras to their draft bookings
CREATE POLICY "Users can add extras to draft bookings" ON booking_extras
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_extras.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'draft'
    )
  );

-- Users can update extras on their draft bookings
CREATE POLICY "Users can update extras on draft bookings" ON booking_extras
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_extras.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'draft'
    )
  );

-- Users can delete extras from their draft bookings
CREATE POLICY "Users can delete extras from draft bookings" ON booking_extras
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_extras.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'draft'
    )
  );

-- Admins can manage all booking extras
CREATE POLICY "Admins can manage all booking extras" ON booking_extras
  FOR ALL USING (auth.email() = 'admin@example.com'); 