import React, { useState, useEffect } from 'react';
import { CalendarClock, MapPin, Edit2, X, Check, Info, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useSearchStore } from '../../stores/searchStore';
import { LocationSelector, LocationDisplay } from '../ui/LocationSelector';
import { useLocations } from '../../hooks/useLocations';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

// Helper function to check if a time should be disabled
const isTimeDisabled = (time: string, pickupTime: string, isSameDay: boolean): boolean => {
  if (!isSameDay) return false;
  
  const [timeHour] = time.split(':').map(Number);
  const [pickupHour] = pickupTime.split(':').map(Number);
  
  return timeHour <= pickupHour;
};


const SearchSummary: React.FC = () => {
  const { searchParams, updateSearchParams, searchCars, isSearchPerformed } = useSearchStore();
  const { calculateDeliveryFee, BASE_LOCATION } = useLocations();
  const [isEditing, setIsEditing] = useState(!isSearchPerformed);
  const [tempParams, setTempParams] = useState(searchParams);
  const [sameReturnLocation, setSameReturnLocation] = useState(
    searchParams.pickupLocation === searchParams.returnLocation
  );
  const [deliveryFees, setDeliveryFees] = useState({ 
    pickupFee: 0, 
    returnFee: 0, 
    totalFee: 0, 
    requiresQuote: false 
  });
  
  // Calculate delivery fees
  useEffect(() => {
    if (!calculateDeliveryFee) return;
    
    const pickup = tempParams.pickupLocation || tempParams.location || BASE_LOCATION?.value || '';
    const returnLoc = tempParams.returnLocation || tempParams.location || BASE_LOCATION?.value || '';
    const fees = calculateDeliveryFee(pickup, returnLoc);
    setDeliveryFees(fees);
  }, [tempParams.pickupLocation, tempParams.returnLocation, tempParams.location]);
  
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
    let updatedParams = { ...tempParams };
    
    if (key === 'pickupLocation' && sameReturnLocation) {
      updatedParams = {
        ...updatedParams,
        pickupLocation: value,
        returnLocation: value
      };
    } else {
      updatedParams = {
        ...updatedParams,
        [key]: value
      };
    }
    
    // Apply the same validation logic as searchStore
    // Check if we're selecting today's date
    const today = new Date().toISOString().split('T')[0];
    const isPickupToday = updatedParams.pickupDate === today;
    
    // Handle pickup time validation for today
    if ((key === 'pickupTime' || key === 'pickupDate') && isPickupToday) {
      const now = new Date();
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Parse the selected pickup time
      const [pickupHour, pickupMinute] = (updatedParams.pickupTime || '10:00').split(':').map(Number);
      const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
      
      // If pickup time is in the past (with 1 hour buffer), update it
      if (pickupTimeInMinutes < currentTimeInMinutes + 60) {
        // Calculate next available hour
        let nextHour = now.getMinutes() > 0 ? now.getHours() + 2 : now.getHours() + 1;
        if (nextHour >= 22) {
          updatedParams.pickupTime = '09:00';
        } else {
          updatedParams.pickupTime = `${nextHour.toString().padStart(2, '0')}:00`;
        }
        
        // If same-day rental, ensure return time is after pickup time
        if (updatedParams.pickupDate === updatedParams.returnDate) {
          const [returnHour] = (updatedParams.returnTime || '10:00').split(':').map(Number);
          const newPickupHour = parseInt(updatedParams.pickupTime.split(':')[0]);
          if (returnHour <= newPickupHour) {
            updatedParams.returnTime = `${(newPickupHour + 1).toString().padStart(2, '0')}:00`;
          }
        }
      }
    }
    
    // If pickup date is changed
    if (key === 'pickupDate') {
      const pickupDate = new Date(value);
      const returnDate = new Date(updatedParams.returnDate);
      
      // If return date is before new pickup date, set it to next day by default
      if (returnDate < pickupDate) {
        const nextDay = new Date(pickupDate);
        nextDay.setDate(nextDay.getDate() + 1);
        updatedParams.returnDate = nextDay.toISOString().split('T')[0];
      }
    }
    
    // If return date is changed
    if (key === 'returnDate') {
      const pickupDate = new Date(updatedParams.pickupDate);
      const returnDate = new Date(value);
      
      // Return date must not be before pickup date
      if (returnDate < pickupDate) {
        updatedParams.returnDate = updatedParams.pickupDate;
      }
    }
    
    // Validate time for same-day rentals
    if (updatedParams.pickupDate === updatedParams.returnDate) {
      const [pickupHour, pickupMinute] = updatedParams.pickupTime.split(':').map(Number);
      const [returnHour, returnMinute] = updatedParams.returnTime.split(':').map(Number);
      const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
      const returnTimeInMinutes = returnHour * 60 + returnMinute;
      
      // For same-day rental, return time must be after pickup time
      if (returnTimeInMinutes <= pickupTimeInMinutes) {
        // Set return time to at least 1 hour after pickup
        const newReturnHour = pickupHour + 1;
        if (newReturnHour < 24) {
          updatedParams.returnTime = `${newReturnHour.toString().padStart(2, '0')}:00`;
        } else {
          // If it would go past midnight, set return to next day
          const nextDay = new Date(updatedParams.pickupDate);
          nextDay.setDate(nextDay.getDate() + 1);
          updatedParams.returnDate = nextDay.toISOString().split('T')[0];
          updatedParams.returnTime = '10:00';
        }
      }
    }
    
    setTempParams(updatedParams);
  };
  
  const handleSameLocationToggle = (checked: boolean) => {
    setSameReturnLocation(checked);
    if (checked) {
      setTempParams({
        ...tempParams,
        returnLocation: tempParams.pickupLocation || tempParams.location
      });
    }
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
    
    // Scroll to top after search update
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="bg-white rounded-xl shadow-hawaii p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 animate-fade-in">
      {isEditing ? (
        // Edit mode
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-display font-semibold text-volcanic-900">
              {!isSearchPerformed ? 'Find Your Perfect Car' : 'Edit Search Parameters'}
            </h3>
            {isSearchPerformed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                leftIcon={<X size={16} />}
              >
                Cancel
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Pickup & Return Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationSelector
                label="Pickup Location"
                value={tempParams.pickupLocation || tempParams.location || BASE_LOCATION?.value || ''}
                onChange={(value) => handleTempParamUpdate('pickupLocation', value)}
                showCategories={true}
                hideFeesInOptions={true}
                excludeCustom={true}
              />
              
              <LocationSelector
                label="Return Location"
                value={sameReturnLocation 
                  ? (tempParams.pickupLocation || tempParams.location || BASE_LOCATION?.value || '')
                  : (tempParams.returnLocation || tempParams.location || BASE_LOCATION?.value || '')
                }
                onChange={(value) => handleTempParamUpdate('returnLocation', value)}
                showCategories={true}
                hideFeesInOptions={true}
                excludeCustom={true}
              />
            </div>
            
            {/* Same Return Location Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="same-return-edit"
                checked={sameReturnLocation}
                onChange={(e) => handleSameLocationToggle(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="same-return-edit" className="text-sm text-gray-700">
                Return to same location
              </label>
            </div>
            
            {/* Delivery Fee Display */}
            {(deliveryFees.totalFee > 0 || deliveryFees.requiresQuote) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-1.5 rounded">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-sm">
                      {deliveryFees.requiresQuote ? (
                        <span className="text-blue-900 font-medium">Custom location - Quote required</span>
                      ) : (
                        <span className="text-blue-900 font-medium">
                          {sameReturnLocation ? 'Delivery service' : 'Pickup & return service'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {deliveryFees.requiresQuote ? (
                      <span className="text-sm font-bold text-orange-600">Quote</span>
                    ) : (
                      <span className="text-lg font-bold text-blue-900">${deliveryFees.totalFee}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Date and Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
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
                  options={HOURS.map((hour) => ({
                    ...hour,
                    disabled: isTimeDisabled(hour.value, tempParams.pickupTime, tempParams.pickupDate === tempParams.returnDate)
                  }))}
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
                  {isSearchPerformed ? 'Update Search' : 'Search'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // View mode - Compact for mobile
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full">
            {/* Mobile Compact View */}
            <div className="md:hidden space-y-3">
              {/* Location Lines */}
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <LocationDisplay 
                      locationValue={searchParams.pickupLocation || searchParams.location || BASE_LOCATION?.value || ''} 
                      showIcon={false}
                      showFee={false}
                      className="font-medium"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <LocationDisplay 
                      locationValue={searchParams.returnLocation || searchParams.location || BASE_LOCATION?.value || ''} 
                      showIcon={false}
                      showFee={false}
                      className="font-medium"
                    />
                  </div>
                </div>
              </div>
              
              {/* Date/Time Line */}
              <div className="flex items-start gap-2">
                <CalendarClock className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">
                    {format(new Date(searchParams.pickupDate), 'MMM d')} - {format(new Date(searchParams.returnDate), 'MMM d, yyyy')}
                  </span>
                  <span className="text-gray-500 block">
                    {searchParams.pickupTime} - {searchParams.returnTime}
                    {(() => {
                      const pickup = searchParams.pickupLocation || searchParams.location || BASE_LOCATION?.value || '';
                      const returnLoc = searchParams.returnLocation || searchParams.location || BASE_LOCATION?.value || '';
                      const fees = calculateDeliveryFee(pickup, returnLoc);
                      
                      if (fees.totalFee > 0) {
                        return (
                          <span className="text-primary-600 font-medium">
                            {' '}• ${fees.totalFee} delivery
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Desktop Full View */}
            <div className="hidden md:block">
              <div className="space-y-2">
                {/* Pickup Location */}
                <div className="flex items-start text-volcanic-600">
                  <MapPin className="w-5 h-5 mr-2 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Pickup:</span>
                    <LocationDisplay 
                      locationValue={searchParams.pickupLocation || searchParams.location || BASE_LOCATION?.value || ''} 
                      showIcon={false}
                      showFee={false}
                    />
                  </div>
                </div>
                
                {/* Return Location */}
                <div className="flex items-start text-volcanic-600">
                  <ArrowRight className="w-5 h-5 mr-2 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Return:</span>
                    <LocationDisplay 
                      locationValue={searchParams.returnLocation || searchParams.location || BASE_LOCATION?.value || ''} 
                      showIcon={false}
                      showFee={false}
                    />
                  </div>
                </div>
                
                {/* Date Time */}
                <div className="flex items-start text-volcanic-600">
                  <CalendarClock className="w-5 h-5 mr-2 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="text-base">
                    <span className="font-medium">
                      {formatDate(searchParams.pickupDate)} at {searchParams.pickupTime}
                    </span>
                    <span className="text-gray-500 mx-1">-</span>
                    <span className="font-medium">
                      {formatDate(searchParams.returnDate)} at {searchParams.returnTime}
                    </span>
                  </div>
                </div>
                
                {/* Delivery Fee */}
                {(() => {
                  const pickup = searchParams.pickupLocation || searchParams.location || BASE_LOCATION?.value || '';
                  const returnLoc = searchParams.returnLocation || searchParams.location || BASE_LOCATION?.value || '';
                  const fees = calculateDeliveryFee(pickup, returnLoc);
                  
                  if (fees.totalFee > 0 || fees.requiresQuote) {
                    return (
                      <div className="text-sm text-gray-600 ml-7">
                        {fees.requiresQuote ? (
                          <span className="text-orange-600 font-medium">Quote required</span>
                        ) : (
                          <span>Delivery fee: <span className="font-medium text-green-600">${fees.totalFee}</span></span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditToggle}
            leftIcon={<Edit2 size={16} />}
            className="w-full md:w-auto"
          >
            Edit Search
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchSummary; 