import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Car as CarIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSearchStore } from '../../stores/searchStore';

const CarGrid: React.FC = () => {
  const { filteredResults, loading, isSearchPerformed, error } = useSearchStore();
  
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-error-50 text-error-800 p-4 rounded-lg">
        <p>Error: {error}</p>
      </div>
    );
  }
  
  if (!isSearchPerformed) {
    return (
      <div className="bg-secondary-50 p-8 text-center rounded-lg">
        <CarIcon size={48} className="mx-auto mb-4 text-secondary-400" />
        <h3 className="text-xl font-semibold mb-2">Search for Available Cars</h3>
        <p className="text-secondary-600 mb-4">
          Use the search form to find available cars for your trip.
        </p>
      </div>
    );
  }
  
  if (filteredResults.length === 0) {
    return (
      <div className="bg-secondary-50 p-8 text-center rounded-lg">
        <CarIcon size={48} className="mx-auto mb-4 text-secondary-400" />
        <h3 className="text-xl font-semibold mb-2">No Cars Found</h3>
        <p className="text-secondary-600 mb-4">
          We couldn't find any cars matching your search criteria.
        </p>
        <p className="text-secondary-600">
          Try adjusting your dates or filters to see more results.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredResults.map(car => (
        <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
          <div className="relative h-48 overflow-hidden">
            <img 
              src={car.image_url} 
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
            
            <div className="text-sm text-secondary-600 mb-3">
              <p><span className="font-medium">Category:</span> {car.category}</p>
              <p><span className="font-medium">Seats:</span> {car.seats}</p>
              <p><span className="font-medium">Transmission:</span> {car.transmission}</p>
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
  );
};

export default CarGrid; 