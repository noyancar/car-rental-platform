import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format, addDays, isBefore, isValid, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCarStore } from '../../stores/carStore';
import { useBookingStore } from '../../stores/bookingStore';
import { useAuthStore } from '../../stores/authStore';

const BookingPage: React.FC = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { currentCar, loading: carLoading, error: carError, fetchCarById } = useCarStore();
  const { 
    createBooking, 
    calculatePrice, 
    checkAvailability,
    loading: bookingLoading,
    isCheckingAvailability
  } = useBookingStore();
  
  // Security: Validate and sanitize URL parameters
  const validateUrlParameters = () => {
    const urlPickupDate = searchParams.get('pickup');
    const urlPickupTime = searchParams.get('pickupTime');
    const urlReturnDate = searchParams.get('return'); 
    const urlReturnTime = searchParams.get('returnTime');
    
    // Validation regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    // Validate formats
    if (urlPickupDate && !dateRegex.test(urlPickupDate)) return null;
    if (urlReturnDate && !dateRegex.test(urlReturnDate)) return null;
    if (urlPickupTime && !timeRegex.test(urlPickupTime)) return null;
    if (urlReturnTime && !timeRegex.test(urlReturnTime)) return null;
    
    // Validate date logic
    if (urlPickupDate && urlReturnDate) {
      const pickup = new Date(`${urlPickupDate}T${urlPickupTime || '10:00'}`);
      const returnDate = new Date(`${urlReturnDate}T${urlReturnTime || '10:00'}`);
      const now = new Date();
      
      if (pickup < now || returnDate <= pickup) return null;
    }
    
    return {
      pickupDate: urlPickupDate,
      pickupTime: urlPickupTime || '10:00',
      returnDate: urlReturnDate,
      returnTime: urlReturnTime || '10:00'
    };
  };
  
  const validatedParams = validateUrlParameters();
  
  // State management
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  
  // Fallback state for when no URL params
  const [fallbackStartDate, setFallbackStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fallbackEndDate, setFallbackEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  
  // Security: Re-verify everything on page load
  useEffect(() => {
    const performSecurityChecks = async () => {
      if (!carId) {
        navigate('/cars');
        return;
      }
      
      setIsVerifying(true);
      
      try {
        // Check 1: Validate car exists and is available
        await fetchCarById(parseInt(carId));
        
        if (validatedParams) {
          // Check 2: Re-verify availability (CRITICAL)
          const stillAvailable = await checkAvailability(
            parseInt(carId),
            validatedParams.pickupDate,
            validatedParams.pickupTime,
            validatedParams.returnDate,
            validatedParams.returnTime
          );
          
          if (!stillAvailable) {
            setSecurityWarning('This car is no longer available for your selected dates');
            setTimeout(() => navigate('/cars'), 3000);
            return;
          }
          
          // Check 3: Verify pricing (prevent manipulation)
          const serverPrice = await calculatePrice(
            parseInt(carId),
            validatedParams.pickupDate,
            validatedParams.pickupTime,
            validatedParams.returnDate,
            validatedParams.returnTime
          );
          
          setTotalPrice(serverPrice);
          setIsAvailable(true);
          
          // Check 4: Compare with expected price if stored
          const expectedPrice = sessionStorage.getItem('expectedPrice');
          if (expectedPrice && Math.abs(serverPrice - parseFloat(expectedPrice)) > 0.01) {
            setSecurityWarning('Price has been updated based on current rates');
          }
        }
        
      } catch (error) {
        console.error('Security verification failed:', error);
        setSecurityWarning('Unable to verify booking details');
        setTimeout(() => navigate('/cars'), 3000);
      } finally {
        setIsVerifying(false);
      }
    };
    
    performSecurityChecks();
  }, [carId, validatedParams, navigate, fetchCarById, checkAvailability, calculatePrice]);
  
  // Render locked date display
  const renderDateDisplay = () => {
    if (!validatedParams) return null;
    
    const days = Math.ceil(
      (new Date(validatedParams.returnDate).getTime() - new Date(validatedParams.pickupDate).getTime()) 
      / (1000 * 60 * 60 * 24)
    );
    
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 mb-3">🚗 Your Rental Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Pickup</p>
                  <p className="font-semibold text-blue-900">
                    {format(new Date(validatedParams.pickupDate), 'MMM dd, yyyy')} at {validatedParams.pickupTime}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Return</p>
                  <p className="font-semibold text-blue-900">
                    {format(new Date(validatedParams.returnDate), 'MMM dd, yyyy')} at {validatedParams.returnTime}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 flex items-center space-x-3">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {days} day{days > 1 ? 's' : ''} rental
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Available
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/cars')}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            Change Dates
          </Button>
        </div>
      </div>
    );
  };
  
  // Security warning display
  const renderSecurityWarning = () => {
    if (!securityWarning) return null;
    
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
          <p className="text-amber-800 font-medium">{securityWarning}</p>
        </div>
      </div>
    );
  };
  
  // Professional booking form
  const renderBookingForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Full Name" 
            type="text" 
            required 
            placeholder="John Doe"
            defaultValue={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''}
          />
          <Input 
            label="Phone Number" 
            type="tel" 
            required 
            placeholder="+1 (555) 123-4567"
            defaultValue={user?.phone || ''}
          />
          <Input 
            label="Email Address" 
            type="email" 
            required 
            placeholder="john@example.com" 
            className="md:col-span-2"
            defaultValue={user?.email || ''}
            disabled
          />
        </div>
      </div>

      {/* Driver Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🪪 Driver Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Driver License Number" 
            type="text" 
            required 
            placeholder="DL123456789"
            defaultValue={user?.license_number || ''}
          />
          <Input 
            label="License Expiry Date" 
            type="date" 
            required 
            min={format(new Date(), 'yyyy-MM-dd')} 
          />
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">💳 Payment Information</h3>
        <div className="space-y-4">
          <Input 
            label="Card Number" 
            type="text" 
            required 
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            pattern="\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Expiry Date" 
              type="text" 
              required 
              placeholder="MM/YY"
              maxLength={5}
              pattern="\d{2}/\d{2}"
            />
            <Input 
              label="CVV" 
              type="text" 
              required 
              placeholder="123"
              maxLength={4}
              pattern="\d{3,4}"
            />
          </div>
          <Input 
            label="Cardholder Name" 
            type="text" 
            required 
            placeholder="John Doe"
          />
        </div>
      </div>

      {/* Discount Code */}
      <div>
        <Input
          label="Discount Code (Optional)"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="Enter discount code"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        disabled={!isAvailable || isVerifying || bookingLoading}
        isLoading={isVerifying || bookingLoading}
        leftIcon={<CreditCard size={20} />}
      >
        {isVerifying ? 'Verifying...' : `Complete Booking - $${totalPrice.toFixed(2)}`}
      </Button>
    </form>
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to complete booking');
      navigate('/login');
      return;
    }
    
    if (!carId || !currentCar) {
      toast.error('Invalid car selection');
      navigate('/cars');
      return;
    }
    
    // Final security checks
    try {
      const currentParams = validatedParams || {
        pickupDate: fallbackStartDate,
        pickupTime: '10:00',
        returnDate: fallbackEndDate,
        returnTime: '10:00'
      };
      
      // Last-minute availability check
      const finalAvailability = await checkAvailability(
        parseInt(carId),
        currentParams.pickupDate,
        currentParams.pickupTime,
        currentParams.returnDate,
        currentParams.returnTime
      );
      
      if (!finalAvailability) {
        toast.error('Car is no longer available');
        navigate('/cars');
        return;
      }
      
      // Create booking
      const booking = await createBooking({
        car_id: parseInt(carId),
        user_id: user.id,
        start_date: currentParams.pickupDate,
        pickup_time: currentParams.pickupTime,
        end_date: currentParams.returnDate,
        return_time: currentParams.returnTime,
        total_price: totalPrice,
        status: 'pending',
      });
      
      if (booking) {
        // Clear stored expectations
        sessionStorage.removeItem('expectedPrice');
        sessionStorage.removeItem('expectedDates');
        
        toast.success('Booking confirmed successfully!');
        navigate(`/bookings/${booking.id}`);
      }
      
    } catch (error) {
      toast.error('Booking failed. Please try again.');
      console.error('Booking error:', error);
    }
  };
  
  if (carLoading || isVerifying) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
        <p className="mt-4 text-secondary-600">
          {isVerifying ? 'Verifying booking details...' : 'Loading car details...'}
        </p>
      </div>
    );
  }
  
  if (carError || !currentCar) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center bg-secondary-50">
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
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/cars" className="inline-flex items-center text-primary-700 hover:text-primary-800">
            <ArrowLeft size={20} className="mr-2" />
            Back to Cars
          </Link>
        </div>

        {/* Security Warning */}
        {renderSecurityWarning()}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-semibold mb-6">Complete Your Booking</h1>
              
              {/* Date Display */}
              {renderDateDisplay()}
              
              {/* Booking Form */}
              {renderBookingForm()}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              
              <div className="mb-4">
                <img 
                  src={currentCar.image_url} 
                  alt={`${currentCar.make} ${currentCar.model}`}
                  className="w-full h-48 object-cover rounded-md"
                />
              </div>
              
              <h3 className="font-semibold text-lg">
                {currentCar.year} {currentCar.make} {currentCar.model}
              </h3>
              <p className="text-secondary-600 mb-4">{currentCar.category}</p>
              
              <div className="border-t border-b border-secondary-200 py-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Daily Rate</span>
                  <span className="font-medium">${currentCar.price_per_day}/day</span>
                </div>
                
                {validatedParams && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Duration</span>
                      <span className="font-medium">
                        {Math.ceil(
                          (new Date(validatedParams.returnDate).getTime() - new Date(validatedParams.pickupDate).getTime()) 
                          / (1000 * 60 * 60 * 24)
                        )} days
                      </span>
                    </div>
                    
                    {discountCode && (
                      <div className="flex justify-between text-success-600">
                        <span>Discount</span>
                        <span>-$0.00</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-primary-800">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex items-center text-success-600">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="text-sm">Free Cancellation</span>
                </div>
                <div className="flex items-center text-success-600">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="text-sm">Insurance Included</span>
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