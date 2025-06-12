-- Add support for multiple images and main image selection
ALTER TABLE cars 
ADD COLUMN image_urls TEXT[] DEFAULT '{}',
ADD COLUMN main_image_index INT DEFAULT 0;

-- Update existing records to populate image_urls with image_url
UPDATE cars 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- Add comment for migration documentation
COMMENT ON COLUMN cars.image_urls IS 'Array of image URLs for the car';
COMMENT ON COLUMN cars.main_image_index IS 'Index of the main image in the image_urls array';

-- Example policy for uploads
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'car-images');

-- Example policy for viewing images
CREATE POLICY "Public access to car images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'car-images');

-- UPDATE izni (dosyaları güncelleme)
CREATE POLICY "Allow authenticated updates" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'car-images');

-- DELETE izni (dosyaları silme)
CREATE POLICY "Allow authenticated deletes" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'car-images'); 