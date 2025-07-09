import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search, Info, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useSearchStore } from '../../stores/searchStore';
import { LocationSelector } from '../ui/LocationSelector';
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

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { 
    searchParams, 
    updateSearchParams,
    searchCars
  } = useSearchStore();
  const { calculateDeliveryFee, DEFAULT_LOCATION } = useLocations();
  
  const [pickupLocation, setPickupLocation] = useState(
    searchParams.pickupLocation || DEFAULT_LOCATION?.value || ''
  );
  const [returnLocation, setReturnLocation] = useState(
    searchParams.returnLocation || DEFAULT_LOCATION?.value || ''
  );
  const [sameReturnLocation, setSameReturnLocation] = useState(
    pickupLocation === returnLocation
  );
  const [deliveryFees, setDeliveryFees] = useState({ 
    pickupFee: 0, 
    returnFee: 0, 
    totalFee: 0, 
    requiresQuote: false 
  });
  
  // Calculate delivery fees when locations change
  useEffect(() => {
    const returnLoc = sameReturnLocation ? pickupLocation : returnLocation;
    const fees = calculateDeliveryFee(pickupLocation, returnLoc);
    setDeliveryFees(fees);
  }, [pickupLocation, returnLocation, sameReturnLocation]);
  
  // Update return location when pickup changes and same location is checked
  useEffect(() => {
    if (sameReturnLocation) {
      setReturnLocation(pickupLocation);
    }
  }, [pickupLocation, sameReturnLocation]);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if locations are selected
    if (!pickupLocation || pickupLocation === 'select location') {
      toast.error('Please select a pickup location');
      return;
    }
    
    const finalReturnLocation = sameReturnLocation ? pickupLocation : returnLocation;
    if (!finalReturnLocation || finalReturnLocation === 'select location') {
      toast.error('Please select a return location');
      return;
    }
    
    // Update search params with selected locations
    updateSearchParams({ 
      location: pickupLocation,
      pickupLocation,
      returnLocation: finalReturnLocation
    });
    
    // Search for available cars with current parameters
    await searchCars();
    
    // Navigate to cars page
    navigate('/cars');
  };

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center animate-float" 
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1598135753163-6167c1a1ad65?auto=compress&cs=tinysrgb&w=1920&q=80)',
            backgroundPosition: 'center 30%'
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary-900/80 via-primary-800/60 to-accent-600/40"></div>
        </div>
      </div>
      
      {/* Hero Content */}
      <div className="container-custom relative z-10 text-white pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-20 md:pb-32">
        <div className="max-w-4xl mb-8 sm:mb-10 md:mb-12 text-center mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold mb-4 sm:mb-6 animate-slide-down">
            <span className="bg-gradient-to-r from-accent-400 to-accent-200 bg-clip-text text-transparent drop-shadow-[3px_3px_6px_rgba(0,0,0,0.8)] block sm:inline">Adventure Awaits You</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8 text-white/90 animate-slide-up text-shadow px-2 sm:px-4 md:px-0" style={{ animationDelay: '0.2s' }}>
            Discover Hawaii's hidden gems with our premium 4x4 vehicles. From beaches to volcanoes, your island journey starts here.
          </p>
        </div>
        
        {/* Search Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 lg:p-8 shadow-hawaii animate-slide-up max-w-5xl mx-auto" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Pickup & Return Locations */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LocationSelector
                  label="Pickup Location"
                  value={pickupLocation}
                  onChange={setPickupLocation}
                  showCategories={true}
                  hideFeesInOptions={true}
                  excludeCustom={true}
                />
                
                <LocationSelector
                  label="Return Location"
                  value={sameReturnLocation ? pickupLocation : returnLocation}
                  onChange={setReturnLocation}
                  showCategories={true}
                  hideFeesInOptions={true}
                  excludeCustom={true}
                />
              </div>
              
              {/* Same Return Location Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="same-return"
                  checked={sameReturnLocation}
                  onChange={(e) => setSameReturnLocation(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-white/90 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="same-return" className="text-sm text-gray-700">
                  Return to same location
                </label>
              </div>
              
              {/* Delivery Fee Display */}
              {(deliveryFees.totalFee > 0 || deliveryFees.requiresQuote) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        {deliveryFees.requiresQuote ? (
                          <>
                            <p className="text-blue-900 font-semibold text-xs sm:text-sm md:text-base">Custom Location Quote</p>
                            <p className="text-blue-700 text-[10px] sm:text-xs md:text-sm">We'll contact you with delivery pricing</p>
                          </>
                        ) : (
                          <>
                            <p className="text-blue-900 font-semibold text-xs sm:text-sm md:text-base">
                              {sameReturnLocation ? 'Delivery Service' : 'Pickup & Return Service'}
                            </p>
                            <p className="text-blue-700 text-[10px] sm:text-xs md:text-sm">
                              {sameReturnLocation 
                                ? `Same location pickup & return`
                                : `Split delivery: Pickup + Return`
                              }
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {deliveryFees.requiresQuote ? (
                        <span className="text-sm sm:text-base md:text-lg font-bold text-orange-600">Quote</span>
                      ) : (
                        <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-900">${deliveryFees.totalFee}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Date and Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Pickup Date and Time */}
              <div className="space-y-3">
                <Input
                  label="Pickup Date"
                  type="date"
                  value={searchParams.pickupDate}
                  onChange={(e) => updateSearchParams({ pickupDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  leftIcon={<CalendarDays className="text-primary-600" size={18} />}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                  placeholder="MM/DD/YYYY"
                />
                <Select
                  label="Pickup Time"
                  options={HOURS}
                  value={searchParams.pickupTime}
                  onChange={(e) => updateSearchParams({ pickupTime: e.target.value })}
                  leftIcon={<Clock className="text-primary-600" size={18} />}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                />
              </div>
              
              {/* Return Date and Time */}
              <div className="space-y-3">
                <Input
                  label="Return Date"
                  type="date"
                  value={searchParams.returnDate}
                  onChange={(e) => updateSearchParams({ returnDate: e.target.value })}
                  min={searchParams.pickupDate}
                  leftIcon={<CalendarDays className="text-primary-600" size={18} />}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                  placeholder="MM/DD/YYYY"
                />
                <Select
                  label="Return Time"
                  options={HOURS.map((hour) => ({
                    ...hour,
                    disabled: isTimeDisabled(hour.value, searchParams.pickupTime, searchParams.pickupDate === searchParams.returnDate),
                    label: isTimeDisabled(hour.value, searchParams.pickupTime, searchParams.pickupDate === searchParams.returnDate) 
                      ? `${hour.label} (Not available)` 
                      : hour.label
                  }))}
                  value={searchParams.returnTime}
                  onChange={(e) => updateSearchParams({ returnTime: e.target.value })}
                  leftIcon={<Clock className="text-primary-600" size={18} />}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                />
              </div>
            </div>
            
            {/* Search Button */}
            <div className="text-center">
              <Button 
                type="submit" 
                variant="accent"
                size="lg"
                leftIcon={<Search size={20} />}
                className="w-full md:w-auto min-w-[200px] shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
              >
                Search Cars
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 