import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { useAdminStore } from '../../stores/adminStore';
import BookingDetailsModal from '../../components/admin/BookingDetailsModal';
import type { Booking } from '../../types';

const AdminCalendar: React.FC = () => {
  const { allCars, allBookings, fetchAllCars, fetchAllBookings, loading } = useAdminStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchAllCars();
    fetchAllBookings();
  }, [fetchAllCars, fetchAllBookings]);

  // Navigation functions
  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = [];
  let day = startDate;
  
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Get bookings for a specific day and car
  const getBookingsForDayAndCar = (date: Date, carId: string) => {
    return allBookings.filter(booking => {
      if (booking.car_id !== carId || booking.status === 'cancelled') return false;
      
      const startDate = parseISO(booking.start_date);
      const endDate = parseISO(booking.end_date);
      
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  // Color generator for consistent car colors
  const getCarColor = (carId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-orange-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < carId.length; i++) {
      hash = carId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Car Availability Calendar</h1>
        <p className="text-gray-600">View all car bookings and availability at a glance</p>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
              leftIcon={<ChevronLeft size={16} />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
          
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 font-semibold text-sm text-gray-700 bg-gray-50">Car</div>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-sm text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Rows by Car */}
        {allCars.filter(car => car.available).map(car => {
          const carColor = getCarColor(car.id);
          
          return (
            <div key={car.id} className="grid grid-cols-8 border-b">
              {/* Car Name */}
              <div className="p-3 bg-gray-50 text-sm font-medium">
                <div className="truncate">
                  {car.make} {car.model}
                </div>
                <div className="text-xs text-gray-500">{car.license_plate}</div>
              </div>
              
              {/* Week Days */}
              {[0, 1, 2, 3, 4, 5, 6].map(weekIndex => {
                const weekStart = addDays(startDate, weekIndex * 7);
                
                return (
                  <div key={weekIndex} className="grid grid-rows-6">
                    {[0, 1, 2, 3, 4, 5].map(weekRow => {
                      const currentDay = addDays(weekStart, weekRow * 7);
                      const bookings = getBookingsForDayAndCar(currentDay, car.id);
                      const isCurrentMonth = isSameMonth(currentDay, monthStart);
                      const isToday = isSameDay(currentDay, new Date());
                      
                      return (
                        <div
                          key={weekRow}
                          className={`
                            border-r border-b p-1 h-20 relative
                            ${!isCurrentMonth ? 'bg-gray-50' : ''}
                            ${isToday ? 'bg-blue-50' : ''}
                          `}
                        >
                          <div className={`text-xs ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                            {format(currentDay, 'd')}
                          </div>
                          
                          {/* Booking Indicators */}
                          {bookings.map((booking, idx) => (
                            <div
                              key={booking.id}
                              className={`
                                absolute inset-x-1 h-4 rounded-sm cursor-pointer
                                ${carColor} bg-opacity-80 hover:bg-opacity-100
                                transition-opacity
                              `}
                              style={{ top: `${20 + idx * 18}px` }}
                              onClick={() => setSelectedBooking(booking)}
                              title={`${booking.first_name} ${booking.last_name}`}
                            >
                              <span className="text-white text-xs px-1 truncate block">
                                {booking.first_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
            <span className="text-sm">Confirmed Booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 rounded-sm border border-blue-200"></div>
            <span className="text-sm">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 rounded-sm"></div>
            <span className="text-sm">Other Month</span>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={async () => {
            await fetchAllBookings();
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminCalendar;