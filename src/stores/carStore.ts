import { create } from 'zustand';
import { mockCars } from '../lib/mockData';
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
  
  fetchCars: (filters?: CarFilters) => void;
  fetchFeaturedCars: () => void;
  fetchCarById: (id: number) => void;
  setFilters: (filters: CarFilters) => void;
  clearFilters: () => void;
}

export const useCarStore = create<CarState>((set, get) => ({
  cars: mockCars,
  featuredCars: mockCars.slice(0, 4),
  currentCar: null,
  loading: false,
  error: null,
  filters: {},
  
  fetchCars: (filters) => {
    const activeFilters = filters || get().filters;
    let filteredCars = [...mockCars];
    
    if (activeFilters.category) {
      filteredCars = filteredCars.filter(car => car.category === activeFilters.category);
    }
    
    if (activeFilters.make) {
      filteredCars = filteredCars.filter(car => car.make === activeFilters.make);
    }
    
    if (activeFilters.available !== undefined) {
      filteredCars = filteredCars.filter(car => car.available === activeFilters.available);
    }
    
    if (activeFilters.priceMin !== undefined) {
      filteredCars = filteredCars.filter(car => car.price_per_day >= activeFilters.priceMin!);
    }
    
    if (activeFilters.priceMax !== undefined) {
      filteredCars = filteredCars.filter(car => car.price_per_day <= activeFilters.priceMax!);
    }
    
    set({ cars: filteredCars });
  },
  
  fetchFeaturedCars: () => {
    set({ featuredCars: mockCars.slice(0, 4) });
  },
  
  fetchCarById: (id: number) => {
    const car = mockCars.find(c => c.id === id) || null;
    set({ currentCar: car });
  },
  
  setFilters: (filters: CarFilters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchCars();
  },
  
  clearFilters: () => {
    set({ filters: {} });
    get().fetchCars();
  },
}));