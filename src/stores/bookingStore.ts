import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Booking } from '../types';
import { useLocationStore } from './locationStore';
import { calculateRentalDuration } from '../utils/bookingPriceCalculations';
import { filterActiveBookings } from '../utils/bookingHelpers';

interface DiscountCodeValidationResult {
  valid: boolean;
  message: string;
  data?: {
    id: string;
    code: string;
    discount_percentage: number;
  };
}

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
  isCheckingAvailability: boolean;

  fetchUserBookings: () => Promise<void>;
  fetchBookingById: (id: string) => Promise<void>;
  createBooking: (booking: Pick<Booking, 'car_id' | 'user_id' | 'start_date' | 'end_date' | 'total_price' | 'status' | 'pickup_time' | 'return_time'> & {
    discount_code_id?: string;
    pickup_location?: string;
    return_location?: string;
    car_rental_subtotal?: number;
    pickup_delivery_fee?: number;
    return_delivery_fee?: number;
  }) => Promise<Booking | null>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  calculatePrice: (carId: string, startDate: string, endDate: string, pickupTime?: string, returnTime?: string, discountCodeId?: string) => Promise<number>;
  checkAvailability: (carId: string, startDate: string, endDate: string, pickupTime?: string, returnTime?: string) => Promise<boolean>;
  validateDiscountCode: (code: string) => Promise<DiscountCodeValidationResult>;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
  isCheckingAvailability: false,
  
  checkAvailability: async (carId: string, startDate: string, endDate: string, pickupTime: string = '10:00', returnTime: string = '10:00') => {
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

      // Filter out expired draft bookings before setting state
      const activeBookings = filterActiveBookings(bookings);

      set({ bookings: activeBookings });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchBookingById: async (id: string) => {
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
          ),
          pickup_location:locations!bookings_pickup_location_id_fkey (*),
          return_location:locations!bookings_return_location_id_fkey (*)
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
        // Add price breakdown fields if provided
        car_rental_subtotal: booking.car_rental_subtotal || 0,
        pickup_delivery_fee: booking.pickup_delivery_fee || 0,
        return_delivery_fee: booking.return_delivery_fee || 0,
        expires_at: expiresAt
      };
      
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
  
  updateBookingStatus: async (id: string, status: Booking['status']) => {
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
  
  calculatePrice: async (carId: string, startDate: string, endDate: string, pickupTime: string = '10:00', returnTime: string = '10:00', discountCodeId?: string) => {
    try {
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('price_per_day')
        .eq('id', carId)
        .single();

      if (carError || !car) return 0;

      // Calculate rental duration
      const rentalDays = calculateRentalDuration(startDate, endDate, pickupTime, returnTime);

      // Fiyat hesaplama
      let price = car.price_per_day * rentalDays;

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

  validateDiscountCode: async (code: string): Promise<DiscountCodeValidationResult> => {
    try {
      const trimmedCode = code.trim();

      if (!trimmedCode) {
        return {
          valid: false,
          message: 'Please enter a discount code'
        };
      }

      // Check if environment variables are set
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables');
        return {
          valid: false,
          message: 'Configuration error. Please contact support.'
        };
      }

      // Call Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-discount-code?code=${encodeURIComponent(trimmedCode)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Discount validation failed:', response.status, errorText);

        // Better error message based on status code
        if (response.status >= 500) {
          return {
            valid: false,
            message: 'Server error. Please try again later.'
          };
        }

        return {
          valid: false,
          message: 'Unable to validate discount code. Please try again.'
        };
      }

      const result = await response.json();

      // Validate response structure
      if (typeof result.valid !== 'boolean' || !result.message) {
        console.error('Invalid response from discount validation:', result);
        return {
          valid: false,
          message: 'Invalid server response. Please contact support.'
        };
      }

      return result;

    } catch (error) {
      console.error('Error validating discount code:', error);

      // Network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          valid: false,
          message: 'Network error. Please check your connection.'
        };
      }

      return {
        valid: false,
        message: 'Unable to validate discount code. Please try again.'
      };
    }
  },
}));