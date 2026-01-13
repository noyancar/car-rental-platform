import React, { useState } from 'react';
import { Gift, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { AuthModal } from '../auth';

interface RegistrationCTABannerProps {
  onDismiss?: () => void;
}

export const RegistrationCTABanner: React.FC<RegistrationCTABannerProps> = ({ onDismiss }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-4 mb-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              Get 10% off your next booking!
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Create an account now and receive a 10% discount code for your next reservation. Plus, easily track all your bookings in one place.
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-primary-700 hover:bg-gray-100"
              >
                Create Account
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/10"
              >
                Continue as Guest
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
      />
    </>
  );
};
