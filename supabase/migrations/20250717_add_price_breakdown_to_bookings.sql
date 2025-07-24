-- Add price breakdown columns to bookings table
-- These are nullable with default 0 to maintain backward compatibility

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS car_rental_subtotal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pickup_delivery_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_delivery_fee numeric DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN bookings.car_rental_subtotal IS 'Base car rental cost excluding delivery fees and extras';
COMMENT ON COLUMN bookings.pickup_delivery_fee IS 'Delivery fee for pickup location';
COMMENT ON COLUMN bookings.return_delivery_fee IS 'Delivery fee for return location (0 if same as pickup)';

-- Note: We're not updating existing records - they will continue to work with calculated values
-- New bookings will populate these fields during creation