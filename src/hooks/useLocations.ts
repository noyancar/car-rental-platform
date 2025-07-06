import { useEffect, useState } from 'react';
import { useLocationStore } from '../stores/locationStore';
import { Database } from '../types/supabase';

type Location = Database['public']['Tables']['locations']['Row'];

interface LocationOption {
  value: string;
  label: string;
  address: string;
  fee: number;
  category: 'base' | 'airport' | 'hotel' | 'custom';
  distance_from_base?: number | null;
}

export function useLocations() {
  const { locations, loading, error, fetchLocations } = useLocationStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      fetchLocations();
      setIsInitialized(true);
    }
  }, [isInitialized, fetchLocations]);

  // Convert database locations to the format expected by existing components
  const locationOptions: LocationOption[] = locations.map(loc => ({
    value: loc.value,
    label: loc.label,
    address: loc.address,
    fee: loc.delivery_fee,
    category: loc.category,
    distance_from_base: loc.distance_from_base
  }));

  // Helper functions that work with both old and new systems
  const getLocationByValue = (value: string): LocationOption | undefined => {
    return locationOptions.find(loc => loc.value === value);
  };

  const getLocationById = (id: string): Location | undefined => {
    return locations.find(loc => loc.id === id);
  };

  const calculateDeliveryFee = (pickupValue: string, returnValue: string) => {
    const pickupLocation = getLocationByValue(pickupValue);
    const returnLocation = getLocationByValue(returnValue);

    if (!pickupLocation || !returnLocation) {
      return { pickupFee: 0, returnFee: 0, totalFee: 0, requiresQuote: false };
    }

    // Handle custom locations
    if (pickupLocation.category === 'custom' || returnLocation.category === 'custom') {
      // Check if it's the "ask for quote" type (fee = -1)
      const needsQuote = pickupLocation.fee === -1 || returnLocation.fee === -1;
      
      if (needsQuote) {
        return { pickupFee: 0, returnFee: 0, totalFee: 0, requiresQuote: true };
      }
      // Otherwise calculate normally (for within 10mi custom locations)
    }

    // If both locations are the same
    if (pickupValue === returnValue) {
      return { 
        pickupFee: pickupLocation.fee, 
        returnFee: 0, 
        totalFee: pickupLocation.fee, 
        requiresQuote: false 
      };
    }

    // If different locations - split the fees like Turo
    // Example: Hilton ($50) pickup, Airport ($70) return = $25 + $35 = $60
    const pickupFee = Math.ceil(pickupLocation.fee / 2);
    const returnFee = Math.ceil(returnLocation.fee / 2);
    return { 
      pickupFee, 
      returnFee, 
      totalFee: pickupFee + returnFee, 
      requiresQuote: false 
    };
  };

  // Default location constants
  const BASE_LOCATION = locationOptions.find(loc => loc.value === 'base-office') || locationOptions[0];
  const DEFAULT_LOCATION = locationOptions.find(loc => loc.value === 'airport-hnl') || locationOptions[0];

  return {
    locations: locationOptions,
    loading,
    error,
    getLocationByValue,
    getLocationById,
    calculateDeliveryFee,
    // Expose raw database locations for components that need them
    dbLocations: locations,
    // Export default locations for backward compatibility
    BASE_LOCATION,
    DEFAULT_LOCATION
  };
}