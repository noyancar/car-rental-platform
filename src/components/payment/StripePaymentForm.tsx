import { useState, useEffect } from 'react';
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
  bookingId: string;
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
  const [processingStage, setProcessingStage] = useState<'payment' | 'verifying'>('payment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Clear error message when user interacts with payment element
  useEffect(() => {
    if (!elements) return;

    const paymentElement = elements.getElement('payment');
    if (!paymentElement) return;

    const handleChange = (event: any) => {
      // Clear error message when user interacts with payment form
      if (errorMessage) {
        setErrorMessage(null);
      }
    };

    const handleFocus = () => {
      // Clear error message when user focuses on payment form
      if (errorMessage) {
        setErrorMessage(null);
      }
    };

    paymentElement.on('change', handleChange);
    paymentElement.on('focus', handleFocus);

    return () => {
      paymentElement.off('change', handleChange);
      paymentElement.off('focus', handleFocus);
    };
  }, [elements, errorMessage]);

  // Warn user before leaving page if they have entered payment info
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if payment hasn't been submitted yet and Stripe is loaded
      if (stripe && elements && !isProcessing && !hasSubmitted) {
        e.preventDefault();
        return true; // Modern approach - browser will show its own message
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stripe, elements, isProcessing, hasSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Prevent double submission
    if (isProcessing || hasSubmitted) {
      return;
    }

    setIsProcessing(true);
    setHasSubmitted(true);
    setErrorMessage(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/callback?booking_id=${bookingId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show user-friendly error messages based on error code
        let userFriendlyMessage = '';
        
        if (error.type === 'card_error') {
          switch (error.code) {
            case 'card_declined':
              userFriendlyMessage = error.decline_code === 'insufficient_funds' 
                ? 'Your card has insufficient funds. Please try another card.'
                : 'Your card was declined. Please try another payment method.';
              break;
            case 'expired_card':
              userFriendlyMessage = 'Your card has expired. Please use a different card.';
              break;
            case 'incorrect_cvc':
              userFriendlyMessage = 'Your card\'s security code is incorrect. Please check and try again.';
              break;
            case 'processing_error':
              userFriendlyMessage = 'We couldn\'t process your card. Please try again or use a different card.';
              break;
            case 'incorrect_number':
              userFriendlyMessage = 'Your card number is incorrect. Please check and try again.';
              break;
            default:
              userFriendlyMessage = error.message || 'Your card was declined. Please try another payment method.';
          }
        } else if (error.type === 'validation_error') {
          userFriendlyMessage = 'Please check your card details and try again.';
        } else if (error.type === 'authentication_error') {
          userFriendlyMessage = 'Payment authentication failed. Please try again or contact your bank.';
        } else {
          userFriendlyMessage = 'Unable to process payment. Please try again in a moment.';
        }
        
        setErrorMessage(userFriendlyMessage);
        onError(userFriendlyMessage);
        setHasSubmitted(false); // Allow retry on error
        setIsProcessing(false); // Close overlay on error
        setProcessingStage('payment'); // Reset stage
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded - change stage to verifying
        setProcessingStage('verifying');

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
            return true;
          }

          return false;
        };

        const pollInterval = setInterval(async () => {
          attempts++;

          const isUpdated = await checkBookingStatus();

          if (isUpdated || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setIsProcessing(false); // Close overlay here
            onSuccess(paymentIntent.id);
          }
        }, 1000);
      }
    } catch (err) {
      // Handle network or unexpected errors
      const errorMsg = 'Connection error. Please check your internet and try again.';
      setErrorMessage(errorMsg);
      onError(errorMsg);
      setHasSubmitted(false); // Allow retry on error
      setIsProcessing(false); // Close overlay on error
      setProcessingStage('payment'); // Reset stage
    }
  };

  return (
    <>
      {/* Payment Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">
              {processingStage === 'payment' ? 'Processing Payment' : 'Verifying Payment'}
            </h3>
            <p className="text-gray-600 text-sm">
              {processingStage === 'payment'
                ? "Please don't close this window..."
                : 'Confirming your booking...'}
            </p>
            <p className="text-gray-500 text-xs mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Amount</h3>
        <p className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</p>
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          business: {
            name: 'NYN Rentals',
          },
        }}
      />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 relative">
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-start gap-3 pr-8">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Payment Error</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              {errorMessage.includes('try again') && (
                <p className="text-xs text-red-600 mt-2">
                  Tip: Double-check your card details or try a different payment method.
                </p>
              )}
            </div>
          </div>
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
    </>
  );
}