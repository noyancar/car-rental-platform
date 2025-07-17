import React, { useState } from 'react';
import { X, MapPin, Phone, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import { Input } from './Input';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quoteData: QuoteRequestData) => void;
  pickupLocation?: string;
  returnLocation?: string;
  pickupDate?: string;
  returnDate?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
  };
}

export interface QuoteRequestData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customPickupAddress: string;
  customReturnAddress: string;
  specialRequests?: string;
}

export function QuoteRequestModal({
  isOpen,
  onClose,
  onSubmit,
  pickupLocation,
  returnLocation,
  pickupDate,
  returnDate,
  carDetails
}: QuoteRequestModalProps) {
  const [formData, setFormData] = useState<QuoteRequestData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customPickupAddress: '',
    customReturnAddress: '',
    specialRequests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof QuoteRequestData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim() || !formData.customerEmail.trim() || !formData.customerPhone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.customPickupAddress.trim() && pickupLocation === 'custom-location') {
      toast.error('Please provide pickup address');
      return;
    }

    if (!formData.customReturnAddress.trim() && returnLocation === 'custom-location') {
      toast.error('Please provide return address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      toast.success('Quote request submitted successfully! We\'ll contact you within 24 hours.');
      onClose();
    } catch (error) {
      toast.error('Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Request Delivery Quote</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Booking Summary */}
          {carDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Booking Summary</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><span className="font-medium">Vehicle:</span> {carDetails.make} {carDetails.model} {carDetails.year}</p>
                {pickupDate && <p><span className="font-medium">Pickup Date:</span> {pickupDate}</p>}
                {returnDate && <p><span className="font-medium">Return Date:</span> {returnDate}</p>}
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your full name"
                required
              />
              
              <Input
                label="Email Address *"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter your email"
                leftIcon={<Mail size={18} />}
                required
              />
              
              <Input
                label="Phone Number *"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Enter your phone number"
                leftIcon={<Phone size={18} />}
                required
              />
            </div>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Location Details</h3>
            <div className="space-y-4">
              {pickupLocation === 'custom-location' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin size={16} className="inline mr-1" />
                    Pickup Address *
                  </label>
                  <textarea
                    value={formData.customPickupAddress}
                    onChange={(e) => handleInputChange('customPickupAddress', e.target.value)}
                    placeholder="Enter complete pickup address with landmarks..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    required
                  />
                </div>
              )}
              
              {returnLocation === 'custom-location' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin size={16} className="inline mr-1" />
                    Return Address *
                  </label>
                  <textarea
                    value={formData.customReturnAddress}
                    onChange={(e) => handleInputChange('customReturnAddress', e.target.value)}
                    placeholder="Enter complete return address with landmarks..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests (Optional)
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any special requirements or requests for delivery..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• We'll review your request and calculate the delivery fee</li>
              <li>• Our team will contact you within 24 hours with a quote</li>
              <li>• Once approved, we'll confirm your booking and payment details</li>
              <li>• Delivery will be scheduled according to your preferred dates</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Send size={18} />}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Submit Quote Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}