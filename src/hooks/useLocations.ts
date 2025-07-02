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

  const calculateDeliveryFee = (pickupValue: string, returnValue: string): number => {
    const pickupLocation = getLocationByValue(pickupValue);
    const returnLocation = getLocationByValue(returnValue);

    if (!pickupLocation || !returnLocation) return 0;

    // Custom locations require a quote
    if (pickupLocation.category === 'custom' || returnLocation.category === 'custom') {
      return -1;
    }

    // If both locations are the same, charge full fee once
    if (pickupValue === returnValue) {
      return pickupLocation.fee;
    }

    // If different locations, split the fees
    return Math.ceil((pickupLocation.fee + returnLocation.fee) / 2);
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