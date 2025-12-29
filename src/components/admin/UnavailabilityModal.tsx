import React, { useState } from 'react';
import { X, Lock, Trash2, Calendar, Clock, Car as CarIcon, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '../ui/Button';
import { useAdminStore } from '../../stores/adminStore';
import type { Car, CarUnavailability } from '../../types';
import { toast } from 'sonner';

interface UnavailabilityModalProps {
  unavailability: CarUnavailability | null; // null = creating new
  cars: Car[];
  preselectedCar?: Car | null;
  preselectedDate?: Date | null;
  onClose: () => void;
  onSave: () => void;
  onDelete?: (id: string) => void;
}

const REASON_PRESETS = [
  'Turo Booking',
  'Maintenance',
  'Personal Use',
  'Cleaning',
  'Inspection',
  'Other Platform Booking',
];

const UnavailabilityModal: React.FC<UnavailabilityModalProps> = ({
  unavailability,
  cars,
  preselectedCar,
  preselectedDate,
  onClose,
  onSave,
  onDelete,
}) => {
  const { addCarUnavailability, updateCarUnavailability } = useAdminStore();

  const isEditing = !!unavailability;

  // Form state - same structure as bookings (start_date, end_date, start_time, end_time)
  const [carId, setCarId] = useState<string>(
    unavailability?.car_id || preselectedCar?.id || ''
  );
  const [startDate, setStartDate] = useState<string>(
    unavailability?.start_date ||
    (preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
  );
  const [startTime, setStartTime] = useState<string>(
    unavailability?.start_time || '10:00'
  );
  const [endDate, setEndDate] = useState<string>(
    unavailability?.end_date ||
    (preselectedDate ? format(addDays(preselectedDate, 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  );
  const [endTime, setEndTime] = useState<string>(
    unavailability?.end_time || '10:00'
  );
  const [reason, setReason] = useState<string>(unavailability?.reason || '');
  const [notes, setNotes] = useState<string>(unavailability?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!carId) {
      newErrors.carId = 'Please select a vehicle';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Please enter a reason';
    }

    // Check that end is after start
    if (startDate && endDate) {
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after start date';
      } else if (startDate === endDate && endTime <= startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isEditing && unavailability) {
        // Update existing
        const success = await updateCarUnavailability(unavailability.id, {
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
          reason: reason || undefined,
          notes: notes || undefined,
        });

        if (success) {
          toast.success('Block updated successfully');
          onSave();
        } else {
          toast.error('Failed to update block');
        }
      } else {
        // Create new
        const result = await addCarUnavailability({
          car_id: carId,
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
          reason: reason || undefined,
          notes: notes || undefined,
        });

        if (result) {
          toast.success('Block created successfully');
          onSave();
        } else {
          toast.error('Failed to create block');
        }
      }
    } catch (error) {
      console.error('Error saving unavailability:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected car info
  const selectedCar = cars.find(c => c.id === carId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Block' : 'Block Dates'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Update the blocked period' : 'Block this car for selected dates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CarIcon className="w-4 h-4 inline mr-1" />
              Vehicle *
            </label>
            <select
              value={carId}
              onChange={(e) => {
                setCarId(e.target.value);
                if (errors.carId) {
                  setErrors(prev => ({ ...prev, carId: '' }));
                }
              }}
              disabled={isEditing}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.carId ? 'border-red-500' : 'border-gray-300'
              } ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Select a vehicle</option>
              {cars.filter(c => c.available).map((car) => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model} {car.year} {car.license_plate ? `(${car.license_plate})` : ''}
                </option>
              ))}
            </select>
            {errors.carId && (
              <p className="text-red-500 text-sm mt-1">{errors.carId}</p>
            )}
          </div>

          {/* Selected Car Preview */}
          {selectedCar && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {selectedCar.image_urls?.[0] || selectedCar.image_url ? (
                <img
                  src={selectedCar.image_urls?.[selectedCar.main_image_index || 0] || selectedCar.image_url}
                  alt={`${selectedCar.make} ${selectedCar.model}`}
                  className="w-16 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <CarIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {selectedCar.make} {selectedCar.model}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedCar.year} • {selectedCar.license_plate || 'No plate'}
                </p>
              </div>
            </div>
          )}

          {/* Date/Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate) {
                    setErrors(prev => ({ ...prev, startDate: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value;
                  setStartTime(newStartTime);
                  // If same day and end time is before or equal to new start time, adjust end time
                  if (startDate === endDate && endTime <= newStartTime) {
                    const [hours, minutes] = newStartTime.split(':').map(Number);
                    const newEndHours = Math.min(hours + 1, 23);
                    setEndTime(`${String(newEndHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) {
                    setErrors(prev => ({ ...prev, endDate: '' }));
                  }
                }}
                min={startDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (errors.endTime) {
                    setErrors(prev => ({ ...prev, endTime: '' }));
                  }
                }}
                min={startDate === endDate ? startTime : undefined}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {startDate === endDate && (
                <p className="text-gray-500 text-xs mt-1">Must be after {startTime}</p>
              )}
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) {
                  setErrors(prev => ({ ...prev, reason: '' }));
                }
              }}
              placeholder="e.g., Turo Booking, Maintenance"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Quick Reason Buttons */}
          <div className="flex flex-wrap gap-2">
            {REASON_PRESETS.slice(0, 4).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setReason(preset);
                  if (errors.reason) {
                    setErrors(prev => ({ ...prev, reason: '' }));
                  }
                }}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  reason === preset
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Blocked dates will make this vehicle unavailable for customer bookings during the specified period.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            {isEditing && onDelete ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onDelete(unavailability!.id)}
                leftIcon={<Trash2 size={16} />}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Block' : 'Create Block'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnavailabilityModal;
