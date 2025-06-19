import React, { useState } from 'react';
import { CalendarClock, Clock, MapPin, Edit2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useSearchStore } from '../../stores/searchStore';

// Location and time data
const LOCATIONS = [
  // $70 Delivery Fee
  { value: 'daniel-k-inouye-airport', label: 'Daniel K. Inouye International Airport' },
  
  // $50 Delivery Fee - Waikiki Hotels
  { value: 'alohilani-resort', label: 'Alohilani Resort Waikiki Beach' },
  { value: 'hyatt-regency-waikiki', label: 'Hyatt Regency Waikiki Beach Resort & Spa' },
  { value: 'ilikai-hotel', label: 'Ilikai Hotel & Luxury Suites' },
  { value: 'hale-koa-hotel', label: 'Hale Koa Hotel' },
  { value: 'hilton-hawaiian-village', label: 'Hilton Hawaiian Village Waikiki Beach Resort' },
  { value: 'sheraton-waikiki', label: 'Sheraton Waikiki' },
  { value: 'royal-hawaiian', label: 'The Royal Hawaiian, a Luxury Collection Resort' },
  { value: 'waikiki-beach-marriott', label: 'Waikiki Beach Marriott Resort & Spa' },
  { value: 'waikiki-grand-hotel', label: 'Waikiki Grand Hotel' },
  
  // $70 Delivery Fee
  // { value: 'custom-location-10mi', label: 'Custom Location - Within 10mi radius' },
  
  // Ask for Quote
  // { value: 'custom-location-outside', label: 'Any other location outside 10mi radius' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

// Helper function to get location label
const getLocationLabel = (locationValue: string): string => {
  const location = LOCATIONS.find(loc => loc.value === locationValue);
  return location ? location.label : locationValue;
};

const SearchSummary: React.FC = () => {
  const { searchParams, updateSearchParams, searchCars } = useSearchStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempParams, setTempParams] = useState(searchParams);
  
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset temp params when canceling edit
      setTempParams(searchParams);
    }
    setIsEditing(!isEditing);
  };
  
  const handleTempParamUpdate = (key: keyof typeof tempParams, value: string) => {
    setTempParams({
      ...tempParams,
      [key]: value
    });
  };
  
  const handleSaveChanges = async () => {
    // Update the search parameters in the store
    Object.entries(tempParams).forEach(([key, value]) => {
      updateSearchParams({ [key]: value });
    });
    
    // Search with the new parameters
    await searchCars();
    
    // Exit edit mode
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-hawaii p-6 mb-8 animate-fade-in">
      {isEditing ? (
        // Edit mode
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-display font-semibold text-volcanic-900">Edit Search Parameters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              leftIcon={<X size={16} />}
            >
              Cancel
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location */}
            <div>
              <Select
                label="Location"
                options={LOCATIONS}
                value={tempParams.location}
                onChange={(e) => handleTempParamUpdate('location', e.target.value)}
              />
            </div>
            
            {/* Pickup Date and Time */}
            <div>
              <Input
                label="Pickup Date"
                type="date"
                value={tempParams.pickupDate}
                onChange={(e) => handleTempParamUpdate('pickupDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Select
                label="Pickup Time"
                options={HOURS}
                value={tempParams.pickupTime}
                onChange={(e) => handleTempParamUpdate('pickupTime', e.target.value)}
              />
            </div>
            
            {/* Return Date and Time */}
            <div>
              <Input
                label="Return Date"
                type="date"
                value={tempParams.returnDate}
                onChange={(e) => handleTempParamUpdate('returnDate', e.target.value)}
                min={tempParams.pickupDate}
              />
            </div>
            <div>
              <Select
                label="Return Time"
                options={HOURS}
                value={tempParams.returnTime}
                onChange={(e) => handleTempParamUpdate('returnTime', e.target.value)}
              />
            </div>
            
            {/* Save Button */}
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleSaveChanges}
                leftIcon={<Check size={16} />}
                className="w-full"
              >
                Update Search
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // View mode
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="space-y-3 mb-4 md:mb-0">
            <h3 className="text-xl font-display font-semibold text-volcanic-900">Your Search</h3>
            
            <div className="flex items-center text-volcanic-600">
              <MapPin size={18} className="mr-2 text-primary-600" />
              <span className="font-medium">{getLocationLabel(searchParams.location)}</span>
            </div>
            
            <div className="flex items-center text-volcanic-600">
              <CalendarClock size={18} className="mr-2 text-primary-600" />
              <span className="font-medium">
                {formatDate(searchParams.pickupDate)} at {searchParams.pickupTime} - 
                {formatDate(searchParams.returnDate)} at {searchParams.returnTime}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditToggle}
            leftIcon={<Edit2 size={16} />}
          >
            Edit Search
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchSummary; 