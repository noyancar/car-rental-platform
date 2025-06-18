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
  createBooking: (booking: Pick<Booking, 'car_id' | 'user_id' | 'start_date' | 'end_date' | 'total_price' | 'status' | 'pickup_location' | 'return_location' | 'pickup_time' | 'return_time'> & { discount_code_id?: number; payment_intent_id?: string }) => Promise<Booking | null>;
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>;
  calculatePrice: (carId: number, startDate: string, endDate: string, pickupTime?: string, returnTime?: string, discountCodeId?: number) => Promise<number>;
  checkAvailability: (carId: number, startDate: string, endDate: string, pickupTime?: string, returnTime?: string) => Promise<boolean>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
  isCheckingAvailability: false,
  
  checkAvailability: async (carId: number, startDate: string, endDate: string, pickupTime: string = '10:00', returnTime: string = '10:00') => {
    try {
      set({ isCheckingAvailability: true });
      
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No active session for availability check');
        return false;
      }
      
      // Use secure fetch with proper authentication
      const response = await fetch(
        `https://lwhqqhlvmtbcugzasamf.supabase.co/functions/v1/check-car-availability?car_id=${encodeURIComponent(carId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&pickup_time=${encodeURIComponent(pickupTime)}&return_time=${encodeURIComponent(returnTime)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Availability check failed:', response.status, errorText);
        return false;
      }
      
      const result = await response.json();
      return Boolean(result.available);
      
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
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
      const isAvailable = await get().checkAvailability(
        booking.car_id,
        booking.start_date,
        booking.end_date,
        booking.pickup_time,
        booking.return_time
      );
      
      if (!isAvailable) {
        throw new Error('Car is not available for the selected dates');
      }
      
      // Make sure all booking fields are included, yeni alanlar null olabilir
      const bookingData = {
        car_id: booking.car_id,
        user_id: booking.user_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_price: booking.total_price,
        status: booking.status || 'pending', // Default status is pending
        // Yeni eklenen alanlar için null check yapıyoruz
        pickup_location: booking.pickup_location || null,
        return_location: booking.return_location || null,
        pickup_time: booking.pickup_time || null,
        return_time: booking.return_time || null,
        discount_code_id: booking.discount_code_id || null,
        payment_intent_id: booking.payment_intent_id || null
      };
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
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
      set({ error: (error as Error).message });
      return null;
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
  
  calculatePrice: async (carId: number, startDate: string, endDate: string, pickupTime: string = '10:00', returnTime: string = '10:00', discountCodeId?: number) => {
    try {
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('price_per_day')
        .eq('id', carId)
        .single();
      
      if (carError || !car) return 0;
      
      // Tarih ve saat bilgilerini birleştirerek tam tarih oluştur
      const startDateTime = new Date(`${startDate}T${pickupTime}`);
      const endDateTime = new Date(`${endDate}T${returnTime}`);
      
      // Milisaniye cinsinden farkı hesapla
      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      
      // Gün sayısını hesapla (yukarı yuvarlayarak)
      // Eğer teslim saati, alış saatinden daha geç ise bir tam gün daha ekle
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // Fiyat hesaplama
      let price = car.price_per_day * diffDays;
      
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