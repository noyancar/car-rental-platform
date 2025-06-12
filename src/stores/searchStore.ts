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
  location: 'istanbul-airport',
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
      
      // Format dates for query
      const pickupDateTime = `${searchParams.pickupDate}T${searchParams.pickupTime}:00`;
      const returnDateTime = `${searchParams.returnDate}T${searchParams.returnTime}:00`;
      
      // Query for available cars - daha esnek sorgu yapısı
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('available', true);
      // Henüz available_locations ile filtreleme yapmıyoruz, çünkü bu alan boş olabilir
      
      if (error) throw error;
      
      // Filter out cars with overlapping bookings
      const availableCars = data ? data as Car[] : [];
      
      // Get bookings for these cars
      const carIds = availableCars.map(car => car.id);
      
      if (carIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .in('car_id', carIds)
          .neq('status', 'cancelled');
        
        // Filter out cars with overlapping bookings
        const unavailableCarIds = new Set();
        
        if (bookings) {
          bookings.forEach(booking => {
            const bookingStart = new Date(booking.start_date);
            const bookingEnd = new Date(booking.end_date);
            const requestStart = new Date(pickupDateTime);
            const requestEnd = new Date(returnDateTime);
            
            // Check if booking overlaps with requested period
            if (
              (bookingStart <= requestEnd && bookingEnd >= requestStart) &&
              booking.status === 'confirmed'
            ) {
              unavailableCarIds.add(booking.car_id);
            }
          });
        }
        
        // Filter out unavailable cars
        const filteredCars = availableCars.filter(car => !unavailableCarIds.has(car.id));
        
        set({ 
          searchResults: filteredCars,
          filteredResults: filteredCars,
          isSearchPerformed: true,
        });
      } else {
        set({
          searchResults: [],
          filteredResults: [],
          isSearchPerformed: true,
        });
      }
      
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