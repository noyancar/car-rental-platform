import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Car } from '../../types';

interface FeaturedCarsSectionProps {
  featuredCars: Car[];
  loading: boolean;
}

const FeaturedCarsSection: React.FC<FeaturedCarsSectionProps> = ({ featuredCars, loading }) => {
  const scrollToSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-10 sm:py-16 md:py-20 bg-secondary-50">
      <div className="container-custom">
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display mb-2">
            Featured Vehicles
          </h2>
          <p className="text-secondary-600 text-sm sm:text-base">
            Hand-picked premium vehicles for your adventure
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredCars.map(car => (
              <div key={car.id} className="card group overflow-hidden">
                <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden">
                  <img 
                    src={car.image_urls && car.image_urls.length > 0 
                      ? car.image_urls[car.main_image_index || 0] 
                      : car.image_url} 
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 bg-primary-800 text-white px-2 py-0.5 sm:px-3 sm:py-1 text-sm sm:text-base">
                    ${car.price_per_day}/day
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {car.make} {car.model} {car.year}
                  </h3>
                  <div className="flex items-center text-accent-500 mt-1 mb-2 sm:mb-3">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <span className="text-secondary-600 text-xs sm:text-sm ml-1">5.0</span>
                  </div>
                  <p className="text-secondary-600 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4">
                    {car.description}
                  </p>
                  <Button 
                    variant="primary" 
                    fullWidth
                    onClick={scrollToSearch}
                  >
                    Check Availability
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCarsSection; 