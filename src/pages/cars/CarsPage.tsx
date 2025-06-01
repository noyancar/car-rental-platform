import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Car as CarIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useCarStore } from '../../stores/carStore';

const CarsPage: React.FC = () => {
  const { cars, loading, error, filters, setFilters, clearFilters, fetchCars } = useCarStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchCars();
  }, [fetchCars]);
  
  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    category: filters.category || '',
    make: filters.make || '',
    priceMin: filters.priceMin || '',
    priceMax: filters.priceMax || '',
  });
  
  const applyFilters = () => {
    const newFilters: any = {};
    if (localFilters.category) newFilters.category = localFilters.category;
    if (localFilters.make) newFilters.make = localFilters.make;
    if (localFilters.priceMin) newFilters.priceMin = Number(localFilters.priceMin);
    if (localFilters.priceMax) newFilters.priceMax = Number(localFilters.priceMax);
    setFilters(newFilters);
    setIsFilterOpen(false);
  };
  
  const resetFilters = () => {
    setLocalFilters({
      category: '',
      make: '',
      priceMin: '',
      priceMax: '',
    });
    clearFilters();
  };
  
  // Filter cars by search term
  const filteredCars = cars.filter((car) => {
    const searchString = `${car.make} ${car.model} ${car.year}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });
  
  // Available makes for filter
  const makes = [...new Set(cars.map(car => car.make))].sort();
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading cars: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-display text-primary-800">Browse Our Fleet</h1>
            
            <div className="flex gap-2">
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={20} />}
                className="min-w-[200px]"
              />
              
              <Button 
                variant="secondary"
                leftIcon={<Filter size={18} />}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                Filters
              </Button>
            </div>
          </div>
          
          {/* Filter panel */}
          {isFilterOpen && (
            <div className="mt-6 p-4 border border-secondary-200 rounded-md bg-secondary-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  label="Category"
                  options={[
                    { value: '', label: 'All Categories' },
                    { value: 'luxury', label: 'Luxury' },
                    { value: 'sports', label: 'Sports' },
                    { value: 'suv', label: 'SUV' },
                    { value: 'sedan', label: 'Sedan' },
                    { value: 'convertible', label: 'Convertible' },
                    { value: 'electric', label: 'Electric' },
                  ]}
                  value={localFilters.category}
                  onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value })}
                />
                
                <Select
                  label="Make"
                  options={[
                    { value: '', label: 'All Makes' },
                    ...makes.map(make => ({ value: make, label: make })),
                  ]}
                  value={localFilters.make}
                  onChange={(e) => setLocalFilters({ ...localFilters, make: e.target.value })}
                />
                
                <Input
                  label="Min Price ($)"
                  type="number"
                  value={localFilters.priceMin}
                  onChange={(e) => setLocalFilters({ ...localFilters, priceMin: e.target.value })}
                  placeholder="Min"
                />
                
                <Input
                  label="Max Price ($)"
                  type="number"
                  value={localFilters.priceMax}
                  onChange={(e) => setLocalFilters({ ...localFilters, priceMax: e.target.value })}
                  placeholder="Max"
                />
              </div>
              
              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="primary" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {filteredCars.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CarIcon size={48} className="mx-auto text-secondary-400 mb-4" />
            <h2 className="text-2xl font-display mb-2">No cars found</h2>
            <p className="text-secondary-600 mb-4">
              No cars match your current search or filter criteria.
            </p>
            <Button variant="primary" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map(car => (
              <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
                <div className="relative h-48">
                  <img 
                    src={car.image_url} 
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary-800 text-white px-3 py-1 rounded-full text-sm">
                      {car.category}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 bg-gradient-to-r from-primary-800 to-primary-700 text-white px-4 py-2 rounded-tr-lg">
                    <span className="text-lg font-semibold">${car.price_per_day}</span>
                    <span className="text-sm">/day</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {car.year} {car.make} {car.model}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {car.features.slice(0, 3).map((feature, index) => (
                        <span 
                          key={index}
                          className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                      {car.features.length > 3 && (
                        <span className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-sm">
                          +{car.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-2">
                    {car.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link to={`/cars/${car.id}`}>
                      <Button variant="outline" fullWidth>
                        Details
                      </Button>
                    </Link>
                    <Link to={`/booking/${car.id}`}>
                      <Button variant="primary" fullWidth>
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarsPage;