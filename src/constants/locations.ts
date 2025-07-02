export const BASE_LOCATION = {
  value: 'base-office',
  label: '711 Ke\'eaumoku St, Honolulu HI 96814',
  address: '711 Ke\'eaumoku St, Honolulu HI 96814',
  fee: 0,
  category: 'base' as const
};

const DEFAULT_LOCATIONS = [
  BASE_LOCATION,
  
  // Airport - $70 Delivery Fee
  { 
    value: 'daniel-k-inouye-airport', 
    label: 'Daniel K. Inouye International Airport',
    address: '300 Rodgers Blvd, Honolulu, HI 96819',
    fee: 70,
    category: 'airport' as const
  },
  
  // Premium Hotels - $50 Delivery Fee
  { 
    value: 'alohilani-resort', 
    label: 'Alohilani Resort Waikiki Beach',
    address: '2490 Kalakaua Ave, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'hyatt-regency-waikiki', 
    label: 'Hyatt Regency Waikiki Beach Resort & Spa',
    address: '2424 Kalakaua Ave, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'ilikai-hotel', 
    label: 'Ilikai Hotel & Luxury Suites',
    address: '1777 Ala Moana Blvd, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'hale-koa-hotel', 
    label: 'Hale Koa Hotel',
    address: '2055 Kalia Rd, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'hilton-hawaiian-village', 
    label: 'Hilton Hawaiian Village Waikiki Beach Resort',
    address: '2005 Kalia Rd, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'sheraton-waikiki', 
    label: 'Sheraton Waikiki',
    address: '2255 Kalakaua Ave, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'royal-hawaiian', 
    label: 'The Royal Hawaiian, a Luxury Collection Resort',
    address: '2259 Kalakaua Ave, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'waikiki-beach-marriott', 
    label: 'Waikiki Beach Marriott Resort & Spa',
    address: '2552 Kalakaua Ave, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  { 
    value: 'waikiki-grand-hotel', 
    label: 'Waikiki Grand Hotel',
    address: '134 Kapahulu Ave, Honolulu, HI 96815',
    fee: 50,
    category: 'hotel' as const
  },
  
  // Custom Locations
  { 
    value: 'custom-location', 
    label: 'Custom Location (10+ miles from office)',
    address: '',
    fee: -1, // -1 indicates quote required
    category: 'custom' as const
  }
];

// Get locations from localStorage if available (for admin updates), otherwise use defaults
function getLocations(): Location[] {
  if (typeof window !== 'undefined') {
    try {
      const adminLocations = localStorage.getItem('adminLocations');
      const currentLocations = localStorage.getItem('currentLocations');
      
      if (adminLocations) {
        return JSON.parse(adminLocations);
      } else if (currentLocations) {
        return JSON.parse(currentLocations);
      }
    } catch (error) {
      console.error('Error loading locations from localStorage:', error);
    }
  }
  return DEFAULT_LOCATIONS;
}

export const LOCATIONS = getLocations();
export const DEFAULT_LOCATIONS_LIST = DEFAULT_LOCATIONS;

export type LocationCategory = 'base' | 'airport' | 'hotel' | 'custom';

export interface Location {
  value: string;
  label: string;
  address: string;
  fee: number;
  category: LocationCategory;
}

export function getLocationByValue(value: string): Location | undefined {
  return LOCATIONS.find(loc => loc.value === value);
}

export function calculateDeliveryFee(pickupLocation: string, returnLocation: string): {
  pickupFee: number;
  returnFee: number;
  totalFee: number;
  requiresQuote: boolean;
} {
  const pickup = getLocationByValue(pickupLocation);
  const returnLoc = getLocationByValue(returnLocation);
  
  if (!pickup || !returnLoc) {
    return { pickupFee: 0, returnFee: 0, totalFee: 0, requiresQuote: false };
  }
  
  // Check if quote is required
  if (pickup.fee === -1 || returnLoc.fee === -1) {
    return { pickupFee: 0, returnFee: 0, totalFee: 0, requiresQuote: true };
  }
  
  // Same location
  if (pickupLocation === returnLocation) {
    return { 
      pickupFee: pickup.fee, 
      returnFee: 0, 
      totalFee: pickup.fee, 
      requiresQuote: false 
    };
  }
  
  // Different locations - split the fees
  const pickupFee = pickup.fee / 2;
  const returnFee = returnLoc.fee / 2;
  
  return { 
    pickupFee, 
    returnFee, 
    totalFee: pickupFee + returnFee, 
    requiresQuote: false 
  };
}