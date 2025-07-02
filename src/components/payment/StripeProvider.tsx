import { Elements } from '@stripe/react-stripe-js';
import { stripePromise, STRIPE_CONFIG } from '../../lib/stripe';

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
}

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  if (!stripePromise) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Payment system is not configured. Please contact support.</p>
      </div>
    );
  }

  const options = clientSecret
    ? {
        clientSecret,
        appearance: STRIPE_CONFIG.appearance,
      }
    : undefined;

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}