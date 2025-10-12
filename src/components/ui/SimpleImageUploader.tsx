import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, X, Star, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Button } from './Button';
import { optimizeImage } from '../../utils/imageOptimizer';

// Yüklenen resim tipini tanımlama
interface UploadedImage {
  id: string;
  url: string;
  isMain: boolean;
}

interface SimpleImageUploaderProps {
  onImagesChange: (urls: string[], mainIndex: number) => void;
  initialImages?: string[];
  initialMainIndex?: number;
  label?: string;
  maxFiles?: number;
  bucketName?: string;
  folderPath?: string;
  itemId?: number;
}

export const SimpleImageUploader: React.FC<SimpleImageUploaderProps> = ({
  onImagesChange,
  initialImages = [],
  initialMainIndex = 0,
  label = 'Fotoğraflar',
  maxFiles = 5,
  bucketName = 'car-images',
  folderPath = '',
  itemId
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track previous values with useRef instead of calculating them every render
  const previousImagesRef = useRef<string[]>([]);
  const previousMainIndexRef = useRef<number>(0);
  
  // İlk yükleme için ayrı bir useEffect - sadece bir kez çalışacak
  useEffect(() => {
    if (initialImages.length > 0 && !initialized) {
      const processedImages = initialImages.map((url, index) => ({
        id: `existing-${index}`,
        url: url,
        isMain: index === initialMainIndex
      }));
      
      if (!processedImages.some(img => img.isMain) && processedImages.length > 0) {
        processedImages[0].isMain = true;
      }
      
      setImages(processedImages);
      setInitialized(true);
      
      // Store initial values in refs
      previousImagesRef.current = initialImages;
      previousMainIndexRef.current = initialMainIndex;
    }
  }, [initialImages, initialMainIndex, initialized]);

  // Current urls and mainIndex calculation wrapped in useMemo
  const { currentUrls, currentMainIndex } = useMemo(() => {
    const urls = images.map(img => img.url);
    const mainIndex = images.findIndex(img => img.isMain);
    return { 
      currentUrls: urls, 
      currentMainIndex: mainIndex !== -1 ? mainIndex : 0 
    };
  }, [images]);

  // Notify parent only when something actually changes
  useEffect(() => {
    if (!initialized || images.length === 0) return;
    
    // Check if anything has actually changed
    const hasUrlsChanged = previousImagesRef.current.length !== currentUrls.length || 
      currentUrls.some((url, i) => previousImagesRef.current[i] !== url);
    
    const hasMainIndexChanged = previousMainIndexRef.current !== currentMainIndex;
    
    if (hasUrlsChanged || hasMainIndexChanged) {
      // Update previous values
      previousImagesRef.current = currentUrls;
      previousMainIndexRef.current = currentMainIndex;
      
      // Notify parent
      onImagesChange(currentUrls, currentMainIndex);
    }
  }, [currentUrls, currentMainIndex, initialized, images.length, onImagesChange]);

  // Dosya yükleme işlevi
  const uploadFiles = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxFiles) {
      toast.error(`You can upload maximum ${maxFiles} photos.`);
      return;
    }

    setIsUploading(true);
    const newImages: UploadedImage[] = [];
    const fileArray = Array.from(files);

    try {
      // Session check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You need to be logged in to upload files!');
        setIsUploading(false);
        return;
      }

      // Process each file
      for (const file of fileArray) {
        try {
          // File type check (images only)
          if (!file.type.startsWith('image/')) {
            toast.error(`${file.name} is not an image file.`);
            continue;
          }

          // File size check - allow up to 10MB (will be optimized)
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`${file.name} is larger than 10MB. Please select a smaller image.`);
            continue;
          }

          // Optimize image
          let fileToUpload = file;
          try {
            const originalSizeMB = file.size / 1024 / 1024;

            // Optimize if file is larger than 1MB
            if (originalSizeMB > 1) {
              toast.info(`Optimizing ${file.name}...`);
              fileToUpload = await optimizeImage(file, {
                maxSizeMB: 1, // Compress to 1MB
                maxWidthOrHeight: 1920, // Max 1920px
                initialQuality: 0.85,
              });

              const newSizeMB = fileToUpload.size / 1024 / 1024;
              const savedPercent = ((1 - fileToUpload.size / file.size) * 100).toFixed(0);

              toast.success(`${file.name} optimized: ${originalSizeMB.toFixed(1)}MB → ${newSizeMB.toFixed(1)}MB (${savedPercent}% saved)`);
            }
          } catch (optimizeError) {
            console.error('Image optimization failed, original file will be uploaded:', optimizeError);
            // Use original file if optimization fails
          }

          // Generate filename
          const fileExt = file.name.split('.').pop();
          const fileName = itemId
            ? `${folderPath}/${itemId}/${Date.now()}.${fileExt}`
            : `${folderPath}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

          // Upload to Supabase
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileToUpload, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) throw error;

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

          // Add new image
          newImages.push({
            id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            url: publicUrlData.publicUrl,
            isMain: images.length === 0 && newImages.length === 0 // First image is main
          });
        } catch (error: any) {
          toast.error(`Error uploading ${file.name}: ${error.message}`);
        }
      }

      // Add successfully uploaded images to state
      if (newImages.length > 0) {
        setImages(prev => {
          // If no main image yet and adding images, make first added image the main one
          if (prev.length === 0 && !prev.some(img => img.isMain) && newImages.length > 0) {
            newImages[0].isMain = true;
          }
          return [...prev, ...newImages];
        });
        toast.success(`${newImages.length} photo${newImages.length > 1 ? 's' : ''} uploaded successfully.`);
      }
    } catch (error: any) {
      toast.error(`File upload error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }, [images, maxFiles, bucketName, folderPath, itemId, onImagesChange]);

  // Ana resmi değiştir
  const setMainImage = (id: string) => {
    setImages(prev => 
      prev.map(img => ({
        ...img,
        isMain: img.id === id
      }))
    );
  };

  // Resmi sil
  const removeImage = (id: string) => {
    const isMain = images.find(img => img.id === id)?.isMain || false;
    
    setImages(prev => {
      const updatedImages = prev.filter(img => img.id !== id);
      
      // Eğer ana resmi sildiysek ve başka resim varsa, ilk resmi ana resim yap
      if (isMain && updatedImages.length > 0) {
        updatedImages[0].isMain = true;
      }
      
      return updatedImages;
    });
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <div className="text-sm text-gray-500">{images.length}/{maxFiles} photos</div>
        </div>
      )}
      
      {/* Upload button */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 mb-2">
          Click to upload photos
        </p>
        <p className="text-xs text-gray-400 mb-4">
          PNG, JPG, WEBP &middot; Max 10MB &middot; Auto-optimized
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || images.length >= maxFiles}
        >
          {isUploading ? 'Uploading...' : 'Select Photos'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              uploadFiles(e.target.files);
              e.target.value = ''; // İnput'u temizle
            }
          }}
          disabled={isUploading || images.length >= maxFiles}
        />
      </div>
      
      {/* Uploaded images */}
      {images.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div 
                key={image.id} 
                className={`relative rounded-lg overflow-hidden border-2 ${
                  image.isMain ? 'border-primary-500' : 'border-gray-200'
                } group`}
              >
                <img 
                  src={image.url} 
                  alt="Uploaded" 
                  className="w-full h-36 object-cover"
                />
                
                {/* Main image badge */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                    Main Photo
                  </div>
                )}

                {/* Control buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setMainImage(image.id)}
                    className={`p-1.5 rounded-full ${
                      image.isMain ? 'text-yellow-400' : 'text-white hover:text-yellow-400'
                    }`}
                    title="Set as main photo"
                  >
                    <Star size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="p-1.5 rounded-full text-white hover:text-red-400"
                    title="Remove photo"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 