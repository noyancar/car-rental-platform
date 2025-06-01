import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Booking } from '../types';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
  isCheckingAvailability: boolean;
  
  fetchUserBookings: () => Promise<void>;
  fetchBookingById: (id: number) => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id'>) => Promise<Booking | null>;
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>;
  calculatePrice: (carId: number, startDate: string, endDate: string, discountCodeId?: number) => Promise<number>;
  checkAvailability: (carId: number, startDate: string, endDate: string) => Promise<{ available: boolean; message: string; conflictingBookings?: number }>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
  isCheckingAvailability: false,
  
  checkAvailability: async (carId: number, startDate: string, endDate: string) => {
    try {
      set({ isCheckingAvailability: true });
      
      // First check if car exists and is available
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('available')
        .eq('id', carId)
        .single();
      
      if (carError || !car) {
        return { available: false, message: 'Car not found' };
      }
      
      if (!car.available) {
        return { available: false, message: 'Car is currently unavailable' };
      }
      
      // Check for overlapping bookings
      const { data: overlappingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, start_date, end_date')
        .eq('car_id', carId)
        .neq('status', 'cancelled')
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
      
      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
        return { available: false, message: 'Error checking availability' };
      }
      
      const available = !overlappingBookings || overlappingBookings.length === 0;
      
      return {
        available,
        message: available 
          ? 'Car is available for selected dates' 
          : `Car is already booked for ${overlappingBookings.length} overlapping period(s)`,
        conflictingBookings: overlappingBookings?.length || 0
      };
      
    } catch (error) {
      console.error('Availability check error:', error);
      return { available: false, message: 'Error checking availability' };
    } finally {
      set({ isCheckingAvailability: false });
    }
  },
  
  fetchUserBookings: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const bookings = data.map(booking => ({
        ...booking,
        car: booking.cars,
      }));
      
      set({ bookings });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchBookingById: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const booking = {
        ...data,
        car: data.cars,
      };
      
      set({ currentBooking: booking });
    } catch (error) {
      set({ error: (error as Error).message });
      set({ currentBooking: null });
    } finally {
      set({ loading: false });
    }
  },
  
  createBooking: async (booking) => {
    try {
      set({ loading: true, error: null });
      
      // Check availability before creating booking
      const availabilityCheck = await get().checkAvailability(
        booking.car_id,
        booking.start_date,
        booking.end_date
      );
      
      if (!availabilityCheck.available) {
        throw new Error(availabilityCheck.message);
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select(`
          *,
          cars (*)
        `)
        .single();
      
      if (error) throw error;
      
      const newBooking = {
        ...data,
        car: data.cars,
      };
      
      set(state => ({ bookings: [newBooking, ...state.bookings] }));
      return newBooking;
    } catch (error) {
      let errorMessage = 'An error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('overlapping')) {
          errorMessage = 'This car is already booked for the selected dates';
        } else if (error.message.includes('not found')) {
          errorMessage = 'The selected car is no longer available';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'This car is currently unavailable for booking';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },
  
  updateBookingStatus: async (id: number, status: Booking['status']) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === id ? { ...booking, status } : booking
        ),
        currentBooking: state.currentBooking?.id === id
          ? { ...state.currentBooking, status }
          : state.currentBooking
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  calculatePrice: async (carId: number, startDate: string, endDate: string, discountCodeId?: number) => {
    try {
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('price_per_day')
        .eq('id', carId)
        .single();
      
      if (carError || !car) return 0;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      let price = car.price_per_day * days;
      
      if (discountCodeId) {
        const { data: discount, error: discountError } = await supabase
          .from('discount_codes')
          .select('discount_percentage')
          .eq('id', discountCodeId)
          .single();
        
        if (!discountError && discount) {
          price = price * (1 - discount.discount_percentage / 100);
        }
      }
      
      return price;
    } catch (error) {
      console.error('Error calculating price:', error);
      return 0;
    }
  },
}));