export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  price_per_day: number;
  available: boolean;
  image_url: string;
  category: string;
  seats: number;
  transmission: string;
  fuel_type: string;
  description?: string;
  features?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: number;
  user_id: string;
  car_id: number;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  pickup_location?: string | null;
  return_location?: string | null;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_intent_id?: string | null;
  discount_code_id?: number | null;
  created_at?: string;
  updated_at?: string;
  car?: Car;
} 