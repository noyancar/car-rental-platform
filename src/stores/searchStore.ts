import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car } from '../types';

interface SearchFilters {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

interface SearchParams {
  location: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

interface SearchState {
  // Search parameters
  searchParams: SearchParams;
  
  // Additional filters
  filters: SearchFilters;
  
  // Results
  searchResults: Car[];
  filteredResults: Car[];
  
  // UI states
  loading: boolean;
  error: string | null;
  isSearchPerformed: boolean;
  
  // Actions
  setSearchParams: (params: SearchParams) => void;
  updateSearchParams: (params: Partial<SearchParams>) => void;
  setFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
  searchCars: () => Promise<void>;
  applyFilters: () => void;
}

// Default search parameters
const defaultSearchParams: SearchParams = {
  location: 'daniel-k-inouye-airport',
  pickupDate: new Date().toISOString().split('T')[0],
  pickupTime: '10:00',
  returnDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  returnTime: '10:00',
};

// Default filters
const defaultFilters: SearchFilters = {
  make: undefined,
  model: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  category: undefined,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  // Initial state
  searchParams: defaultSearchParams,
  filters: defaultFilters,
  searchResults: [],
  filteredResults: [],
  loading: false,
  error: null,
  isSearchPerformed: false,
  
  // Actions
  setSearchParams: (params) => {
    set({ searchParams: params });
  },
  
  updateSearchParams: (params) => {
    set({ searchParams: { ...get().searchParams, ...params } });
  },
  
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().applyFilters();
  },
  
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },
  
  searchCars: async () => {
    try {
      const { searchParams } = get();
      set({ loading: true, error: null });
      
      // Remove authentication requirement - users can search without login
      // Get current session but don't require it
      const { data: { session } } = await supabase.auth.getSession();
      
      // Kullanıcı tarafından seçilen tarihler
      const startDate = searchParams.pickupDate;
      const endDate = searchParams.returnDate;
      const pickupTime = searchParams.pickupTime;
      const returnTime = searchParams.returnTime;
      
      // Edge Function'ı çağır - use anon key if no session
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Use session token if available, otherwise use anon key
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Use the anon key from environment variable
        headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-car-availability?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&pickup_time=${encodeURIComponent(pickupTime)}&return_time=${encodeURIComponent(returnTime)}&include_details=true`,
        {
          method: 'GET',
          headers,
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error searching for cars: ${errorText}`);
      }
      
      const result = await response.json();
      
      // Edge function'dan gelen araçları kullan
      const availableCars = result.cars || [];
      
      set({ 
        searchResults: availableCars,
        filteredResults: availableCars,
        isSearchPerformed: true,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  applyFilters: () => {
    const { searchResults, filters } = get();
    
    let filtered = [...searchResults];
    
    // Apply make filter
    if (filters.make) {
      filtered = filtered.filter(car => car.make === filters.make);
    }
    
    // Apply model filter
    if (filters.model) {
      filtered = filtered.filter(car => car.model === filters.model);
    }
    
    // Apply price range filter
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(car => car.price_per_day >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(car => car.price_per_day <= filters.maxPrice!);
    }
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(car => car.category === filters.category);
    }
    
    set({ filteredResults: filtered });
  }
})); 