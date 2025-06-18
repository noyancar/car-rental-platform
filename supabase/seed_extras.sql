-- Seed data for extras

INSERT INTO extras (name, slug, description, price, price_type, category, stock_quantity, max_per_booking, icon_name, sort_order) VALUES
-- Services
('Prepaid refuel', 'prepaid-refuel', 'Save time, make drop-off a breeze, and avoid additional fees by adding this Extra, which allows you to return my car at any fuel level. Price includes up to a full tank of gas.', 105.00, 'one_time', 'services', NULL, 1, 'Fuel', 1),
('Post-trip Cleaning Fee', 'post-trip-cleaning', 'For a small fee, we''ll handle the car''s interior and exterior cleaning.', 50.00, 'one_time', 'services', NULL, 1, 'Sparkles', 2),

-- Safety
('Child Safety Seat', 'child-safety-seat', 'Graco TrioGrow SnugLock 3in1 Car Seat', 35.00, 'per_day', 'safety', 10, 4, 'Baby', 10),

-- Beach
('Beach Chair', 'beach-chair', 'Lightweight and foldable, perfect for relaxing by the shore.', 10.00, 'per_day', 'beach', 20, 6, 'Armchair', 20),
('Beach Umbrella', 'beach-umbrella', 'Provides shade and UV protection for a comfortable beach experience.', 25.00, 'per_day', 'beach', 15, 2, 'Umbrella', 21),
('Beach Wagon', 'beach-wagon', 'For a day at the beach, a camping trip, or a weekend festival, this collapsible beach wagon makes carrying your gear a breeze.', 35.00, 'per_day', 'beach', 5, 1, 'ShoppingCart', 22),

-- Camping
('Cooler - 40-can capacity', 'cooler-40-can', 'Keeps your beverages and snacks chilled', 25.00, 'per_day', 'camping', 12, 2, 'Package', 30),
('Cooler Bag - 50-can capacity', 'cooler-bag-50-can', 'Insulated soft cooler bag, lightweight and easy to carry', 15.00, 'per_day', 'camping', 15, 2, 'Backpack', 31),
('Cooler - 90-can capacity with wheels', 'cooler-90-can-wheels', 'Large rolling cooler for extended trips', 30.00, 'per_day', 'camping', 8, 1, 'Package2', 32),

-- Tech
('DJI Osmo Action 5 Pro Adventure Combo', 'dji-osmo-action-5-pro', 'Capture your adventures in stunning 4K with this rugged, waterproof action camera combo.', 50.00, 'per_day', 'tech', 5, 1, 'Camera', 40),
('Powerbank 10,000 mAh', 'powerbank-10000', 'Keep your devices charged on the go with this compact, high-capacity powerbank.', 10.00, 'per_day', 'tech', 25, 3, 'Battery', 41)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_type = EXCLUDED.price_type,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  max_per_booking = EXCLUDED.max_per_booking,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Initialize inventory for items with stock limits (for next 30 days)
INSERT INTO extras_inventory (extra_id, date, total_stock)
SELECT 
  e.id,
  d.date,
  e.stock_quantity
FROM extras e
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day'::interval) AS d(date)
WHERE e.stock_quantity IS NOT NULL
ON CONFLICT (extra_id, date) DO NOTHING; 