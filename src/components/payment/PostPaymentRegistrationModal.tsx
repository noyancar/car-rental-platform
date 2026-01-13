import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface PostPaymentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestEmail: string;
  guestName: string;
  bookingId: string;
}

export const PostPaymentRegistrationModal: React.FC<PostPaymentRegistrationModalProps> = ({
  isOpen,
  onClose,
  guestEmail,
  guestName,
  bookingId,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuestLink, setShowGuestLink] = useState(false);
  const [guestAccessToken, setGuestAccessToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const fetchGuestToken = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('guest_access_token')
      .eq('id', bookingId)
      .single() as { data: { guest_access_token: string | null } | null };

    if (data?.guest_access_token) {
      setGuestAccessToken(data.guest_access_token);
    }
  };

  const handleContinueAsGuest = async () => {
    await fetchGuestToken();
    setShowGuestLink(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: guestEmail,
        password: password,
        options: {
          data: {
            full_name: guestName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // 2. Update guest booking to link with new user
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          user_id: authData.user.id,
          // Keep customer email for record
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Failed to link booking to user:', updateError);
        // Don't throw - account was created, just couldn't link booking
      }

      toast.success('Account created successfully!');
      onClose();

      // Refresh the page to show logged in state
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600">
            Create an account to track your bookings and enjoy faster checkout
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Pre-filled email (readonly) */}
          <Input
            type="email"
            label="Email"
            value={guestEmail}
            disabled
            className="bg-gray-50"
          />

          {/* Password */}
          <Input
            type="password"
            label="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            disabled={isLoading}
          />

          {/* Confirm Password */}
          <Input
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            disabled={isLoading}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Benefits */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <p className="font-medium text-sm text-blue-900">What you'll get:</p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center">
                <Check size={16} className="mr-2 text-green-600" />
                Track all your bookings in one place
              </li>
              <li className="flex items-center">
                <Check size={16} className="mr-2 text-green-600" />
                Faster checkout for future rentals
              </li>
              <li className="flex items-center">
                <Check size={16} className="mr-2 text-green-600" />
                Manage your profile and preferences
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              Create Account
            </Button>
          </div>

          {!showGuestLink ? (
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
              disabled={isLoading}
            >
              No thanks, continue as guest
            </button>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-sm font-medium text-blue-900 mb-2">View Your Booking Anytime:</p>
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="text-xs text-gray-600 mb-2">Save this link to access your booking:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/bookings/guest?token=${guestAccessToken}`}
                    className="text-xs text-blue-700 bg-gray-50 px-2 py-1 rounded flex-1 border border-gray-200"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/bookings/guest?token=${guestAccessToken}`);
                      toast.success('Link copied!');
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-800 w-full text-center mt-3"
              >
                Close
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
