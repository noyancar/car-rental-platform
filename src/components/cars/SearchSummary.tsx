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


const SearchSummary: React.FC = () => {
  const { searchParams, updateSearchParams, searchCars } = useSearchStore();
  const { calculateDeliveryFee, BASE_LOCATION } = useLocations();
  const [isEditing, setIsEditing] = useState(false);
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
    if (key === 'pickupLocation' && sameReturnLocation) {
      setTempParams({
        ...tempParams,
        pickupLocation: value,
        returnLocation: value
      });
    } else {
      setTempParams({
        ...tempParams,
        [key]: value
      });
    }
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
          
          <div className="space-y-4">
            {/* Pickup & Return Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationSelector
                label="Pickup Location"
                value={tempParams.pickupLocation || tempParams.location || BASE_LOCATION?.value || ''}
                onChange={(value) => handleTempParamUpdate('pickupLocation', value)}
                showCategories={true}
                hideFeesInOptions={true}
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
        </div>
      ) : (
        // View mode
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="space-y-3 mb-4 md:mb-0">
            <h3 className="text-xl font-display font-semibold text-volcanic-900">Your Search</h3>
            
            <div className="space-y-2">
              {/* Pickup Location */}
              <div className="flex items-center text-volcanic-600">
                <MapPin size={18} className="mr-2 text-primary-600 flex-shrink-0" />
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
              <div className="flex items-center text-volcanic-600">
                <ArrowRight size={18} className="mr-2 text-primary-600 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Return:</span>
                  <LocationDisplay 
                    locationValue={searchParams.returnLocation || searchParams.location || BASE_LOCATION?.value || ''} 
                    showIcon={false}
                    showFee={false}
                  />
                </div>
              </div>
              
              {/* Delivery Fee if applicable */}
              {(() => {
                const pickup = searchParams.pickupLocation || searchParams.location || BASE_LOCATION?.value || '';
                const returnLoc = searchParams.returnLocation || searchParams.location || BASE_LOCATION?.value || '';
                const fees = calculateDeliveryFee(pickup, returnLoc);
                
                if (fees.totalFee > 0 || fees.requiresQuote) {
                  return (
                    <div className="text-sm text-gray-600 ml-6">
                      {fees.requiresQuote ? (
                        <span className="text-orange-600 font-medium">Quote required for delivery</span>
                      ) : (
                        <span>Delivery fee: <span className="font-medium text-green-600">${fees.totalFee}</span></span>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
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