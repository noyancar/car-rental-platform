import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key from environment variable
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('Stripe publishable key is not set in environment variables');
}

// Initialize Stripe
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  locale: 'en',
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorSurface: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '8px',
    },
  },
};

// Helper function to format price for Stripe (converts dollars to cents)
export const formatPriceForStripe = (price: number): number => {
  return Math.round(price * 100);
};

// Helper function to format price from Stripe (converts cents to dollars)
export const formatPriceFromStripe = (price: number): number => {
  return price / 100;
};