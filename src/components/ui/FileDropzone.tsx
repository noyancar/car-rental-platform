import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image, Check, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, ensureStorageBucket } from '../../lib/supabase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { optimizeImage } from '../../utils/imageOptimizer';

export interface ImageFile {
  id: string;
  file?: File;
  previewUrl: string;
  storageUrl?: string;
  isUploading?: boolean;
  isMain?: boolean;
}

interface FileDropzoneProps {
  onImagesUpload: (urls: string[], mainIndex: number) => void;
  values?: string[];
  mainImageIndex?: number;
  label?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  bucketName?: string;
  folderPath?: string;
  carId?: number;
}

interface SortableImageProps {
  image: ImageFile;
  index: number;
  isMain: boolean;
  onRemove: (id: string) => void;
  onSetMain: (id: string) => void;
}

// Sortable image component for drag and drop
const SortableImage = ({ image, index, isMain, onRemove, onSetMain }: SortableImageProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative rounded overflow-hidden border-2 ${isMain ? 'border-primary-500' : 'border-secondary-200'} group`}
    >
      <div 
        className="cursor-move absolute top-0 left-0 right-0 h-6 bg-black bg-opacity-40 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" 
        {...attributes} 
        {...listeners}
      >
        <div className="flex items-center">
          <ArrowUp size={14} className="text-white" />
          <ArrowDown size={14} className="text-white" />
        </div>
      </div>
      
      <img 
        src={image.previewUrl} 
        alt={`Preview ${index + 1}`} 
        className={`object-cover ${isMain ? 'h-28 w-full' : 'h-20 w-full'}`} 
      />
      
      {isMain && (
        <div className="absolute top-1 right-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-sm z-10">
          MAIN
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-1 bg-black bg-opacity-50">
        {image.isUploading ? (
          <div className="animate-pulse text-white text-xs">Uploading...</div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSetMain(image.id)}
              className={`p-1 rounded-full ${isMain ? 'text-yellow-400' : 'text-white hover:text-yellow-400'}`}
              title="Set as main image"
            >
              <Star size={isMain ? 16 : 14} />
            </button>
            
            <button
              type="button"
              onClick={() => onRemove(image.id)}
              className="p-1 rounded-full text-white hover:text-error-400"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onImagesUpload,
  values = [],
  mainImageIndex = 0,
  label = 'Upload Images',
  maxSizeMB = 10,
  maxFiles = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  bucketName = 'car-images',
  folderPath = '',
  carId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [prevValues, setPrevValues] = useState<string[]>([]);
  const [prevMainIndex, setPrevMainIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Setup DnD kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Initialize images from values (URLs) passed in props - only once
  useEffect(() => {
    if (!initialized && values.length > 0) {
      const initialImages = values.map((url, index) => ({
        id: `existing-${index}`,
        previewUrl: url,
        storageUrl: url,
        isMain: index === mainImageIndex
      }));
      setImages(initialImages);
      setPrevValues([...values]);
      setPrevMainIndex(mainImageIndex);
      setInitialized(true);
    }
  }, [values, mainImageIndex, initialized]);
  
  // Ensure the storage bucket exists when component mounts
  useEffect(() => {
    ensureStorageBucket(bucketName);
  }, [bucketName]);
  
  // Notify parent only when images actually change
  const notifyParent = useCallback(() => {
    if (images.length === 0 && prevValues.length === 0) return;
    
    const urls = images.map(img => img.storageUrl || img.previewUrl);
    
    // Remove any invalid URLs to prevent issues
    const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim() !== '');
    
    const mainIndex = images.findIndex(img => img.isMain);
    const finalMainIndex = mainIndex >= 0 ? mainIndex : 0;
    
    // Deep compare with previous values
    const prevUrls = prevValues || [];
    
    // Check if arrays are different
    let urlsChanged = validUrls.length !== prevUrls.length;
    
    // If lengths are the same, check each URL
    if (!urlsChanged && validUrls.length > 0) {
      for (let i = 0; i < validUrls.length; i++) {
        if (validUrls[i] !== prevUrls[i]) {
          urlsChanged = true;
          break;
        }
      }
    }
    
    const mainIndexChanged = finalMainIndex !== prevMainIndex;
    
    // Only notify if something actually changed
    if (urlsChanged || mainIndexChanged) {
      onImagesUpload(validUrls, finalMainIndex);
      
      // Update previous values
      setPrevValues([...validUrls]);
      setPrevMainIndex(finalMainIndex);
    }
  }, [images, prevValues, prevMainIndex, onImagesUpload]);
  
  const uploadImageToStorage = async (image: ImageFile) => {
    if (!image.file) return;
    
    try {
      // Oturum kontrolü ekleyin
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Dosya yüklemek için oturum açmanız gerekiyor!');
        return;
      }
      
      // Generate a unique file name
      const fileExt = image.file.name.split('.').pop();
      const fileName = carId 
        ? `car-${carId}/image-${Date.now()}.${fileExt}`
        : `${folderPath}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, image.file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      // Update image state with storage URL
      setImages(prev => {
        const updatedImages = prev.map(img => 
          img.id === image.id 
            ? { ...img, storageUrl: publicUrlData.publicUrl, isUploading: false }
            : img
        );
        
        // Use requestAnimationFrame instead of setTimeout for better performance
        requestAnimationFrame(() => notifyParent());
        
        return updatedImages;
      });
      
    } catch (error: any) {
      toast.error(`Dosya yükleme hatası: ${error.message || JSON.stringify(error)}`);
      
      // Mark as failed but keep in UI
      setImages(prev => 
        prev.map(img => 
          img.id === image.id 
            ? { ...img, isUploading: false }
            : img
        )
      );
    }
  };
  
  // Define handleFilesUpload first so it can be used in the dependency arrays
  const handleFilesUpload = useCallback(async (files: File[]) => {
    // Check if adding these files would exceed the maximum
    if (images.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }
    
    // Process each file
    const newImages: ImageFile[] = [];
    
    for (const file of files) {
      // Validate file type
      if (!acceptedFileTypes.includes(file.type)) {
        toast.error(`File type not accepted for "${file.name}". Please upload: ${acceptedFileTypes.join(', ')}`);
        continue;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
        continue;
      }
      
      // Optimize image if needed
      let fileToUpload = file;
      try {
        const originalSizeMB = file.size / 1024 / 1024;
        
        // Optimize if file is larger than 1MB
        if (originalSizeMB > 1) {
          toast.info(`Optimizing ${file.name}...`);
          fileToUpload = await optimizeImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            initialQuality: 0.85,
          });
          
          const newSizeMB = fileToUpload.size / 1024 / 1024;
          const savedPercent = ((1 - fileToUpload.size / file.size) * 100).toFixed(0);
          
          toast.success(`${file.name} optimized: ${originalSizeMB.toFixed(1)}MB → ${newSizeMB.toFixed(1)}MB (${savedPercent}% saved)`);
        }
      } catch (optimizeError) {
        console.error('Image optimization failed, using original:', optimizeError);
      }
      
      // Create a unique ID for this image
      const imageId = `new-${Math.random().toString(36).substring(2, 15)}`;
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(fileToUpload);
      
      // Add to images array
      newImages.push({
        id: imageId,
        file: fileToUpload,
        previewUrl,
        isUploading: true,
        isMain: images.length === 0 && newImages.length === 0 // First image is main by default
      });
    }
    
    // Update state with new images
    setImages(prev => {
      const updatedImages = [...prev, ...newImages];
      
      // Use requestAnimationFrame instead of setTimeout for better performance
      requestAnimationFrame(() => notifyParent());
      
      return updatedImages;
    });
    
    // Upload each image to storage
    for (const newImage of newImages) {
      if (newImage.file) {
        await uploadImageToStorage(newImage);
      }
    }
  }, [images.length, maxFiles, acceptedFileTypes, maxSizeMB, bucketName, carId, folderPath, notifyParent]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length) {
        await handleFilesUpload(files);
      }
    },
    [handleFilesUpload]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        await handleFilesUpload(files);
      }
      // Reset input value to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFilesUpload]
  );

  const handleRemoveImage = useCallback((imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    
    // Release object URL to prevent memory leaks
    if (imageToRemove?.previewUrl && imageToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    
    // Remove the image
    setImages(prev => {
      const wasMain = prev.find(img => img.id === imageId)?.isMain || false;
      const newImages = prev.filter(img => img.id !== imageId);
      
      // If we removed the main image and there are other images, set a new main
      if (wasMain && newImages.length > 0) {
        newImages[0].isMain = true;
      }
      
      // Use requestAnimationFrame instead of setTimeout for better performance
      requestAnimationFrame(() => notifyParent());
      
      return newImages;
    });
  }, [images, notifyParent]);

  const handleSetMainImage = useCallback((imageId: string) => {
    setImages(prev => {
      const updatedImages = prev.map(img => ({
        ...img,
        isMain: img.id === imageId
      }));
      
      // Use requestAnimationFrame instead of setTimeout for better performance
      requestAnimationFrame(() => notifyParent());
      
      return updatedImages;
    });
  }, [notifyParent]);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setImages(prev => {
        const oldIndex = prev.findIndex(img => img.id === active.id);
        const newIndex = prev.findIndex(img => img.id === over.id);
        
        // Create new array with reordered images
        const newImages = arrayMove(prev, oldIndex, newIndex);
        
        // Use requestAnimationFrame instead of setTimeout for better performance
        requestAnimationFrame(() => notifyParent());
        
        return newImages;
      });
    }
  }, [notifyParent]);

  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Drag area for new files */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 transition-colors
          flex flex-col items-center justify-center cursor-pointer
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-secondary-300 hover:border-primary-400'}
          mb-3
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ minHeight: '100px' }}
      >
        <div className="mb-2 p-2 rounded-full bg-secondary-100">
          <Upload className="h-5 w-5 text-secondary-500" />
        </div>
        <p className="text-sm text-center text-secondary-600">
          Drag and drop images here, or click to select
        </p>
        <p className="text-xs text-center text-secondary-500 mt-1">
          {acceptedFileTypes.map(type => type.replace('image/', '.')).join(', ')} (max {maxSizeMB}MB)
        </p>
        <p className="text-xs text-center text-secondary-500">
          {images.length} / {maxFiles} images
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileChange}
          multiple
          disabled={images.length >= maxFiles}
        />
      </div>
      
      {/* Image preview grid with drag-to-reorder */}
      {images.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-secondary-500 mb-2">
            Drag to reorder • Click star to set as main • {images.length} / {maxFiles} images
          </p>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={images.map(img => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    index={index}
                    isMain={!!image.isMain}
                    onRemove={handleRemoveImage}
                    onSetMain={handleSetMainImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}; 