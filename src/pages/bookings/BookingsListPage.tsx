import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { useBookingStore } from '../../stores/bookingStore';

const BookingsListPage: React.FC = () => {
  const { bookings, loading, error, fetchUserBookings } = useBookingStore();
  
  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-success-500';
      case 'cancelled':
        return 'text-error-500';
      case 'completed':
        return 'text-secondary-500';
      default:
        return 'text-warning-500';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading bookings: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold mb-6">My Bookings</h1>
          
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">No bookings found</h2>
              <p className="text-secondary-600 mb-6">
                You haven't made any bookings yet. Start by browsing our available cars.
              </p>
              <Link to="/cars">
                <Button variant="primary">Browse Cars</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="border border-secondary-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Car Image */}
                    <div className="relative h-48 md:h-full">
                      <img 
                        src={booking.car?.image_url} 
                        alt={`${booking.car?.make} ${booking.car?.model}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-white ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Booking Details */}
                    <div className="p-4 md:col-span-3">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {booking.car?.year} {booking.car?.make} {booking.car?.model}
                          </h3>
                          <p className="text-secondary-600">{booking.car?.category}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold">${booking.total_price}</p>
                          <p className="text-secondary-600">Total Price</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center text-secondary-600">
                          <Calendar className="h-5 w-5 mr-2" />
                          <span>
                            {format(new Date(booking.start_date), 'MMM d, yyyy')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-secondary-600">
                          <Clock className="h-5 w-5 mr-2" />
                          <span>
                            {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Link to={`/bookings/${booking.id}`}>
                          <Button variant="outline">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsListPage;