import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
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
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 mb-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              Create an account for a better experience
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Sign up to track all your bookings in one place, save your preferences, and enjoy faster checkout on future rentals.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-white text-primary-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-white hover:bg-white/10 rounded-md font-medium text-sm transition-colors"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </>
  );
};
