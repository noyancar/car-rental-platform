import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Eye, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAdminStore } from '../../stores/adminStore';
import { useLocations } from '../../hooks/useLocations';
import BookingDetailsModal from '../../components/admin/BookingDetailsModal';
import { exportMonthlyRevenueCSV } from '../../utils/csvExport';
import type { Booking } from '../../types';
import { isBookingExpired, formatBookingId } from '../../utils/bookingHelpers';

const AdminBookings: React.FC = () => {
  const { 
    allBookings, 
    loading, 
    error,
    fetchAllBookings,
    updateBookingStatus
  } = useAdminStore();
  
  const { dbLocations } = useLocations();
  const [searchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    // Initialize with URL parameter if available
    return searchParams.get('filter') || '';
  });
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  useEffect(() => {
    fetchAllBookings();
  }, []); // Only on mount - simple and clean
  
  
  const handleStatusChange = async (booking: Booking, newStatus: Booking['status']) => {
    try {
      await updateBookingStatus(booking.id, newStatus);
      toast.success('Booking status updated successfully');
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  const handleExportRevenue = () => {
    try {
      const [year, month] = exportMonth.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      // Add customer name to bookings for export
      const bookingsWithCustomerNames = allBookings.map(booking => ({
        ...booking,
        customer_name: booking.first_name && booking.last_name 
          ? `${booking.first_name} ${booking.last_name}` 
          : booking.email || 'Unknown',
        customer_email: booking.email
      }));
      
      exportMonthlyRevenueCSV(bookingsWithCustomerNames, monthDate);
      toast.success('Revenue report exported successfully');
    } catch (error) {
      toast.error('Failed to export revenue report');
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-secondary-600" />;
      case 'draft':
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-warning-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-warning-600" />;
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
    return location ? location.label : 'Unknown location';
  };
  
  const filteredBookings = allBookings.filter(booking => {
    const matchesSearch = (
      booking.car?.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.includes(searchTerm)
    );
    
    // Handle special "active" filter
    let matchesStatus = true;
    if (statusFilter === 'active') {
      // Active bookings: confirmed status and current date is between start and end dates
      if (booking.status !== 'confirmed') {
        matchesStatus = false;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        matchesStatus = today >= startDate && today <= endDate;
      }
    } else if (statusFilter) {
      matchesStatus = booking.status === statusFilter;
    }
    
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
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-800">
            Manage Bookings
          </h1>
          
          {/* Export Controls */}
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <Button
              variant="outline"
              leftIcon={<Download size={20} />}
              onClick={handleExportRevenue}
            >
              Export Revenue
            </Button>
          </div>
        </div>
        
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
                { value: 'active', label: 'Active (Currently Rented)' },
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
                      #{formatBookingId(booking.id)}
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
                      ${booking.grand_total || booking.total_price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(booking.status)}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                          booking.status === 'confirmed' ? 'bg-success-50 text-success-500' :
                          booking.status === 'cancelled' ? 'bg-error-50 text-error-500' :
                          booking.status === 'completed' ? 'bg-secondary-100 text-secondary-600' :
                          (booking.status === 'draft' && isBookingExpired(booking)) ? 'bg-red-50 text-red-600' :
                          'bg-warning-50 text-warning-500'
                        }`}>
                          {booking.status === 'draft' && isBookingExpired(booking)
                            ? 'Draft (Expired)'
                            : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
                          }
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
                          <select
                            value=""
                            onChange={(e) => handleStatusChange(booking, e.target.value as Booking['status'])}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer bg-white"
                          >
                            <option value="" disabled>Change Status</option>
                            {booking.status !== 'confirmed' && <option value="confirmed">✓ Confirm</option>}
                            {booking.status !== 'cancelled' && <option value="cancelled">✗ Cancel</option>}
                            {booking.status === 'confirmed' && <option value="completed">✓ Complete</option>}
                          </select>
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