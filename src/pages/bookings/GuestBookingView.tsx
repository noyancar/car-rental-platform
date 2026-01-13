import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Shield, Car, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { parseDateInLocalTimezone } from '../../utils/dateUtils';
import { calculateBookingPriceBreakdown } from '../../utils/bookingPriceCalculations';

const GuestBookingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid booking link. Please check your email for the correct link.');
      setLoading(false);
      return;
    }

    loadBooking();
  }, [token]);

  const loadBooking = async () => {
    try {
      setLoading(true);

      // Fetch booking by guest access token
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          booking_extras (
            *,
            extra:extras (*)
          ),
          pickup_location:locations!bookings_pickup_location_id_fkey (*),
          return_location:locations!bookings_return_location_id_fkey (*)
        `)
        .eq('guest_access_token', token)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Booking not found. This link may have expired or is invalid.');
        } else {
          throw fetchError;
        }
        return;
      }

      // Verify this is a guest booking
      if (data.user_id !== null) {
        setError('This is not a guest booking. Please sign in to view your bookings.');
        return;
      }

      setBooking(data);
    } catch (err) {
      console.error('Error loading guest booking:', err);
      setError('Failed to load booking details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
        <p className="text-gray-600 mt-4">Loading your booking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
        <div className="container-custom">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Unable to Load Booking</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  // Calculate rental duration
  const rentalDuration = Math.ceil(
    (parseDateInLocalTimezone(booking.end_date).getTime() -
     parseDateInLocalTimezone(booking.start_date).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  // Calculate price breakdown
  const priceBreakdown = calculateBookingPriceBreakdown(booking);
  const { grandTotal } = priceBreakdown;

  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Booking</h1>
                <p className="text-gray-600">
                  Booking for {booking.customer_name}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                booking.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : booking.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </div>
            </div>

            {/* Status message */}
            {booking.status === 'confirmed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Booking Confirmed!</p>
                  <p className="text-sm text-green-700 mt-1">
                    We've sent a confirmation email to {booking.customer_email}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Car Details */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-64">
                  <img
                    src={booking.cars?.image_url}
                    alt={`${booking.cars?.make} ${booking.cars?.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    {booking.cars?.make} {booking.cars?.model} {booking.cars?.year}
                  </h2>

                  {/* Dates */}
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <span className="font-medium">Pickup: </span>
                        {format(parseDateInLocalTimezone(booking.start_date), 'MMM d, yyyy')}
                        {booking.pickup_time && ` at ${booking.pickup_time}`}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <span className="font-medium">Return: </span>
                        {format(parseDateInLocalTimezone(booking.end_date), 'MMM d, yyyy')}
                        {booking.return_time && ` at ${booking.return_time}`}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Car className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <span className="font-medium">Duration: </span>
                        {rentalDuration} days
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Pickup & Return Locations</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Pickup Location</p>
                      <p className="font-medium">{booking.pickup_location?.label || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Return Location</p>
                      <p className="font-medium">{booking.return_location?.label || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extras */}
              {booking.booking_extras && booking.booking_extras.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Extras</h3>
                  <div className="space-y-2">
                    {booking.booking_extras.map((be: any) => (
                      <div key={be.id} className="flex justify-between items-center">
                        <span className="text-gray-700">
                          {be.extra?.name} × {be.quantity}
                        </span>
                        <span className="font-medium">${be.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Car Rental</span>
                    <span>${priceBreakdown.carRentalSubtotal.toFixed(2)}</span>
                  </div>

                  {priceBreakdown.totalDeliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span>${priceBreakdown.totalDeliveryFee.toFixed(2)}</span>
                    </div>
                  )}

                  {priceBreakdown.extrasTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Extras</span>
                      <span>${priceBreakdown.extrasTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total Paid</span>
                    <span className="text-primary-800">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Need Help?</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href="mailto:nynrentals@gmail.com" className="hover:text-primary-700">
                        nynrentals@gmail.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href="tel:+18089091272" className="hover:text-primary-700">
                        (808) 909-1272
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestBookingView;
