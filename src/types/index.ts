export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  created_at?: string;
  role?: 'user' | 'admin';
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
  pickup_location?: {
    id: string;
    value: string;
    label: string;
    address: string;
    category: string;
    delivery_fee: number;
  }; // Location object from join
  return_location?: {
    id: string;
    value: string;
    label: string;
    address: string;
    category: string;
    delivery_fee: number;
  }; // Location object from join
  pickup_time?: string;
  return_time?: string;
  discount_code_id?: string;
  stripe_payment_intent_id?: string;
  stripe_payment_status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  stripe_payment_method_id?: string;
  expires_at?: string | null; // Expiry timestamp for draft bookings
  // Customer information fields
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  customer_email?: string;
  customer_name?: string;
  stripe_customer_id?: string;
  // Pricing breakdown fields
  car_rental_subtotal?: number;
  subtotal?: number;
  pickup_delivery_fee?: number;
  return_delivery_fee?: number;
  delivery_fee?: number;
  discount_amount?: number;
  extras_total?: number;
  grand_total?: number;
  refunded_amount?: number;
  stripe_refund_id?: string;
  // Extras relation
  booking_extras?: BookingExtra[];
}

export type DiscountCode = {
  id: string;
  code: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  max_uses?: number | null;
  current_uses: number;
  active: boolean;
}

export type AppliedDiscount = Pick<DiscountCode, 'id' | 'code' | 'discount_percentage'>;

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

// Seasonal Pricing Types
export interface CarSeasonalPricing {
  id: string;
  car_id: string;
  name: string;
  description?: string;
  price_per_day: number;
  valid_from: string;
  valid_to: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyPriceBreakdown {
  date: string;
  price: number;
  pricing_name: string;
  is_special_price: boolean;
}

export interface PriceCalculationResult {
  total_price: number;
  daily_breakdown: DailyPriceBreakdown[];
  base_price_days: number;
  special_price_days: number;
  average_per_day: number;
}

export interface PricingPreview {
  date: string;
  price_per_day: number;
  pricing_name: string;
  is_special_price: boolean;
  priority: number;
}

// Blog Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  author_id?: string;
  author_name?: string;
  published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;

  // SEO fields
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];

  // Blog specific fields
  category?: string;
  tags?: string[];
  read_time_minutes?: number;
  views_count: number;
}