import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays, isBefore, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCarStore } from '../../stores/carStore';
import { useBookingStore } from '../../stores/bookingStore';
import { useAuthStore } from '../../stores/authStore';
import { useSearchStore } from '../../stores/searchStore';

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
  const { searchParams, isSearchPerformed } = useSearchStore();
  
  // Initialize dates from searchParams if available, otherwise use default values
  const [startDate, setStartDate] = useState(isSearchPerformed ? searchParams.pickupDate : format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(isSearchPerformed ? searchParams.returnDate : '');
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  
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
      setValidationMessage('End date must be after start date');
      return false;
    }

    setValidationMessage('');
    return true;
  }, [startDate, endDate]);

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // Clear end date if it's before new start date
    if (endDate && isBefore(parseISO(endDate), parseISO(newStartDate))) {
      setEndDate('');
    }
    
    // Reset availability status
    setIsAvailable(null);
  };

  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setIsAvailable(null);
  };
  
  // Update price when dates change
  useEffect(() => {
    const updatePrice = async () => {
      if (!carId || !startDate || !endDate || !validateDates()) {
        setTotalPrice(0);
        return;
      }
      
      const price = await calculatePrice(parseInt(carId), startDate, endDate);
      setTotalPrice(price);
    };
    
    const timeoutId = setTimeout(updatePrice, 300);
    return () => clearTimeout(timeoutId);
  }, [carId, startDate, endDate, calculatePrice, validateDates]);
  
  // Check availability with debouncing
  useEffect(() => {
    const checkCarAvailability = async () => {
      if (!carId || !startDate || !endDate || !validateDates()) {
        setIsAvailable(null);
        return;
      }
      
      const available = await checkAvailability(parseInt(carId), startDate, endDate);
      setIsAvailable(available);
    };
    
    const timeoutId = setTimeout(checkCarAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [carId, startDate, endDate, checkAvailability, validateDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to make a booking');
      navigate('/login');
      return;
    }
    
    if (!validateDates()) {
      toast.error(validationMessage);
      return;
    }
    
    if (!isAvailable) {
      toast.error('Car is not available for selected dates');
      return;
    }
    
    try {
      // Eğer searchParams boş veya tanımsızsa, varsayılan değerler kullanalım
      const locationValue = isSearchPerformed && searchParams.location ? searchParams.location : 'default-location';
      const pickupTimeValue = isSearchPerformed && searchParams.pickupTime ? searchParams.pickupTime : '10:00';
      const returnTimeValue = isSearchPerformed && searchParams.returnTime ? searchParams.returnTime : '10:00';
      
      const booking = await createBooking({
        car_id: currentCar!.id,
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: 'pending',
        pickup_location: locationValue,
        return_location: locationValue,
        pickup_time: pickupTimeValue,
        return_time: returnTimeValue
      });
      
      if (booking) {
        toast.success('Booking created successfully');
        navigate(`/bookings/${booking.id}`);
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to create booking');
    }
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
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="mb-6">
          <Link to={`/cars/${carId}`} className="inline-flex items-center text-primary-700 hover:text-primary-800">
            <ArrowLeft size={20} className="mr-2" />
            Back to Car Details
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-semibold mb-6">Book Your Rental</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    leftIcon={<Calendar size={20} />}
                  />
                  
                  <Input
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    min={startDate}
                    leftIcon={<Calendar size={20} />}
                    disabled={!startDate}
                  />
                </div>
                
                {validationMessage && (
                  <div className="text-error-500 text-sm flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {validationMessage}
                  </div>
                )}
                
                {isCheckingAvailability ? (
                  <div className="flex items-center justify-center text-secondary-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-800 mr-2"></div>
                    Checking availability...
                  </div>
                ) : startDate && endDate && isAvailable !== null && (
                  <div className={`flex items-center ${isAvailable ? 'text-success-500' : 'text-error-500'}`}>
                    {isAvailable ? (
                      <>
                        <CheckCircle size={20} className="mr-2" />
                        Car is available for selected dates
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} className="mr-2" />
                        Car is not available for selected dates
                      </>
                    )}
                  </div>
                )}
                
                <div>
                  <Input
                    label="Discount Code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter discount code"
                  />
                </div>
                
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={bookingLoading}
                  disabled={!isAvailable || bookingLoading || !startDate || !endDate}
                >
                  Complete Booking
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
                  {currentCar.year} {currentCar.make} {currentCar.model}
                </h2>
                <p className="text-primary-800 font-semibold mb-4">
                  ${currentCar.price_per_day}/day
                </p>
                
                <div className="border-t border-b border-secondary-200 py-4 my-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-secondary-600">Daily Rate:</span>
                    <span>${currentCar.price_per_day}</span>
                  </div>
                  
                  {startDate && endDate && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-secondary-600">Rental Duration:</span>
                        <span>
                          {Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))} days
                        </span>
                      </div>
                      
                      <div className="flex justify-between font-semibold text-lg mt-4">
                        <span>Total:</span>
                        <span>${totalPrice}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-secondary-600">
                  <p className="mb-2">
                    <span className="font-medium">Pickup Location:</span> {isSearchPerformed ? searchParams.location.replace('-', ' ').toUpperCase() : 'Not specified'}
                  </p>
                  
                  <p>
                    <CreditCard size={16} className="inline mr-1" />
                    <span className="text-secondary-800">Payment collected at pickup</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;