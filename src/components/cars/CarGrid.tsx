import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Car as CarIcon, Calendar, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSearchStore } from '../../stores/searchStore';

const CarGrid: React.FC = () => {
  const { filteredResults, loading, isSearchPerformed, error } = useSearchStore();
  
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl shadow-md max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Unable to Complete Your Search</h3>
            <p className="text-red-600">{error}</p>
            <p className="mt-4 text-sm text-red-600">Please try adjusting your search criteria or refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isSearchPerformed) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl shadow-md max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-primary-600" />
            <CarIcon className="w-10 h-10 text-primary-600" />
            <MapPin className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-3xl font-display font-bold mb-4 text-volcanic-900">
            Let's Find Your Perfect Car!
          </h3>
          <p className="text-volcanic-600 text-lg mb-2">
            Tell us when and where you need a car, and we'll show you all available options.
          </p>
          <p className="text-volcanic-500 text-base">
            Our real-time availability ensures you only see cars you can actually book.
          </p>
        </div>
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-200">
          <p className="text-primary-700 font-medium">
            💡 Quick tip: Start by selecting your travel dates above to see available cars and real-time pricing.
          </p>
        </div>
      </div>
    );
  }
  
  if (filteredResults.length === 0) {
    return (
      <div className="bg-sandy-100 p-12 text-center rounded-2xl shadow-md">
        <CarIcon size={48} className="mx-auto mb-4 text-primary-600" />
        <h3 className="text-2xl font-display font-semibold mb-3 text-volcanic-900">No Cars Found</h3>
        <p className="text-volcanic-600 text-lg mb-4">
          We couldn't find any cars matching your search criteria.
        </p>
        <p className="text-volcanic-500">
          Try adjusting your dates or filters to see more results.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredResults.map(car => (
        <div key={car.id} className="bg-white rounded-xl shadow-hawaii overflow-hidden group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col h-full min-h-[450px]">
          <div className="relative h-56 overflow-hidden">
            <img 
              src={car.image_urls && car.image_urls.length > 0 
                ? car.image_urls[car.main_image_index || 0] 
                : car.image_url} 
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 price-tag m-3">
              ${car.price_per_day}/day
            </div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-display font-semibold text-volcanic-900 mb-2">
              {car.year} {car.make} {car.model}
            </h3>
            <div className="flex items-center text-accent-500 mb-3">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <span className="text-volcanic-500 text-sm ml-2">5.0</span>
            </div>
            
            <div className="text-sm text-volcanic-600 mb-4 space-y-1">
              <p><span className="font-semibold text-volcanic-700">Category:</span> {car.category}</p>
              <p><span className="font-semibold text-volcanic-700">Seats:</span> {car.seats}</p>
              <p><span className="font-semibold text-volcanic-700">Transmission:</span> {car.transmission}</p>
            </div>
            
            <p className="text-volcanic-600 text-sm line-clamp-2 mb-6 flex-grow">
              {car.description}
            </p>
            
            <Link to={`/cars/${car.id}`} className="mt-auto">
              <Button variant="primary" fullWidth className="shadow-md hover:shadow-lg">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarGrid; 