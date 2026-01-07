import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car } from '../types';
import { parseDateInLocalTimezone } from '../utils/dateUtils';

interface SearchFilters {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

interface SearchParams {
  location: string;
  pickupLocation?: string;
  returnLocation?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;}

type SortOption = 'price-low-high' | 'price-high-low' | 'name-a-z' | 'name-z-a';

interface SearchState {
  // Search parameters
  searchParams: SearchParams;

  // Additional filters
  filters: SearchFilters;

  // Sorting
  sortBy: SortOption;

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
  setSortBy: (sort: SortOption) => void;
  searchCars: () => Promise<void>;
  applyFilters: () => void;
  applySorting: () => void;
}

// Helper function to get today's date in local timezone
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get tomorrow's date in local timezone
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get next available hour
const getNextAvailableHour = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // If it's past the current hour (e.g., 15:30), go to next hour (16:00)
  // Add 1 hour buffer for booking preparation
  let nextHour = currentMinutes > 0 ? currentHour + 2 : currentHour + 1;
  
  // If it's too late in the day, return tomorrow's first available hour
  if (nextHour >= 22) {
    return '09:00';
  }
  
  return `${nextHour.toString().padStart(2, '0')}:00`;
};

// Default search parameters
const defaultSearchParams: SearchParams = {
  location: 'select location',
  pickupLocation: 'select location',
  returnLocation: 'select location',
  pickupDate: getTodayDate(),
  pickupTime: getNextAvailableHour(),
  returnDate: getTomorrowDate(),
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
  sortBy: 'price-low-high',
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
    const currentParams = get().searchParams;
    const newParams = { ...currentParams, ...params };
    
    // Check if we're selecting today's date
    const today = getTodayDate();
    const isPickupToday = newParams.pickupDate === today;
    const isReturnToday = newParams.returnDate === today;
    
    // Handle pickup time validation for today
    if ((params.pickupTime || params.pickupDate) && isPickupToday) {
      const now = new Date();
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Parse the selected pickup time
      const [pickupHour, pickupMinute] = (newParams.pickupTime || '10:00').split(':').map(Number);
      const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
      
      // If pickup time is in the past (with 1 hour buffer), update it
      if (pickupTimeInMinutes < currentTimeInMinutes + 60) {
        newParams.pickupTime = getNextAvailableHour();
        
        // If same-day rental, ensure return time is after pickup time
        if (newParams.pickupDate === newParams.returnDate) {
          const [returnHour] = (newParams.returnTime || '10:00').split(':').map(Number);
          const newPickupHour = parseInt(newParams.pickupTime.split(':')[0]);
          if (returnHour <= newPickupHour) {
            newParams.returnTime = `${(newPickupHour + 1).toString().padStart(2, '0')}:00`;
          }
        }
      }
    }
    
    // If pickup date is changed, set default return date to next day (but allow same-day)
    if (params.pickupDate && params.pickupDate !== currentParams.pickupDate) {
      const pickupDate = parseDateInLocalTimezone(params.pickupDate);
      const returnDate = parseDateInLocalTimezone(newParams.returnDate);

      // If return date is before new pickup date, set it to next day by default
      if (returnDate < pickupDate) {
        const nextDay = new Date(pickupDate);
        nextDay.setDate(nextDay.getDate() + 1);
        newParams.returnDate = nextDay.toISOString().split('T')[0];
      }
      // If pickup date was changed and no explicit return date was provided, set default to next day
      else if (!params.returnDate) {
        const nextDay = new Date(pickupDate);
        nextDay.setDate(nextDay.getDate() + 1);
        newParams.returnDate = nextDay.toISOString().split('T')[0];
      }
    }

    // If return date is changed, validate based on pickup date
    if (params.returnDate) {
      const pickupDate = parseDateInLocalTimezone(newParams.pickupDate);
      const returnDate = parseDateInLocalTimezone(params.returnDate);

      // Return date must not be before pickup date
      if (returnDate < pickupDate) {
        // Set to same day as pickup (allow same-day rental)
        newParams.returnDate = newParams.pickupDate;
      }
    }
    
    // Validate time for same-day rentals
    if (newParams.pickupDate === newParams.returnDate) {
      const [pickupHour, pickupMinute] = newParams.pickupTime.split(':').map(Number);
      const [returnHour, returnMinute] = newParams.returnTime.split(':').map(Number);
      const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
      const returnTimeInMinutes = returnHour * 60 + returnMinute;
      
      // For same-day rental, return time must be after pickup time
      if (returnTimeInMinutes <= pickupTimeInMinutes) {
        // Set return time to at least 1 hour after pickup
        const newReturnHour = pickupHour + 1;
        if (newReturnHour < 24) {
          newParams.returnTime = `${newReturnHour.toString().padStart(2, '0')}:00`;
        } else {
          // If it would go past midnight, set return to next day
          const nextDay = new Date(newParams.pickupDate);
          nextDay.setDate(nextDay.getDate() + 1);
          newParams.returnDate = nextDay.toISOString().split('T')[0];
          newParams.returnTime = '10:00';
        }
      }
    }
    
    // Ensure pickup date is not in the past
    if (params.pickupDate) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const selectedPickup = parseDateInLocalTimezone(params.pickupDate);
      selectedPickup.setHours(0, 0, 0, 0);

      if (selectedPickup < todayDate) {
        newParams.pickupDate = getTodayDate();
        newParams.returnDate = getTomorrowDate();
        newParams.pickupTime = getNextAvailableHour();
        newParams.returnTime = '10:00';
      }
    }
    
    set({ searchParams: newParams });
  },
  
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().applyFilters();
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().applySorting();
  },
  
  searchCars: async () => {
    try {
      const { searchParams } = get();
      set({ loading: true, error: null });

      // Check if locations are selected
      if (!searchParams.pickupLocation || searchParams.pickupLocation === 'select location' ||
          !searchParams.returnLocation || searchParams.returnLocation === 'select location') {
        throw new Error('Please select pickup and return locations');
      }

      // Get current session but don't require it
      const { data: { session } } = await supabase.auth.getSession();

      // Kullanıcı tarafından seçilen tarihler
      const startDate = searchParams.pickupDate;
      const endDate = searchParams.returnDate;
      const pickupTime = searchParams.pickupTime;
      const returnTime = searchParams.returnTime;

      // Step 1: Fetch ALL active cars
      const { data: allCars, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .eq('available', true)
        .order('price_per_day', { ascending: true });

      if (carsError) {
        throw new Error('Failed to fetch cars');
      }

      if (!allCars || allCars.length === 0) {
        set({
          searchResults: [],
          filteredResults: [],
          isSearchPerformed: true,
        });
        return;
      }

      // Step 2: Check availability for each car
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
      }

      // Check availability for all cars in parallel
      const carsWithAvailability = await Promise.all(
        allCars.map(async (car) => {
          try {
            const queryParams = new URLSearchParams({
              start_date: startDate,
              end_date: endDate,
              pickup_time: pickupTime,
              return_time: returnTime,
              car_id: car.id
            });

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-car-availability?${queryParams.toString()}`,
              {
                method: 'GET',
                headers,
              }
            );

            if (response.ok) {
              const result = await response.json();
              // When checking individual car, edge function returns { available: boolean }
              const isAvailable = result.available === true;
              return { ...car, isAvailableForDates: isAvailable };
            } else {
              // If check fails, mark as unavailable
              return { ...car, isAvailableForDates: false };
            }
          } catch (error) {
            console.error(`Error checking availability for car ${car.id}:`, error);
            return { ...car, isAvailableForDates: false };
          }
        })
      );

      set({
        searchResults: carsWithAvailability,
        filteredResults: carsWithAvailability,
        isSearchPerformed: true,
      });

      // Apply sorting after setting results (default: price-low-high)
      get().applySorting();
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
    // Apply sorting after filtering
    get().applySorting();
  },

  applySorting: () => {
    const { filteredResults, sortBy } = get();

    let sorted = [...filteredResults];

    switch (sortBy) {
      case 'price-low-high':
        sorted.sort((a, b) => a.price_per_day - b.price_per_day);
        break;
      case 'price-high-low':
        sorted.sort((a, b) => b.price_per_day - a.price_per_day);
        break;
      case 'name-a-z':
        sorted.sort((a, b) => {
          const nameA = `${a.make} ${a.model}`.toLowerCase();
          const nameB = `${b.make} ${b.model}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'name-z-a':
        sorted.sort((a, b) => {
          const nameA = `${a.make} ${a.model}`.toLowerCase();
          const nameB = `${b.make} ${b.model}`.toLowerCase();
          return nameB.localeCompare(nameA);
        });
        break;
    }

    set({ filteredResults: sorted });
  }
})); 