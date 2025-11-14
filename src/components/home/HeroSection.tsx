import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search, Info, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useSearchStore } from '../../stores/searchStore';
import { LocationSelector } from '../ui/LocationSelector';
import { useLocations } from '../../hooks/useLocations';
import { useDeliveryFees } from '../../hooks/useDeliveryFees';

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
  const { DEFAULT_LOCATION } = useLocations();

  const [pickupLocation, setPickupLocation] = useState(
    searchParams.pickupLocation || DEFAULT_LOCATION?.value || ''
  );
  const [returnLocation, setReturnLocation] = useState(
    searchParams.returnLocation || DEFAULT_LOCATION?.value || ''
  );
  const [sameReturnLocation, setSameReturnLocation] = useState(
    pickupLocation === returnLocation
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use custom hook for delivery fees
  const effectiveReturnLocation = sameReturnLocation ? pickupLocation : returnLocation;
  const deliveryFees = useDeliveryFees(pickupLocation, effectiveReturnLocation);
  
  
  // Update return location when pickup changes and same location is checked
  useEffect(() => {
    if (sameReturnLocation) {
      setReturnLocation(pickupLocation);
    }
  }, [pickupLocation, sameReturnLocation]);

  // Prevent body scroll when modal is open and prevent layout shift
  useEffect(() => {
    if (isModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isModalOpen]);
  
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

    // Close modal on mobile after search
    setIsModalOpen(false);

    // Navigate to cars page
    navigate('/cars');
  };

  // Render the search form content (used in both desktop and mobile)
  const renderSearchForm = () => (
    <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
      {/* Pickup & Return Locations */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Same Return Location Checkbox - Red accent */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="same-return"
            checked={sameReturnLocation}
            onChange={(e) => setSameReturnLocation(e.target.checked)}
            className="w-4 h-4 text-[#c51b37] bg-white border-gray-300 rounded focus:ring-[#c51b37] accent-[#c51b37]"
          />
          <label htmlFor="same-return" className="text-sm font-normal text-[#1a1a1a]">
            Return to same location
          </label>
        </div>

        {/* Delivery Fee Display - Red theme */}
        {(deliveryFees.totalFee > 0 || deliveryFees.requiresQuote) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-red-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#c51b37]" />
                </div>
                <div className="min-w-0">
                  {deliveryFees.requiresQuote ? (
                    <>
                      <p className="text-[#1a1a1a] font-bold text-xs sm:text-sm md:text-base">Custom Location Quote</p>
                      <p className="text-[#656a6f] text-[10px] sm:text-xs md:text-sm">We'll contact you with delivery pricing</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[#1a1a1a] font-bold text-xs sm:text-sm md:text-base">
                        {sameReturnLocation ? 'Delivery Service' : 'Pickup & Return Service'}
                      </p>
                      <p className="text-[#656a6f] text-[10px] sm:text-xs md:text-sm">
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
                  <span className="text-sm sm:text-base md:text-lg font-black text-[#c51b37]">Quote</span>
                ) : (
                  <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#3aad00]">+${deliveryFees.totalFee}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date and Time Grid - Red accents */}
      {/* Mobile: 2-column grid layout */}
      <div className="md:hidden space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Pickup Date"
            type="date"
            value={searchParams.pickupDate}
            onChange={(e) => updateSearchParams({ pickupDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            leftIcon={<CalendarDays className="text-[#c51b37]" size={20} />}
            className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
            placeholder="MM/DD/YYYY"
          />
          <Select
            label="Pickup Time"
            options={HOURS}
            value={searchParams.pickupTime}
            onChange={(e) => updateSearchParams({ pickupTime: e.target.value })}
            leftIcon={<Clock className="text-[#c51b37]" size={20} />}
            className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Return Date"
            type="date"
            value={searchParams.returnDate}
            onChange={(e) => updateSearchParams({ returnDate: e.target.value })}
            min={searchParams.pickupDate}
            leftIcon={<CalendarDays className="text-[#c51b37]" size={20} />}
            className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
            placeholder="MM/DD/YYYY"
          />
          <Select
            label="Return Time"
            options={HOURS.map((hour) => ({
              ...hour,
              disabled: isTimeDisabled(hour.value, searchParams.pickupTime, searchParams.pickupDate === searchParams.returnDate)
            }))}
            value={searchParams.returnTime}
            onChange={(e) => updateSearchParams({ returnTime: e.target.value })}
            leftIcon={<Clock className="text-[#c51b37]" size={20} />}
            className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
          />
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={<Search size={20} />}
          className="w-full hover:bg-[#a01629] text-white font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 h-[3.25rem] text-sm"
          pixel={{ event: "SearchCars",
            params: {
              pickupDate: searchParams.pickupDate,
              returnDate: searchParams.returnDate,
              pickupLocation: searchParams.pickupLocation,
              returnLocation: searchParams.returnLocation
            }
          }}
        >
          Search Cars
        </Button>
      </div>

      {/* Desktop: Single horizontal row with all fields */}
      <div className="hidden md:grid md:grid-cols-[3fr_2fr_3fr_2fr_2fr] md:gap-3 md:items-end">
        {/* Pickup Date */}
        <Input
          label="Pickup Date"
          type="date"
          value={searchParams.pickupDate}
          onChange={(e) => updateSearchParams({ pickupDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          leftIcon={<CalendarDays className="text-[#c51b37]" size={20} />}
          className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
          placeholder="MM/DD/YYYY"
        />

        {/* Pickup Time */}
        <Select
          label="Pickup Time"
          options={HOURS}
          value={searchParams.pickupTime}
          onChange={(e) => updateSearchParams({ pickupTime: e.target.value })}
          leftIcon={<Clock className="text-[#c51b37]" size={20} />}
          className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
        />

        {/* Return Date */}
        <Input
          label="Return Date"
          type="date"
          value={searchParams.returnDate}
          onChange={(e) => updateSearchParams({ returnDate: e.target.value })}
          min={searchParams.pickupDate}
          leftIcon={<CalendarDays className="text-[#c51b37]" size={20} />}
          className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
          placeholder="MM/DD/YYYY"
        />

        {/* Return Time */}
        <Select
          label="Return Time"
          options={HOURS.map((hour) => ({
            ...hour,
            disabled: isTimeDisabled(hour.value, searchParams.pickupTime, searchParams.pickupDate === searchParams.returnDate)
          }))}
          value={searchParams.returnTime}
          onChange={(e) => updateSearchParams({ returnTime: e.target.value })}
          leftIcon={<Clock className="text-[#c51b37]" size={20} />}
          className="bg-white border-gray-300 focus:border-[#c51b37] focus:ring-[#c51b37] text-[#1a1a1a] h-[3.25rem]"
        />

        {/* Search Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={<Search size={20} />}
          className="bg-[#c51b37] hover:bg-[#a01629] text-white font-bold tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 h-[3.25rem] text-base whitespace-nowrap px-4"
          pixel={{ event: "SearchCars",
            params: {
              pickupDate: searchParams.pickupDate,
              returnDate: searchParams.returnDate,
              pickupLocation: searchParams.pickupLocation,
              returnLocation: searchParams.returnLocation
            }
          }}
        >
          Search Cars
        </Button>
      </div>
    </form>
  );

  return (
    <section className="relative min-h-[65vh] sm:min-h-[65vh] md:min-h-[65vh] flex items-start overflow-hidden bg-[#b80000ff]">
      
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-[80vh] object-cover"
        >
          <source src="https://cafeproject.blob.core.windows.net/nyncarrentals/homepage.mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1598135753163-6167c1a1ad65?auto=compress&cs=tinysrgb&w=1920&q=80)',
              backgroundPosition: 'center 30%'
            }}
          ></div>
        </video>
        {/* Simple dark overlay - Sixt style */}
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>

      {/* Hero Content */}
      <div className="container-custom relative z-10 text-white pt-8 sm:pt-10 md:pt-12 pb-10 sm:pb-16 md:pb-20 lg:pb-32">
        {/* Mobile: Fake Search Input Trigger */}
        <div className="block md:hidden">
          <div className="relative bg-white rounded-lg p-4 shadow-2xl space-y-3 animate-glow">
            {/* Fake Search Input */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-3 border-2 border-gray-300 rounded-lg px-4 py-3 bg-white cursor-pointer hover:border-[#c51b37] transition-colors"
            >
              <Search className="text-[#c51b37] flex-shrink-0" size={24} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5">Pickup Location</p>
                <p className="text-sm text-gray-900 font-medium truncate">Daniel K. Inouye International Airport</p>
              </div>
            </div>

            {/* Select Pickup Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="lg"
              leftIcon={<Search size={20} />}
              className="w-full bg-[#c51b37] hover:bg-[#a01629] text-white font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 h-[3.25rem] text-sm"
            >
              Select Pickup
            </Button>
          </div>
        </div>

        {/* Desktop: Inline Search Form - Sixt style */}
        <div className="hidden md:block bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-2xl max-w-7xl mx-auto animate-glow">
          {renderSearchForm()}
        </div>

        {/* Mobile: Search Modal */}
        {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            ></div>

            {/* Modal Content */}
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-[#1a1a1a]">Search Cars</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 pb-8">
                {renderSearchForm()}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
      
    </section>
  );
};

export default HeroSection; 