import React from 'react';
import { SearchSummary, CarFilters, CarGrid } from '../../components/cars';
import { useSearchStore } from '../../stores/searchStore';

const CarsPage: React.FC = () => {
  const { isSearchPerformed } = useSearchStore();
  
  return (
    <div className="py-20 bg-sandy-50 min-h-screen">
      <div className="container-custom">
        {/* Search Summary Section */}
        {isSearchPerformed && <SearchSummary />}
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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