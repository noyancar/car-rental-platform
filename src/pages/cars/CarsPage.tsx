import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Car as CarIcon, Calendar, Sliders, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DatePickerCard } from '../../components/ui/DatePickerCard';
import { useCarStore } from '../../stores/carStore';

const CarsPage: React.FC = () => {
  const { cars, loading, error, filters, setFilters, clearFilters, fetchCars } = useCarStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    category: filters.category || '',
    make: filters.make || '',
    priceMin: filters.priceMin || '',
    priceMax: filters.priceMax || '',
  });
  
  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleDateSearch = (startDate: string, endDate: string) => {
    setFilters({
      ...filters,
      startDate,
      endDate
    });
  };
  
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
  
  return (
    <div className="py-16 bg-secondary-50 min-h-screen">
      <div className="container-custom">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-display text-primary-800">Browse Our Fleet</h1>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search cars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={20} />}
                  className="min-w-[200px]"
                />
                {searchTerm && (
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <Button 
                variant="secondary"
                leftIcon={<Filter size={18} />}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="mt-6">
            <DatePickerCard onSearch={handleDateSearch} />
          </div>
          
          {/* Filter panel */}
          {isFilterOpen && (
            <div className="mt-6 p-4 border border-secondary-200 rounded-md bg-secondary-50 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
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
                </div>
                
                <div>
                  <Select
                    label="Make"
                    options={[
                      { value: '', label: 'All Makes' },
                      ...makes.map(make => ({ value: make, label: make })),
                    ]}
                    value={localFilters.make}
                    onChange={(e) => setLocalFilters({ ...localFilters, make: e.target.value })}
                  />
                </div>
                
                <div>
                  <Input
                    label="Min Price ($)"
                    type="number"
                    placeholder="Min"
                    value={localFilters.priceMin}
                    onChange={(e) => setLocalFilters({ ...localFilters, priceMin: e.target.value })}
                  />
                </div>
                
                <div>
                  <Input
                    label="Max Price ($)"
                    type="number"
                    placeholder="Max"
                    value={localFilters.priceMax}
                    onChange={(e) => setLocalFilters({ ...localFilters, priceMax: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-4 gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  leftIcon={<X size={16} />}
                >
                  Reset
                </Button>
                <Button 
                  variant="primary" 
                  onClick={applyFilters}
                  leftIcon={<Sliders size={16} />}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
          
          {/* Active filters display */}
          {Object.keys(filters).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.category && (
                <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center">
                  Category: {filters.category}
                  <button 
                    className="ml-2"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.category;
                      setFilters(newFilters);
                      setLocalFilters({ ...localFilters, category: '' });
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {filters.make && (
                <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center">
                  Make: {filters.make}
                  <button 
                    className="ml-2"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.make;
                      setFilters(newFilters);
                      setLocalFilters({ ...localFilters, make: '' });
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {filters.priceMin && (
                <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center">
                  Min Price: ${filters.priceMin}
                  <button 
                    className="ml-2"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.priceMin;
                      setFilters(newFilters);
                      setLocalFilters({ ...localFilters, priceMin: '' });
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {filters.priceMax && (
                <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center">
                  Max Price: ${filters.priceMax}
                  <button 
                    className="ml-2"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.priceMax;
                      setFilters(newFilters);
                      setLocalFilters({ ...localFilters, priceMax: '' });
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {(filters.startDate && filters.endDate) && (
                <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center">
                  Dates: {filters.startDate} - {filters.endDate}
                  <button 
                    className="ml-2"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.startDate;
                      delete newFilters.endDate;
                      setFilters(newFilters);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              <button 
                className="text-secondary-600 hover:text-secondary-800 text-sm underline"
                onClick={resetFilters}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
          </div>
        ) : error ? (
          <div className="bg-error-50 text-error-500 p-4 rounded-md">
            Error loading cars: {error}
          </div>
        ) : filteredCars.length === 0 ? (
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
              <div key={car.id} className="card group overflow-hidden animate-fade-in">
                <div className="relative h-60 overflow-hidden">
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
                  <div className="absolute bottom-0 left-0 bg-primary-800 text-white px-3 py-1">
                    ${car.price_per_day}/day
                  </div>
                  {!car.available && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-error-500 text-white px-4 py-2 rounded-md font-semibold">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold">
                    {car.year} {car.make} {car.model}
                  </h3>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {car.features.slice(0, 3).map((feature, index) => (
                      <span 
                        key={index} 
                        className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                    {car.features.length > 3 && (
                      <span className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-xs">
                        +{car.features.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <p className="text-secondary-600 text-sm mt-3 line-clamp-2">
                    {car.description}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link to={`/cars/${car.id}`}>
                      <Button variant="outline" fullWidth>
                        Details
                      </Button>
                    </Link>
                    <Link to={car.available ? `/booking/${car.id}` : '#'}>
                      <Button 
                        variant="primary" 
                        fullWidth
                        disabled={!car.available}
                      >
                        {car.available ? 'Book Now' : 'Unavailable'}
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