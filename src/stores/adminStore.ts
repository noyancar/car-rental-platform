import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Car, Booking, DiscountCode, Campaign, User } from '../types';

interface CustomerWithStats extends User {
  is_blacklisted?: boolean;
  blacklist_reason?: string;
  total_bookings?: number;
  total_spent?: number;
  last_booking_date?: string;
}

interface CustomerNote {
  id: string;
  user_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface AdminState {
  // Cars
  allCars: Car[];
  // Bookings
  allBookings: Booking[];
  // Discount codes
  discountCodes: DiscountCode[];
  // Campaigns
  campaigns: Campaign[];
  // Customers
  allCustomers: CustomerWithStats[];
  
  loading: boolean;
  error: string | null;
  
  // Car management
  fetchAllCars: () => Promise<void>;
  addCar: (car: Omit<Car, 'id'>) => Promise<void>;
  updateCar: (id: string, car: Partial<Car>) => Promise<void>;
  toggleCarAvailability: (id: string, available: boolean) => Promise<void>;
  deleteCar: (id: string) => Promise<boolean>;
  
  // Booking management
  fetchAllBookings: () => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  
  // Discount code management
  fetchDiscountCodes: () => Promise<void>;
  addDiscountCode: (code: Omit<DiscountCode, 'id' | 'created_at' | 'current_uses'>) => Promise<void>;
  updateDiscountCode: (id: string, code: Partial<DiscountCode>) => Promise<void>;
  toggleDiscountCodeStatus: (id: string, active: boolean) => Promise<void>;
  
  // Campaign management
  fetchCampaigns: () => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'created_at'>) => Promise<void>;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => Promise<void>;
  toggleCampaignStatus: (id: string, active: boolean) => Promise<void>;
  
  // Customer management
  fetchAllCustomers: () => Promise<void>;
  toggleCustomerBlacklist: (userId: string, blacklist: boolean, reason?: string | null) => Promise<boolean>;
  getCustomerBookings: (userId: string) => Promise<Booking[]>;
  getCustomerNotes: (userId: string) => Promise<CustomerNote[]>;
  addCustomerNote: (userId: string, note: string) => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  allCars: [],
  allBookings: [],
  discountCodes: [],
  campaigns: [],
  allCustomers: [],
  loading: false,
  error: null,
  
