import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Extra, BookingExtra, ExtraCategory } from '../types';

interface ExtrasState {
  extras: Extra[];
  selectedExtras: Map<string, { extra: Extra; quantity: number }>;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchExtras: (pickupDate: string, returnDate: string) => Promise<void>;
  addExtra: (extra: Extra, quantity: number) => void;
  removeExtra: (extraId: string) => void;
  updateQuantity: (extraId: string, quantity: number) => void;
  clearSelectedExtras: () => void;
  calculateTotal: (rentalDays: number) => { extrasTotal: number; breakdown: Array<{ name: string; price: number; quantity: number; total: number }> };
  saveBookingExtras: (bookingId: number, rentalDays: number) => Promise<void>;
  checkAvailability: (extraId: string, quantity: number, pickupDate: string, returnDate: string) => Promise<boolean>;
}

export const useExtrasStore = create<ExtrasState>((set, get) => ({
  extras: [],
  selectedExtras: new Map(),
  loading: false,
  error: null,

  fetchExtras: async (pickupDate: string, returnDate: string) => {
    set({ loading: true, error: null });
    try {
      // Fetch all active extras
      const { data: extras, error } = await supabase
        .from('extras')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // For each extra with stock limits, check availability
      const extrasWithAvailability = await Promise.all(
        (extras || []).map(async (extra) => {
          if (extra.stock_quantity === null) {
            return { ...extra, available: true, availableQuantity: 99 };
          }

          // Check availability for the date range
          const { data: availability } = await supabase.rpc('check_extra_availability', {
            p_extra_id: extra.id,
            p_start_date: pickupDate,
            p_end_date: returnDate,
            p_quantity: 1
          });

          return { 
            ...extra, 
            available: availability || false,
            availableQuantity: extra.stock_quantity // This is simplified, you might want to calculate actual available quantity
          };
        })
      );

      set({ extras: extrasWithAvailability, loading: false });
    } catch (error) {
      console.error('Error fetching extras:', error);
      set({ error: 'Failed to load extras', loading: false });
    }
  },

  addExtra: (extra: Extra, quantity: number) => {
    const { selectedExtras } = get();
    const newSelected = new Map(selectedExtras);
    newSelected.set(extra.id, { extra, quantity });
    set({ selectedExtras: newSelected });
  },

  removeExtra: (extraId: string) => {
    const { selectedExtras } = get();
    const newSelected = new Map(selectedExtras);
    newSelected.delete(extraId);
    set({ selectedExtras: newSelected });
  },

  updateQuantity: (extraId: string, quantity: number) => {
    const { selectedExtras } = get();
    const selected = selectedExtras.get(extraId);
    if (selected) {
      if (quantity <= 0) {
        get().removeExtra(extraId);
      } else {
        const newSelected = new Map(selectedExtras);
        newSelected.set(extraId, { ...selected, quantity });
        set({ selectedExtras: newSelected });
      }
    }
  },

  clearSelectedExtras: () => {
    set({ selectedExtras: new Map() });
  },

  calculateTotal: (rentalDays: number) => {
    const { selectedExtras } = get();
    let extrasTotal = 0;
    const breakdown: Array<{ name: string; price: number; quantity: number; total: number }> = [];

    selectedExtras.forEach(({ extra, quantity }) => {
      const total = extra.price_type === 'per_day' 
        ? extra.price * quantity * rentalDays
        : extra.price * quantity;
      
      extrasTotal += total;
      breakdown.push({
        name: extra.name,
        price: extra.price,
        quantity,
        total
      });
    });

    return { extrasTotal, breakdown };
  },

  saveBookingExtras: async (bookingId: number, rentalDays: number) => {
    const { selectedExtras, calculateTotal } = get();
    
    try {
      // Calculate total extras price
      const { extrasTotal } = calculateTotal(rentalDays);
      
      // Prepare booking extras data
      const bookingExtras = Array.from(selectedExtras.values()).map(({ extra, quantity }) => ({
        booking_id: bookingId,
        extra_id: extra.id,
        quantity,
        unit_price: extra.price,
        total_price: extra.price_type === 'per_day' 
          ? extra.price * quantity * rentalDays
          : extra.price * quantity
      }));

      if (bookingExtras.length > 0) {
        // Delete existing extras for this booking (if any)
        await supabase
          .from('booking_extras')
          .delete()
          .eq('booking_id', bookingId);

        // Insert new extras
        const { error } = await supabase
          .from('booking_extras')
          .insert(bookingExtras);

        if (error) throw error;
      }
      
      // Update the booking's extras_total field
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ extras_total: extrasTotal })
        .eq('id', bookingId);
        
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error saving booking extras:', error);
      throw error;
    }
  },

  checkAvailability: async (extraId: string, quantity: number, pickupDate: string, returnDate: string) => {
    try {
      const { data, error } = await supabase.rpc('check_extra_availability', {
        p_extra_id: extraId,
        p_start_date: pickupDate,
        p_end_date: returnDate,
        p_quantity: quantity
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking extra availability:', error);
      return false;
    }
  }
})); 