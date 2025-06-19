
-- Insert cars from CSV
INSERT INTO cars (
  make, model, trim, year, color, license_plate, seats, doors, fuel_type, gas_grade, 
  category, price_per_day, features, description, transmission, mileage_type, 
  available, image_url, image_urls
) VALUES
-- 1. Kia Sorento S 2025
('Kia', 'Sorento', 'S', 2025, 'Wolf Gray', '063025', 7, 4, 'Gas', 'Regular', 
 'suv', 120, 
 '["Backup Camera", "Blind Spot Warning", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "GPS", "Heated Seats", "Sunroof"]'::jsonb,
 'Spacious 7-seat SUV with advanced safety features and modern technology.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1629834468948-2ccdec4b9b0d?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1629834468948-2ccdec4b9b0d?auto=format&fit=crop&w=800&q=80']),

-- 2. Chrysler Pacifica Touring L 2024
('Chrysler', 'Pacifica', 'Touring L', 2024, 'White', 'YAC429', 7, 4, 'Gas', 'Regular',
 'luxury', 150,
 '["Backup Camera", "Blind Spot Warning", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "GPS", "Heated Seats", "Adaptive Cruise Control", "Brake Assist", "Lane Departure Warning", "Lane Keeping Assist"]'::jsonb,
 'Premium minivan with luxury features and advanced driver assistance.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80']),

-- 3. Dodge Challenger R/T 2022
('Dodge', 'Challenger', 'R/T', 2022, 'Red', 'WJY644', 5, 2, 'Gas', 'Premium',
 'sports', 180,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Brake Assist"]'::jsonb,
 'Classic American muscle car with powerful V8 engine.',
 'Automatic', '150 miles/day', true, 
 'https://images.unsplash.com/photo-1626668011687-a63fe9bc19a9?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1626668011687-a63fe9bc19a9?auto=format&fit=crop&w=800&q=80']),

-- 4. Ford Bronco Black Diamond 2024 (Velocity Blue)
('Ford', 'Bronco', 'Black Diamond', 2024, 'Velocity Blue Metallic', '904HEK', 5, 4, 'Gas', 'Regular',
 'suv', 200,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "Brake Assist", "All-wheel Drive", "Convertible"]'::jsonb,
 'Rugged off-road SUV with removable top and doors. Perfect for Hawaiian adventures!',
 'Manual', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1622193724842-3170ef043adb?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1622193724842-3170ef043adb?auto=format&fit=crop&w=800&q=80']),

-- 5. Ford Bronco Black Diamond 2024 (Eruption Green)
('Ford', 'Bronco', 'Black Diamond', 2024, 'Eruption Green', '033125', 5, 4, 'Gas', 'Regular',
 'suv', 200,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "Brake Assist", "All-wheel Drive", "Convertible"]'::jsonb,
 'Rugged off-road SUV with removable top and doors. Perfect for Hawaiian adventures!',
 'Manual', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1622193724842-3170ef043adb?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1622193724842-3170ef043adb?auto=format&fit=crop&w=800&q=80']),

-- 6. Jeep Gladiator Nighthawk 2024 (Yellow) - Unit 1
('Jeep', 'Gladiator', 'Nighthawk', 2024, 'Yellow', 'LPT833', 5, 4, 'Gas', 'Regular',
 'suv', 220,
 '["Backup Camera", "AUX Input", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "Adaptive Cruise Control", "Brake Assist", "All-wheel Drive", "Convertible"]'::jsonb,
 'The only open-air pickup truck with best-in-class towing and 4x4 capability.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1620591309146-1a4f2c8faaa9?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1620591309146-1a4f2c8faaa9?auto=format&fit=crop&w=800&q=80']),

-- 7. Jeep Gladiator Nighthawk 2024 (Blue)
('Jeep', 'Gladiator', 'Nighthawk', 2024, 'Blue', 'LPV633', 5, 4, 'Gas', 'Regular',
 'suv', 220,
 '["Backup Camera", "AUX Input", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "Adaptive Cruise Control", "Brake Assist", "All-wheel Drive", "Convertible"]'::jsonb,
 'The only open-air pickup truck with best-in-class towing and 4x4 capability.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1620591309146-1a4f2c8faaa9?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1620591309146-1a4f2c8faaa9?auto=format&fit=crop&w=800&q=80']),

-- 8. Jeep Gladiator Nighthawk 2024 (Yellow) - Unit 2
('Jeep', 'Gladiator', 'Nighthawk', 2024, 'Yellow', 'FA937', 5, 4, 'Gas', 'Regular',
 'suv', 220,
 '["Backup Camera", "AUX Input", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "Adaptive Cruise Control", "Brake Assist", "All-wheel Drive", "Convertible"]'::jsonb,
 'The only open-air pickup truck with best-in-class towing and 4x4 capability.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1620591309146-1a4f2c8faaa9?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1620591309146-1a4f2c8faaa9?auto=format&fit=crop&w=800&q=80']),

