import { create } from 'zustand';
import { mockBookings } from '../lib/mockData';
import type { Booking } from '../types';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
  
  fetchUserBookings: () => Promise<void>;
  fetchBookingById: (id: number) => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id'>) => Promise<Booking | null>;
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>;
  calculatePrice: (carId: number, startDate: string, endDate: string, discountCodeId?: number) => Promise<number>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: mockBookings,
  currentBooking: null,
  loading: false,
  error: null,
  
  fetchUserBookings: async () => {
    set({ bookings: mockBookings });
  },
  
  fetchBookingById: async (id: number) => {
    const booking = mockBookings.find(b => b.id === id) || null;
    set({ currentBooking: booking });
  },
  
  createBooking: async (booking) => {
    const newBooking = {
      ...booking,
      id: mockBookings.length + 1,
      created_at: new Date().toISOString(),
    } as Booking;
    
    mockBookings.push(newBooking);
    set({ bookings: [...mockBookings] });
    return newBooking;
  },
  
  updateBookingStatus: async (id: number, status: Booking['status']) => {
    const updatedBookings = mockBookings.map(booking =>
      booking.id === id ? { ...booking, status } : booking
    );
    set({ bookings: updatedBookings });
    
    if (get().currentBooking?.id === id) {
      set({ currentBooking: { ...get().currentBooking, status } });
    }
  },
  
  calculatePrice: async (carId: number, startDate: string, endDate: string) => {
    const car = mockBookings.find(b => b.car_id === carId)?.car;
    if (!car) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return car.price_per_day * days;
  },
}));