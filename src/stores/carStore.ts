import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car, CarWithFeatures, Json } from '../types';
import { createCarWithFeatures } from '../types';

interface CarFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  make?: string;
  available?: boolean;
}

interface CarState {
  cars: CarWithFeatures[];
  featuredCars: CarWithFeatures[];
  currentCar: CarWithFeatures | null;
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
      
      // Transform cars with parsed features
      const carsWithFeatures = (data as Car[]).map(createCarWithFeatures);
      
      set({ cars: carsWithFeatures });
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
      
      // Transform cars with parsed features
      const featuredWithFeatures = (data as Car[]).map(createCarWithFeatures);
      
      set({ featuredCars: featuredWithFeatures });
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
      
      // Transform car with parsed features
      const carWithFeatures = createCarWithFeatures(data as Car);
      
      set({ currentCar: carWithFeatures });
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