import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Star, ChevronLeft, ChevronRight, Users, DoorOpen, Fuel, Gauge, Settings2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Car } from '../../types';

interface FeaturedCarsSectionProps {
  featuredCars: Car[];
  loading: boolean;
}

const FeaturedCarsSection: React.FC<FeaturedCarsSectionProps> = ({ featuredCars, loading }) => {
  // Sort cars by price (cheapest to most expensive), considering seasonal pricing
  const sortedCars = useMemo(() => {
    return [...featuredCars].sort((a, b) => {
      // Use seasonal pricing if available, otherwise use regular price
      const priceA = (a as any).active_seasonal_pricing
        ? (a as any).active_seasonal_pricing.price_per_day
        : a.price_per_day;
      const priceB = (b as any).active_seasonal_pricing
        ? (b as any).active_seasonal_pricing.price_per_day
        : b.price_per_day;
      return priceA - priceB;
    });
  }, [featuredCars]);

  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Responsive items per page
  const getItemsPerPage = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1; // mobile
    if (window.innerWidth < 1024) return 2; // tablet
    if (window.innerWidth < 1280) return 3; // laptop
    return 4; // desktop
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = getItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  const totalPages = Math.ceil(sortedCars.length / itemsPerPage);

  const scrollToSearch = () => {
    window.scrollTo({ top: 1040, behavior: 'smooth' });
  };

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setIsAutoPlaying(false);
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || sortedCars.length <= itemsPerPage) return;

    const interval = setInterval(() => {
      nextPage();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, sortedCars.length, itemsPerPage, nextPage]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextPage();
    } else if (isRightSwipe) {
      prevPage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const getCurrentPageCars = () => {
    const startIndex = currentPage * itemsPerPage;
    return sortedCars.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white via-secondary-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display mb-3 md:mb-4 text-volcanic-900">
            Our Complete Fleet
          </h2>
          <p className="text-secondary-600 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">
            Explore our entire collection of premium vehicles available for your Oahu adventure
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-secondary-500">
            <span className="inline-block w-12 h-0.5 bg-primary-800"></span>
            <span className="font-semibold">{sortedCars.length} Vehicles Available</span>
            <span className="inline-block w-12 h-0.5 bg-primary-800"></span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-800 mb-4"></div>
            <p className="text-secondary-600 text-sm">Loading our fleet...</p>
          </div>
        ) : sortedCars.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-secondary-600 text-lg">No vehicles available at the moment.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Mobile Swipe Instruction */}
            <div className="block sm:hidden text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-success-50 border-2 border-success-600 rounded-full px-4 py-2 shadow-md">
                <ChevronLeft className="w-5 h-5 text-success-600 animate-pulse" />
                <span className="font-bold text-success-700 text-sm">Swipe to browse vehicles</span>
                <ChevronRight className="w-5 h-5 text-success-600 animate-pulse" />
              </div>
            </div>

            {/* Thumbnail Preview Bar */}
            {sortedCars.length > itemsPerPage && (
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 px-2 sm:px-4">
                  {sortedCars.map((car, idx) => {
                    const isInCurrentPage = idx >= currentPage * itemsPerPage && idx < (currentPage + 1) * itemsPerPage;
                    const pageIndex = Math.floor(idx / itemsPerPage);

                    return (
                      <button
                        key={car.id}
                        onClick={() => goToPage(pageIndex)}
                        className={`flex-shrink-0 transition-all duration-300 rounded-lg overflow-hidden border-2 ${
                          isInCurrentPage
                            ? 'bg-success-50 border-success-600  shadow-lg'
                            : 'bg-secondary-100 border-secondary-300 hover:border-secondary-400 hover:shadow-md'
                        }`}
                        aria-label={`View ${car.make} ${car.model}`}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 relative">
                          <img
                            src={car.image_urls && car.image_urls.length > 0
                              ? car.image_urls[car.main_image_index || 0]
                              : car.image_url}
                            alt={`${car.make} ${car.model}`}
                            className={`rounded w-full h-full object-cover transition-all duration-500 ${
                              isInCurrentPage ? '' : 'grayscale hover:grayscale-0'
                            }`}
                          />
                          {isInCurrentPage && (
                            <div className="absolute inset-0 ring-2 ring-success-600 ring-inset rounded"></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Carousel Container */}
            <div
              className="relative"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              {/* Navigation Buttons */}
              {totalPages > 1 && (
                <>
                  <button
                    onClick={prevPage}
                    className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-16 z-20 bg-white hover:bg-primary-800 hover:text-white text-volcanic-900 rounded-full p-3 shadow-2xl transition-all duration-300 items-center justify-center group border-2 border-primary-800"
                    aria-label="Previous vehicles"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextPage}
                    className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-16 z-20 bg-white hover:bg-primary-800 hover:text-white text-volcanic-900 rounded-full p-3 shadow-2xl transition-all duration-300 items-center justify-center group border-2 border-primary-800"
                    aria-label="Next vehicles"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Cards Grid with Touch Support */}
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="px-2 sm:px-8 pb-4 sm:pb-0"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-7 transition-all duration-500 ease-in-out">
                  {getCurrentPageCars().map((car, index) => (
                    <div
                      key={car.id}
                      className="card group overflow-hidden transform transition-all duration-300 hover:shadow-2xl animate-fade-in mb-2 sm:mb-0"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative h-52 sm:h-56 md:h-60 overflow-hidden bg-secondary-100">
                        <img
                          src={car.image_urls && car.image_urls.length > 0
                            ? car.image_urls[car.main_image_index || 0]
                            : car.image_url}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-primary-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                          {car.category || 'Standard'}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
                          <div className="flex flex-col gap-1">
                            <div className="bg-success-600 text-white px-3 py-1.5 rounded-lg font-bold text-base sm:text-lg shadow-lg inline-block w-fit">
                              ${(car as any).active_seasonal_pricing ? (car as any).active_seasonal_pricing.price_per_day : car.price_per_day}<span className="text-xs font-normal">/day</span>
                            </div>
                            {(car as any).active_seasonal_pricing && (
                              <div className="bg-orange-500/90 text-white px-2 py-0.5 rounded text-xs font-semibold shadow-md inline-block w-fit">
                                Until {new Date((car as any).active_seasonal_pricing.valid_to).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="flex justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-volcanic-900 mb-2 line-clamp-1">
                              {car.make} {car.model} {car.year}
                            </h3>

                            <div className="flex items-center text-accent-500">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="text-secondary-600 text-xs ml-1.5 font-medium">5.0</span>
                            </div>
                          </div>

                          {/* Vehicle Specifications - Right Side */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-secondary-700">
                              <Users className="w-3.5 h-3.5 text-primary-800" />
                              <span>{car.seats} Seats</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-secondary-700">
                              <Gauge className="w-3.5 h-3.5 text-primary-800" />
                              <span>{car.mileage_type}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-secondary-700">
                              <Settings2 className="w-3.5 h-3.5 text-primary-800" />
                              <span>{car.transmission}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          fullWidth
                          onClick={scrollToSearch}
                          className="bg-primary-800 hover:bg-primary-900 text-white font-semibold py-2 sm:py-2.5 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
                        >
                          Check Availability
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10">
                {/* Mobile Navigation Buttons */}
                <button
                  onClick={prevPage}
                  className="sm:hidden flex items-center justify-center bg-primary-800 text-white rounded-full p-2 shadow-lg active:scale-95 transition-transform"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Pagination Dots */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToPage(index)}
                      className={`transition-all duration-300 rounded-full ${
                        currentPage === index
                          ? 'bg-primary-800 w-8 h-3'
                          : 'bg-secondary-300 hover:bg-secondary-400 w-3 h-3'
                      }`}
                      aria-label={`Go to page ${index + 1}`}
                      aria-current={currentPage === index ? 'true' : 'false'}
                    />
                  ))}
                </div>

                {/* Mobile Navigation Buttons */}
                <button
                  onClick={nextPage}
                  className="sm:hidden flex items-center justify-center bg-primary-800 text-white rounded-full p-2 shadow-lg active:scale-95 transition-transform"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Page Counter */}
            <div className="text-center mt-4 text-sm text-secondary-500">
              <span className="font-medium">
                Page {currentPage + 1} of {totalPages}
              </span>
              {' '}&middot;{' '}
              <span>
                Showing {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, sortedCars.length)} of {sortedCars.length} vehicles
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCarsSection; 