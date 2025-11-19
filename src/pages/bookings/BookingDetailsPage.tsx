import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Car as CarIcon, CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown';
import { useBookingStore } from '../../stores/bookingStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { calculateBookingPriceBreakdown } from '../../utils/bookingPriceCalculations';
import { formatBookingId } from '../../utils/bookingHelpers';
import { parseDateInLocalTimezone } from '../../utils/dateUtils';

const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBooking, loading, error, fetchBookingById } = useBookingStore();
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchBookingById(id);
    }
  }, [id, fetchBookingById]);
  
  
  const checkPaymentStatus = async () => {
    if (!currentBooking || !currentBooking.stripe_payment_intent_id) return;
    
    setIsCheckingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { booking_id: currentBooking.id }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success('Payment status checked and updated');
        // Reload booking to show updated status
        fetchBookingById(currentBooking.id);
      }
    } catch (error) {
      toast.error('Failed to check payment status');
    } finally {
      setIsCheckingPayment(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col justify-center items-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
        <p className="mt-4 text-secondary-600">Loading booking details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center bg-secondary-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-error-500" />
            <h2 className="mt-4 text-2xl font-semibold text-secondary-900">Error Loading Booking</h2>
            <p className="mt-2 text-secondary-600">{error}</p>
            <Link to="/bookings" className="mt-6 inline-block">
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Back to Bookings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!currentBooking) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center bg-secondary-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-error-500" />
            <h2 className="mt-4 text-2xl font-semibold text-secondary-900">Booking Not Found</h2>
            <p className="mt-2 text-secondary-600">The booking you're looking for doesn't exist or has been removed.</p>
            <Link to="/bookings" className="mt-6 inline-block">
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Back to Bookings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success-50 text-success-500';
      case 'cancelled':
        return 'bg-error-50 text-error-500';
      case 'completed':
        return 'bg-secondary-100 text-secondary-600';
      case 'draft':
        return 'bg-blue-50 text-blue-500';
      case 'pending':
        return 'bg-warning-50 text-warning-500';
      default:
        return 'bg-warning-50 text-warning-500';
    }
  };
  
  return (
    <div className="min-h-screen pt-2 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="mb-6">
          <Link to="/bookings" className="inline-flex items-center text-primary-700 hover:text-primary-800">
            <ArrowLeft size={16} className="mr-1" />
            Back to Bookings
          </Link>
        </div>
        
        {/* Success Alert - Only show for confirmed bookings */}
        {currentBooking.status === 'confirmed' && currentBooking.stripe_payment_status === 'succeeded' && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Payment Successful!</h3>
              <p className="mt-1 text-xs sm:text-sm text-green-700">Your booking is confirmed. Check your email for details.</p>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-secondary-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-semibold text-secondary-900">
                  Booking #{formatBookingId(currentBooking.id)}
                </h1>
                <p className="mt-1 text-secondary-500">
                  Created on {format(new Date(currentBooking.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full ${getStatusColor(currentBooking.status)}`}>
                {currentBooking.status.charAt(0).toUpperCase() + currentBooking.status.slice(1)}
              </div>
            </div>
          </div>
          
          {/* Car Details */}
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CarIcon size={20} className="mr-2" />
              Vehicle Details
            </h2>
            <div className="flex items-start">
              <div className="w-32 h-24 rounded-md overflow-hidden">
                <img 
                  src={
                    currentBooking.car?.image_urls && currentBooking.car.image_urls.length > 0
                      ? currentBooking.car.image_urls[currentBooking.car.main_image_index || 0]
                      : currentBooking.car?.image_url
                  } 
                  alt={`${currentBooking.car?.make} ${currentBooking.car?.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">
                  {currentBooking.car?.make} {currentBooking.car?.model} {currentBooking.car?.year}
                </h3>
                <p className="text-secondary-600 mt-1">
                  Category: {currentBooking.car?.category}
                </p>
              </div>
            </div>
          </div>
          
          {/* Booking Details */}
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar size={20} className="mr-2" />
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Pickup Details */}
              <div>
                <p className="text-secondary-600 text-sm sm:text-base">Pickup</p>
                <div className="mt-1">
                  <p className="text-sm sm:text-base">
                    📍 {format(parseDateInLocalTimezone(currentBooking.start_date), 'MMM d, yyyy')} at {currentBooking.pickup_time || '10:00 AM'}
                  </p>
                  {currentBooking.pickup_location && (
                    <p className="text-xs sm:text-sm text-secondary-500 mt-1">
                      Location: {currentBooking.pickup_location.label}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Return Details */}
              <div>
                <p className="text-secondary-600 text-sm sm:text-base">Return</p>
                <div className="mt-1">
                  <p className="text-sm sm:text-base">
                    📍 {format(parseDateInLocalTimezone(currentBooking.end_date), 'MMM d, yyyy')} at {currentBooking.return_time || '10:00 AM'}
                  </p>
                  {currentBooking.return_location && (
                    <p className="text-xs sm:text-sm text-secondary-500 mt-1">
                      Location: {currentBooking.return_location.label}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Total Price - moved to end */}
              <div className="md:col-span-2">
                <p className="text-secondary-600 text-sm sm:text-base">Total Price</p>
                <div className="mt-1 flex items-center">
                  <CreditCard size={16} className="text-secondary-400 mr-1" />
                  <span className="text-lg sm:text-xl font-semibold">
                    ${currentBooking.grand_total || currentBooking.total_price}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seasonal Daily Breakdown */}
          {currentBooking.car_id && (
            <div className="p-6 border-t">
              <PriceBreakdown
                carId={currentBooking.car_id}
                startDate={currentBooking.start_date}
                endDate={currentBooking.end_date}
                startTime={currentBooking.pickup_time || undefined}
                endTime={currentBooking.return_time || undefined}
              />
            </div>
          )}

          {/* Price Breakdown */}
          <div className="p-6 border-t">
            <h2 className="text-lg font-semibold mb-4">Price Summary</h2>
            <div className="space-y-2">
              {(() => {
                // Use centralized price breakdown calculation
                const priceBreakdown = calculateBookingPriceBreakdown(currentBooking);
                
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Car Rental</span>
                      <span>${priceBreakdown.carRentalSubtotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Delivery Fee */}
                    {priceBreakdown.totalDeliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Delivery Fee</span>
                        <span>${priceBreakdown.totalDeliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {/* Extras section */}
                    {currentBooking.booking_extras && currentBooking.booking_extras.length > 0 && (
                      <>
                        <div className="text-sm font-medium text-secondary-700 mt-3">Extras</div>
                        {currentBooking.booking_extras.map((extra: any) => (
                          <div key={extra.id} className="flex justify-between text-sm">
                            <span className="text-secondary-600 pl-4">
                              {extra.extra?.name || 'Extra'} × {extra.quantity}
                            </span>
                            <span>${extra.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </>
                    )}
                    
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary-800">
                        ${priceBreakdown.grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          
          {/* Payment Status */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <CreditCard size={20} className="mr-2" />
                Payment Status
              </h2>
              {currentBooking.status !== 'draft' && currentBooking.stripe_payment_status !== 'succeeded' && currentBooking.stripe_payment_status !== 'canceled' && currentBooking.stripe_payment_status !== 'failed' && (
                <button
                  onClick={() => fetchBookingById(id!)}
                  className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
            </div>
            <div className="flex items-center">
              {currentBooking.stripe_payment_status === 'succeeded' ? (
                <>
                  <CheckCircle size={20} className="text-success-500 mr-2" />
                  <div>
                    <p className="font-medium">Payment Completed</p>
                    <p className="text-sm text-secondary-500">
                      Reference: #{currentBooking.stripe_payment_intent_id?.slice(-8) || 'N/A'}
                    </p>
                    <p className="text-xs text-secondary-400 mt-1">
                      📧 Booking confirmation sent to your email
                    </p>
                  </div>
                </>
              ) : currentBooking.stripe_payment_status === 'processing' ? (
                <>
                  <Clock size={20} className="text-warning-500 mr-2" />
                  <div>
                    <p className="font-medium">Payment Processing</p>
                    <p className="text-sm text-secondary-500">
                      Your payment is being processed...
                    </p>
                  </div>
                </>
              ) : currentBooking.stripe_payment_status === 'failed' ? (
                <>
                  <XCircle size={20} className="text-error-500 mr-2" />
                  <div>
                    <p className="font-medium">Payment Failed</p>
                    <p className="text-sm text-secondary-500">
                      The payment could not be processed
                    </p>
                  </div>
                </>
              ) : currentBooking.stripe_payment_status === 'canceled' ? (
                <>
                  <XCircle size={20} className="text-error-500 mr-2" />
                  <div>
                    <p className="font-medium">Payment Canceled</p>
                    <p className="text-sm text-secondary-500">
                      The payment was canceled
                    </p>
                  </div>
                </>
              ) : currentBooking.stripe_payment_status === 'pending' || !currentBooking.stripe_payment_status ? (
                <>
                  <Clock size={20} className="text-warning-500 mr-2" />
                  <div>
                    <p className="font-medium">Payment Pending</p>
                    <p className="text-sm text-secondary-500">
                      Please complete the payment to confirm your booking
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-error-500 mr-2" />
                  <div>
                    <p className="font-medium">Unknown Payment Status</p>
                    <p className="text-sm text-secondary-500">
                      Status: {currentBooking.stripe_payment_status}
                    </p>
                  </div>
                </>
              )}
            </div>
            {/* Continue to Payment for draft bookings */}
            {currentBooking.status === 'draft' && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/payment/${currentBooking.id}`)}
                >
                  Continue to Payment
                </Button>
              </div>
            )}
            {/* Manual Payment Check for pending payments with payment intent */}
            {currentBooking.stripe_payment_intent_id && currentBooking.stripe_payment_status === 'pending' && currentBooking.status !== 'draft' && (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={checkPaymentStatus}
                  disabled={isCheckingPayment}
                  leftIcon={<RefreshCw size={14} className={isCheckingPayment ? 'animate-spin' : ''} />}
                >
                  {isCheckingPayment ? 'Checking...' : 'Check Payment Status'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;