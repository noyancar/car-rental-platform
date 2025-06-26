import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, FileText, Calendar, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, loading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    license_number: user?.license_number || '',
    license_expiry: user?.license_expiry || '',
    emergency_contact: user?.emergency_contact || '',
    emergency_phone: user?.emergency_phone || '',
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        license_number: user.license_number || '',
        license_expiry: user.license_expiry || '',
        emergency_contact: user.emergency_contact || '',
        emergency_phone: user.emergency_phone || '',
      });
    }
  }, [user]);
  
  // Calculate profile completion
  const calculateCompletion = () => {
    const requiredFields = ['first_name', 'last_name', 'phone', 'license_number', 'license_expiry'];
    const filledFields = requiredFields.filter(field => formData[field as keyof typeof formData]);
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };
  
  const profileCompletion = calculateCompletion();
  const isProfileComplete = profileCompletion === 100;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name) {
      toast.error('Please enter your full name');
      return;
    }
    
    if (!formData.phone) {
      toast.error('Phone number is required for reservations');
      return;
    }
    
    if (!formData.license_number || !formData.license_expiry) {
      toast.error('Driver\'s license information is required to rent a car');
      return;
    }
    
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center bg-secondary-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-secondary-900">Not Authenticated</h2>
          <p className="mt-2 text-secondary-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          {/* Profile Completion Alert */}
          {!isProfileComplete && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">Complete your profile</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Fill in all required information to make bookings faster. Your profile is {profileCompletion}% complete.
                </p>
                <div className="mt-2 w-full bg-amber-100 rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-primary-800 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                    <User className="h-8 w-8 text-primary-800" />
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-semibold">My Profile</h1>
                    <p className="text-primary-100">{user.email}</p>
                  </div>
                </div>
                {isProfileComplete && (
                  <div className="flex items-center bg-green-600 px-3 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-error-50 text-error-500 rounded-md">
                  {error}
                </div>
              )}
              
              {/* Personal Information */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-700" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  
                  <div className="md:col-span-2">
                    <Input
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      leftIcon={<Phone size={20} />}
                      placeholder="+1 (123) 456-7890"
                      type="tel"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Driver's License */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary-700" />
                  Driver's License
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="License Number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="DL12345678"
                    required
                  />
                  
                  <Input
                    label="Expiry Date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  We need this information to verify your eligibility to rent a vehicle.
                </p>
              </div>
              
              {/* Emergency Contact (Optional) */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary-700" />
                  Emergency Contact
                  <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Contact Name"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Jane Doe"
                  />
                  
                  <Input
                    label="Contact Phone"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                    placeholder="+1 (123) 456-7890"
                    type="tel"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  fullWidth
                  size="lg"
                >
                  Save Changes
                </Button>
              </div>
            </form>
            
            {/* Account Info */}
            <div className="border-t border-secondary-200 p-6 bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-secondary-600">
                  <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center text-secondary-600">
                  <CreditCard className="h-5 w-5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Account Type</p>
                    <p className="text-sm">Standard Member</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;