import React, { useEffect, useState } from 'react';
import { Sliders, Check } from 'lucide-react';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useSearchStore } from '../../stores/searchStore';

const CarFilters: React.FC = () => {
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
  
  // Extract filter options from search results
  useEffect(() => {
    if (searchResults.length > 0) {
      // Extract unique makes
      const uniqueMakes = [...new Set(searchResults.map(car => car.make))].sort();
      setMakes(uniqueMakes);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(searchResults.map(car => car.category))].sort();
      setCategories(uniqueCategories);
      
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
  
  // Apply filters
  const handleApplyFilters = () => {
    setFilters({
      make: selectedMake || undefined,
      model: selectedModel || undefined,
      category: selectedCategory || undefined,
      minPrice: selectedMinPrice,
      maxPrice: selectedMaxPrice
    });
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
    <div className="bg-white rounded-xl shadow-hawaii p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-semibold text-volcanic-900 flex items-center">
          <Sliders size={20} className="mr-2 text-primary-600" />
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
      
      <div className="space-y-4">
        {/* Make Filter */}
        <div>
          <Select
            label="Make"
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value);
              // Reset model when make changes
              setSelectedModel('');
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
              ...categories.map(category => ({ value: category, label: category }))
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
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default CarFilters; 