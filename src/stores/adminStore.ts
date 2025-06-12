import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car, Booking, DiscountCode, Campaign } from '../types';

interface AdminState {
  // Cars
  allCars: Car[];
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
  addCar: (car: Omit<Car, 'id'>) => Promise<void>;
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
      
      set({ allCars: data as Car[] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  addCar: async (car) => {
    try {
      set({ loading: true, error: null });
      
      // Ensure image_urls array exists
      const carData = {
        ...car,
        // If image_urls is not provided, create it from image_url
        image_urls: car.image_urls?.length > 0 
          ? car.image_urls 
          : car.image_url ? [car.image_url] : [],
        // Set main_image_index to 0 if not provided
        main_image_index: car.main_image_index || 0
      };
      
      const { error } = await supabase
        .from('cars')
        .insert([carData]);
      
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
      
      // Prepare update data with image_urls handling
      let updateData = { ...car };
      
      // Handle image_urls if provided
      if (car.image_urls && Array.isArray(car.image_urls)) {
        updateData.image_urls = car.image_urls;
        
        // Update main_image_index if not provided but we have image_urls
        if (car.main_image_index === undefined && car.image_urls.length > 0) {
          updateData.main_image_index = 0;
        }
        
        // Also update the legacy image_url field to be the main image
        if (car.image_urls.length > 0) {
          const mainIndex = car.main_image_index || 0;
          updateData.image_url = car.image_urls[mainIndex];
        }
      } 
      // If only image_url is updated but not image_urls
      else if (car.image_url && !car.image_urls) {
        // Get current car data to check existing image_urls
        const { data: currentCar } = await supabase
          .from('cars')
          .select('image_urls')
          .eq('id', id)
          .single();
          
        if (currentCar && currentCar.image_urls) {
          // Update image_urls with the new image_url as main
          updateData.image_urls = [car.image_url, ...(currentCar.image_urls || [])];
          updateData.main_image_index = 0;
        } else {
          // No existing image_urls, create new array
          updateData.image_urls = [car.image_url];
          updateData.main_image_index = 0;
        }
      }
      
      const { error } = await supabase
        .from('cars')
        .update(updateData)
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
  
  // Booking management
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
      
      const bookings: Booking[] = data.map(item => ({
        ...item,
        car: item.cars,
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
  
  // Discount code management
  fetchDiscountCodes: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ discountCodes: data as DiscountCode[] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  addDiscountCode: async (code) => {
    try {
      set({ loading: true, error: null });
      
      // Set initial values for current_uses
      const newCode = {
        ...code,
        current_uses: 0,
      };
      
      const { error } = await supabase
        .from('discount_codes')
        .insert([newCode]);
      
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
  
  // Campaign management
  fetchCampaigns: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ campaigns: data as Campaign[] });
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