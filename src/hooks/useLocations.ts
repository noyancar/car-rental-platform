import { useEffect, useState } from 'react';
import { useLocationStore } from '../stores/locationStore';
import { LOCATIONS as DEFAULT_LOCATIONS, type Location as ConstantLocation } from '../constants/locations';
import { Database } from '../types/supabase';

type Location = Database['public']['Tables']['locations']['Row'];

interface LocationOption {
  value: string;
  label: string;
  address: string;
  fee: number;
  category: 'base' | 'airport' | 'hotel' | 'custom';
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
  const locationOptions: LocationOption[] = locations.length > 0
    ? locations.map(loc => ({
        value: loc.value,
        label: loc.label,
        address: loc.address,
        fee: loc.delivery_fee,
        category: loc.category
      }))
    : DEFAULT_LOCATIONS.map(loc => ({
        value: loc.value,
        label: loc.label,
        address: loc.address,
        fee: loc.fee,
        category: loc.category
      })); // Fallback to hardcoded locations if database is empty

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

    // Custom locations require a quote
    if (pickupLocation.category === 'custom' || returnLocation.category === 'custom') {
      return { pickupFee: 0, returnFee: 0, totalFee: 0, requiresQuote: true };
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

  return {
    locations: locationOptions,
    loading,
    error,
    getLocationByValue,
    getLocationById,
    calculateDeliveryFee,
    // Expose raw database locations for components that need them
    dbLocations: locations
  };
}