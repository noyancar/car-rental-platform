// Temporary mock data exports while developing UI
import type { Car, Booking, Campaign, User, DiscountCode } from '../types';

// Mock Cars Data
export const mockCars: Car[] = [
  {
    id: 1,
    make: 'BMW',
    model: 'M5',
    year: 2025,
    price_per_day: 299,
    category: 'luxury',
    image_url: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
    description: 'Experience luxury and performance with the BMW M5.',
    features: ['Leather Seats', 'Navigation', 'Bluetooth', 'Heated Seats'],
    available: true
  },
  {
    id: 2,
    make: 'Tesla',
    model: 'Model S',
    year: 2025,
    price_per_day: 259,
    category: 'electric',
    image_url: 'https://images.pexels.com/photos/7989741/pexels-photo-7989741.jpeg',
    description: 'The future of driving with Tesla Model S.',
    features: ['Autopilot', 'Long Range', 'Premium Sound', 'Glass Roof'],
    available: true
  },
  {
    id: 3,
    make: 'Porsche',
    model: '911',
    year: 2025,
    price_per_day: 399,
    category: 'sports',
    image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
    description: 'Classic sports car performance with modern technology.',
    features: ['Sport Mode', 'Carbon Fiber', 'Launch Control', 'Bose Audio'],
    available: true
  },
  {
    id: 4,
    make: 'Range Rover',
    model: 'Sport',
    year: 2025,
    price_per_day: 349,
    category: 'suv',
    image_url: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
    description: 'Luxury SUV with outstanding off-road capability.',
    features: ['Air Suspension', '4x4', 'Panoramic Roof', 'Premium Audio'],
    available: true
  }
];

// Mock User Data
export const mockUser: User = {
  id: '123',
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1 (555) 123-4567',
  address: '123 Main St, New York, NY 10001',
  license_number: 'DL123456789',
  created_at: '2025-01-01T00:00:00Z'
};

// Mock Bookings Data
export const mockBookings: Booking[] = [
  {
    id: 1,
    user_id: '123',
    car_id: 1,
    start_date: '2025-06-01',
    end_date: '2025-06-05',
    total_price: 1495,
    status: 'confirmed',
    created_at: '2025-05-25T10:00:00Z',
    car: mockCars[0]
  },
  {
    id: 2,
    user_id: '123',
    car_id: 2,
    start_date: '2025-07-10',
    end_date: '2025-07-15',
    total_price: 1295,
    status: 'pending',
    created_at: '2025-05-25T11:00:00Z',
    car: mockCars[1]
  }
];

// Mock Campaigns Data
export const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'Summer Special',
    description: 'Get 20% off on all luxury cars this summer!',
    discount_percentage: 20,
    valid_from: '2025-06-01',
    valid_to: '2025-08-31',
    featured_image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
    active: true
  },
  {
    id: 2,
    name: 'Weekend Getaway',
    description: 'Special weekend rates on all SUVs',
    discount_percentage: 15,
    valid_from: '2025-06-01',
    valid_to: '2025-12-31',
    featured_image_url: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
    active: true
  }
];

// Mock Discount Codes
export const mockDiscountCodes: DiscountCode[] = [
  {
    id: 1,
    code: 'SUMMER25',
    discount_percentage: 25,
    valid_from: '2025-06-01',
    valid_to: '2025-08-31',
    max_uses: 100,
    current_uses: 45,
    active: true
  },
  {
    id: 2,
    code: 'WELCOME15',
    discount_percentage: 15,
    valid_from: '2025-01-01',
    valid_to: '2025-12-31',
    max_uses: 1000,
    current_uses: 358,
    active: true
  }
];

// Mock Supabase client (empty implementation)
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: mockUser }, error: null }),
    signInWithPassword: async () => ({ data: { user: mockUser }, error: null }),
    signUp: async () => ({ data: { user: mockUser }, error: null }),
    signOut: async () => ({ error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null })
      }),
      order: () => ({
        limit: () => ({ data: [], error: null })
      })
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: null })
      })
    }),
    update: () => ({
      eq: async () => ({ error: null })
    })
  })
};