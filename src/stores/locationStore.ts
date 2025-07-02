import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Location = Database['public']['Tables']['locations']['Row'];

interface LocationStore {
  locations: Location[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchLocations: () => Promise<void>;
  getLocationById: (id: string) => Location | undefined;
  getLocationByValue: (value: string) => Location | undefined;
  calculateDeliveryFee: (pickupLocationId: string, returnLocationId: string) => number;
  
  // Admin actions
  addLocation: (location: Database['public']['Tables']['locations']['Insert']) => Promise<Location | null>;
  updateLocation: (id: string, updates: Database['public']['Tables']['locations']['Update']) => Promise<boolean>;
  deleteLocation: (id: string) => Promise<boolean>;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: [],
  loading: false,
  error: null,

  fetchLocations: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      set({ locations: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching locations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch locations',
        loading: false 
      });
    }
  },

  getLocationById: (id: string) => {
    return get().locations.find(loc => loc.id === id);
  },

  getLocationByValue: (value: string) => {
    return get().locations.find(loc => loc.value === value);
  },

  calculateDeliveryFee: (pickupLocationId: string, returnLocationId: string) => {
    const { locations } = get();
    const pickupLocation = locations.find(loc => loc.id === pickupLocationId);
    const returnLocation = locations.find(loc => loc.id === returnLocationId);

    if (!pickupLocation || !returnLocation) return 0;

    // If both locations are the same, charge full fee once
    if (pickupLocationId === returnLocationId) {
      return pickupLocation.delivery_fee;
    }

    // If different locations, split the fees
    return Math.ceil((pickupLocation.delivery_fee + returnLocation.delivery_fee) / 2);
  },

  addLocation: async (location) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert(location)
        .select()
        .single();

      if (error) throw error;

      // Refresh locations
      await get().fetchLocations();
      
      return data;
    } catch (error) {
      console.error('Error adding location:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add location' 
      });
      return null;
    }
  },

  updateLocation: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Refresh locations
      await get().fetchLocations();
      
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update location' 
      });
      return false;
    }
  },

  deleteLocation: async (id) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      // Refresh locations
      await get().fetchLocations();
      
      return true;
    } catch (error) {
      console.error('Error deleting location:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete location' 
      });
      return false;
    }
  }
}));