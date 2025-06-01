import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car, CarWithFeatures, Booking, DiscountCode, Campaign } from '../types';
import { createCarWithFeatures } from '../types';

interface AdminState {
  // Cars
  allCars: CarWithFeatures[];
  // Bookings
  allBookings: Booking[];
  // Discount codes
  discountCodes: DiscountCode[];
  // Campaigns
  campaigns: Campaign[];
  
  loading: boolean;
  error: string | null;
  
  // Car management
  fetchAllCars: () => Promise<void>;
  addCar: (car: Omit<Car, 'id' | 'created_at'>) => Promise<void>;
  updateCar: (id: number, car: Partial<Car>) => Promise<void>;
  toggleCarAvailability: (id: number, available: boolean) => Promise<void>;
  
  // Booking management
  fetchAllBookings: () => Promise<void>;
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>;
  
  // Discount code management
  fetchDiscountCodes: () => Promise<void>;
  addDiscountCode: (code: Omit<DiscountCode, 'id' | 'created_at' | 'current_uses'>) => Promise<void>;
  updateDiscountCode: (id: number, code: Partial<DiscountCode>) => Promise<void>;
  toggleDiscountCodeStatus: (id: number, active: boolean) => Promise<void>;
  
  // Campaign management
  fetchCampaigns: () => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'created_at'>) => Promise<void>;
  updateCampaign: (id: number, campaign: Partial<Campaign>) => Promise<void>;
  toggleCampaignStatus: (id: number, active: boolean) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  allCars: [],
  allBookings: [],
  discountCodes: [],
  campaigns: [],
  loading: false,
  error: null,
  
  // Car management
  fetchAllCars: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform cars with parsed features
      const carsWithFeatures = (data as Car[]).map(createCarWithFeatures);
      
      set({ allCars: carsWithFeatures });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  addCar: async (car) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('cars')
        .insert([car]);
      
      if (error) throw error;
      
      await get().fetchAllCars();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateCar: async (id, car) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('cars')
        .update(car)
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchAllCars();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  toggleCarAvailability: async (id, available) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('cars')
        .update({ available })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchAllCars();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchAllBookings: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const bookings = data.map(booking => ({
        ...booking,
        car: booking.cars ? createCarWithFeatures(booking.cars as Car) : undefined,
      }));
      
      set({ allBookings: bookings });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateBookingStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchAllBookings();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchDiscountCodes: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ discountCodes: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  addDiscountCode: async (code) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('discount_codes')
        .insert([{ ...code, current_uses: 0 }]);
      
      if (error) throw error;
      
      await get().fetchDiscountCodes();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateDiscountCode: async (id, code) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('discount_codes')
        .update(code)
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchDiscountCodes();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  toggleDiscountCodeStatus: async (id, active) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('discount_codes')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchDiscountCodes();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchCampaigns: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ campaigns: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  addCampaign: async (campaign) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('campaigns')
        .insert([campaign]);
      
      if (error) throw error;
      
      await get().fetchCampaigns();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateCampaign: async (id, campaign) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('campaigns')
        .update(campaign)
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchCampaigns();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  toggleCampaignStatus: async (id, active) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('campaigns')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchCampaigns();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));

export { useAdminStore }