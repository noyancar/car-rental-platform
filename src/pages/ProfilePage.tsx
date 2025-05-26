import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, FileText } from 'lucide-react';
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
    address: user?.address || '',
    license_number: user?.license_number || '',
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        license_number: user.license_number || '',
      });
    }
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-primary-800 text-white">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-800" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-semibold">My Profile</h1>
                  <p className="text-primary-100">{user.email}</p>
                </div>
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-error-50 text-error-500 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  leftIcon={<User size={20} />}
                  placeholder="John"
                />
                
                <Input
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  leftIcon={<User size={20} />}
                  placeholder="Doe"
                />
                
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  leftIcon={<Phone size={20} />}
                  placeholder="+1 (123) 456-7890"
                  type="tel"
                />
                
                <Input
                  label="Driver's License Number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  leftIcon={<FileText size={20} />}
                  placeholder="DL12345678"
                />
                
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    leftIcon={<MapPin size={20} />}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  fullWidth
                >
                  Save Changes
                </Button>
              </div>
            </form>
            
            {/* Account Info */}
            <div className="border-t border-secondary-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="flex items-center text-secondary-600">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>Email: {user.email}</span>
                </div>
                <div className="flex items-center text-secondary-600">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <span>Account Type: Standard</span>
                </div>
                <div className="flex items-center text-secondary-600">
                  <FileText className="h-5 w-5 mr-2" />
                  <span>Member Since: {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
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