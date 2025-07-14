import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle, Clock, Users, Gauge, MapPin, Info, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { format, isBefore, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useLocations } from '../../hooks/useLocations';
import { LocationSelector } from '../../components/ui/LocationSelector';
import { QuoteRequestModal, type QuoteRequestData } from '../../components/ui/QuoteRequestModal';
import { useCarStore } from '../../stores/carStore';
import { useBookingStore } from '../../stores/bookingStore';
import { useAuthStore } from '../../stores/authStore';
import { useSearchStore } from '../../stores/searchStore';
import { useExtrasStore } from '../../stores/extrasStore';
import ExtrasModal from '../../components/booking/ExtrasModal';
import { cn } from '../../lib/utils';

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

const BookingPage: React.FC = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentCar, loading: carLoading, error: carError, fetchCarById } = useCarStore();
  const { 
    createBooking, 
    calculatePrice, 
    checkAvailability,
    loading: bookingLoading,
    isCheckingAvailability
  } = useBookingStore();
  const { searchParams, isSearchPerformed, updateSearchParams } = useSearchStore();
  const { saveBookingExtras, calculateTotal } = useExtrasStore();
  const { calculateDeliveryFee, getLocationByValue, DEFAULT_LOCATION, locations, loading: locationsLoading } = useLocations();
  
  // Initialize dates from searchParams if available, otherwise use default values
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [startDate, setStartDate] = useState(isSearchPerformed ? searchParams.pickupDate : format(today, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(isSearchPerformed ? searchParams.returnDate : format(tomorrow, 'yyyy-MM-dd'));
  const [pickupTime, setPickupTime] = useState(isSearchPerformed ? searchParams.pickupTime : '10:00');
  const [returnTime, setReturnTime] = useState(isSearchPerformed ? searchParams.returnTime : '10:00');
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [isEditingLocations, setIsEditingLocations] = useState(false);
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState(
    searchParams.pickupLocation || ''
  );
  const [returnLocation, setReturnLocation] = useState(
    searchParams.returnLocation || ''
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
  
  // Auto-adjust return time when dates change
  useEffect(() => {
    if (startDate === endDate && pickupTime >= returnTime) {
      // Find the next available time slot
      const nextHour = HOURS.find(hour => !isTimeDisabled(hour.value, pickupTime, true));
      if (nextHour) {
        setReturnTime(nextHour.value);
      }
    }
  }, [startDate, endDate, pickupTime, returnTime]);
  
  // Set default locations when locations are loaded and no location is selected
  useEffect(() => {
    if (!locationsLoading && locations.length > 0) {
      if (!pickupLocation && DEFAULT_LOCATION) {
        setPickupLocation(DEFAULT_LOCATION.value);
      }
      if (!returnLocation && DEFAULT_LOCATION) {
        setReturnLocation(DEFAULT_LOCATION.value);
      }
    }
  }, [locationsLoading, locations, DEFAULT_LOCATION]);
  
  // Fetch car details on mount
  useEffect(() => {
    if (carId) {
      fetchCarById(parseInt(carId));
    }
    
    // If user navigated here without search parameters, redirect to car details
    if (!isSearchPerformed && carId) {
      toast.info('Please select rental dates first');
      navigate(`/cars/${carId}`);
    }
  }, [carId, fetchCarById, isSearchPerformed, navigate]);
  
  // Validate dates and return status
  const validateDates = useCallback(() => {
    if (!startDate || !endDate) {
      setValidationMessage('Please select both pickup and return dates');
      return false;
    }
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (!isValid(start) || !isValid(end)) {
        setValidationMessage('Invalid date format');
        return false;
      }
      
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      if (isBefore(start, now)) {
        setValidationMessage('Pickup date cannot be in the past');
        return false;
      }
      
      if (isBefore(end, start)) {
        setValidationMessage('Return date must be after pickup date');
        return false;
      }
      
      setValidationMessage('');
      return true;
    } catch (error) {
      setValidationMessage('Invalid date format');
      return false;
    }
  }, [startDate, endDate]);
  
  // Check availability when dates change
  useEffect(() => {
    const checkCarAvailability = async () => {
      if (!validateDates() || !currentCar) {
        setIsAvailable(null);
        return;
      }
      
      try {
        const available = await checkAvailability(
          currentCar.id,
          startDate,
          endDate,
          pickupTime,
          returnTime
        );
        setIsAvailable(available);
        setHasCheckedAvailability(true);
        
        // Calculate price only if available
        if (available) {
          const price = await calculatePrice(
            currentCar.id,
            startDate,
            endDate,
            pickupTime,
            returnTime
          );
          setTotalPrice(price);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setIsAvailable(false);
        setHasCheckedAvailability(true);
      }
    };
    
    // Only check availability if dates have been changed or it's the first check from search
    if (!isEditingDates && currentCar && (hasCheckedAvailability || isSearchPerformed)) {
      checkCarAvailability();
    }
  }, [currentCar, startDate, endDate, pickupTime, returnTime, isEditingDates, validateDates, checkAvailability, calculatePrice]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDates() || !isAvailable || !currentCar) {
      return;
    }
    
    // Update search params
    updateSearchParams({
      pickupDate: startDate,
      returnDate: endDate,
      pickupTime,
      returnTime,
      pickupLocation,
      returnLocation
    });
    
    setShowExtrasModal(true);
  };
  
  const handleExtrasModalContinue = async (selectedExtras: Map<string, { extra: any; quantity: number }>) => {
    if (!currentCar || !user) {
      // Store booking info and navigate to pending payment
      const bookingData = {
        car_id: currentCar?.id,
        start_date: startDate,
        end_date: endDate,
        pickup_time: pickupTime,
        return_time: returnTime,
        pickup_location: pickupLocation,
        return_location: returnLocation,
        total_price: totalPrice + (deliveryFees.requiresQuote ? 0 : deliveryFees.totalFee),
        extras: Array.from(selectedExtras.entries()).map(([id, { extra, quantity }]) => ({
          id,
          extra,
          quantity
        }))
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      
      // Navigate to payment page which will handle authentication
      navigate('/payment/pending');
      return;
    }
    
    try {
      // Create booking with authenticated user
      const booking = await createBooking({
        car_id: currentCar.id,
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        pickup_location: pickupLocation,
        return_location: returnLocation,
        pickup_time: pickupTime,
        return_time: returnTime,
        total_price: totalPrice + (deliveryFees.requiresQuote ? 0 : deliveryFees.totalFee),
        status: 'draft'
      });
      
      if (booking) {
        // Save extras
        const rentalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        await saveBookingExtras(booking.id, rentalDays);
        
        // Navigate to payment page
        navigate(`/payment/${booking.id}`);
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to create booking');
    } finally {
      setShowExtrasModal(false);
    }
  };
  
  const handleQuoteRequest = async (quoteData: QuoteRequestData) => {
    // Here you would typically send the quote request to your backend
    // For now, we'll just store it in localStorage as a placeholder
    const quoteRequest = {
      ...quoteData,
      carId: currentCar?.id,
      carDetails: currentCar ? {
        make: currentCar.make,
        model: currentCar.model,
        year: currentCar.year
      } : null,
      pickupLocation,
      returnLocation,
      pickupDate: startDate,
      returnDate: endDate,
      pickupTime,
      returnTime,
      requestDate: new Date().toISOString()
    };
    
    // Store in localStorage for demo purposes
    const existingQuotes = JSON.parse(localStorage.getItem('quoteRequests') || '[]');
    existingQuotes.push(quoteRequest);
    localStorage.setItem('quoteRequests', JSON.stringify(existingQuotes));
    
    // In a real app, you would send this to your backend API
    // await fetch('/api/quote-requests', { method: 'POST', body: JSON.stringify(quoteRequest) });
  };
  
  if (carLoading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (carError || !currentCar) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Error loading car details</h2>
          <Link to="/cars">
            <Button variant="primary" leftIcon={<ArrowLeft size={20} />}>
              Back to Cars
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Calculate rental duration with time consideration
  const rentalDuration = startDate && endDate 
    ? (() => {
        const startDateTime = new Date(`${startDate}T${pickupTime}`);
        const endDateTime = new Date(`${endDate}T${returnTime}`);
        const diffMs = endDateTime.getTime() - startDateTime.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      })()
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Car Image - Desktop Only */}
      <div className="hidden lg:block relative h-96 bg-gradient-to-br from-gray-900 to-gray-700">
        <img 
          src={currentCar.image_url} 
          alt={`${currentCar.make} ${currentCar.model}`}
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Breadcrumb and Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 text-white p-8">
          <div className="container-custom">
            <nav className="flex items-center space-x-2 text-sm mb-4">
              <Link to="/" className="hover:text-white/80">Home</Link>
              <span>/</span>
              <Link to="/cars" className="hover:text-white/80">Cars</Link>
              <span>/</span>
              <Link to={`/cars/${carId}`} className="hover:text-white/80">
                {currentCar.make} {currentCar.model}
              </Link>
              <span>/</span>
              <span>Book Now</span>
            </nav>
            <h1 className="text-4xl font-bold mb-2">Complete Your Booking</h1>
            <p className="text-xl">{currentCar.make} {currentCar.model} {currentCar.year}</p>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm sticky top-16 z-40">
        <div className="container-custom py-4">
          <Link to={`/cars/${carId}`} className="flex items-center text-gray-600 mb-3">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
          <p className="text-gray-600">{currentCar.make} {currentCar.model} {currentCar.year}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Desktop Back Button */}
        <div className="hidden lg:block mb-6">
          <Link to={`/cars/${carId}`} className="inline-flex items-center text-gray-600 hover:text-gray-800">
            <ArrowLeft size={20} className="mr-2" />
            Back to Car Details
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm">
              <form onSubmit={handleSubmit}>
                {/* Rental Dates Section */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Rental Dates</h2>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setIsEditingDates(!isEditingDates);
                        if (isEditingDates) {
                          // When clicking "Done", enable availability check
                          setHasCheckedAvailability(true);
                        }
                      }}
                    >
                      {isEditingDates ? 'Done' : 'Edit Dates'}
                    </Button>
                  </div>

                  {isEditingDates ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="date"
                          label="Pickup Date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          leftIcon={<Calendar size={18} />}
                        />
                        <Select
                          label="Pickup Time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          options={HOURS}
                          className="mt-2"
                          leftIcon={<Clock size={18} />}
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          label="Return Date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          leftIcon={<Calendar size={18} />}
                        />
                        <Select
                          label="Return Time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          options={HOURS.map((hour) => ({
                            ...hour,
                            disabled: isTimeDisabled(hour.value, pickupTime, startDate === endDate)
                          }))}
                          className="mt-2"
                          leftIcon={<Clock size={18} />}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Pickup Date</p>
                        <p className="font-medium">{format(parseISO(startDate), 'MMM d, yyyy')} at {pickupTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Return Date</p>
                        <p className="font-medium">{format(parseISO(endDate), 'MMM d, yyyy')} at {returnTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Duration</p>
                        <p className="font-medium">{rentalDuration} days</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pickup & Return Locations */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Pickup & Return Locations</h2>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsEditingLocations(!isEditingLocations)}
                    >
                      {isEditingLocations ? 'Done' : 'Edit Locations'}
                    </Button>
                  </div>
                  
                  {isEditingLocations ? (
                    <div className="space-y-4">
                      <LocationSelector
                        label="Pickup Location"
                        value={pickupLocation}
                        onChange={setPickupLocation}
                      />
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sameReturn"
                          checked={sameReturnLocation}
                          onChange={(e) => setSameReturnLocation(e.target.checked)}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                        <label htmlFor="sameReturn" className="ml-2 text-sm">
                          Return to same location
                        </label>
                      </div>
                      
                      {!sameReturnLocation && (
                        <LocationSelector
                          label="Return Location"
                          value={returnLocation}
                          onChange={setReturnLocation}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Pickup Location</p>
                          <p className="font-medium">{getLocationByValue(pickupLocation)?.label || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Return Location</p>
                          <p className="font-medium">{getLocationByValue(returnLocation)?.label || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Service Info */}
                  {deliveryFees.totalFee > 0 && !deliveryFees.requiresQuote && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">Delivery Service</p>
                          <p className="text-blue-700">
                            {sameReturnLocation ? 'Same location pickup & return' : 'Different return location'}
                          </p>
                          <p className="font-semibold text-blue-900 mt-1">${deliveryFees.totalFee}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Availability Status */}
                {isAvailable !== null && !isEditingDates && (
                  <div className="px-6 py-4 border-b">
                    <div className={cn(
                      "flex items-center p-4 rounded-lg",
                      isAvailable 
                        ? "bg-green-50 text-green-700" 
                        : "bg-red-50 text-red-700"
                    )}>
                      {isAvailable ? (
                        <>
                          <CheckCircle size={20} className="mr-2 flex-shrink-0" />
                          <span>Car is available for your selected dates</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="block">Car is not available for these dates.</span>
                            {user && (
                              <div className="mt-2">
                                <span className="block text-sm">
                                  Have a pending booking? 
                                </span>
                                <Link 
                                  to="/bookings" 
                                  className="text-sm text-red-800 underline hover:text-red-900"
                                >
                                  Check your bookings →
                                </Link>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Validation Message */}
                {validationMessage && (
                  <div className="px-6 py-2">
                    <div className="text-red-500 text-sm flex items-center">
                      <AlertCircle size={16} className="mr-1" />
                      {validationMessage}
                    </div>
                  </div>
                )}

                {/* Discount Code */}
                <div className="p-6 border-b">
                  <Input
                    label="Discount Code (Optional)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter discount code"
                  />
                </div>

                {/* Submit Button */}
                <div className="p-6">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={bookingLoading}
                    disabled={(!isAvailable && !deliveryFees.requiresQuote) || bookingLoading || !startDate || !endDate || isEditingDates || isEditingLocations}
                  >
                    {deliveryFees.requiresQuote ? 'Request Quote' : 'Complete Booking'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Price Summary (Desktop) / Collapsible (Mobile) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            {/* Desktop Sticky Summary */}
            <div className="hidden lg:block sticky top-24">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Car Image */}
                <div className="relative h-48">
                  <img 
                    src={currentCar.image_url} 
                    alt={`${currentCar.make} ${currentCar.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Car Details */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-1">
                    {currentCar.make} {currentCar.model} {currentCar.year}
                  </h3>
                  <p className="text-3xl font-bold text-primary-600 mb-4">
                    ${currentCar.price_per_day}<span className="text-base font-normal text-gray-500">/day</span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{currentCar.seats || 5} Seats</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Gauge className="w-4 h-4 text-gray-400 mr-2" />
                      <span>200 miles/day</span>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-3 text-sm mb-6">
                    <div>
                      <p className="text-gray-500 mb-1">Pickup Location:</p>
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2" />
                        <span className="font-medium">{getLocationByValue(pickupLocation)?.label || 'Not specified'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Return Location:</p>
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2" />
                        <span className="font-medium">{getLocationByValue(returnLocation)?.label || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {isAvailable && !isEditingDates && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Price Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daily Rate:</span>
                          <span>${currentCar.price_per_day}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span>{rentalDuration} days</span>
                        </div>
                        {deliveryFees.totalFee > 0 && !deliveryFees.requiresQuote && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Fee:</span>
                            <span>${deliveryFees.totalFee}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>Total:</span>
                          <span>${totalPrice + (deliveryFees.requiresQuote ? 0 : deliveryFees.totalFee)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center text-sm text-green-600">
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="font-medium">Secure online payment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Collapsible Summary */}
            <div className="lg:hidden bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMobileDetails(!showMobileDetails)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <img 
                    src={currentCar.image_url} 
                    alt={`${currentCar.make} ${currentCar.model}`}
                    className="w-16 h-16 object-cover rounded-lg mr-4"
                  />
                  <div className="text-left">
                    <h3 className="font-semibold">{currentCar.make} {currentCar.model}</h3>
                    <p className="text-primary-600 font-bold">${currentCar.price_per_day}/day</p>
                  </div>
                </div>
                {showMobileDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showMobileDetails && (
                <div className="p-4 border-t">
                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{currentCar.seats || 5} Seats</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Gauge className="w-4 h-4 text-gray-400 mr-2" />
                      <span>200 miles/day</span>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Pickup: <span className="font-medium text-gray-900">{getLocationByValue(pickupLocation)?.label}</span></p>
                    </div>
                    <div>
                      <p className="text-gray-500">Return: <span className="font-medium text-gray-900">{getLocationByValue(returnLocation)?.label}</span></p>
                    </div>
                  </div>

                  {/* Price Summary */}
                  {isAvailable && !isEditingDates && (
                    <div className="border-t pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Car Rental ({rentalDuration} days):</span>
                          <span>${totalPrice}</span>
                        </div>
                        {deliveryFees.totalFee > 0 && !deliveryFees.requiresQuote && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Fee:</span>
                            <span>${deliveryFees.totalFee}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>Total:</span>
                          <span className="text-primary-600">${totalPrice + (deliveryFees.requiresQuote ? 0 : deliveryFees.totalFee)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="font-medium">Secure online payment</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showExtrasModal && (
        <ExtrasModal
          isOpen={showExtrasModal}
          onClose={() => setShowExtrasModal(false)}
          onContinue={handleExtrasModalContinue}
          pickupDate={startDate}
          returnDate={endDate}
          rentalDays={rentalDuration}
          carTotal={totalPrice}
          deliveryFee={deliveryFees.totalFee}
          requiresQuote={deliveryFees.requiresQuote}
        />
      )}
      
      {showQuoteModal && (
        <QuoteRequestModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          onSubmit={handleQuoteRequest}
          pickupLocation={pickupLocation}
          returnLocation={returnLocation}
          pickupDate={startDate}
          returnDate={endDate}
          carDetails={currentCar ? {
            make: currentCar.make,
            model: currentCar.model,
            year: currentCar.year
          } : undefined}
        />
      )}
    </div>
  );
};

export default BookingPage;