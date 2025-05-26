import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast.success('Password reset email sent');
    } catch (err) {
      setError((err as Error).message);
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen pt-16 pb-12 flex flex-col justify-center bg-secondary-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-display font-bold text-primary-800">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-secondary-600">
          We'll send you an email with a link to reset your password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded bg-error-50 text-error-500 text-sm">
              {error}
            </div>
          )}
          
          {emailSent ? (
            <div className="text-center">
              <div className="bg-success-50 p-4 rounded-md mb-4">
                <p className="text-success-900">
                  We've sent an email to <strong>{email}</strong> with instructions to reset your password.
                </p>
              </div>
              <p className="text-secondary-600 mb-6">
                If you don't see the email, check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                onClick={() => setEmailSent(false)}
                leftIcon={<ArrowLeft size={16} />}
              >
                Back to Reset Password
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={20} />}
                placeholder="your.email@example.com"
                autoComplete="email"
              />

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                >
                  Send Reset Link
                </Button>
              </div>
              
              <div className="text-center mt-4">
                <Link to="/login" className="text-primary-700 hover:text-primary-600 text-sm">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;