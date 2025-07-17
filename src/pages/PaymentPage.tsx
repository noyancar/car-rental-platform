import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/auth';
import StripeProvider from '../components/payment/StripeProvider';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { BookingWithExtras } from '../types';
import { useLocations } from '../hooks/useLocations';
import { calculateRentalDuration, calculateCarRentalTotal, calculateExtrasTotal } from '../utils/booking';

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { calculateDeliveryFee } = useLocations();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [deliveryFees, setDeliveryFees] = useState({ 
    pickupFee: 0, 
    returnFee: 0, 
    totalFee: 0, 
    requiresQuote: false 
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      navigate('/');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      // Store the current URL to redirect back after auth
      localStorage.setItem('authRedirectUrl', window.location.pathname);
      setShowAuthModal(true);
    } else {
      loadBookingDetails();
    }
  }, [bookingId, user]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Reload the page to fetch booking details with authenticated user
    loadBookingDetails();
  };

  const loadBookingDetails = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch booking with extras and locations
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          booking_extras (
            *,
            extras (*)
          ),
          pickup_location:locations!bookings_pickup_location_id_fkey (*),
          return_location:locations!bookings_return_location_id_fkey (*)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Check if booking is already paid
      if (bookingData.status === 'confirmed' && bookingData.stripe_payment_intent_id) {
        toast.info('This booking has already been paid');
        navigate(`/bookings/${bookingId}`);
        return;
      }

      // Format the data - keep location data for display
      const formattedBooking = {
        ...bookingData,
        car: bookingData.cars,
        booking_extras: bookingData.booking_extras?.map((be: any) => ({
          ...be,
          extra: be.extras
        })),
        // Keep location IDs for compatibility
        pickup_location: bookingData.pickup_location_id,
        return_location: bookingData.return_location_id,
        // Store location objects for display
        pickup_location_data: bookingData.pickup_location,
        return_location_data: bookingData.return_location
      };

      setBooking(formattedBooking);
      
      // Calculate delivery fees based on location data
      if (bookingData.pickup_location && bookingData.return_location) {
        const fees = calculateDeliveryFee(
          bookingData.pickup_location.value, 
          bookingData.return_location.value
        );
        setDeliveryFees(fees);
      }

      // Create payment intent
      await createPaymentIntent(formattedBooking);
    } catch (error) {

      toast.error('Failed to load booking details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (bookingData: BookingWithExtras) => {
    try {
      // Call the Supabase Edge Function to create a payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          booking_id: bookingData.id,
          metadata: {
            user_email: user?.email,
            car_info: `${bookingData.car?.make} ${bookingData.car?.model} ${bookingData.car?.year}`
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.success) {
        if (data.status === 'succeeded') {
          // Payment already completed
          toast.info('This booking has already been paid');
          navigate(`/bookings/${bookingId}`);
          return;
        } else if (data.client_secret) {
          setPaymentClientSecret(data.client_secret);
        } else {
          throw new Error(data?.error || 'Failed to create payment intent');
        }
      } else {
        throw new Error(data?.error || 'Failed to create payment intent');
      }
    } catch (error) {
      setPaymentError('Failed to initialize payment. Please try again.');
      toast.error('Failed to initialize payment');
    }
  };

  const handlePaymentSuccess = async () => {
    // Webhook already updated the booking status, just show success and navigate
    toast.success('Payment successful! Your booking is confirmed.');
    navigate(`/bookings/${bookingId}`);
  };

  const handlePaymentError = async (error: string) => {
    toast.error(error);
    setPaymentError(error);
    
    // Create a new payment intent for retry
    if (booking) {
      try {
        await createPaymentIntent(booking);
      } catch (retryError) {
        console.error('Failed to create new payment intent for retry:', retryError);
      }
    }
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
          <div className="container-custom">
            <div className="mb-6">
              <button 
                onClick={() => navigate('/bookings')} 
                className="inline-flex items-center text-primary-700 hover:text-primary-800"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to My Bookings
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto text-center">
              <Shield className="w-16 h-16 text-primary-800 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Secure Checkout</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to complete your booking. Your rental details have been saved.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowAuthModal(true)}
                size="lg"
              >
                Sign in to continue
              </Button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Booking not found</h2>
          <Link to="/">
            <Button variant="primary" leftIcon={<ArrowLeft size={20} />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Use centralized calculation functions
  const rentalDuration = calculateRentalDuration(
    booking.start_date,
    booking.end_date,
    booking.pickup_time || '10:00',
    booking.return_time || '10:00'
  );
  
  const carTotal = booking.car ? calculateCarRentalTotal(booking.car.price_per_day, rentalDuration) : 0;
  const extrasTotal = calculateExtrasTotal(booking.booking_extras);
  
  // Calculate the correct grand total
  // If booking has grand_total use it, otherwise calculate from components
  const grandTotal = booking.grand_total || (booking.total_price + extrasTotal);

  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/bookings')} 
            className="inline-flex items-center text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to My Bookings
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-semibold mb-6">Complete Your Payment</h1>

              {paymentError && !paymentClientSecret && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Payment Initialization Failed</p>
                    <p className="text-sm text-red-600 mt-1">{paymentError}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-3"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start mb-6">
                <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>

              {/* Stripe Payment Form */}
              {paymentClientSecret ? (
                <StripeProvider clientSecret={paymentClientSecret}>
                  <StripePaymentForm
                    amount={grandTotal}
                    bookingId={parseInt(bookingId!)}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </StripeProvider>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-800 mx-auto mb-4"></div>
                  <p className="text-gray-600">Initializing secure payment...</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
              {/* Car Details */}
              {booking.car && (
                <>
                  <div className="relative h-48">
                    <img 
                      src={booking.car.image_url} 
                      alt={`${booking.car.make} ${booking.car.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-1">
                      {booking.car.make} {booking.car.model} {booking.car.year}
                    </h2>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')} ({rentalDuration} days)
                      </div>
                      
                      {/* Pickup Location */}
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-green-600" />
                        <div>
                          <span className="font-medium">Pickup: </span>
                          {booking.pickup_location_data?.label || 'Not specified'}
                        </div>
                      </div>
                      
                      {/* Return Location */}
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                        <div>
                          <span className="font-medium">Return: </span>
                          {booking.pickup_location === booking.return_location 
                            ? 'Same as pickup location' 
                            : (booking.return_location_data?.label || 'Not specified')}
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Car Rental</span>
                        <span>${carTotal.toFixed(2)}</span>
                      </div>

                      {/* Delivery Fee */}
                      {deliveryFees.totalFee > 0 && !deliveryFees.requiresQuote && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Fee</span>
                          <span>${deliveryFees.totalFee.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Extras */}
                      {booking.booking_extras && booking.booking_extras.length > 0 && (
                        <>
                          <div className="text-sm font-medium text-gray-700 mt-3 mb-2">Extras</div>
                          {booking.booking_extras.map((be: any) => (
                            <div key={be.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {be.extra?.name} × {be.quantity}
                              </span>
                              <span>${be.total_price.toFixed(2)}</span>
                            </div>
                          ))}
                        </>
                      )}

                      <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                        <span>Total</span>
                        <span className="text-primary-800">
                          ${grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;