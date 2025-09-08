import React, { useState } from 'react';
import { Phone, FileText, AlertCircle } from 'lucide-react';
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
    license_number: user?.license_number || '',
    license_state: user?.license_state || '',
    has_valid_license: false,
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

    if (!formData.license_number) {
      toast.error('Driver\'s license number is required');
      return;
    }

    if (!formData.license_state) {
      toast.error('Please select your license state or country');
      return;
    }

    if (!formData.has_valid_license) {
      toast.error('Please confirm you have a valid driver\'s license');
      return;
    }

    try {
      setLoading(true);
      
      
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        license_number: formData.license_number,
        license_state: formData.license_state,
        has_valid_license: formData.has_valid_license,
        license_verified_at: new Date().toISOString(),
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

  // Common US states for Hawaii car rental
  const stateOptions = [
    { value: '', label: 'Select State/Country' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'CA', label: 'California' },
    { value: 'TX', label: 'Texas' },
    { value: 'FL', label: 'Florida' },
    { value: 'NY', label: 'New York' },
    { value: 'WA', label: 'Washington' },
    { value: 'OR', label: 'Oregon' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'NV', label: 'Nevada' },
    { value: 'OTHER_US', label: 'Other US State' },
    { value: 'FOREIGN', label: 'Foreign License' },
  ];

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

        {/* License information - Always show these fields */}
        {!user?.license_number && (
          <Input
            label="Driver's License Number"
            value={formData.license_number}
            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            leftIcon={<FileText size={20} />}
            placeholder="DL12345678"
            required
          />
        )}

        {!user?.license_state && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License State/Country
            </label>
            <select
              value={formData.license_state}
              onChange={(e) => setFormData({ ...formData, license_state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              {stateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Foreign license warning */}
        {formData.license_state === 'FOREIGN' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Foreign licenses may require an International Driving Permit (IDP). 
              Please ensure you have the necessary documentation.
            </p>
          </div>
        )}

        {/* License confirmation - Always show this */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.has_valid_license}
              onChange={(e) => setFormData({ ...formData, has_valid_license: e.target.checked })}
              className="mt-1 mr-3 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              required
            />
            <span className="text-sm text-gray-700">
              I confirm that I have a valid driver's license and I am legally 
              allowed to drive in Hawaii. I understand that I will need to present 
              my physical license at the time of vehicle pickup.
            </span>
          </label>
        </div>

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