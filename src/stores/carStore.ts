import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car } from '../types';

interface CarFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  make?: string;
  available?: boolean;
}

interface CarState {
  cars: Car[];
  featuredCars: Car[];
  currentCar: Car | null;
  loading: boolean;
  error: string | null;
  filters: CarFilters;
  isCheckingAvailability: boolean;
  
  fetchCars: (filters?: CarFilters) => Promise<void>;
  fetchFeaturedCars: () => Promise<void>;
  fetchCarById: (id: number) => Promise<void>;
  setFilters: (filters: CarFilters) => Promise<void>;
  clearFilters: () => void;
  fetchAvailableCars: (pickupDate: string, pickupTime: string, returnDate: string, returnTime: string) => Promise<void>;
  checkSingleCarAvailability: (carId: number, pickupDate: string, pickupTime: string, returnDate: string, returnTime: string) => Promise<boolean>;
}

export const useCarStore = create<CarState>((set, get) => ({
  cars: [],
  featuredCars: [],
  currentCar: null,
  loading: false,
  error: null,
  filters: {},
  isCheckingAvailability: false,
  
  fetchCars: async (filters) => {
    try {
      set({ loading: true, error: null });
      
      let query = supabase
        .from('cars')
        .select('*');
      
      const activeFilters = filters || get().filters;
      
      if (activeFilters.category) {
        query = query.eq('category', activeFilters.category);
      }
      
      if (activeFilters.make) {
        query = query.eq('make', activeFilters.make);
      }
      
      if (activeFilters.available !== undefined) {
        query = query.eq('available', activeFilters.available);
      }
      
      if (activeFilters.priceMin !== undefined) {
        query = query.gte('price_per_day', activeFilters.priceMin);
      }
      
      if (activeFilters.priceMax !== undefined) {
        query = query.lte('price_per_day', activeFilters.priceMax);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ cars: data as Car[] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchFeaturedCars: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      
      set({ featuredCars: data as Car[] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchCarById: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ currentCar: data as Car });
    } catch (error) {
      set({ error: (error as Error).message });
      set({ currentCar: null });
    } finally {
      set({ loading: false });
    }
  },
  
  setFilters: async (filters: CarFilters) => {
    set({ filters: { ...get().filters, ...filters } });
    await get().fetchCars(filters);
  },
  
  clearFilters: () => {
    set({ filters: {} });
    get().fetchCars({});
  },

  fetchAvailableCars: async (pickupDate: string, pickupTime: string, returnDate: string, returnTime: string) => {
    try {
      set({ loading: true, error: null });
      
      // First get all cars
      const { data: allCars, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .eq('available', true);
      
      if (carsError) throw carsError;

      // Check availability for each car
      const availabilityChecks = await Promise.all(
        allCars.map(async (car) => {
          const isAvailable = await get().checkSingleCarAvailability(
            car.id,
            pickupDate,
            pickupTime,
            returnDate,
            returnTime
          );
          return { ...car, isAvailable };
        })
      );
      
      // Filter only available cars
      const availableCars = availabilityChecks.filter(car => car.isAvailable);
      
      set({ cars: availableCars });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  checkSingleCarAvailability: async (carId: number, pickupDate: string, pickupTime: string, returnDate: string, returnTime: string): Promise<boolean> => {
    try {
      set({ isCheckingAvailability: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return false;

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/check-car-availability?` + 
        `car_id=${carId}&` +
        `start_date=${pickupDate}&` +
        `pickup_time=${pickupTime}&` +
        `end_date=${returnDate}&` +
        `return_time=${returnTime}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) return false;
      
      const result = await response.json();
      return result.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    } finally {
      set({ isCheckingAvailability: false });
    }
  },
}));