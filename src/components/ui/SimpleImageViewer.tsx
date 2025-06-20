import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn, ZoomOut } from 'lucide-react';

interface SimpleImageViewerProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatio?: 'auto' | '16:9' | '4:3' | '1:1' | '3:2';
  maxHeight?: string;
}

export const SimpleImageViewer: React.FC<SimpleImageViewerProps> = ({ 
  images, 
  alt, 
  className = "w-full",
  aspectRatio = 'auto',
  maxHeight = "max-h-[70vh]"
}) => {
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || [];
  const hasImages = validImages.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Reset states when image changes
  useEffect(() => {
    setImageLoaded(false);
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
  }, [currentIndex]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!showFullscreen) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          setZoomLevel(1);
          setDragOffset({ x: 0, y: 0 });
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showFullscreen, currentIndex]);
  
  if (!hasImages) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center h-96`}>
        <p className="text-gray-500">Görüntü yok</p>
      </div>
    );
  }
  
  const goToPrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setDragOffset({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      case '3:2': return 'aspect-[3/2]';
      default: return '';
    }
  };
  
  return (
    <>
      <div className={`${className} relative bg-gray-50 ${aspectRatio === 'auto' ? '' : getAspectRatioClass()}`}>
        <div 
          ref={containerRef}
          className={`relative overflow-hidden group ${aspectRatio === 'auto' ? 'flex items-center justify-center' : 'h-full'}`}
        >
          {/* Loading state */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
            </div>
          )}
          
          {/* Ana görüntü */}
          <img 
            src={validImages[currentIndex]} 
            alt={`${alt} (${currentIndex + 1}/${validImages.length})`} 
            className={`
              transition-all duration-300
              ${aspectRatio === 'auto' 
                ? `w-full ${maxHeight} object-contain` 
                : 'w-full h-full object-cover'
              }
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Hover overlay - sadece yüklendikten sonra göster */}
          {imageLoaded && (
            <>
              {/* Fullscreen butonu */}
              <button
                onClick={() => setShowFullscreen(true)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 backdrop-blur-sm"
                title="Tam ekran görüntüle"
              >
                <Expand size={20} />
              </button>
              
              {/* Navigation buttons - sadece birden fazla görüntü varsa */}
              {validImages.length > 1 && (
                <>
                  <button 
                    onClick={goToPrevious}
                    className="absolute top-1/2 left-3 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 backdrop-blur-sm"
                    aria-label="Önceki görüntü"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  
                  <button 
                    onClick={goToNext}
                    className="absolute top-1/2 right-3 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 backdrop-blur-sm"
                    aria-label="Sonraki görüntü"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              
              {/* Thumbnail strip - sadece birden fazla görüntü varsa */}
              {validImages.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {validImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`relative w-20 h-14 rounded-md overflow-hidden transition-all duration-200 flex-shrink-0 ${
                          index === currentIndex 
                            ? 'ring-2 ring-white scale-110 shadow-xl' 
                            : 'opacity-60 hover:opacity-90 hover:scale-105'
                        }`}
                      >
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        {index === currentIndex && (
                          <div className="absolute inset-0 bg-white/20" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Image counter */}
              {validImages.length > 1 && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentIndex + 1} / {validImages.length}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Custom Fullscreen Modal - Modal komponentini kullanmıyoruz */}
      {showFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black">
          {/* Close button */}
          <button
            onClick={() => {
              setShowFullscreen(false);
              setZoomLevel(1);
              setDragOffset({ x: 0, y: 0 });
            }}
            className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-2 rounded-full transition-all z-[110]"
            title="Kapat (ESC)"
          >
            <X size={24} />
          </button>
          
          {/* Zoom controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center gap-2 px-3 py-1.5 z-[110]">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className={`p-1 rounded-full transition-all ${
                zoomLevel > 1 
                  ? 'text-white hover:bg-white/20' 
                  : 'text-white/40 cursor-not-allowed'
              }`}
              title="Uzaklaştır (-)"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className={`p-1 rounded-full transition-all ${
                zoomLevel < 3 
                  ? 'text-white hover:bg-white/20' 
                  : 'text-white/40 cursor-not-allowed'
              }`}
              title="Yakınlaştır (+)"
            >
              <ZoomIn size={20} />
            </button>
          </div>
          
          {/* Main image container */}
          <div 
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              ref={imageRef}
              src={validImages[currentIndex]} 
              alt={`${alt} (${currentIndex + 1}/${validImages.length})`} 
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transform: `scale(${zoomLevel}) translate(${dragOffset.x / zoomLevel}px, ${dragOffset.y / zoomLevel}px)`,
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              draggable={false}
            />
          </div>
          
          {/* Navigation for multiple images */}
          {validImages.length > 1 && (
            <>
              <button 
                onClick={goToPrevious}
                className="absolute top-1/2 left-4 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-3 rounded-full transition-all z-[110]"
                title="Önceki (←)"
              >
                <ChevronLeft size={32} />
              </button>
              
              <button 
                onClick={goToNext}
                className="absolute top-1/2 right-4 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-3 rounded-full transition-all z-[110]"
                title="Sonraki (→)"
              >
                <ChevronRight size={32} />
              </button>
              
              {/* Dots indicator */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-[110]">
                {validImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 hover:bg-white/70 w-2'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}; 