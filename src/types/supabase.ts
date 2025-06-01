export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: number
          created_at: string
          make: string
          model: string
          year: number
          price_per_day: number
          category: string
          image_url: string
          available: boolean
          features: Json
          description: string
          seats: number
          transmission: string
          mileage_type: string
          min_rental_hours: number
        }
        Insert: {
          id?: number
          created_at?: string
          make: string
          model: string
          year: number
          price_per_day: number
          category: string
          image_url: string
          available?: boolean
          features?: Json
          description: string
          seats?: number
          transmission?: string
          mileage_type?: string
          min_rental_hours?: number
        }
        Update: {
          id?: number
          created_at?: string
          make?: string
          model?: string
          year?: number
          price_per_day?: number
          category?: string
          image_url?: string
          available?: boolean
          features?: Json
          description?: string
          seats?: number
          transmission?: string
          mileage_type?: string
          min_rental_hours?: number
        }
      }
      bookings: {
        Row: {
          id: number
          created_at: string
          user_id: string
          car_id: number
          start_date: string
          end_date: string
          total_price: number
          status: string
          discount_code_id: number | null
          payment_intent_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          car_id: number
          start_date: string
          end_date: string
          total_price: number
          status?: string
          discount_code_id?: number | null
          payment_intent_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          car_id?: number
          start_date?: string
          end_date?: string
          total_price?: number
          status?: string
          discount_code_id?: number | null
          payment_intent_id?: string | null
        }
      }
      discount_codes: {
        Row: {
          id: number
          created_at: string
          code: string
          discount_percentage: number
          valid_from: string
          valid_to: string
          max_uses: number
          current_uses: number
          active: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          code: string
          discount_percentage: number
          valid_from: string
          valid_to: string
          max_uses: number
          current_uses?: number
          active?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          code?: string
          discount_percentage?: number
          valid_from?: string
          valid_to?: string
          max_uses?: number
          current_uses?: number
          active?: boolean
        }
      }
      campaigns: {
        Row: {
          id: number
          created_at: string
          name: string
          description: string
          discount_percentage: number
          valid_from: string
          valid_to: string
          featured_image_url: string
          active: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description: string
          discount_percentage: number
          valid_from: string
          valid_to: string
          featured_image_url: string
          active?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string
          discount_percentage?: number
          valid_from?: string
          valid_to?: string
          featured_image_url?: string
          active?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          address: string | null
          license_number: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          license_number?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          license_number?: string | null
          avatar_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}