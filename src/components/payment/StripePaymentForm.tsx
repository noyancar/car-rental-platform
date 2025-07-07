import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StripePaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
  bookingId: number;
}

export default function StripePaymentForm({ 
  onSuccess, 
  onError, 
  amount, 
  bookingId 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/auth/callback?booking_id=${bookingId}&payment_success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message || 'An error occurred with your payment');
        } else {
          setErrorMessage('An unexpected error occurred. Please try again.');
        }
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded - wait for webhook to update the booking
        // Poll for booking status update (max 10 seconds)
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkBookingStatus = async () => {
          const { data: booking } = await supabase
            .from('bookings')
            .select('stripe_payment_status')
            .eq('id', bookingId)
            .single();
          
          if (booking?.stripe_payment_status === 'succeeded') {
            onSuccess(paymentIntent.id);
            return true;
          }
          
          return false;
        };
        
        const pollInterval = setInterval(async () => {
          attempts++;
          
          const isUpdated = await checkBookingStatus();
          
          if (isUpdated || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            
            if (!isUpdated && attempts >= maxAttempts) {
              // Webhook didn't update in time, but payment was successful
              onSuccess(paymentIntent.id);
            }
          }
        }, 1000);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      onError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Amount</h3>
        <p className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</p>
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        }}
      />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>Your payment information is secure and encrypted.</p>
        <p className="mt-1">Powered by Stripe</p>
      </div>
    </form>
  );
}