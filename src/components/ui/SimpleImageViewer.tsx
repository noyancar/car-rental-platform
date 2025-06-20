import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimpleImageViewerProps {
  images: string[];
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const SimpleImageViewer: React.FC<SimpleImageViewerProps> = ({ 
  images, 
  alt, 
  className = "w-full h-96",
  objectFit = 'contain' // Varsayılan olarak contain kullanarak görüntülerin tamamını göster
}) => {
  // Geçersiz görüntüleri filtrele
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  
  // Görüntü kontrolü
  const hasImages = validImages.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Görüntü yoksa boş bir yer tutucu göster
  if (!hasImages) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <p className="text-gray-500">Görüntü yok</p>
      </div>
    );
  }
  
  // Sadece bir görüntü varsa, kontrolsüz göster
  if (validImages.length === 1) {
    return (
      <div className={`${className} relative overflow-hidden bg-gray-50`}>
        <img 
          src={validImages[0]} 
          alt={alt} 
          className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : `object-${objectFit}`}`}
        />
      </div>
    );
  }
  
  // Önceki görüntüye git
  const goToPrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };
  
  // Sonraki görüntüye git
  const goToNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  return (
    <div className={`${className} relative overflow-hidden group bg-gray-50`}>
      {/* Ana görüntü */}
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={validImages[currentIndex]} 
          alt={`${alt} (${currentIndex + 1}/${validImages.length})`} 
          className={`max-w-full max-h-full ${objectFit === 'contain' ? 'object-contain' : `object-${objectFit}`} transition-all duration-300`}
        />
      </div>
      
      {/* Önceki/Sonraki Düğmeleri */}
      <button 
        onClick={goToPrevious}
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        onClick={goToNext}
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={24} />
      </button>
      
      {/* Küçük Resimler - bunlar object-cover kalabilir */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-30 flex justify-center gap-2 overflow-x-auto">
        {validImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-16 h-12 rounded overflow-hidden transition-all ${
              index === currentIndex ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <img 
              src={image} 
              alt={`Küçük resim ${index + 1}`} 
              className="w-full h-full object-cover" // Küçük resimler için cover kullanmaya devam et
            />
          </button>
        ))}
      </div>
      
      {/* Sayaç */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
        {currentIndex + 1} / {validImages.length}
      </div>
    </div>
  );
}; 