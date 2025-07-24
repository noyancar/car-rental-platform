export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  license_number?: string;
  license_expiry?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  category: string;
  image_url: string;
  image_urls?: string[];
  main_image_index?: number;
  available: boolean;
  features: string[];
  description: string;
  seats: number;
  transmission: string;
  mileage_type: string;
  trim?: string;
  color?: string;
  license_plate?: string;
  doors?: number;
  fuel_type?: string;
  gas_grade?: string;
}

export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  car_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  updated_at?: string;
  car?: Car;
  pickup_location_id?: string;
  return_location_id?: string;
  pickup_location?: any; // Location object from join
  return_location?: any; // Location object from join
  pickup_time?: string;
  return_time?: string;
  discount_code_id?: string;
  stripe_payment_intent_id?: string;
  stripe_payment_status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  stripe_payment_method_id?: string;
  expires_at?: string | null; // Expiry timestamp for draft bookings
}

export type DiscountCode = {
  id: string;
  code: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  max_uses: number;
  current_uses: number;
  active: boolean;
}

export type Campaign = {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  featured_image_url: string;
  active: boolean;
}

export type CampaignStatus = 'active' | 'scheduled' | 'expired' | 'paused';

export type ExtraCategory = 'services' | 'safety' | 'beach' | 'tech' | 'camping';
export type ExtraPriceType = 'per_day' | 'one_time';

export interface Extra {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  price_type: ExtraPriceType;
  category: ExtraCategory;
  stock_quantity?: number | null;
  max_per_booking: number;
  icon_name?: string;
  image_url?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtraInventory {
  id: string;
  extra_id: string;
  date: string;
  total_stock: number;
  reserved_count: number;
  available_count: number;
  created_at: string;
  updated_at: string;
}

export interface BookingExtra {
  id: string;
  booking_id: string;
  extra_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  extra?: Extra; // For joins
}

export interface BookingWithExtras extends Booking {
  extras_total?: number;
  grand_total?: number;
  booking_extras?: BookingExtra[];
}