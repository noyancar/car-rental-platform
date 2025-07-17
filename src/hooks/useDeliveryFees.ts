import { useState, useEffect } from 'react';
import { useLocations } from './useLocations';

interface DeliveryFees {
  pickupFee: number;
  returnFee: number;
  totalFee: number;
  requiresQuote: boolean;
}

export function useDeliveryFees(pickupLocation: string, returnLocation: string) {
  const { calculateDeliveryFee } = useLocations();
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFees>({
    pickupFee: 0,
    returnFee: 0,
    totalFee: 0,
    requiresQuote: false
  });

  useEffect(() => {
    if (pickupLocation && returnLocation) {
      const fees = calculateDeliveryFee(pickupLocation, returnLocation);
      setDeliveryFees(fees);
    } else {
      setDeliveryFees({
        pickupFee: 0,
        returnFee: 0,
        totalFee: 0,
        requiresQuote: false
      });
    }
  }, [pickupLocation, returnLocation]); // calculateDeliveryFee removed to prevent infinite loop

  return deliveryFees;
}