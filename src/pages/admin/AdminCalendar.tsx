import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Lock, AlertCircle } from 'lucide-react';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  isSameDay,
  startOfDay,
  endOfDay,
  isToday
} from 'date-fns';
import { Button } from '../../components/ui/Button';
import { useAdminStore } from '../../stores/adminStore';
import BookingDetailsModal from '../../components/admin/BookingDetailsModal';
import UnavailabilityModal from '../../components/admin/UnavailabilityModal';
import type { Booking, CarUnavailability, Car } from '../../types';
import { toast } from 'sonner';

// Number of days to show in the timeline
const DAYS_TO_SHOW = 14;

interface TimelineEvent {
  id: string;
  type: 'booking' | 'unavailability';
  startDate: Date;
  endDate: Date;
  data: Booking | CarUnavailability;
}

const AdminCalendar: React.FC = () => {
  const {
    allCars,
    allBookings,
    carUnavailabilities,
    fetchAllCars,
    fetchAllBookings,
    fetchCarUnavailabilities,
    deleteCarUnavailability,
    loading
  } = useAdminStore();

  // State
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedUnavailability, setSelectedUnavailability] = useState<CarUnavailability | null>(null);
  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);
  const [selectedCarForBlock, setSelectedCarForBlock] = useState<Car | null>(null);
  const [selectedDateForBlock, setSelectedDateForBlock] = useState<Date | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchAllCars();
    fetchAllBookings();
    fetchCarUnavailabilities();
  }, [fetchAllCars, fetchAllBookings, fetchCarUnavailabilities]);

  // Generate array of dates for the timeline
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  }, [startDate]);

  // Navigation functions
  const goToPreviousWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  // Get events for a specific car
  const getEventsForCar = (carId: string): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add bookings - only confirmed ones
    allBookings
      .filter(b => b.car_id === carId && b.status === 'confirmed')
      .forEach(booking => {
        events.push({
          id: booking.id,
          type: 'booking',
          startDate: parseISO(booking.start_date),
          endDate: parseISO(booking.end_date),
          data: booking
        });
      });

    // Add unavailabilities (same structure as bookings now)
    carUnavailabilities
      .filter(u => u.car_id === carId)
      .forEach(unavail => {
        events.push({
          id: unavail.id,
          type: 'unavailability',
          startDate: parseISO(unavail.start_date),
          endDate: parseISO(unavail.end_date),
          data: unavail
        });
      });

    return events;
  };

  // Check if a date is within an event
  const getEventForDate = (events: TimelineEvent[], date: Date): TimelineEvent | null => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return events.find(event => {
      const eventStart = startOfDay(event.startDate);
      const eventEnd = endOfDay(event.endDate);
      return (
        isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(eventStart, { start: dayStart, end: dayEnd })
      );
    }) || null;
  };

  // Check if date is start of an event
  const isEventStart = (event: TimelineEvent, date: Date): boolean => {
    return isSameDay(event.startDate, date);
  };

  // Check if date is end of an event
  const isEventEnd = (event: TimelineEvent, date: Date): boolean => {
    return isSameDay(event.endDate, date);
  };

  // Calculate event span for display
  const getEventSpan = (event: TimelineEvent, date: Date): number => {
    if (!isEventStart(event, date)) return 0;

    let span = 1;
    const endDateIndex = timelineDates.findIndex(d => isSameDay(d, event.endDate));
    const startDateIndex = timelineDates.findIndex(d => isSameDay(d, date));

    if (endDateIndex >= 0 && startDateIndex >= 0) {
      span = Math.min(endDateIndex - startDateIndex + 1, DAYS_TO_SHOW - startDateIndex);
    } else if (endDateIndex < 0) {
      // Event extends beyond visible range
      span = DAYS_TO_SHOW - startDateIndex;
    }

    return Math.max(1, span);
  };

  // Handle cell click - open modal to add block
  const handleCellClick = (car: Car, date: Date) => {
    const events = getEventsForCar(car.id);
    const existingEvent = getEventForDate(events, date);

    if (existingEvent) {
      // Click on existing event
      if (existingEvent.type === 'booking') {
        setSelectedBooking(existingEvent.data as Booking);
      } else {
        setSelectedUnavailability(existingEvent.data as CarUnavailability);
        setShowUnavailabilityModal(true);
      }
    } else {
      // Empty cell - create new block
      setSelectedCarForBlock(car);
      setSelectedDateForBlock(date);
      setSelectedUnavailability(null);
      setShowUnavailabilityModal(true);
    }
  };

  // Handle delete unavailability
  const handleDeleteUnavailability = async (id: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;

    const success = await deleteCarUnavailability(id);
    if (success) {
      toast.success('Block deleted successfully');
      setShowUnavailabilityModal(false);
      setSelectedUnavailability(null);
    } else {
      toast.error('Failed to delete block');
    }
  };

  // Get status color for booking
  const getBookingStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  // Filter to only show available cars
  const availableCars = allCars.filter(car => car.available);

  if (loading && allCars.length === 0) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Car Availability Calendar
        </h1>
        <p className="text-gray-600">
          Manage bookings and block dates for your vehicles (Turo, maintenance, etc.)
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              leftIcon={<ChevronLeft size={16} />}
            >
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              leftIcon={<Calendar size={16} />}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              rightIcon={<ChevronRight size={16} />}
            >
              <span className="hidden sm:inline">Next</span>
            </Button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {format(startDate, 'MMM d')} - {format(addDays(startDate, DAYS_TO_SHOW - 1), 'MMM d, yyyy')}
          </h2>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCarForBlock(null);
              setSelectedDateForBlock(new Date());
              setSelectedUnavailability(null);
              setShowUnavailabilityModal(true);
            }}
            leftIcon={<Plus size={16} />}
          >
            Add Block
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-medium text-gray-700">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-800 rounded"></div>
            <span>Blocked (Turo/Maintenance)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Confirmed Booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
            <span>Weekend</span>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            {/* Header Row - Dates */}
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[180px] border-r">
                  Vehicle
                </th>
                {timelineDates.map((date, index) => {
                  const isCurrentDay = isToday(date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <th
                      key={index}
                      className={`px-1 py-2 text-center min-w-[70px] border-r ${
                        isCurrentDay ? 'bg-blue-50' : isWeekend ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div className="text-xs text-gray-500 uppercase">
                        {format(date, 'EEE')}
                      </div>
                      <div className={`text-sm font-semibold ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                        {format(date, 'd')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(date, 'MMM')}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body - Cars */}
            <tbody>
              {availableCars.length === 0 ? (
                <tr>
                  <td colSpan={DAYS_TO_SHOW + 1} className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No available cars found</p>
                  </td>
                </tr>
              ) : (
                availableCars.map((car) => {
                  const events = getEventsForCar(car.id);
                  const processedDates = new Set<number>(); // Track which dates we've rendered events for

                  return (
                    <tr key={car.id} className="border-b hover:bg-gray-50">
                      {/* Car Info - Sticky */}
                      <td className="sticky left-0 bg-white z-10 px-4 py-3 border-r">
                        <div className="flex items-center gap-3">
                          {car.image_urls?.[0] || car.image_url ? (
                            <img
                              src={car.image_urls?.[car.main_image_index || 0] || car.image_url}
                              alt={`${car.make} ${car.model}`}
                              className="w-12 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">No img</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {car.make} {car.model}
                            </div>
                            <div className="text-xs text-gray-500">
                              {car.year} • {car.license_plate || 'No plate'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date Cells */}
                      {timelineDates.map((date, dateIndex) => {
                        const isCurrentDay = isToday(date);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const event = getEventForDate(events, date);

                        // Check if we already rendered a spanning event that covers this date
                        if (processedDates.has(dateIndex)) {
                          return null; // Skip - covered by colspan
                        }

                        // If there's an event starting on this date, calculate span
                        if (event && isEventStart(event, date)) {
                          const span = getEventSpan(event, date);

                          // Mark these dates as processed
                          for (let i = 0; i < span; i++) {
                            processedDates.add(dateIndex + i);
                          }

                          const isBooking = event.type === 'booking';
                          const booking = isBooking ? event.data as Booking : null;
                          const unavail = !isBooking ? event.data as CarUnavailability : null;

                          return (
                            <td
                              key={dateIndex}
                              colSpan={span}
                              className={`relative p-1 border-r cursor-pointer transition-colors ${
                                isCurrentDay ? 'bg-blue-50' : isWeekend ? 'bg-amber-50' : ''
                              }`}
                              onClick={() => handleCellClick(car, date)}
                            >
                              <div
                                className={`
                                  h-10 rounded-md flex items-center justify-center gap-1 text-white text-xs font-medium
                                  ${isBooking ? getBookingStatusColor(booking?.status || '') : 'bg-gray-800'}
                                  hover:opacity-90 transition-opacity
                                `}
                                title={
                                  isBooking
                                    ? `${booking?.first_name} ${booking?.last_name} - ${booking?.status}`
                                    : `${unavail?.reason || 'Blocked'} - ${unavail?.source}`
                                }
                              >
                                {isBooking ? (
                                  <span className="truncate px-2">
                                    {booking?.first_name || 'Booking'}
                                  </span>
                                ) : (
                                  <>
                                    <Lock size={12} />
                                    <span className="truncate px-1">
                                      {unavail?.reason || 'Blocked'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Event continues from previous (but didn't start today)
                        if (event) {
                          processedDates.add(dateIndex);
                          return null; // Will be handled by colspan from start date
                        }

                        // Empty cell
                        return (
                          <td
                            key={dateIndex}
                            className={`p-1 border-r cursor-pointer transition-colors hover:bg-gray-100 ${
                              isCurrentDay ? 'bg-blue-50 hover:bg-blue-100' : isWeekend ? 'bg-amber-50 hover:bg-amber-100' : ''
                            }`}
                            onClick={() => handleCellClick(car, date)}
                          >
                            <div className="h-10 rounded-md border-2 border-dashed border-transparent hover:border-gray-300 transition-colors" />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

      {/* Unavailability Modal */}
      {showUnavailabilityModal && (
        <UnavailabilityModal
          unavailability={selectedUnavailability}
          cars={allCars}
          preselectedCar={selectedCarForBlock}
          preselectedDate={selectedDateForBlock}
          onClose={() => {
            setShowUnavailabilityModal(false);
            setSelectedUnavailability(null);
            setSelectedCarForBlock(null);
            setSelectedDateForBlock(null);
          }}
          onSave={async () => {
            await fetchCarUnavailabilities();
            setShowUnavailabilityModal(false);
            setSelectedUnavailability(null);
            setSelectedCarForBlock(null);
            setSelectedDateForBlock(null);
          }}
          onDelete={handleDeleteUnavailability}
        />
      )}
    </div>
  );
};

export default AdminCalendar;
