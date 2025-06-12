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
      
      // Process the data to ensure image_urls is always an array
      const processedData = data.map(car => {
        // If image_urls is not an array or is empty, create an array with image_url
        if (!Array.isArray(car.image_urls) || car.image_urls.length === 0) {
          car.image_urls = car.image_url ? [car.image_url] : [];
          car.main_image_index = 0;
        }
        
        return car;
      });
      
      set({ cars: processedData as Car[] });
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
      
      // Process the data to ensure image_urls is always an array
      const processedData = data.map(car => {
        // If image_urls is not an array or is empty, create an array with image_url
        if (!Array.isArray(car.image_urls) || car.image_urls.length === 0) {
          car.image_urls = car.image_url ? [car.image_url] : [];
          car.main_image_index = 0;
        }
        
        return car;
      });
      
      set({ featuredCars: processedData as Car[] });
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
      
      // Process the data to ensure valid image data
      if (data) {
        // If image_urls is not an array or is empty, create an array with image_url
        if (!Array.isArray(data.image_urls) || data.image_urls.length === 0) {
          data.image_urls = data.image_url ? [data.image_url] : [];
          data.main_image_index = 0;
        } else {
          // Filter out invalid URLs
          data.image_urls = data.image_urls.filter((url: any) => 
            url && typeof url === 'string' && url.trim() !== ''
          );
        }
        
        // Make sure main_image_index is valid
        if (data.main_image_index === null || 
            data.main_image_index === undefined || 
            data.main_image_index >= data.image_urls.length) {
          data.main_image_index = 0;
        }
        
        // If we still have no images but we have an image_url, use it
        if (data.image_urls.length === 0 && data.image_url) {
          data.image_urls = [data.image_url];
          data.main_image_index = 0;
        }
        
        // Ensure legacy image_url is set to main image
        if (data.image_urls.length > 0) {
          data.image_url = data.image_urls[data.main_image_index];
        }
      }
      
      // Set processed data
      
      set({ currentCar: data as Car });
    } catch (error) {
      console.error('Error fetching car by ID:', error);
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