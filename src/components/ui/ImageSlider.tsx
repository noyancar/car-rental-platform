import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  alt: string;
  className?: string;
  height?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const ImageSlider: React.FC<ImageSliderProps> = ({ 
  images, 
  alt, 
  className = "w-full h-96", 
  height = "h-96",
  objectFit = 'contain' // Varsayılan olarak contain kullanarak görüntülerin tamamını göster
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Validate images array and filter out empty strings or invalid URLs
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const hasImages = validImages.length > 0;
  const imageCount = validImages.length;
  
  // Reset current index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= imageCount && imageCount > 0) {
      setCurrentIndex(0);
    }
  }, [imageCount, currentIndex]);
  
  const goToPrevious = () => {
    if (isAnimating || !hasImages) return;
    setIsAnimating(true);
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? imageCount - 1 : prevIndex - 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  const goToNext = () => {
    if (isAnimating || !hasImages) return;
    setIsAnimating(true);
    setCurrentIndex(prevIndex => 
      prevIndex === imageCount - 1 ? 0 : prevIndex + 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex || !hasImages) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };
  
  // If no images, show a placeholder
  if (!hasImages) {
    return (
      <div className={`${className} bg-secondary-100 flex items-center justify-center`}>
        <p className="text-secondary-500">No images available</p>
      </div>
    );
  }
  
  // If only one image, show it without controls
  if (imageCount === 1) {
    return (
      <div className={`${className} relative overflow-hidden bg-gray-50`}>
        <img 
          src={validImages[0]} 
          alt={alt} 
          className={`w-full h-full object-${objectFit}`}
        />
      </div>
    );
  }
  
  return (
    <div className={`${className} relative overflow-hidden group bg-gray-50`}>
      {/* Images with fade animation instead of transform */}
      <div className="h-full relative">
        {validImages.map((image, index) => (
          <div 
            key={index}
            className="absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 10 : 0
            }}
          >
            <img 
              src={image} 
              alt={`${alt} (${index + 1}/${imageCount})`} 
              className={`max-w-full max-h-full ${objectFit === 'contain' ? 'object-contain' : `object-${objectFit}`}`}
            />
          </div>
        ))}
      </div>
      
      {/* Left/Right Controls */}
      <button 
        onClick={goToPrevious}
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        aria-label="Previous image"
        disabled={isAnimating}
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        onClick={goToNext}
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        aria-label="Next image"
        disabled={isAnimating}
      >
        <ChevronRight size={24} />
      </button>
      
      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {validImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white scale-110' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            disabled={isAnimating}
          />
        ))}
      </div>
      
      {/* Current slide indicator */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm z-20">
        {currentIndex + 1} / {imageCount}
      </div>
    </div>
  );
}; 