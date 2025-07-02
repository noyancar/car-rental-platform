import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Car, Calendar, Package, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthModal } from '../components/auth';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { BookingWithExtras } from '../types';
import { calculateDeliveryFee, getLocationByValue } from '../constants/locations';

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateBookingStatus } = useBookingStore();
  const [booking, setBooking] = useState<BookingWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState({ 
    pickupFee: 0, 
    returnFee: 0, 
    totalFee: 0, 
    requiresQuote: false 
  });
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
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
      
      // Fetch booking with extras
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          booking_extras (
            *,
            extras (*)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Format the data
      const formattedBooking = {
        ...bookingData,
        car: bookingData.cars,
        booking_extras: bookingData.booking_extras?.map((be: any) => ({
          ...be,
          extra: be.extras
        }))
      };

      setBooking(formattedBooking);
      
      // Calculate delivery fees
      if (formattedBooking.pickup_location && formattedBooking.return_location) {
        const fees = calculateDeliveryFee(formattedBooking.pickup_location, formattedBooking.return_location);
        setDeliveryFees(fees);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Failed to load booking details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) return;

    // Basic validation
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      toast.error('Please fill in all payment fields');
      return;
    }

    setProcessing(true);

    try {
      // In a real application, you would:
      // 1. Create a payment intent with Stripe
      // 2. Process the payment
      // 3. Update the booking status

      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update booking status to confirmed
      await updateBookingStatus(parseInt(bookingId!), 'confirmed');

      toast.success('Payment successful! Your booking is confirmed.');
      navigate(`/bookings/${bookingId}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
          <div className="container-custom">
            <div className="mb-6">
              <button 
                onClick={() => navigate(-1)} 
                className="inline-flex items-center text-primary-700 hover:text-primary-800"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
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

  const rentalDuration = Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24));
  const carTotal = booking.car ? booking.car.price_per_day * rentalDuration : 0;
  const extrasTotal = booking.booking_extras?.reduce((sum, be) => sum + be.total_price, 0) || 0;
  const deliveryTotal = deliveryFees.requiresQuote ? 0 : deliveryFees.totalFee;
  const grandTotal = carTotal + extrasTotal + deliveryTotal;

  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-semibold mb-6">Complete Your Payment</h1>

              <form onSubmit={handlePayment} className="space-y-6">
                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Cardholder Name"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').slice(0, 16))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.slice(0, 3))}
                        placeholder="123"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={processing}
                  disabled={processing}
                  leftIcon={<CreditCard size={20} />}
                >
                  {processing ? 'Processing...' : `Pay $${grandTotal.toFixed(2)}`}
                </Button>
              </form>
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
                      {booking.car.year} {booking.car.make} {booking.car.model}
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
                          {getLocationByValue(booking.pickup_location || '')?.label || booking.pickup_location || 'Not specified'}
                        </div>
                      </div>
                      
                      {/* Return Location */}
                      {booking.pickup_location !== booking.return_location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                          <div>
                            <span className="font-medium">Return: </span>
                            {getLocationByValue(booking.return_location || '')?.label || booking.return_location || 'Not specified'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Car Rental</span>
                        <span>${carTotal.toFixed(2)}</span>
                      </div>

                      {/* Extras */}
                      {booking.booking_extras && booking.booking_extras.length > 0 && (
                        <>
                          <div className="text-sm font-medium text-gray-700 mt-3 mb-2">Extras</div>
                          {booking.booking_extras.map((be) => (
                            <div key={be.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {be.extra?.name} × {be.quantity}
                              </span>
                              <span>${be.total_price.toFixed(2)}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {extrasTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Extras Total</span>
                          <span>${extrasTotal.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Delivery Fee */}
                      {deliveryFees.totalFee > 0 && !deliveryFees.requiresQuote && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Fee</span>
                          <span>${deliveryFees.totalFee.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {deliveryFees.requiresQuote && (
                        <div className="flex justify-between">
                          <span className="text-orange-600">Delivery Fee</span>
                          <span className="text-orange-600 italic">Quote required</span>
                        </div>
                      )}

                      <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                        <span>Total</span>
                        <span className="text-primary-800">
                          {deliveryFees.requiresQuote ? (
                            <>
                              ${(carTotal + extrasTotal).toFixed(2)}
                              <span className="text-sm font-normal text-orange-600 block">+ delivery quote</span>
                            </>
                          ) : (
                            `$${grandTotal.toFixed(2)}`
                          )}
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