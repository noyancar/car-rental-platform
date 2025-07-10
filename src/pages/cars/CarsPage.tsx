import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchSummary, CarFilters, CarGrid } from '../../components/cars';
import { useSearchStore } from '../../stores/searchStore';

const CarsPage: React.FC = () => {
  const { isSearchPerformed, setFilters, searchCars } = useSearchStore();
  const [searchParams] = useSearchParams();
  
  // Handle URL parameters on component mount
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      // Apply the category filter from URL
      setFilters({ category });
      
      // If no search has been performed yet, trigger a search
      if (!isSearchPerformed) {
        searchCars();
      }
    }
  }, [searchParams]);
  
  return (
    <div className="py-6 sm:py-8 md:py-10 bg-sandy-50 min-h-screen">
      <div className="container-custom">
        {/* Search Form - Always visible */}
        <div className="mb-6 sm:mb-8">
          <SearchSummary />
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Filters - Left Sidebar */}
          <div className="lg:col-span-1">
            {isSearchPerformed && <CarFilters />}
          </div>
          
          {/* Car Results - Right Content */}
          <div className="lg:col-span-3">
            <CarGrid />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarsPage;