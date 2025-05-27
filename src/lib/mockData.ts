import type { User, Car, Booking, Campaign } from '../types';

export const mockUser: User = {
  id: '1',
  email: 'demo@example.com',
  first_name: 'Demo',
  last_name: 'User',
  phone: '+1234567890',
  avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
  created_at: '2025-01-01T00:00:00Z'
};

export const mockCars: Car[] = [
  {
    id: 1,
    make: 'Tesla',
    model: 'Model S',
    year: 2025,
    color: 'Red',
    category: 'Luxury',
    price_per_day: 200,
    description: 'High-performance electric vehicle',
    image_url: 'https://images.pexels.com/photos/12861709/pexels-photo-12861709.jpeg',
    available: true,
    features: ['Autopilot', 'Premium Sound', 'Ludicrous Mode'],
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    make: 'Porsche',
    model: '911',
    year: 2025,
    color: 'Black',
    category: 'Sports',
    price_per_day: 300,
    description: 'Classic sports car with modern technology',
    image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
    available: true,
    features: ['Sport Chrono Package', 'Carbon Ceramic Brakes', 'Sport Exhaust'],
    created_at: '2025-01-01T00:00:00Z'
  }
];

export const mockBookings: Booking[] = [
  {
    id: 1,
    user_id: '1',
    car_id: 1,
    start_date: '2025-06-01',
    end_date: '2025-06-03',
    total_price: 600,
    status: 'confirmed',
    created_at: '2025-05-15T00:00:00Z',
    car: mockCars[0],
    user: mockUser
  }
];

export const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'Summer Special',
    description: 'Get 20% off on all luxury cars this summer',
    discount_percentage: 20,
    valid_from: '2025-06-01',
    valid_to: '2025-08-31',
    active: true,
    featured_image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
    created_at: '2025-05-01T00:00:00Z'
  }
];