import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Car, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/auth';
import { PriceBreakdown } from '../components/booking/PriceBreakdown';
import { useAuthStore } from '../stores/authStore';
import { useBookingStore } from '../stores/bookingStore';
import { useCarStore } from '../stores/carStore';
import { useExtrasStore } from '../stores/extrasStore';
import { parseDateInLocalTimezone } from '../utils/dateUtils';

const PendingPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { createBooking } = useBookingStore();
  const { fetchCarById } = useCarStore();
  const { saveBookingExtras } = useExtrasStore();
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingCreated, setBookingCreated] = useState(false);

  useEffect(() => {
    // Load pending booking from localStorage
    const bookingData = localStorage.getItem('pendingBooking');
    if (!bookingData) {
      toast.error('No pending booking found');
      navigate('/');
      return;
    }
    
    const parsedBooking = JSON.parse(bookingData);
    setPendingBooking(parsedBooking);
    
    // Fetch car details
    fetchCarDetails(parsedBooking.car_id);
  }, []);

  useEffect(() => {
    if (user && pendingBooking && !bookingCreated) {
      // User is now authenticated, create the actual booking
      setBookingCreated(true); // Prevent duplicate creation
      createBookingForUser();
    }
  }, [user, pendingBooking, bookingCreated]);

  const fetchCarDetails = async (carId: number) => {
    try {
      await fetchCarById(carId);
      const { currentCar } = useCarStore.getState();
      setCar(currentCar);
    } catch (error) {
      console.error('Error fetching car:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBookingForUser = async () => {
    if (!user || !pendingBooking) {
      console.error('Missing user or pendingBooking:', { user, pendingBooking });
      return;
    }

    
    // Validate required fields
    if (!pendingBooking.car_id || !pendingBooking.start_date || !pendingBooking.end_date || !pendingBooking.total_price) {
      console.error('Missing required booking fields:', pendingBooking);
      toast.error('Invalid booking data. Please try again.');
      return;
    }
    
    try {
      // Create the booking
      const booking = await createBooking({
        car_id: pendingBooking.car_id,
        user_id: user.id,
        start_date: pendingBooking.start_date,
        end_date: pendingBooking.end_date,
        total_price: pendingBooking.total_price,
        status: 'draft', // Start with draft status
        pickup_location: pendingBooking.pickup_location || 'base-office',
        return_location: pendingBooking.return_location || pendingBooking.pickup_location || 'base-office',
        pickup_time: pendingBooking.pickup_time || '10:00',
        return_time: pendingBooking.return_time || '10:00',
        // Add price breakdown fields
        car_rental_subtotal: pendingBooking.car_rental_subtotal || 0,
        pickup_delivery_fee: pendingBooking.pickup_delivery_fee || 0,
        return_delivery_fee: pendingBooking.return_delivery_fee || 0
      });


      if (booking) {
        // Restore selected extras
        if (pendingBooking.extras && pendingBooking.extras.length > 0) {
          // Restore extras to store
          const { addExtra } = useExtrasStore.getState();
          pendingBooking.extras.forEach((item: any) => {
            addExtra(item.extra, item.quantity);
          });
          
          // Calculate rental duration
          const start = new Date(`${pendingBooking.start_date}T${pendingBooking.pickup_time || '10:00'}`);
          const end = new Date(`${pendingBooking.end_date}T${pendingBooking.return_time || '10:00'}`);
          const diffMs = end.getTime() - start.getTime();
          const rentalDuration = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          
          // Save extras to booking
          await saveBookingExtras(booking.id, rentalDuration);
        }

        // Clear pending booking
        localStorage.removeItem('pendingBooking');
        
        // Navigate to payment page
        // Don't show success toast here - it's just a draft booking
        // The actual success message will appear after payment
        navigate(`/payment/${booking.id}`);
      } else {
        console.error('No booking returned from createBooking');
        toast.error('Failed to create booking - no booking returned');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // The useEffect will handle creating the booking once user is authenticated
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  if (!pendingBooking) {
    return null;
  }

  const start = new Date(`${pendingBooking.start_date}T${pendingBooking.pickup_time || '10:00'}`);
  const end = new Date(`${pendingBooking.end_date}T${pendingBooking.return_time || '10:00'}`);
  const diffMs = end.getTime() - start.getTime();
  const rentalDuration = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return (
    <>
      <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <Shield className="w-16 h-16 text-primary-800 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
                <p className="text-gray-600 text-lg">
                  Sign in to complete your booking. Your rental details have been saved.
                </p>
              </div>

              {/* Booking Summary */}
              {car && (
                <div className="bg-secondary-50 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Your Booking Summary</h2>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={car.image_url} 
                      alt={`${car.make} ${car.model}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {car.make} {car.model} {car.year}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(parseDateInLocalTimezone(pendingBooking.start_date), 'MMM d')} - {format(parseDateInLocalTimezone(pendingBooking.end_date), 'MMM d, yyyy')}
                        </div>
                        <div>{rentalDuration} days</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-800">
                        ${pendingBooking.total_price}
                      </p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                  </div>

                  {/* Seasonal Pricing Breakdown */}
                  {pendingBooking.car_id && (
                    <div className="border-t pt-4 mt-4">
                      <PriceBreakdown
                        carId={pendingBooking.car_id}
                        startDate={pendingBooking.start_date}
                        endDate={pendingBooking.end_date}
                        startTime={pendingBooking.pickup_time}
                        endTime={pendingBooking.return_time}
                      />
                    </div>
                  )}

                  {pendingBooking.extras && pendingBooking.extras.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center mb-2">
                        <Package className="w-4 h-4 mr-2 text-primary-700" />
                        <span className="font-medium">Selected Extras</span>
                      </div>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {pendingBooking.extras.map((item: any, index: number) => (
                          <li key={index}>
                            {item.extra.name} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign in to continue
                </Button>
                
                <p className="text-sm text-gray-600 mt-4">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // Don't redirect if user just closes modal - let them stay on the page
          // Only redirect if they explicitly cancel the booking
        }}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default PendingPaymentPage; 