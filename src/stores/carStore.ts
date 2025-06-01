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
      
      // Ensure default values for new fields if they're null
      const carsWithDefaults = data?.map(car => ({
        ...car,
        seats: car.seats ?? 5,
        transmission: car.transmission ?? 'Automatic',
        mileage_type: car.mileage_type ?? 'Unlimited',
        min_rental_hours: car.min_rental_hours ?? 24,
        features: Array.isArray(car.features) ? car.features : []
      })) ?? [];
      
      set({ cars: carsWithDefaults });
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
      
      // Ensure default values for new fields
      const featuredWithDefaults = data?.map(car => ({
        ...car,
        seats: car.seats ?? 5,
        transmission: car.transmission ?? 'Automatic',
        mileage_type: car.mileage_type ?? 'Unlimited',
        min_rental_hours: car.min_rental_hours ?? 24,
        features: Array.isArray(car.features) ? car.features : []
      })) ?? [];
      
      set({ featuredCars: featuredWithDefaults });
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
      
      // Ensure default values for new fields
      const carWithDefaults = data ? {
        ...data,
        seats: data.seats ?? 5,
        transmission: data.transmission ?? 'Automatic',
        mileage_type: data.mileage_type ?? 'Unlimited',
        min_rental_hours: data.min_rental_hours ?? 24,
        features: Array.isArray(data.features) ? data.features : []
      } : null;
      
      set({ currentCar: carWithDefaults });
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