import React from 'react';
import { X, User, Car, MapPin, Calendar, DollarSign, Phone, Mail, CreditCard, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import type { Booking } from '../../types';

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange: (bookingId: string, status: Booking['status']) => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose, onStatusChange }) => {
  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Booking Details</h2>
            <p className="text-gray-500 text-sm mt-1">ID: {booking.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              Created: {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User size={20} />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">{booking.first_name} {booking.last_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium flex items-center gap-1">
                  <Mail size={14} />
                  {booking.email || 'Not provided'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium flex items-center gap-1">
                  <Phone size={14} />
                  {booking.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Car Info */}
          {booking.car && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Car size={20} />
                Vehicle Information
              </h3>
              <div className="flex gap-4">
                <img 
                  src={booking.car.image_url} 
                  alt={`${booking.car.make} ${booking.car.model}`}
                  className="w-32 h-24 object-cover rounded"
                />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-lg">{booking.car.make} {booking.car.model}</p>
                  <p>Year: {booking.car.year}</p>
                  <p>Category: {booking.car.category}</p>
                  <p>Daily Rate: ${booking.car.price_per_day}</p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Details */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar size={20} />
              Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Pickup:</span>
                <p className="font-medium">{format(new Date(booking.start_date), 'MMM d, yyyy')}</p>
                <p className="text-gray-500">{booking.pickup_time}</p>
              </div>
              <div>
                <span className="text-gray-600">Return:</span>
                <p className="font-medium">{format(new Date(booking.end_date), 'MMM d, yyyy')}</p>
                <p className="text-gray-500">{booking.return_time}</p>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin size={20} />
              Locations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Pickup Location:</span>
                <p className="font-medium">
                  {booking.pickup_location?.label || booking.pickup_location_id || 'Not specified'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Return Location:</span>
                <p className="font-medium">
                  {booking.return_location?.label || booking.return_location_id || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign size={20} />
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${booking.subtotal || booking.total_price}</span>
              </div>
              {booking.booking_extras && booking.booking_extras.length > 0 && (
                <div className="space-y-1">
                  <div className="text-gray-600 text-xs mt-2">Additional Services:</div>
                  {booking.booking_extras.map((extra: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="ml-2">• {extra.extras?.name || 'Extra'} (x{extra.quantity})</span>
                      <span>${extra.total_price}</span>
                    </div>
                  ))}
                  {booking.extras_total > 0 && (
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Extras Total:</span>
                      <span>${booking.extras_total}</span>
                    </div>
                  )}
                </div>
              )}
              {booking.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-medium">${booking.delivery_fee}</span>
                </div>
              )}
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-${booking.discount_amount}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${booking.grand_total || booking.total_price}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-gray-500">
                <CreditCard size={16} />
                <span>Payment Status: {booking.stripe_payment_status ? booking.stripe_payment_status.charAt(0).toUpperCase() + booking.stripe_payment_status.slice(1) : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <div className="flex gap-2">
              {booking.status !== 'confirmed' && (
                <Button 
                  variant="primary"
                  onClick={() => {
                    onStatusChange(booking.id, 'confirmed');
                    onClose();
                  }}
                  pixel={{ event: "ConfirmBooking", params: { carId: booking.car_id } }}

                >
                  Confirm Booking
                </Button>
              )}
              <Button 
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this booking?')) {
                    onStatusChange(booking.id, 'cancelled');
                    onClose();
                  }
                }}
                pixel={{ event: "CancelBooking", params: { carId: booking.car_id } }}
              >
                Cancel Booking
              </Button>
              {booking.status === 'confirmed' && (
                <Button 
                  variant="primary"
                  onClick={() => {
                    onStatusChange(booking.id, 'completed');
                    onClose();
                  }}
                  pixel={{ event: "BookingCompleted", params: { carId: booking.car_id } }}
                >
                  Mark as Completed
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;