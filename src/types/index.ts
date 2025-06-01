// types/index.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type User = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  license_number?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export type Car = {
  id: number;
  created_at: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  category: string;
  image_url: string;
  available: boolean;
  features: Json; // JSONB field from database
  description: string;
  seats: number;
  transmission: string;
  mileage_type: string;
  // PDF'den eklenen yeni alanlar
  trim?: string;
  color?: string;
  plate?: string;
  doors?: number;
  fuel_type?: string;
  gas_grade?: string;
}

// Computed type for easier feature access
export type CarWithFeatures = Car & {
  parsedFeatures: string[]; // features'ı string array olarak parse edilmiş hali
}

export type Booking = {
  id: number;
  created_at: string;
  user_id: string;
  car_id: number;
  car?: Car;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  discount_code_id?: number | null;
  payment_intent_id?: string | null;
}

export type DiscountCode = {
  id: number;
  created_at: string;
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
  created_at: string;
  name: string;
  description: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  featured_image_url: string;
  active: boolean;
}

// Database types (generated from Supabase)
export interface Database {
  public: {
    Tables: {
      cars: {
        Row: Car;
        Insert: Omit<Car, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
          available?: boolean;
          features?: Json;
          seats?: number;
          transmission?: string;
          mileage_type?: string;
        };
        Update: Partial<Omit<Car, 'id'>> & {
          id?: number;
        };
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
          status?: string;
          discount_code_id?: number | null;
          payment_intent_id?: string | null;
        };
        Update: Partial<Omit<Booking, 'id'>> & {
          id?: number;
        };
      };
      discount_codes: {
        Row: DiscountCode;
        Insert: Omit<DiscountCode, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
          current_uses?: number;
          active?: boolean;
        };
        Update: Partial<Omit<DiscountCode, 'id'>> & {
          id?: number;
        };
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
          active?: boolean;
        };
        Update: Partial<Omit<Campaign, 'id'>> & {
          id?: number;
        };
      };
      profiles: {
        Row: User;
        Insert: {
          id: string;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          address?: string | null;
          license_number?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          address?: string | null;
          license_number?: string | null;
          avatar_url?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper function to parse car features
export const parseCarFeatures = (features: Json): string[] => {
  if (Array.isArray(features)) {
    return features.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// Helper function to create CarWithFeatures
export const createCarWithFeatures = (car: Car): CarWithFeatures => ({
  ...car,
  parsedFeatures: parseCarFeatures(car.features)
});

// Type guards
export const isValidBookingStatus = (status: string): status is Booking['status'] => {
  return ['pending', 'confirmed', 'cancelled', 'completed'].includes(status);
}