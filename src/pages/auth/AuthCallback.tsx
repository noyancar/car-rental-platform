import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL hash
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          if (errorCode === 'otp_expired') {
            setError('This sign-in link has expired. Please request a new one.');
          } else if (error === 'access_denied') {
            setError(errorDescription || 'Access was denied. Please try again.');
          } else {
            setError(errorDescription || 'An error occurred during sign in.');
          }
          return;
        }

        // Get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          // Auto-fill profile from Google OAuth metadata if available
          const metadata = session.user.user_metadata;
          if (metadata) {
            const fullName = metadata.full_name || '';
            const firstName = metadata.given_name || fullName.split(' ')[0] || '';
            const lastName = metadata.family_name || fullName.split(' ').slice(1).join(' ') || '';

            // Update profile if we have name data and profile exists
            if (firstName || lastName) {
              await supabase
                .from('profiles')
                .update({
                  first_name: firstName,
                  last_name: lastName
                })
                .eq('id', session.user.id);
            }
          }

          // Check for pending booking FIRST
          const pendingBooking = localStorage.getItem('pendingBooking');
          
          if (pendingBooking) {
            // User was trying to complete a booking
            navigate('/payment/pending');
            return;
          }
          
          // Check if there's a stored redirect URL
          const redirectUrl = localStorage.getItem('authRedirectUrl');
          
          if (redirectUrl) {
            localStorage.removeItem('authRedirectUrl');
            navigate(redirectUrl);
          } else {
            // Default redirect to home
            navigate('/');
          }
        } else {
          // No session, redirect to home and let user sign in via modal
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError('An unexpected error occurred. Please try signing in again.');
      }
    };

    handleCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Sign-in Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                // Close this error and navigate to home
                navigate('/');
                toast.info('Please try signing in again');
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-800 mx-auto mb-4" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 