-- 9. Jeep Grand Cherokee L Limited 2023
('Jeep', 'Grand Cherokee L', 'Limited', 2023, 'Velvet Red Pearlcoat', 'WWB650', 6, 4, 'Gas', 'Regular',
 'luxury', 180,
 '["Backup Camera", "Blind Spot Warning", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "GPS", "Heated Seats", "Sunroof", "Adaptive Cruise Control", "Brake Assist", "Lane Departure Warning", "Lane Keeping Assist", "All-wheel Drive"]'::jsonb,
 'Three-row luxury SUV with premium features and advanced safety technology.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1609521263047-f8f205293b24?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1609521263047-f8f205293b24?auto=format&fit=crop&w=800&q=80']),

-- 10. Jeep Wrangler Sahara 2023 (White) - Unit 1
('Jeep', 'Wrangler', 'Sahara', 2023, 'White', 'WSG213', 5, 4, 'Gas', 'Regular',
 'suv', 160,
 '["Backup Camera", "AUX Input", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "GPS", "Sunroof", "Brake Assist", "All-wheel Drive"]'::jsonb,
 'Iconic off-road vehicle with removable doors and roof. Island adventure ready!',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 11. Jeep Wrangler Sahara 2023 (White) - Unit 2
('Jeep', 'Wrangler', 'Sahara', 2023, 'White', 'WSG206', 5, 4, 'Gas', 'Regular',
 'suv', 160,
 '["Backup Camera", "AUX Input", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "GPS", "Sunroof", "Brake Assist", "All-wheel Drive"]'::jsonb,
 'Iconic off-road vehicle with removable doors and roof. Island adventure ready!',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 12. Jeep Wrangler Sport S 2024 (Anvil)
('Jeep', 'Wrangler', 'Sport S', 2024, 'Anvil', '173TYH', 5, 4, 'Gas', 'Regular',
 'suv', 140,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "All-wheel Drive"]'::jsonb,
 'Trail-rated 4x4 capability with modern technology features.',
 'Manual', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 13. Jeep Wrangler Sport S 2024 (Silver)
('Jeep', 'Wrangler', 'Sport S', 2024, 'Silver', '172TYH', 5, 4, 'Gas', 'Regular',
 'suv', 140,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "All-wheel Drive"]'::jsonb,
 'Trail-rated 4x4 capability with modern technology features.',
 'Manual', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 14. Jeep Wrangler Sport S 2025 (White) - Unit 1
('Jeep', 'Wrangler', 'Sport S', 2025, 'White', 'YBD725', 5, 4, 'Gas', 'Regular',
 'suv', 145,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "All-wheel Drive"]'::jsonb,
 'All-new 2025 model with enhanced off-road capabilities.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 15. Jeep Wrangler Sport S 2025 (White) - Unit 2
('Jeep', 'Wrangler', 'Sport S', 2025, 'White', '032625', 5, 4, 'Gas', 'Regular',
 'suv', 145,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "All-wheel Drive"]'::jsonb,
 'All-new 2025 model with enhanced off-road capabilities.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 16. Jeep Wrangler Sport S 2025 (White) - Unit 3
('Jeep', 'Wrangler', 'Sport S', 2025, 'White', 'YBD724', 5, 4, 'Gas', 'Regular',
 'suv', 145,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "All-wheel Drive"]'::jsonb,
 'All-new 2025 model with enhanced off-road capabilities.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 17. Jeep Wrangler Sport S 2025 (White) - Unit 4
('Jeep', 'Wrangler', 'Sport S', 2025, 'White', 'YBD732', 5, 4, 'Gas', 'Regular',
 'suv', 145,
 '["Backup Camera", "Android Auto", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "Sunroof", "All-wheel Drive"]'::jsonb,
 'All-new 2025 model with enhanced off-road capabilities.',
 'Automatic', 'Unlimited', true, 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),

-- 18. Mini Convertible Cooper S 2024 (Island Blue)
('Mini', 'Convertible', 'Cooper S', 2024, 'Island Blue', 'WXA497', 4, 2, 'Gas', 'Premium',
 'convertible', 250,
 '["Backup Camera", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "GPS", "Heated Seats", "Sunroof", "Brake Assist", "Lane Departure Warning", "Convertible"]'::jsonb,
 'Fun-to-drive convertible with go-kart handling and premium features. Perfect for coastal drives!',
 'Manual', '200 miles/day', true, 
 'https://images.unsplash.com/photo-1609965803451-43c6e8d7b346?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1609965803451-43c6e8d7b346?auto=format&fit=crop&w=800&q=80']),

-- 19. Mini Convertible Cooper S 2024 (Chili Red)
('Mini', 'Convertible', 'Cooper S', 2024, 'Chili Red', 'WXA496', 4, 2, 'Gas', 'Premium',
 'convertible', 250,
 '["Backup Camera", "Apple CarPlay", "Bluetooth", "USB Charger", "USB Input", "GPS", "Heated Seats", "Sunroof", "Brake Assist", "Lane Departure Warning", "Convertible"]'::jsonb,
 'Fun-to-drive convertible with go-kart handling and premium features. Perfect for coastal drives!',
 'Manual', '200 miles/day', true, 
 'https://images.unsplash.com/photo-1609965803451-43c6e8d7b346?auto=format&fit=crop&w=800&q=80',
 ARRAY['https://images.unsplash.com/photo-1609965803451-43c6e8d7b346?auto=format&fit=crop&w=800&q=80']);

-- Verify the data was inserted correctly
SELECT COUNT(*) as total_cars FROM cars;
SELECT make, model, trim, year, color, license_plate FROM cars ORDER BY id; 