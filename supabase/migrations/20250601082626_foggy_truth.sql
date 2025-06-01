-- Add car specifications columns
ALTER TABLE cars 
ADD COLUMN seats INT DEFAULT 5,
ADD COLUMN transmission TEXT DEFAULT 'Automatic',
ADD COLUMN mileage_type TEXT DEFAULT 'Unlimited',
ADD COLUMN min_rental_hours INT DEFAULT 24;