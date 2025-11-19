import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/auth';
import ProfileCompletionForm from '../components/payment/ProfileCompletionForm';
import StripeProvider from '../components/payment/StripeProvider';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import { PriceBreakdown } from '../components/booking/PriceBreakdown';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { BookingWithExtras } from '../types';
import { calculateBookingPriceBreakdown } from '../utils/bookingPriceCalculations';
import { isBookingExpired } from '../utils/bookingHelpers';
import { parseDateInLocalTimezone } from '../utils/dateUtils';

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

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

      // Fetch fresh profile data from database to check completeness
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        toast.error('Failed to load profile');
        return;
      }

      // Check if user profile is complete (only essential fields)
      if (!profile.first_name || !profile.last_name || !profile.phone) {
        setShowProfileCompletion(true);
        setLoading(false);
        return;
      }
      
      // Fetch booking with extras, locations, and discount code
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
          return_location:locations!bookings_return_location_id_fkey (*),
          discount_code:discount_codes (code, discount_percentage)
        `)
        .eq('id', bookingId!)
        .single();

      if (bookingError) throw bookingError;

      // Check if booking has expired
      if (isBookingExpired(bookingData)) {
        toast.error('This booking has expired. Please create a new booking.');
        navigate('/bookings');
        return;
      }

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
          customerEmail: bookingData.customer_email || bookingData.email || user?.email, // Send customer email for receipt
          customerName: bookingData.customer_name || 'Customer', // Use existing customer_name or fallback
          metadata: {
            user_email: user?.email,
            car_info: `${bookingData.car?.make} ${bookingData.car?.model} ${bookingData.car?.year}`
          }
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
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
      console.error('Payment initialization error:', error);
      console.error('Full error details:', { error, data });
      setPaymentError('Failed to initialize payment. Please try again.');
      toast.error('Failed to initialize payment');
    }
  };

  const handlePaymentSuccess = async () => {
    // Webhook already updated the booking status, just show success and navigate
    toast.success('Payment successful! Your booking is confirmed.');
    navigate(`/bookings/${bookingId}`);
  };

  const handleProfileComplete = () => {
    setShowProfileCompletion(false);
    // Reload booking details after profile is complete
    loadBookingDetails();
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

  if (showProfileCompletion) {
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
          
          <ProfileCompletionForm onComplete={handleProfileComplete} />
        </div>
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

  // Use centralized price breakdown calculation
  const priceBreakdown = calculateBookingPriceBreakdown(booking);
  const { carRentalSubtotal: carTotal, extrasTotal, grandTotal } = priceBreakdown;
  
  // Calculate rental duration for display
  const rentalDuration = Math.ceil(
    (parseDateInLocalTimezone(booking.end_date).getTime() - parseDateInLocalTimezone(booking.start_date).getTime()) /
    (1000 * 60 * 60 * 24)
  );

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
                    bookingId={bookingId!}
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
                        {format(parseDateInLocalTimezone(booking.start_date), 'MMM d')} - {format(parseDateInLocalTimezone(booking.end_date), 'MMM d, yyyy')} ({rentalDuration} days)
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

                    {/* Seasonal Pricing Breakdown */}
                    {booking.car_id && (
                      <div className="border-t pt-4">
                        <PriceBreakdown
                          carId={booking.car_id}
                          startDate={booking.start_date}
                          endDate={booking.end_date}
                          startTime={booking.pickup_time || undefined}
                          endTime={booking.return_time || undefined}
                          className="mb-4"
                        />
                      </div>
                    )}

                    {/* Price Breakdown (Additional Fees) */}
                    <div className="border-t pt-4 space-y-3">
                      {booking.discount_code && (
                        <div className="flex justify-between text-green-600 text-sm mb-2">
                          <span>Discount Applied: {booking.discount_code.code} ({booking.discount_code.discount_percentage}% off)</span>
                        </div>
                      )}

                      {/* Delivery Fee */}
                      {priceBreakdown.totalDeliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Fee</span>
                          <span>${priceBreakdown.totalDeliveryFee.toFixed(2)}</span>
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