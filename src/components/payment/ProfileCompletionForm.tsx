import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';

interface ProfileCompletionFormProps {
  onComplete: () => void;
}

const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({ onComplete }) => {
  const { user, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.first_name || !formData.last_name) {
      toast.error('Please enter your full name');
      return;
    }

    if (!formData.phone) {
      toast.error('Phone number is required');
      return;
    }

    try {
      setLoading(true);

      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      });
      
      toast.success('Profile updated successfully');
      onComplete();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
        <p className="text-gray-600 text-sm">
          We need a few more details before you can complete your booking.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name fields if missing */}
        {(!user?.first_name || !user?.last_name) && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="John"
              required
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
        )}

        {/* Phone number */}
        {!user?.phone && (
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            leftIcon={<Phone size={20} />}
            placeholder="+1 (808) 555-0123"
            type="tel"
            required
          />
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={loading}
        >
          Save and Continue to Payment
        </Button>
      </form>
    </div>
  );
};

export default ProfileCompletionForm;