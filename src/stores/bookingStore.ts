import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Booking } from '../types';
import { useLocationStore } from './locationStore';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
  isCheckingAvailability: boolean;
  
  fetchUserBookings: () => Promise<void>;
  fetchBookingById: (id: number) => Promise<void>;
  createBooking: (booking: Pick<Booking, 'car_id' | 'user_id' | 'start_date' | 'end_date' | 'total_price' | 'status' | 'pickup_time' | 'return_time'> & { discount_code_id?: number; pickup_location?: string; return_location?: string }) => Promise<Booking | null>;
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>;
  calculatePrice: (carId: number, startDate: string, endDate: string, pickupTime?: string, returnTime?: string, discountCodeId?: number) => Promise<number>;
  checkAvailability: (carId: number, startDate: string, endDate: string, pickupTime?: string, returnTime?: string) => Promise<boolean>;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
  isCheckingAvailability: false,
  
  checkAvailability: async (carId: number, startDate: string, endDate: string, pickupTime: string = '10:00', returnTime: string = '10:00') => {
    try {
      set({ isCheckingAvailability: true });
      
      // Get current session but don't require it
      const { data: { session } } = await supabase.auth.getSession();
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Use session token if available, otherwise use anon key
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Use the anon key for anonymous users
        headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
      }
      
      // Use secure fetch with proper authentication
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-car-availability?car_id=${encodeURIComponent(carId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&pickup_time=${encodeURIComponent(pickupTime)}&return_time=${encodeURIComponent(returnTime)}`,
        {
          method: 'GET',
          headers,
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
      console.log('Current user:', user);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          booking_extras (
            *,
            extra:extras (*)
          )
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
          cars (*),
          booking_extras (
            *,
            extra:extras (*)
          )
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
      
      // Get location IDs from location values
      const locationStore = useLocationStore.getState();
      let pickup_location_id = null;
      let return_location_id = null;
      
      // Ensure locations are loaded
      if (locationStore.locations.length === 0) {
        await locationStore.fetchLocations();
      }
      
      // Get location IDs from values
      if (booking.pickup_location) {
        const pickupLocation = locationStore.locations.find(loc => loc.value === booking.pickup_location);
        if (pickupLocation) {
          pickup_location_id = pickupLocation.id;
        }
      }
      
      if (booking.return_location) {
        const returnLocation = locationStore.locations.find(loc => loc.value === booking.return_location);
        if (returnLocation) {
          return_location_id = returnLocation.id;
        }
      }
      
      // Calculate expiry time for draft bookings (30 minutes from now)
      const expiresAt = booking.status === 'draft' 
        ? new Date(Date.now() + 30 * 60 * 1000).toISOString() 
        : null;
      
      // Make sure all booking fields are included - only use location IDs
      const bookingData = {
        car_id: booking.car_id,
        user_id: booking.user_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_price: booking.total_price,
        status: booking.status || 'draft', // Default to draft
        pickup_location_id: pickup_location_id,
        return_location_id: return_location_id,
        pickup_time: booking.pickup_time || null,
        return_time: booking.return_time || null,
        discount_code_id: booking.discount_code_id || null,
        expires_at: expiresAt
      };
      
      console.log('Creating booking with data:', bookingData);
      
      // First insert the booking
      const { data: insertedBooking, error: insertError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      // Then fetch it with relations
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*)
        `)
        .eq('id', insertedBooking.id)
        .single();
      
      if (error) throw error;
      
      const newBooking = {
        ...data,
        car: data.cars,
      };
      
      set(state => ({ bookings: [newBooking, ...state.bookings] }));
      return newBooking;
    } catch (error) {
      console.error('Create booking error:', error);
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