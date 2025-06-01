export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  license_number?: string;
  avatar_url?: string;
}

export type Car = {
  id: number;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  category: string;
  image_url: string;
  available: boolean;
  features: string[];
  description: string;
  seats: number;
  transmission: string;
  mileage_type: string;
}

export type Booking = {
  id: number;
  user_id: string;
  car_id: number;
  car?: Car;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  discount_code_id?: number;
  payment_intent_id?: string;
}

export type DiscountCode = {
  id: number;
  code: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  max_uses: number;
  current_uses: number;
  active: boolean;
}

export type Campaign = {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  featured_image_url: string;
  active: boolean;
}