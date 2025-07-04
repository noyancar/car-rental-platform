import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Car as CarIcon, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { useBookingStore } from '../../stores/bookingStore';

const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentBooking, loading, error, fetchBookingById } = useBookingStore();
  
  useEffect(() => {
    if (id) {
      fetchBookingById(parseInt(id));
    }
  }, [id, fetchBookingById]);
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col justify-center items-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
        <p className="mt-4 text-secondary-600">Loading booking details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center bg-secondary-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-error-500" />
            <h2 className="mt-4 text-2xl font-semibold text-secondary-900">Error Loading Booking</h2>
            <p className="mt-2 text-secondary-600">{error}</p>
            <Link to="/bookings" className="mt-6 inline-block">
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Back to Bookings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!currentBooking) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center bg-secondary-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-error-500" />
            <h2 className="mt-4 text-2xl font-semibold text-secondary-900">Booking Not Found</h2>
            <p className="mt-2 text-secondary-600">The booking you're looking for doesn't exist or has been removed.</p>
            <Link to="/bookings" className="mt-6 inline-block">
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Back to Bookings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success-50 text-success-500';
      case 'cancelled':
        return 'bg-error-50 text-error-500';
      case 'completed':
        return 'bg-secondary-100 text-secondary-600';
      default:
        return 'bg-warning-50 text-warning-500';
    }
  };
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="mb-6">
          <Link to="/bookings" className="inline-flex items-center text-primary-700 hover:text-primary-800">
            <ArrowLeft size={16} className="mr-1" />
            Back to Bookings
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-secondary-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-semibold text-secondary-900">
                  Booking #{currentBooking.id}
                </h1>
                <p className="mt-1 text-secondary-500">
                  Created on {format(new Date(currentBooking.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full ${getStatusColor(currentBooking.status)}`}>
                {currentBooking.status.charAt(0).toUpperCase() + currentBooking.status.slice(1)}
              </div>
            </div>
          </div>
          
          {/* Car Details */}
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CarIcon size={20} className="mr-2" />
              Vehicle Details
            </h2>
            <div className="flex items-start">
              <div className="w-32 h-24 rounded-md overflow-hidden">
                <img 
                  src={
                    currentBooking.car?.image_urls && currentBooking.car.image_urls.length > 0
                      ? currentBooking.car.image_urls[currentBooking.car.main_image_index || 0]
                      : currentBooking.car?.image_url
                  } 
                  alt={`${currentBooking.car?.make} ${currentBooking.car?.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">
                  {currentBooking.car?.year} {currentBooking.car?.make} {currentBooking.car?.model}
                </h3>
                <p className="text-secondary-600 mt-1">
                  Category: {currentBooking.car?.category}
                </p>
                <div className="mt-2">
                  <Link to={`/cars/${currentBooking.car?.id}`}>
                    <Button variant="outline" size="sm">
                      View Car Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking Details */}
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar size={20} className="mr-2" />
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-secondary-600">Rental Period</p>
                <div className="mt-1 flex items-center">
                  <Clock size={16} className="text-secondary-400 mr-1" />
                  <span>
                    {format(new Date(currentBooking.start_date), 'MMM d, yyyy')} - {format(new Date(currentBooking.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-secondary-600">Total Price</p>
                <div className="mt-1 flex items-center">
                  <CreditCard size={16} className="text-secondary-400 mr-1" />
                  <span className="text-xl font-semibold">${currentBooking.total_price}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Status */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard size={20} className="mr-2" />
              Payment Status
            </h2>
            <div className="flex items-center">
              {currentBooking.payment_intent_id ? (
                <>
                  <CheckCircle size={20} className="text-success-500 mr-2" />
                  <div>
                    <p className="font-medium">Payment Completed</p>
                    <p className="text-sm text-secondary-500">
                      Transaction ID: {currentBooking.payment_intent_id}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-error-500 mr-2" />
                  <div>
                    <p className="font-medium">Payment Pending</p>
                    <p className="text-sm text-secondary-500">
                      Please complete the payment to confirm your booking
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;