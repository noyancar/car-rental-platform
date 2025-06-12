import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Car } from '../../types';

interface FeaturedCarsSectionProps {
  featuredCars: Car[];
  loading: boolean;
}

const FeaturedCarsSection: React.FC<FeaturedCarsSectionProps> = ({ featuredCars, loading }) => {
  return (
    <section className="py-20 bg-secondary-50">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display">
            Featured Vehicles
          </h2>
          <Link to="/cars">
            <Button variant="outline">View All Cars</Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map(car => (
              <div key={car.id} className="card group overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={car.image_urls && car.image_urls.length > 0 
                      ? car.image_urls[car.main_image_index || 0] 
                      : car.image_url} 
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 bg-primary-800 text-white px-3 py-1">
                    ${car.price_per_day}/day
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <div className="flex items-center text-accent-500 mt-1 mb-3">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-secondary-600 text-sm ml-1">5.0</span>
                  </div>
                  <p className="text-secondary-600 text-sm line-clamp-2 mb-4">
                    {car.description}
                  </p>
                  <Link to={`/cars/${car.id}`}>
                    <Button variant="primary" fullWidth>
                      View Details
                    </Button>
                  </Link>
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