import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
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
  
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (carId) {
      fetchCarById(parseInt(carId));
    }
  }, [carId, fetchCarById]);
  
  useEffect(() => {
    const updatePrice = async () => {
      if (carId && startDate && endDate) {
        const price = await calculatePrice(parseInt(carId), startDate, endDate);
        setTotalPrice(price);
      }
    };
    
    updatePrice();
  }, [carId, startDate, endDate, calculatePrice]);
  
  useEffect(() => {
    const checkCarAvailability = async () => {
      if (carId && startDate && endDate) {
        const available = await checkAvailability(parseInt(carId), startDate, endDate);
        setIsAvailable(available);
      }
    };
    
    checkCarAvailability();
  }, [carId, startDate, endDate, checkAvailability]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to make a booking');
      navigate('/login');
      return;
    }
    
    if (!isAvailable) {
      toast.error('Car is not available for the selected dates');
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
      toast.error('Failed to create booking');
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
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading car details. Please try again.
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
                    onChange={(e) => setStartDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    leftIcon={<Calendar size={20} />}
                  />
                  
                  <Input
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    leftIcon={<Calendar size={20} />}
                  />
                </div>
                
                {isCheckingAvailability ? (
                  <div className="flex items-center justify-center text-secondary-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-800 mr-2"></div>
                    Checking availability...
                  </div>
                ) : isAvailable !== null && (
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
                  disabled={!isAvailable || bookingLoading}
                  leftIcon={<CreditCard size={20} />}
                >
                  Proceed to Payment
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