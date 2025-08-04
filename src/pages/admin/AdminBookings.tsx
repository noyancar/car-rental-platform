import React, { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAdminStore } from '../../stores/adminStore';
import { useLocations } from '../../hooks/useLocations';
import BookingDetailsModal from '../../components/admin/BookingDetailsModal';
import type { Booking } from '../../types';

const AdminBookings: React.FC = () => {
  const { 
    allBookings, 
    loading, 
    error,
    fetchAllBookings,
    updateBookingStatus
  } = useAdminStore();
  
  const { dbLocations } = useLocations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);
  
  useEffect(() => {
    console.log('Admin bookings data:', allBookings);
    console.log('Available locations:', dbLocations);
    if (allBookings.length > 0) {
      console.log('First booking detail:', allBookings[0]);
      console.log('Pickup location data:', allBookings[0].pickup_location);
      console.log('Return location data:', allBookings[0].return_location);
    }
  }, [allBookings, dbLocations]);
  
  const handleStatusChange = async (booking: Booking, newStatus: Booking['status']) => {
    try {
      await updateBookingStatus(booking.id, newStatus);
      toast.success('Booking status updated successfully');
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-error-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-warning-500" />;
    }
  };
  
  const getLocationName = (locationId: string | undefined, locationData?: any) => {
    // First try to use the location data from the booking (joined data)
    if (locationData && locationData.label) {
      return locationData.label;
    }
    
    // Fallback to looking up by ID
    if (!locationId) return 'Not specified';
    const location = dbLocations.find(loc => loc.id === locationId);
    console.log(`Looking for location ${locationId}:`, location);
    return location ? location.label : 'Unknown location';
  };
  
  const filteredBookings = allBookings.filter(booking => {
    const matchesSearch = (
      booking.car?.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.includes(searchTerm)
    );
    
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    
    const matchesDate = !dateFilter || (
      new Date(booking.start_date).toISOString().split('T')[0] === dateFilter
    );
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading bookings: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <h1 className="text-3xl font-display font-bold text-primary-800 mb-8">
          Manage Bookings
        </h1>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={20} />}
            />
            
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              leftIcon={<Filter size={20} />}
            />
          </div>
        </div>
        
        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Booking ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Car</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Dates</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Locations</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-secondary-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-secondary-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4">
                      #{booking.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img 
                          src={booking.car?.image_url} 
                          alt={`${booking.car?.make} ${booking.car?.model}`}
                          className="h-12 w-16 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="font-medium">
                            {booking.car?.make} {booking.car?.model}
                          </div>
                          <div className="text-sm text-secondary-500">
                            {booking.car?.year}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>Start: {new Date(booking.start_date).toLocaleDateString()}</div>
                        <div>End: {new Date(booking.end_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Pickup:</span>
                          <span>{getLocationName(booking.pickup_location_id, booking.pickup_location)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="font-medium">Return:</span>
                          <span>{getLocationName(booking.return_location_id, booking.return_location)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      ${booking.total_price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(booking.status)}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                          booking.status === 'confirmed' ? 'bg-success-50 text-success-500' :
                          booking.status === 'cancelled' ? 'bg-error-50 text-error-500' :
                          booking.status === 'completed' ? 'bg-secondary-100 text-secondary-600' :
                          'bg-warning-50 text-warning-500'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                          leftIcon={<Eye size={16} />}
                        >
                          Details
                        </Button>
                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                          <Select
                            value=""
                            onChange={(e) => handleStatusChange(booking, e.target.value as Booking['status'])}
                            className="w-40"
                            options={[
                              { value: '', label: 'Change Status', disabled: true },
                              ...(booking.status !== 'confirmed' ? [{ value: 'confirmed', label: '✓ Confirm' }] : []),
                              ...(booking.status !== 'cancelled' ? [{ value: 'cancelled', label: '✗ Cancel' }] : []),
                              ...(booking.status === 'confirmed' ? [{ value: 'completed', label: '✓ Complete' }] : []),
                            ].filter(opt => opt.value !== booking.status)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusChange={(bookingId, status) => {
          handleStatusChange(
            allBookings.find(b => b.id === bookingId)!,
            status
          );
        }}
      />
    </div>
  );
};

export default AdminBookings;