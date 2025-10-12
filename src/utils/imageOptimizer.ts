import imageCompression from 'browser-image-compression';

export interface ImageOptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
}

// Varsayılan ayarlar
const defaultOptions: ImageOptimizationOptions = {
  maxSizeMB: 1, // 1MB'a kadar sıkıştır
  maxWidthOrHeight: 1920, // Max 1920px genişlik/yükseklik
  useWebWorker: true,
  fileType: 'auto',
  initialQuality: 0.8,
  alwaysKeepResolution: false,
};

/**
 * Görüntü dosyasını optimize eder ve sıkıştırır
 * @param file - Optimize edilecek dosya
 * @param customOptions - Özel optimizasyon ayarları
 * @returns Optimize edilmiş dosya
 */
export async function optimizeImage(
  file: File,
  customOptions?: ImageOptimizationOptions
): Promise<File> {
  const options = { ...defaultOptions, ...customOptions };

  try {
    // Dosya zaten küçükse ve görüntü değilse, dokunma
    if (file.size <= (options.maxSizeMB! * 1024 * 1024) && !file.type.startsWith('image/')) {
      return file;
    }

    // Görüntü değilse hata fırlat
    if (!file.type.startsWith('image/')) {
      throw new Error('Dosya bir görüntü değil');
    }


    // Görüntüyü sıkıştır
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB!,
      maxWidthOrHeight: options.maxWidthOrHeight!,
      useWebWorker: options.useWebWorker,
      fileType: options.fileType as any,
      initialQuality: options.initialQuality,
      alwaysKeepResolution: options.alwaysKeepResolution,
    });


    return compressedFile;
  } catch (error) {
    console.error('Görüntü optimizasyonu başarısız:', error);
    throw error;
  }
}

/**
 * Birden fazla görüntüyü optimize eder
 * @param files - Optimize edilecek dosyalar
 * @param customOptions - Özel optimizasyon ayarları
 * @returns Optimize edilmiş dosyalar
 */
export async function optimizeMultipleImages(
  files: File[],
  customOptions?: ImageOptimizationOptions
): Promise<File[]> {
  const optimizedFiles = await Promise.all(
    files.map(file => optimizeImage(file, customOptions))
  );
  
  return optimizedFiles;
}

/**
 * Görüntü boyutunu kontrol eder ve kullanıcı dostu mesaj döner
 * @param file - Kontrol edilecek dosya
 * @param maxSizeMB - Maksimum dosya boyutu (MB)
 * @returns Hata mesajı veya null
 */
export function validateImageSize(file: File, maxSizeMB: number): string | null {
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (fileSizeMB > maxSizeMB) {
    return `${file.name} dosyası ${fileSizeMB.toFixed(1)} MB boyutunda. Maksimum ${maxSizeMB} MB olmalıdır.`;
  }
  
  return null;
}

/**
 * Dosya tipini kontrol eder
 * @param file - Kontrol edilecek dosya
 * @param acceptedTypes - Kabul edilen MIME tipleri
 * @returns Hata mesajı veya null
 */
export function validateImageType(file: File, acceptedTypes: string[]): string | null {
  if (!acceptedTypes.includes(file.type)) {
    const acceptedExtensions = acceptedTypes.map(type => type.split('/')[1]).join(', ');
    return `${file.name} dosyası desteklenmeyen bir formatta. Desteklenen formatlar: ${acceptedExtensions}`;
  }
  
  return null;
}

/**
 * Görüntü kalitesini kademeli olarak düşürerek hedef boyuta ulaşmaya çalışır
 * @param file - Optimize edilecek dosya
 * @param targetSizeMB - Hedef dosya boyutu (MB)
 * @param minQuality - Minimum kalite (0-1)
 * @returns Optimize edilmiş dosya
 */
export async function optimizeToTargetSize(
  file: File,
  targetSizeMB: number = 1,
  minQuality: number = 0.5
): Promise<File> {
  let quality = 0.9;
  let optimizedFile = file;
  
  // Dosya zaten hedef boyuttan küçükse, sadece boyutları kontrol et
  if (file.size <= targetSizeMB * 1024 * 1024) {
    return optimizeImage(file, {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: 1920,
      initialQuality: 0.95,
    });
  }
  
  // Kademeli olarak kaliteyi düşür
  while (quality >= minQuality) {
    try {
      optimizedFile = await optimizeImage(file, {
        maxSizeMB: targetSizeMB,
        initialQuality: quality,
        maxWidthOrHeight: 1920,
      });
      
      // Hedef boyuta ulaştıysak çık
      if (optimizedFile.size <= targetSizeMB * 1024 * 1024) {
        break;
      }
      
      // Kaliteyi düşür
      quality -= 0.1;
    } catch (error) {
      console.error(`Kalite ${quality} ile optimizasyon başarısız:`, error);
      quality -= 0.1;
    }
  }
  
  return optimizedFile;
}

/**
 * Adds thumbnail transformation parameters to Supabase Storage URL
 * If Supabase transform is not supported, returns original URL (safe fallback)
 * @param url - Original Supabase storage URL
 * @param width - Desired width in pixels (default: 400)
 * @param height - Desired height in pixels (default: 300)
 * @returns Thumbnail URL or original URL in case of error
 */
export function getThumbnailUrl(
  url: string,
  width: number = 400,
  height: number = 300
): string {
  // Check for empty or invalid URL
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', width.toString());
    urlObj.searchParams.set('height', height.toString());
    urlObj.searchParams.set('resize', 'cover');
    return urlObj.toString();
  } catch (error) {
    // Return original URL in case of error (safe fallback)
    console.warn('getThumbnailUrl: Invalid URL, returning original:', url);
    return url;
  }
} 