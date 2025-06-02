import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car } from '../types';
import { isWithinInterval, parseISO } from 'date-fns';

interface CarFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  make?: string;
  available?: boolean;
  startDate?: string;
  endDate?: string;
}

interface CarState {
  cars: Car[];
  featuredCars: Car[];
  currentCar: Car | null;
  loading: boolean;
  error: string | null;
  filters: CarFilters;
  
  fetchCars: (filters?: CarFilters) => Promise<void>;
  fetchFeaturedCars: () => Promise<void>;
  fetchCarById: (id: number) => Promise<void>;
  setFilters: (filters: CarFilters) => Promise<void>;
  clearFilters: () => void;
}

export const useCarStore = create<CarState>((set, get) => ({
  cars: [],
  featuredCars: [],
  currentCar: null,
  loading: false,
  error: null,
  filters: {},
  
  fetchCars: async (filters) => {
    try {
      set({ loading: true, error: null });
      
      let query = supabase
        .from('cars')
        .select(`
          *,
          bookings (
            start_date,
            end_date,
            status
          )
        `);
      
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

      // Filter out cars with booking conflicts
      const filteredCars = data.map(car => {
        const carData = { ...car };
        delete carData.bookings;
        return carData;
      }).filter(car => {
        if (!activeFilters.startDate || !activeFilters.endDate) {
          return true;
        }

        const selectedStart = parseISO(activeFilters.startDate);
        const selectedEnd = parseISO(activeFilters.endDate);

        // Check for booking conflicts
        const hasConflict = data
          .find(d => d.id === car.id)?.bookings
          ?.some(booking => {
            if (booking.status === 'cancelled') return false;
            
            const bookingStart = parseISO(booking.start_date);
            const bookingEnd = parseISO(booking.end_date);

            // Check for any overlap
            return (
              isWithinInterval(selectedStart, { start: bookingStart, end: bookingEnd }) ||
              isWithinInterval(selectedEnd, { start: bookingStart, end: bookingEnd }) ||
              isWithinInterval(bookingStart, { start: selectedStart, end: selectedEnd }) ||
              isWithinInterval(bookingEnd, { start: selectedStart, end: selectedEnd })
            );
          });

        return !hasConflict;
      });
      
      set({ cars: filteredCars as Car[] });
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
        .select(`
          *,
          bookings (
            start_date,
            end_date,
            status
          )
        `)
        .eq('available', true)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;

      const filteredCars = data.map(car => {
        const carData = { ...car };
        delete carData.bookings;
        return carData;
      });
      
      set({ featuredCars: filteredCars as Car[] });
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
        .select(`
          *,
          bookings (
            start_date,
            end_date,
            status
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;

      const carData = { ...data };
      delete carData.bookings;
      
      set({ currentCar: carData as Car });
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
}));