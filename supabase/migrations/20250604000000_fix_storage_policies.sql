-- Fix storage policies for car-images bucket
-- First, ensure the bucket exists and is public

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public access to car images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create comprehensive policies for car-images bucket

-- 1. Allow anyone to view images (public access)
CREATE POLICY "Anyone can view car images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'car-images');

-- 2. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload car images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'car-images');

-- 3. Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update car images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'car-images')
WITH CHECK (bucket_id = 'car-images');

-- 4. Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete car images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'car-images');

-- Update any existing car records that might have incorrect image URLs
-- Fix image URLs to use proper Supabase storage URL format if needed
UPDATE cars
SET image_url = REPLACE(image_url, '/storage/v1/object/public/', '')
WHERE image_url LIKE '%/storage/v1/object/public/%';

-- Ensure all cars have at least empty image_urls array
UPDATE cars
SET image_urls = CASE 
    WHEN image_urls IS NULL THEN ARRAY[]::text[]
    ELSE image_urls
END; 