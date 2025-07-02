import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Booking } from '../types';

const PaymentRetryPage: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadBookingDetails();
  }, [bookingId, user]);

  const loadBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, cars(make, model, year)')
        .eq('id', bookingId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      // Check if already paid
      if (data.status === 'confirmed' && data.stripe_payment_intent_id) {
        navigate(`/bookings/${bookingId}`);
        return;
      }

      setBooking(data);
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Failed to load booking details');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    navigate(`/payment/${bookingId}`);
  };

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
          <Link to="/bookings">
            <Button variant="primary" leftIcon={<ArrowLeft size={20} />}>
              Back to Bookings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button 
              onClick={() => navigate('/bookings')} 
              className="inline-flex items-center text-primary-700 hover:text-primary-800"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Bookings
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-orange-50 border-b border-orange-200 p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-orange-600" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Payment Required</h1>
                  <p className="text-gray-600 mt-1">Your booking is pending payment</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">Booking Details</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-medium">#{booking.id}</span>
                  </div>
                  {booking.cars && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-medium">
                        {booking.cars.year} {booking.cars.make} {booking.cars.model}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-lg">${booking.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Your booking has been created but requires payment to be confirmed. 
                  Please complete the payment process to secure your rental.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="primary"
                  onClick={handleRetryPayment}
                  leftIcon={<RefreshCw size={20} />}
                  fullWidth
                >
                  Complete Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRetryPage;