import React, { useState } from 'react';
import { Mail, User, Phone } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface GuestCheckoutFormProps {
  onSubmit: (data: GuestCheckoutData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface GuestCheckoutData {
  email: string;
  name: string;
  phone?: string;
}

export const GuestCheckoutForm: React.FC<GuestCheckoutFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; name?: string } = {};

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Please enter your full name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    onSubmit({
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
      <p className="text-sm text-gray-600 mb-4">
        We'll send your booking confirmation to this email address.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          placeholder="your@email.com"
          leftIcon={<Mail size={18} />}
          error={errors.email}
          required
          disabled={isLoading}
        />

        <Input
          type="text"
          label="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          placeholder="John Doe"
          leftIcon={<User size={18} />}
          error={errors.name}
          required
          disabled={isLoading}
        />

        <Input
          type="tel"
          label="Phone Number (Optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
          leftIcon={<Phone size={18} />}
          disabled={isLoading}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            Continue to Payment
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          By continuing, you agree to receive booking confirmations via email.
        </p>
      </form>
    </div>
  );
};
