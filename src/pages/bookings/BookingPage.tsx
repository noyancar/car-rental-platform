import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle, Clock, Users, Gauge, MapPin, Info } from 'lucide-react';
import { format, isBefore, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { LocationSelector } from '../../components/ui/LocationSelector';
import { useLocations } from '../../hooks/useLocations';
import { QuoteRequestModal, type QuoteRequestData } from '../../components/ui/QuoteRequestModal';
import { useCarStore } from '../../stores/carStore';
import { useBookingStore } from '../../stores/bookingStore';
import { useAuthStore } from '../../stores/authStore';
import { useSearchStore } from '../../stores/searchStore';
import { useExtrasStore } from '../../stores/extrasStore';
import ExtrasModal from '../../components/booking/ExtrasModal';

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
  const { calculateDeliveryFee, getLocationByValue, DEFAULT_LOCATION } = useLocations();
  
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
  const [showPriceSummary, setShowPriceSummary] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  // Location states
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
      setValidationMessage('Please select both dates');
      return false;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (!isValid(start) || !isValid(end)) {
      setValidationMessage('Invalid date format');
      return false;
    }

    if (isBefore(end, start)) {
      setValidationMessage('Return date cannot be before pickup date');
      return false;
    }
    
    // For same-day rentals, validate time
    if (startDate === endDate) {
      const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
      const [returnHour, returnMinute] = returnTime.split(':').map(Number);
      const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
      const returnTimeInMinutes = returnHour * 60 + returnMinute;
      
      if (returnTimeInMinutes <= pickupTimeInMinutes) {
        setValidationMessage('For same-day rentals, return time must be after pickup time');
        return false;
      }
    }

    setValidationMessage('');
    return true;
  }, [startDate, endDate, pickupTime, returnTime]);

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date is before new start date, set it to next day by default
    if (endDate && isBefore(parseISO(endDate), parseISO(newStartDate))) {
      const nextDay = new Date(newStartDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(format(nextDay, 'yyyy-MM-dd'));
    }
    // If no end date set, default to next day
    else if (!endDate) {
      const nextDay = new Date(newStartDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(format(nextDay, 'yyyy-MM-dd'));
    }
    
    // Reset availability status
    setIsAvailable(null);
    setShowPriceSummary(false);
  };

  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    setIsAvailable(null);
    setShowPriceSummary(false);
    
    // If switching to same-day rental, validate return time
    if (startDate === newEndDate) {
      const [pickupHour] = pickupTime.split(':').map(Number);
      const [returnHour] = returnTime.split(':').map(Number);
      
      if (returnHour <= pickupHour) {
        // Auto-adjust return time to be at least 1 hour after pickup
        const newReturnHour = pickupHour + 1;
        if (newReturnHour < 24) {
          setReturnTime(`${newReturnHour.toString().padStart(2, '0')}:00`);
        } else {
          // Can't do same-day rental if pickup is too late
          toast.info('Same-day rental not available for late pickup times');
          const nextDay = new Date(startDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setEndDate(format(nextDay, 'yyyy-MM-dd'));
        }
      }
    }
  };

  // Handle time changes
  const handlePickupTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPickupTime = e.target.value;
    setPickupTime(newPickupTime);
    
    // If same-day rental, ensure return time is still valid
    if (startDate === endDate) {
      const [newPickupHour] = newPickupTime.split(':').map(Number);
      const [returnHour] = returnTime.split(':').map(Number);
      
      if (returnHour <= newPickupHour) {
        // Auto-adjust return time to be at least 1 hour after pickup
        const newReturnHour = newPickupHour + 1;
        if (newReturnHour < 24) {
          setReturnTime(`${newReturnHour.toString().padStart(2, '0')}:00`);
        } else {
          // If it would go past midnight, set return to next day
          const nextDay = new Date(startDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setEndDate(format(nextDay, 'yyyy-MM-dd'));
          setReturnTime('10:00');
        }
      }
    }
  };

  const handleReturnTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newReturnTime = e.target.value;
    
    // If same-day rental, validate return time is after pickup time
    if (startDate === endDate) {
      const [pickupHour] = pickupTime.split(':').map(Number);
      const [returnHour] = newReturnTime.split(':').map(Number);
      
      if (returnHour <= pickupHour) {
        // This shouldn't happen with disabled options, but keep as fallback
        toast.error('Return time must be after pickup time for same-day rentals');
        // Set to first available time
        const firstAvailableHour = pickupHour + 1;
        if (firstAvailableHour < 24) {
          setReturnTime(`${firstAvailableHour.toString().padStart(2, '0')}:00`);
        }
        return;
      }
    }
    
    setReturnTime(newReturnTime);
  };
  
  // Update price when dates change
  useEffect(() => {
    const updatePrice = async () => {
      if (!carId || !startDate || !endDate || !validateDates()) {
        setTotalPrice(0);
        return;
      }
      
      const price = await calculatePrice(parseInt(carId), startDate, endDate, pickupTime, returnTime);
      setTotalPrice(price);
      setShowPriceSummary(true);
    };
    
    const timeoutId = setTimeout(updatePrice, 300);
    return () => clearTimeout(timeoutId);
  }, [carId, startDate, endDate, pickupTime, returnTime, calculatePrice, validateDates]);
  
  // Check availability with debouncing
  useEffect(() => {
    const checkCarAvailability = async () => {
      if (!carId || !startDate || !endDate || !validateDates()) {
        setIsAvailable(null);
        return;
      }
      
      const available = await checkAvailability(parseInt(carId), startDate, endDate, pickupTime, returnTime);
      setIsAvailable(available);
    };
    
    const timeoutId = setTimeout(checkCarAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [carId, startDate, endDate, pickupTime, returnTime, checkAvailability, validateDates]);

  // Toggle date editing mode
  const toggleEditDates = () => {
    setIsEditingDates(!isEditingDates);
    // Don't reset availability when just viewing dates
    if (!isEditingDates) {
      setIsAvailable(null);
      setValidationMessage('');
    }
  };

  // Save date changes
  const saveDateChanges = async () => {
    // First validate the dates
    if (!validateDates()) {
      toast.error(validationMessage);
      return;
    }
    
    // Update search params with new dates
    updateSearchParams({
      pickupDate: startDate,
      returnDate: endDate,
      pickupTime: pickupTime,
      returnTime: returnTime
    });
    
    // Exit edit mode
    setIsEditingDates(false);
    
    // Show success message
    toast.success("Dates updated successfully");
    
    // Check availability immediately after saving
    const available = await checkAvailability(parseInt(carId!), startDate, endDate, pickupTime, returnTime);
    setIsAvailable(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove login requirement here - allow anonymous users to proceed
    
    if (!validateDates()) {
      toast.error(validationMessage);
      return;
    }
    
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
    
    // Check if quote is required
    if (deliveryFees.requiresQuote) {
      setShowQuoteModal(true);
      return;
    }
    
    if (!isAvailable) {
      toast.info('Please select dates when the car is available');
      // Scroll to the availability message for better visibility
      document.querySelector('.bg-secondary-50.text-secondary-700')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    // Open extras modal instead of creating booking directly
    setShowExtrasModal(true);
  };

  const handleExtrasModalContinue = async () => {
    try {
      
      // Calculate extras total
      const { extrasTotal } = calculateTotal(rentalDuration);
      const grandTotal = totalPrice + extrasTotal + (deliveryFees.requiresQuote ? 0 : deliveryFees.totalFee);
      
      // Create booking with draft status - if no user, we'll store the booking data temporarily
      if (user) {
        const booking = await createBooking({
          car_id: currentCar!.id,
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          total_price: grandTotal,
          status: 'pending',
          pickup_location: pickupLocation,
          return_location: sameReturnLocation ? pickupLocation : returnLocation,
          pickup_time: pickupTime,
          return_time: returnTime
        });
        
        if (booking) {
          // Save selected extras to the booking
          await saveBookingExtras(booking.id, rentalDuration);
          
          // Navigate to payment page
          navigate(`/payment/${booking.id}`);
        }
      } else {
        // Get selected extras from the store
        const { selectedExtras } = useExtrasStore.getState();
        
        // Store booking data in localStorage for anonymous users
        const bookingData = {
          car_id: currentCar!.id,
          start_date: startDate,
          end_date: endDate,
          total_price: grandTotal,
          pickup_location: pickupLocation,
          return_location: sameReturnLocation ? pickupLocation : returnLocation,
          pickup_time: pickupTime,
          return_time: returnTime,
          extras: Array.from(selectedExtras.entries()).map(([id, { extra, quantity }]) => ({
            id,
            extra,
            quantity
          }))
        };
        
        localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        
        // Navigate to payment page which will handle authentication
        navigate('/payment/pending');
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
  
  // Generate breadcrumb items
  const breadcrumbItems = currentCar ? [
    { label: 'Cars', path: '/cars' },
    { label: `${currentCar.make} ${currentCar.model} ${currentCar.year}`, path: `/cars/${carId}` },
    { label: 'Book Now', path: `/booking/${carId}` }
  ] : [];

  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <PageHeader
          title="Complete Your Booking"
          subtitle={currentCar ? `${currentCar.make} ${currentCar.model} ${currentCar.year}` : ''}
          breadcrumbItems={breadcrumbItems}
          fallbackPath={`/cars/${carId}`}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-semibold mb-6">Book Your Rental</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rental Dates Section with Edit Toggle */}
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Rental Dates</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={toggleEditDates}
                    >
                      {isEditingDates ? 'Cancel' : 'Edit Dates'}
                    </Button>
                  </div>
                  
                  {isEditingDates ? (
                    // Date Edit Form
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input
                            label="Pickup Date"
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            leftIcon={<Calendar size={20} />}
                          />
                        </div>
                        
                        <div>
                          <Input
                            label="Return Date"
                            type="date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            min={startDate}
                            leftIcon={<Calendar size={20} />}
                            disabled={!startDate}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Pickup Time
                          </label>
                          <div className="relative">
                            <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500" />
                            <select
                              value={pickupTime}
                              onChange={handlePickupTimeChange}
                              className="pl-10 pr-4 py-2 w-full border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0');
                                return (
                                  <option key={hour} value={`${hour}:00`}>
                                    {`${hour}:00`}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Return Time
                          </label>
                          <div className="relative">
                            <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500" />
                            <select
                              value={returnTime}
                              onChange={handleReturnTimeChange}
                              className="pl-10 pr-4 py-2 w-full border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0');
                                const hourValue = `${hour}:00`;
                                const isSameDay = startDate === endDate;
                                const isDisabled = isSameDay && parseInt(hour) <= parseInt(pickupTime.split(':')[0]);
                                
                                return (
                                  <option 
                                    key={hour} 
                                    value={hourValue}
                                    disabled={isDisabled}
                                    style={isDisabled ? { color: '#9CA3AF', backgroundColor: '#F3F4F6' } : {}}
                                  >
                                    {hourValue}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={saveDateChanges}
                          disabled={!startDate || !endDate}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Date Summary
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="mb-2 md:mb-0">
                        <div className="text-sm text-secondary-600">Pickup Date</div>
                        <div className="font-medium">{format(new Date(startDate), 'MMM d, yyyy')} at {pickupTime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-secondary-600">Return Date</div>
                        <div className="font-medium">{format(new Date(endDate), 'MMM d, yyyy')} at {returnTime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-secondary-600">Duration</div>
                        <div className="font-medium">{rentalDuration} days</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Pickup & Return Locations */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Pickup & Return Locations</h3>
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
                      value={returnLocation}
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
                      id="same-return-booking"
                      checked={sameReturnLocation}
                      onChange={(e) => setSameReturnLocation(e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="same-return-booking" className="text-sm text-gray-700">
                      Return to same location
                    </label>
                  </div>
                  
                  {/* Delivery Fee Display */}
                  {(deliveryFees.totalFee > 0 || deliveryFees.requiresQuote) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Info className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            {deliveryFees.requiresQuote ? (
                              <>
                                <p className="text-blue-900 font-semibold">Custom Location Quote</p>
                                <p className="text-blue-700 text-sm">We'll contact you with delivery pricing</p>
                              </>
                            ) : (
                              <>
                                <p className="text-blue-900 font-semibold">
                                  {sameReturnLocation ? 'Delivery Service' : 'Pickup & Return Service'}
                                </p>
                                <p className="text-blue-700 text-sm">
                                  {sameReturnLocation 
                                    ? `Same location pickup & return`
                                    : `Split delivery: Pickup + Return`
                                  }
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {deliveryFees.requiresQuote ? (
                            <span className="text-lg font-bold text-orange-600">Quote</span>
                          ) : (
                            <span className="text-2xl font-bold text-blue-900">${deliveryFees.totalFee}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Availability Status - Only show when not editing and after check */}
                {!isEditingDates && isAvailable !== null && (
                  <div className={`flex items-center justify-center p-3 rounded-md ${
                    isAvailable 
                      ? 'bg-success-50 text-success-700' 
                      : 'bg-secondary-50 text-secondary-700'
                  }`}>
                    {isAvailable ? (
                      <>
                        <CheckCircle size={20} className="mr-2" />
                        Car is available for your selected dates
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} className="mr-2" />
                        Car is not available for these dates. Please select different dates.
                      </>
                    )}
                  </div>
                )}
                
                {/* Validation Message */}
                {validationMessage && (
                  <div className="text-error-500 text-sm flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {validationMessage}
                  </div>
                )}
                
                {/* Loading Indicator */}
                {isCheckingAvailability && (
                  <div className="flex items-center justify-center text-secondary-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-800 mr-2"></div>
                    Checking availability...
                  </div>
                )}
                
                {/* Discount Code */}
                <div>
                  <Input
                    label="Discount Code (Optional)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter discount code"
                  />
                </div>
                
                {/* Price Summary - Show only when available */}
                {showPriceSummary && isAvailable && !isEditingDates && (
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Price Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Daily Rate:</span>
                        <span>${currentCar.price_per_day}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Duration:</span>
                        <span>{rentalDuration} days</span>
                      </div>
                      {discountCode && (
                        <div className="flex justify-between text-success-600">
                          <span>Discount:</span>
                          <span>Applied</span>
                        </div>
                      )}
                      {deliveryFees.totalFee > 0 && !deliveryFees.requiresQuote && (
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Delivery Fee:</span>
                          <span>${deliveryFees.totalFee}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t border-secondary-200">
                        <span>Total:</span>
                        <span>${totalPrice + (deliveryFees.requiresQuote ? 0 : deliveryFees.totalFee)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={bookingLoading}
                  disabled={(!isAvailable && !deliveryFees.requiresQuote) || bookingLoading || !startDate || !endDate || isEditingDates}
                >
                  {deliveryFees.requiresQuote ? 'Request Quote' : 'Complete Booking'}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Car Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48">
                <img 
                  src={currentCar.image_url} 
                  alt={`${currentCar.make} ${currentCar.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-1">
                  {currentCar.make} {currentCar.model} {currentCar.year}
                </h2>
                <p className="text-primary-800 font-semibold mb-4">
                  ${currentCar.price_per_day}/day
                </p>
                
                <div className="border-t border-secondary-200 py-4 my-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-primary-700 mr-2" />
                      <div>
                        <p className="text-xs text-secondary-600">Seats</p>
                        <p className="text-sm font-medium">{currentCar.seats || 5}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Gauge className="h-5 w-5 text-primary-700 mr-2" />
                      <div>
                        <p className="text-xs text-secondary-600">Mileage</p>
                        <p className="text-sm font-medium">{currentCar.mileage_type || 'Unlimited'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-secondary-600 space-y-2">
                  <div>
                    <p className="font-medium text-secondary-800 mb-1">Pickup Location:</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary-600" />
                      <span>{getLocationByValue(pickupLocation)?.label || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-secondary-800 mb-1">Return Location:</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary-600" />
                      <span>{getLocationByValue(returnLocation)?.label || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  {deliveryFees.totalFee > 0 && !deliveryFees.requiresQuote && (
                    <div className="pt-2 border-t border-secondary-200">
                      <span className="font-medium text-secondary-800">Delivery Fee: </span>
                      <span className="text-green-600 font-medium">${deliveryFees.totalFee}</span>
                    </div>
                  )}
                  
                  <div className="pt-2 flex items-center gap-2">
                    <CreditCard size={16} className="text-green-600" />
                    <span className="text-green-600 font-medium">Secure online payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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