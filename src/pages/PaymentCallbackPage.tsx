import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

const PaymentCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const bookingId = searchParams.get('booking_id');
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
        const redirectStatus = searchParams.get('redirect_status');

        if (!bookingId) {
          throw new Error('No booking ID found');
        }

        // Check the redirect status from Stripe
        if (redirectStatus === 'succeeded') {
          // Payment was successful
          // Wait a moment for the webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if the booking has been updated
          const { data: booking, error } = await supabase
            .from('bookings')
            .select('status, stripe_payment_status')
            .eq('id', bookingId)
            .single();

          if (error) {
            throw error;
          }

          if (booking?.stripe_payment_status === 'succeeded' || booking?.status === 'confirmed') {
            setStatus('success');
            setMessage('Payment successful! Your booking has been confirmed.');
            toast.success('Payment successful!');
            
            // Redirect to booking details after a short delay
            setTimeout(() => {
              navigate(`/bookings/${bookingId}`);
            }, 2000);
          } else {
            // Webhook might not have processed yet, but payment was successful
            setStatus('success');
            setMessage('Payment processing... You will receive a confirmation email shortly.');
            toast.success('Payment submitted successfully!');
            
            setTimeout(() => {
              navigate(`/bookings/${bookingId}`);
            }, 3000);
          }
        } else if (redirectStatus === 'failed') {
          // 3D Secure authentication failed
          setStatus('error');
          setMessage('Payment authentication failed.');
          setErrorDetails('Your bank declined the authentication. Please try again or use a different card.');
          toast.error('Payment authentication failed');
        } else if (redirectStatus === 'canceled') {
          // User canceled 3D Secure authentication
          setStatus('error');
          setMessage('Payment was canceled.');
          setErrorDetails('You canceled the payment verification. Please try again when you\'re ready.');
        } else {
          // Unknown status
          setStatus('error');
          setMessage('Unable to verify payment status.');
          setErrorDetails('Please check your booking status or contact support.');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment.');
        setErrorDetails('Please try again or contact support if the issue persists.');
        toast.error('Payment processing error');
      }
    };

    handlePaymentCallback();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-800 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <p className="text-sm text-gray-500">Redirecting to your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{message}</h2>
          <p className="text-gray-600">{errorDetails}</p>
        </div>
        
        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              const bookingId = searchParams.get('booking_id');
              if (bookingId) {
                navigate(`/payment/${bookingId}`);
              } else {
                navigate('/bookings');
              }
            }}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/bookings')}
          >
            View My Bookings
          </Button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;