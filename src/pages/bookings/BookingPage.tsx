import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format, addDays, differenceInDays, isBefore, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCarStore } from '../../stores/carStore';
import { useBookingStore } from '../../stores/bookingStore';
import { useAuthStore } from '../../stores/authStore';

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
  
  // Initialize with today as start date, tomorrow as end date
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  const [startDate, setStartDate] = useState(format(today, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(tomorrow, 'yyyy-MM-dd'));
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  
  useEffect(() => {
    if (carId) {
      fetchCarById(parseInt(carId));
    }
  }, [carId, fetchCarById]);
  
  // Calculate rental duration whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (isValid(start) && isValid(end)) {
        const days = differenceInDays(end, start);
        setRentalDuration(Math.max(1, days));
      }
    }
  }, [startDate, endDate]);
  
  // Validate dates and return status
  const validateDates = useCallback(() => {
    if (!startDate || !endDate) {
      setValidationMessage('Please select both pickup and return dates');
      return false;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!isValid(start) || !isValid(end)) {
      setValidationMessage('Invalid date format');
      return false;
    }

    if (isBefore(start, today)) {
      setValidationMessage('Pickup date cannot be in the past');
      return false;
    }

    if (isBefore(end, start)) {
      setValidationMessage('Return date must be after pickup date');
      return false;
    }

    if (differenceInDays(end, start) < 1) {
      setValidationMessage('Minimum rental period is 1 day');
      return false;
    }

    setValidationMessage('');
    return true;
  }, [startDate, endDate]);

  // Handle start date change with smart end date adjustment
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // Auto-adjust end date if it's invalid
    const start = parseISO(newStartDate);
    const end = parseISO(endDate);
    
    if (isValid(start) && (!isValid(end) || isBefore(end, start) || differenceInDays(end, start) < 1)) {
      // Set end date to start date + 1 day
      setEndDate(format(addDays(start, 1), 'yyyy-MM-dd'));
    }
    
    // Reset availability check
    setIsAvailable(null);
  };

  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    
    // Validate minimum rental period
    const start = parseISO(startDate);
    const end = parseISO(newEndDate);
    
    if (isValid(start) && isValid(end) && differenceInDays(end, start) < 1) {
      toast.error('Minimum rental period is 1 day');
    }
    
    setIsAvailable(null);
  };
  
  // Update price with debouncing
  useEffect(() => {
    const updatePrice = async () => {
      if (!carId || !validateDates()) {
        setTotalPrice(0);
        return;
      }
      
      const price = await calculatePrice(parseInt(carId), startDate, endDate);
      setTotalPrice(price);
    };
    
    const timeoutId = setTimeout(updatePrice, 400);
    return () => clearTimeout(timeoutId);
  }, [carId, startDate, endDate, calculatePrice, validateDates]);
  
  // Check availability with debouncing
  useEffect(() => {
    const checkCarAvailability = async () => {
      if (!carId || !validateDates()) {
        setIsAvailable(null);
        return;
      }
      
      const available = await checkAvailability(parseInt(carId), startDate, endDate);
      setIsAvailable(available);
    };
    
    const timeoutId = setTimeout(checkCarAvailability, 400);
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
      toast.error('This car is not available for the selected dates');
      return;
    }
    
    try {
      const booking = await createBooking({
        car_id: currentCar!.id,
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: 'pending',
      });
      
      if (booking) {
        toast.success('Booking created successfully');
        navigate(`/bookings/${booking.id}`);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('availability')) {
        toast.error('Sorry, this car was just booked. Please try different dates.');
      } else {
        toast.error(errorMessage || 'Failed to create booking');
      }
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
          <h2 className="text-2xl font-semibold mb-4">Error Loading Car Details</h2>
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
                    label="Pickup Date"
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    leftIcon={<Calendar size={20} />}
                    required
                  />
                  
                  <Input
                    label="Return Date"
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    min={format(parseISO(startDate), 'yyyy-MM-dd')}
                    leftIcon={<Calendar size={20} />}
                    required
                  />
                </div>
                
                {/* Rental Duration */}
                {startDate && endDate && validateDates() && (
                  <div className="flex items-center text-secondary-600 bg-secondary-50 p-3 rounded-md">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>Rental Duration: {rentalDuration} {rentalDuration === 1 ? 'day' : 'days'}</span>
                  </div>
                )}
                
                {/* Validation Message */}
                {validationMessage && (
                  <div className="flex items-center text-error-500 bg-error-50 p-3 rounded-md">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {validationMessage}
                  </div>
                )}
                
                {/* Availability Status */}
                {isCheckingAvailability ? (
                  <div className="flex items-center justify-center text-secondary-600 bg-secondary-50 p-3 rounded-md">
                    <div className="animate-spin h-5 w-5 border-2 border-primary-800 border-t-transparent rounded-full mr-2"></div>
                    Checking availability...
                  </div>
                ) : isAvailable !== null && validateDates() && (
                  <div className={`flex items-center p-3 rounded-md ${
                    isAvailable ? 'bg-success-50 text-success-500' : 'bg-error-50 text-error-500'
                  }`}>
                    {isAvailable ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Car is available for your selected dates
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Car is not available for these dates
                      </>
                    )}
                  </div>
                )}
                
                <div>
                  <Input
                    label="Discount Code (Optional)"
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
                  isLoading={bookingLoading || isCheckingAvailability}
                  disabled={!validateDates() || !isAvailable || bookingLoading || isCheckingAvailability}
                  leftIcon={<CreditCard size={20} />}
                >
                  {!user ? 'Sign in to Book' :
                   !validateDates() ? 'Select Valid Dates' :
                   isCheckingAvailability ? 'Checking Availability...' :
                   !isAvailable ? 'Car Not Available' :
                   `Book Now • $${totalPrice}`}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              
              <div className="mb-4">
                <img 
                  src={currentCar.image_url} 
                  alt={`${currentCar.make} ${currentCar.model}`}
                  className="w-full h-48 object-cover rounded-md"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    {currentCar.year} {currentCar.make} {currentCar.model}
                  </h3>
                  <p className="text-secondary-600">{currentCar.category}</p>
                </div>
                
                <div className="border-t border-b border-secondary-200 py-4">
                  <div className="flex justify-between mb-2">
                    <span>Daily Rate</span>
                    <span>${currentCar.price_per_day}/day</span>
                  </div>
                  
                  {validateDates() && (
                    <div className="flex justify-between mb-2 text-secondary-600">
                      <span>Duration</span>
                      <span>{rentalDuration} {rentalDuration === 1 ? 'day' : 'days'}</span>
                    </div>
                  )}
                  
                  {discountCode && (
                    <div className="flex justify-between mb-2 text-success-500">
                      <span>Discount</span>
                      <span>-$0.00</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
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