  // Car management
  fetchAllCars: async () => {
    const state = get();
    try {
      // Check if modal is open in sessionStorage
      const modalOpen = sessionStorage.getItem('adminCarsModalOpen') === 'true';
      
      // Only show loading if we don't have data yet AND modal is not open
      if (state.allCars.length === 0 && !modalOpen) {
        set({ loading: true, error: null });
      } else {
        set({ error: null });
      }
      
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
        image_urls: car.image_urls && car.image_urls.length > 0 
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
  
  updateCar: async (id: string, car) => {
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
      set({ isSavingData: false });
    }
  },
  
  toggleCarAvailability: async (id: string, available) => {
    try {
      set({ isSavingData: true, error: null });
      
      const { error } = await supabase
        .from('cars')
        .update({ available })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchAllCars();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isSavingData: false });
    }
  },
  
  deleteCar: async (id: string) => {
    try {
      set({ isSavingData: true, error: null });
      
      // First check if car has any active bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('car_id', id)
        .in('status', ['confirmed', 'pending']);
      
      if (bookingsError) throw bookingsError;
      
      if (bookings && bookings.length > 0) {
        throw new Error('Cannot delete car with active bookings');
      }
      
      // Delete the car
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchAllCars();
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ isSavingData: false });
    }
  },
  
  // Booking management
  fetchAllBookings: async () => {
    const state = get();
    try {
      // Check if modal is open in sessionStorage
      const modalOpen = sessionStorage.getItem('adminCarsModalOpen') === 'true';
      
      // Only show loading if we don't have data yet AND modal is not open
      if (state.allBookings.length === 0 && !modalOpen) {
        set({ loading: true, error: null });
      } else {
        set({ error: null });
      }
      
      // Step 1: Get bookings with related data
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          pickup_location:locations!pickup_location_id (*),
          return_location:locations!return_location_id (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        set({ allBookings: [] });
        return;
      }
      
      // Step 2: Get unique user IDs
      const userIds = [...new Set(data.map(b => b.user_id).filter(Boolean))];
      
      // Step 3: Batch fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, license_number')
        .in('id', userIds);
      
      // Create lookup map
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );
      
      // Step 4: Fetch emails using the RPC function
      const { data: emailsData } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });
      
      // Create email lookup map
      const emailsMap = new Map(
        (emailsData || []).map(e => [e.user_id, e.email])
      );
      
      // Step 5: Combine data
      const bookings: Booking[] = data
        .filter(item => item.car_id && item.created_at) // Only valid bookings
        .map(item => {
          const profile = profilesMap.get(item.user_id);
          return {
            ...item,
            car_id: item.car_id as string,
            created_at: item.created_at as string,
            status: item.status as Booking['status'],
            car: item.cars || undefined, // Convert null to undefined
            pickup_location: item.pickup_location,
            return_location: item.return_location,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            phone: profile?.phone || '',
            license_number: profile?.license_number || '',
            email: emailsMap.get(item.user_id) || ''
          };
        });
      
      set({ allBookings: bookings, isInitialLoad: false });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateBookingStatus: async (id: string, status) => {
    try {
      set({ loading: true, error: null });
      
      // First update the booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // If cancelled, make the car available again
      if (status === 'cancelled') {
        // Get the booking to find the car
        const { data: booking } = await supabase
          .from('bookings')
          .select('car_id')
          .eq('id', id)
          .single();
        
        if (booking?.car_id) {
          // Make the car available
          await supabase
            .from('cars')
            .update({ available: true })
            .eq('id', booking.car_id);
        }
      }
      
      await get().fetchAllBookings();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  // Discount code management
  fetchDiscountCodes: async () => {
    const state = get();
    try {
      // Only show loading if we don't have data yet
      if (state.discountCodes.length === 0) {
        set({ loading: true, error: null });
      } else {
        set({ error: null });
      }
      
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
  
  updateDiscountCode: async (id: string, code) => {
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
  
  toggleDiscountCodeStatus: async (id: string, active) => {
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
    const state = get();
    try {
      // Only show loading if we don't have data yet
      if (state.campaigns.length === 0) {
        set({ loading: true, error: null });
      } else {
        set({ error: null });
      }
      
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
  
  updateCampaign: async (id: string, campaign) => {
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
  
  toggleCampaignStatus: async (id: string, active) => {
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
  
  // Customer management
  fetchAllCustomers: async () => {
    const state = get();
    try {
      // Only show loading if we don't have data yet
      if (state.allCustomers.length === 0) {
        set({ loading: true, error: null });
      } else {
        set({ error: null });
      }
      
      // Get all profiles with customer stats
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        set({ allCustomers: [] });
        return;
      }
      
      // Get emails for all users
      const { data: emailsData } = await supabase
        .rpc('get_user_emails', { user_ids: data.map(p => p.id) });
      
      // Create email lookup map
      const emailsMap = new Map(
        (emailsData || []).map(e => [e.user_id, e.email])
      );
      
      // Combine data
      const customers: CustomerWithStats[] = data.map(profile => ({
        ...profile,
        email: emailsMap.get(profile.id) || ''
      }));
      
      set({ allCustomers: customers });
    } catch (error) {
      console.error('Error fetching customers:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  toggleCustomerBlacklist: async (userId: string, blacklist: boolean, reason?: string | null) => {
    try {
      set({ loading: true, error: null });
      
      console.log('Toggling blacklist for user:', userId, 'blacklist:', blacklist, 'reason:', reason);
      
      // First check current user is admin
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id || '')
        .single();
      
      console.log('Admin profile:', adminProfile);
      
      const updateData: any = { is_blacklisted: blacklist };
      if (blacklist) {
        updateData.blacklist_reason = reason;
      } else {
        updateData.blacklist_reason = null;
      }
      
      console.log('Update data:', updateData);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select();
      
      console.log('Update result:', data, 'error:', error);
      
      if (error) {
        console.error('Detailed error:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling blacklist:', error);
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },
  
  getCustomerBookings: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          car:cars (*),
          pickup_location:locations!pickup_location_id (*),
          return_location:locations!return_location_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match Booking type
      const bookings: Booking[] = (data || []).map(booking => ({
        ...booking,
        car: booking.car || undefined,
        pickup_location: booking.pickup_location || undefined,
        return_location: booking.return_location || undefined
      }));
      
      return bookings;
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      return [];
    }
  },
  
  getCustomerNotes: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as CustomerNote[];
    } catch (error) {
      console.error('Error fetching customer notes:', error);
      return [];
    }
  },
  
  addCustomerNote: async (userId: string, note: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { error } = await supabase
        .from('customer_notes')
        .insert([{
          user_id: userId,
          note,
          created_by: user.id
        }]);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error adding customer note:', error);
      return false;
    }
  },
}));