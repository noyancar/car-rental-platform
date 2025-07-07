-- 1. Önce trigger'ları kaldır
DROP TRIGGER IF EXISTS auto_generate_car_slug ON cars;
DROP TRIGGER IF EXISTS auto_generate_booking_reference ON bookings;

-- 2. Fonksiyonları kaldır
DROP FUNCTION IF EXISTS trigger_generate_car_slug();
DROP FUNCTION IF EXISTS trigger_generate_booking_reference();
DROP FUNCTION IF EXISTS generate_car_slug(INTEGER, VARCHAR, VARCHAR, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS generate_booking_reference();

-- 3. Index'leri kaldır
DROP INDEX IF EXISTS idx_cars_slug;
DROP INDEX IF EXISTS idx_bookings_reference;

-- 4. Sütunları kaldır
ALTER TABLE cars DROP COLUMN IF EXISTS slug;
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_reference;

-- 5. Kontrol
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cars' 
AND column_name = 'slug';

-- Boş dönmeli

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'booking_reference';