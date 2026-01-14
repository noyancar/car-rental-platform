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
  phone: string;
}

type FormErrors = {
  email?: string;
  name?: string;
  phone?: string;
};

// Constants outside component - good practice, not over-engineering
const VALIDATION_RULES = {
  PHONE_MIN_DIGITS: 10,
  NAME_MIN_LENGTH: 2,
} as const;

const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  NAME_REQUIRED: 'Full name is required',
  NAME_TOO_SHORT: 'Please enter your full name',
  PHONE_REQUIRED: 'Phone number is required',
  PHONE_INVALID: 'Please enter a valid phone number (at least 10 digits)',
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email: string): boolean => EMAIL_REGEX.test(email);

const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= VALIDATION_RULES.PHONE_MIN_DIGITS;
};

export const GuestCheckoutForm: React.FC<GuestCheckoutFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = ERROR_MESSAGES.EMAIL_REQUIRED;
    } else if (!validateEmail(email)) {
      newErrors.email = ERROR_MESSAGES.EMAIL_INVALID;
    }

    if (!name.trim()) {
      newErrors.name = ERROR_MESSAGES.NAME_REQUIRED;
    } else if (name.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
      newErrors.name = ERROR_MESSAGES.NAME_TOO_SHORT;
    }

    if (!phone.trim()) {
      newErrors.phone = ERROR_MESSAGES.PHONE_REQUIRED;
    } else if (!validatePhone(phone)) {
      newErrors.phone = ERROR_MESSAGES.PHONE_INVALID;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim(),
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
            clearFieldError('email');
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
            clearFieldError('name');
          }}
          placeholder="John Doe"
          leftIcon={<User size={18} />}
          error={errors.name}
          required
          disabled={isLoading}
        />

        <Input
          type="tel"
          label="Phone Number"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearFieldError('phone');
          }}
          placeholder="+1 (555) 123-4567"
          leftIcon={<Phone size={18} />}
          error={errors.phone}
          required
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
