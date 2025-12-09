import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { SearchSummary, CarFilters, CarGrid } from '../../components/cars';
import { useSearchStore } from '../../stores/searchStore';
import { Button } from '../../components/ui/Button';
import { tracker } from '../../lib/analytics/tracker';

const CarsPage: React.FC = () => {
  const { isSearchPerformed, setFilters, searchCars, filteredResults, searchParams: searchCriteria, filters } = useSearchStore();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const searchTrackedRef = useRef(false);

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

  // Track funnel stage 2 and search event when search is performed
  useEffect(() => {
    if (isSearchPerformed && !searchTrackedRef.current) {
      // Track funnel stage 2: Listing view
      tracker.trackFunnelStage('listing', 2, undefined, {
        resultsCount: filteredResults.length,
        pickupLocation: searchCriteria.pickupLocation,
        returnLocation: searchCriteria.returnLocation,
        pickupDate: searchCriteria.pickupDate,
        returnDate: searchCriteria.returnDate,
      });

      // Track search event with full criteria
      tracker.trackSearch({
        searchQuery: `${searchCriteria.pickupLocation} - ${searchCriteria.returnLocation}`,
        filters: {
          pickupLocation: searchCriteria.pickupLocation,
          returnLocation: searchCriteria.returnLocation,
          pickupDate: searchCriteria.pickupDate,
          returnDate: searchCriteria.returnDate,
          pickupTime: searchCriteria.pickupTime,
          returnTime: searchCriteria.returnTime,
          make: filters.make,
          model: filters.model,
          category: filters.category,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
        },
        resultsCount: filteredResults.length,
      });

      searchTrackedRef.current = true;
    }
  }, [isSearchPerformed, filteredResults.length, searchCriteria, filters]);
  
  return (
    <div className="py-6 sm:py-8 md:py-10 bg-white min-h-screen">
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