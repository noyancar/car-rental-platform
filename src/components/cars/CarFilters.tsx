import React, { useEffect, useState } from 'react';
import { Sliders, Check } from 'lucide-react';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useSearchStore } from '../../stores/searchStore';

interface CarFiltersProps {
  onClose?: () => void;
}

const CarFilters: React.FC<CarFiltersProps> = ({ onClose }) => {
  const { searchResults, filters, setFilters, resetFilters } = useSearchStore();
  
  // Extracted unique values from search results for filter options
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  
  // Local state for filter values
  const [selectedMake, setSelectedMake] = useState(filters.make || '');
  const [selectedModel, setSelectedModel] = useState(filters.model || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
  const [selectedMinPrice, setSelectedMinPrice] = useState<number | undefined>(filters.minPrice);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | undefined>(filters.maxPrice);
  
  // Available categories based on current make/model selection
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Update local state when filters change (e.g., from URL parameters)
  useEffect(() => {
    setSelectedCategory(filters.category || '');
    setSelectedMake(filters.make || '');
    setSelectedModel(filters.model || '');
    setSelectedMinPrice(filters.minPrice);
    setSelectedMaxPrice(filters.maxPrice);
  }, [filters]);
  
  // Extract filter options from search results
  useEffect(() => {
    if (searchResults.length > 0) {
      // Extract unique makes
      const uniqueMakes = [...new Set(searchResults.map(car => car.make))].sort();
      setMakes(uniqueMakes);
      
      // Use predefined categories to ensure all are visible
      // These must match the database values (lowercase)
      const predefinedCategories = ['sports', 'suv', 'luxury', 'convertible'];
      setCategories(predefinedCategories);
      
      // Find price range
      const prices = searchResults.map(car => car.price_per_day);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      setPriceRange({ min: minPrice, max: maxPrice });
      
      // Set default values if not already set
      if (!selectedMinPrice) setSelectedMinPrice(minPrice);
      if (!selectedMaxPrice) setSelectedMaxPrice(maxPrice);
    }
  }, [searchResults]);
  
  // Update models when make changes
  useEffect(() => {
    if (selectedMake) {
      const matchingModels = [...new Set(
        searchResults
          .filter(car => car.make === selectedMake)
          .map(car => car.model)
      )].sort();
      setModels(matchingModels);
    } else {
      setModels([]);
    }
  }, [selectedMake, searchResults]);
  
  // Update available categories based on make/model selection
  useEffect(() => {
    let carsToCheck = searchResults;
    
    // Filter by make if selected
    if (selectedMake) {
      carsToCheck = carsToCheck.filter(car => car.make === selectedMake);
    }
    
    // Further filter by model if selected
    if (selectedModel) {
      carsToCheck = carsToCheck.filter(car => car.model === selectedModel);
    }
    
    // Extract available categories from filtered cars
    const categoriesInFilteredCars = [...new Set(carsToCheck.map(car => car.category))];
    setAvailableCategories(categoriesInFilteredCars);
  }, [selectedMake, selectedModel, searchResults]);
  
  // Apply filters
  const handleApplyFilters = () => {
    setFilters({
      make: selectedMake || undefined,
      model: selectedModel || undefined,
      category: selectedCategory || undefined,
      minPrice: selectedMinPrice,
      maxPrice: selectedMaxPrice
    });
    
    // Close filters on mobile after applying
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedCategory('');
    setSelectedMinPrice(priceRange.min);
    setSelectedMaxPrice(priceRange.max);
    resetFilters();
  };
  
  return (
    <div className="bg-white rounded-xl shadow-hawaii p-4 sm:p-5 md:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
        <h3 className="text-base sm:text-lg md:text-xl font-display font-semibold text-volcanic-900 flex items-center">
          <Sliders className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary-600" />
          Filter Cars
        </h3>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
        >
          Reset
        </Button>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Make Filter */}
        <div>
          <Select
            label="Make"
            value={selectedMake}
            onChange={(e) => {
              const newMake = e.target.value;
              setSelectedMake(newMake);
              // Reset model when make changes
              setSelectedModel('');
              
              // Check if current category is still valid with new make
              if (newMake && selectedCategory) {
                const carsForMake = searchResults.filter(car => car.make === newMake);
                const categoriesForMake = [...new Set(carsForMake.map(car => car.category))];
                
                // Clear category if it's not available for the new make
                if (!categoriesForMake.includes(selectedCategory)) {
                  setSelectedCategory('');
                }
              }
            }}
            options={[
              { value: '', label: 'All Makes' },
              ...makes.map(make => ({ value: make, label: make }))
            ]}
          />
        </div>
        
        {/* Model Filter */}
        <div>
          <Select
            label="Model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            options={[
              { value: '', label: selectedMake ? `All ${selectedMake} Models` : 'Select Make First' },
              ...models.map(model => ({ value: model, label: model }))
            ]}
            disabled={!selectedMake}
          />
        </div>
        
        {/* Category Filter */}
        <div>
          <Select
            label="Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(category => ({ 
                value: category, 
                label: category.charAt(0).toUpperCase() + category.slice(1),
                disabled: Boolean((selectedMake || selectedModel) && !availableCategories.includes(category))
              }))
            ]}
          />
        </div>
        
        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-semibold text-volcanic-700 mb-2">
            Price Range (per day)
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Min"
              value={selectedMinPrice !== undefined ? selectedMinPrice : ''}
              onChange={(e) => setSelectedMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              min={priceRange.min}
              max={selectedMaxPrice}
            />
            
            <Input
              type="number"
              placeholder="Max"
              value={selectedMaxPrice !== undefined ? selectedMaxPrice : ''}
              onChange={(e) => setSelectedMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              min={selectedMinPrice}
              max={priceRange.max}
            />
          </div>
        </div>
        
        {/* Apply Filters Button */}
        <Button 
          variant="primary"
          onClick={handleApplyFilters}
          fullWidth
          leftIcon={<Check size={16} />}
          pixel={{ 
            event: "CarFilters", 
            params: { 
              selectedMake: selectedMake, 
              selectedModel: selectedModel, 
              selectedCategory: selectedCategory, 
              selectedMinPrice: selectedMinPrice, 
              selectedMaxPrice: selectedMaxPrice 
            }
          }}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default CarFilters; 