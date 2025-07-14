import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { SearchSummary, CarFilters, CarGrid } from '../../components/cars';
import { useSearchStore } from '../../stores/searchStore';
import { Button } from '../../components/ui/Button';

const CarsPage: React.FC = () => {
  const { isSearchPerformed, setFilters, searchCars, filteredResults } = useSearchStore();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  // Handle URL parameters on component mount
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      // Apply the category filter from URL
      setFilters({ category });
      
      // If no search has been performed yet, don't trigger search
      // Let the user select dates and locations first
      // The category filter will be pre-selected for them
    }
  }, [searchParams]);
  
  return (
    <div className="py-6 sm:py-8 md:py-10 bg-sandy-50 min-h-screen">
      <div className="container-custom">
        {/* Search Form - Always visible */}
        <div className="mb-6 sm:mb-8">
          <SearchSummary />
        </div>
        
        {/* Mobile Filter Toggle Button */}
        {isSearchPerformed && (
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Sliders size={18} />}
              rightIcon={showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            >
              <span className="flex items-center justify-between w-full">
                <span>Filter Cars</span>
                <span className="text-secondary-600 text-sm">
                  {filteredResults.length} cars found
                </span>
              </span>
            </Button>
          </div>
        )}
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Filters - Collapsible on mobile, sidebar on desktop */}
          <div className={`lg:col-span-1 ${!showFilters && 'hidden lg:block'}`}>
            {isSearchPerformed && <CarFilters onClose={() => setShowFilters(false)} />}
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