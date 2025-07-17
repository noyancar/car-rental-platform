import React, { useState } from 'react';
import { X, Mail, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
}

// Google Icon Component
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic-link' | 'forgot-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when modal closes
  const handleClose = () => {
    setMode('signin'); // Always reset to signin
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setMagicLinkSent(false);
    setResetEmailSent(false);
    onClose();
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Store current URL for redirect after OAuth
      const currentPath = window.location.pathname;
      if (currentPath === '/payment/pending') {
        // Already on pending payment page, OAuth will redirect back here
      } else if (currentPath.includes('/payment/')) {
        // On payment page, store it
        localStorage.setItem('authRedirectUrl', currentPath);
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) throw error;
        
        toast.success('Account created! Please check your email to verify.');
        onSuccess?.();
        handleClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast.success('Signed in successfully!');
        onSuccess?.();
        handleClose();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email.');
    } catch (error: any) {
      console.error('Magic link error:', error);
      toast.error(error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      });
      
      if (error) throw error;
      
      setResetEmailSent(true);
      toast.success('Password reset link sent! Check your email.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (mode === 'magic-link') {
      if (magicLinkSent) {
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Check your email!</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setMode('signin');
                setMagicLinkSent(false);
                setEmail('');
              }}
            >
              Back to sign in
            </Button>
          </div>
        );
      }

      return (
        <form onSubmit={handleMagicLink} className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
              Sign in with magic link
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              We'll send you a link to sign in instantly, no password needed.
            </p>
          </div>

          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={loading}
            disabled={loading}
            leftIcon={<Mail size={20} />}
          >
            Send magic link
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-xs sm:text-sm text-primary-700 hover:text-primary-800 underline"
            >
              Back to sign in
            </button>
          </div>
        </form>
      );
    }

    if (mode === 'forgot-password') {
      if (resetEmailSent) {
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Check your email!</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setMode('signin');
                setResetEmailSent(false);
                setEmail('');
              }}
              fullWidth
            >
              Back to sign in
            </Button>
          </div>
        );
      }

      return (
        <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-5">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Reset your password</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <Input
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={loading}
            disabled={loading}
          >
            Send reset link
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-xs sm:text-sm text-primary-700 hover:text-primary-800 underline"
            >
              Back to sign in
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            {mode === 'signin' 
              ? 'Enter your credentials to access your account' 
              : 'Start your journey with NoyanCar today'}
          </p>
        </div>

        {/* Social Login */}
        <div>
          <Button
            type="button"
            variant="outline"
            fullWidth
            size="lg"
            onClick={handleGoogleLogin}
            leftIcon={<GoogleIcon />}
            disabled={loading}
            className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Continue with Google
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-3 sm:px-4 bg-white text-gray-500 uppercase tracking-wider">Or continue with</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailPassword} className="space-y-3">
          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full"
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none mt-[13px]"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={loading}
            disabled={loading}
            className="!mt-4"
          >
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        {/* Alternative Actions */}
        <div className="space-y-2 sm:space-y-3 text-center">
          {mode === 'signin' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot-password');
                  setShowPassword(false);
                }}
                className="text-xs sm:text-sm text-primary-700 hover:text-primary-800 font-medium block w-full"
              >
                Forgot your password?
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('magic-link');
                  setShowPassword(false);
                }}
                className="text-xs sm:text-sm text-primary-700 hover:text-primary-800 font-medium block w-full"
              >
                Sign in with magic link
              </button>
            </>
          )}
          
          {mode !== 'signin' && (
            <button
              type="button"
              onClick={() => {
                setMode('magic-link');
                setShowPassword(false);
              }}
              className="text-xs sm:text-sm text-primary-700 hover:text-primary-800 font-medium"
            >
              Sign in with magic link
            </button>
          )}

          <div className="text-xs sm:text-sm text-gray-600">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setShowPassword(false);
                setPassword(''); // Clear password when switching modes
                setEmail(''); // Clear email too for better UX
              }}
              className="text-primary-700 hover:text-primary-800 font-semibold underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={false}>
      <div className="relative bg-white rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md mx-auto">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div className="max-w-sm mx-auto">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal; 