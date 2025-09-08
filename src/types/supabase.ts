export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      booking_extras: {
        Row: {
          booking_id: string | null
          created_at: string | null
          extra_id: string
          id: string
          notes: string | null
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          extra_id: string
          id?: string
          notes?: string | null
          quantity?: number
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          extra_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_extras_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_extras_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          car_id: string | null
          car_rental_subtotal: number | null
          created_at: string | null
          discount_code_id: string | null
          end_date: string
          expires_at: string | null
          extras_total: number | null
          grand_total: number | null
          id: string
          pickup_delivery_fee: number | null
          pickup_location_id: string | null
          pickup_time: string | null
          refunded_amount: number | null
          return_delivery_fee: number | null
          return_location_id: string | null
          return_time: string | null
          start_date: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_method_id: string | null
          stripe_payment_status: string | null
          stripe_refund_id: string | null
          total_price: number
          user_id: string
        }
        Insert: {
          car_id?: string | null
          car_rental_subtotal?: number | null
          created_at?: string | null
          discount_code_id?: string | null
          end_date: string
          expires_at?: string | null
          extras_total?: number | null
          grand_total?: number | null
          id?: string
          pickup_delivery_fee?: number | null
          pickup_location_id?: string | null
          pickup_time?: string | null
          refunded_amount?: number | null
          return_delivery_fee?: number | null
          return_location_id?: string | null
          return_time?: string | null
          start_date: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_payment_status?: string | null
          stripe_refund_id?: string | null
          total_price: number
          user_id: string
        }
        Update: {
          car_id?: string | null
          car_rental_subtotal?: number | null
          created_at?: string | null
          discount_code_id?: string | null
          end_date?: string
          expires_at?: string | null
          extras_total?: number | null
          grand_total?: number | null
          id?: string
          pickup_delivery_fee?: number | null
          pickup_location_id?: string | null
          pickup_time?: string | null
          refunded_amount?: number | null
          return_delivery_fee?: number | null
          return_location_id?: string | null
          return_time?: string | null
          start_date?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_payment_status?: string | null
          stripe_refund_id?: string | null
          total_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_return_location_id_fkey"
            columns: ["return_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_discount_code"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string
          discount_percentage: number
          featured_image_url: string
          id: string
          name: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description: string
          discount_percentage: number
          featured_image_url: string
          id?: string
          name: string
          valid_from: string
          valid_to: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string
          discount_percentage?: number
          featured_image_url?: string
          id?: string
          name?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: []
      }
      cars: {
        Row: {
          available: boolean | null
          category: string
          color: string | null
          created_at: string | null
          description: string
          doors: number | null
          features: Json | null
          fuel_type: string | null
          gas_grade: string | null
          id: string
          image_url: string
          image_urls: string[] | null
          license_plate: string | null
          main_image_index: number | null
          make: string
          mileage_type: string | null
          min_rental_hours: number | null
          model: string
          price_per_day: number
          seats: number | null
          transmission: string | null
          trim: string | null
          year: number
        }
        Insert: {
          available?: boolean | null
          category: string
          color?: string | null
          created_at?: string | null
          description: string
          doors?: number | null
          features?: Json | null
          fuel_type?: string | null
          gas_grade?: string | null
          id?: string
          image_url: string
          image_urls?: string[] | null
          license_plate?: string | null
          main_image_index?: number | null
          make: string
          mileage_type?: string | null
          min_rental_hours?: number | null
          model: string
          price_per_day: number
          seats?: number | null
          transmission?: string | null
          trim?: string | null
          year: number
        }
        Update: {
          available?: boolean | null
          category?: string
          color?: string | null
          created_at?: string | null
          description?: string
          doors?: number | null
          features?: Json | null
          fuel_type?: string | null
          gas_grade?: string | null
          id?: string
          image_url?: string
          image_urls?: string[] | null
          license_plate?: string | null
          main_image_index?: number | null
          make?: string
          mileage_type?: string | null
          min_rental_hours?: number | null
          model?: string
          price_per_day?: number
          seats?: number | null
          transmission?: string | null
          trim?: string | null
          year?: number
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_percentage: number
          id: string
          max_uses: number
          valid_from: string
          valid_to: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_percentage: number
          id?: string
          max_uses: number
          valid_from: string
          valid_to: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_percentage?: number
          id?: string
          max_uses?: number
          valid_from?: string
          valid_to?: string
        }
        Relationships: []
      }
      extras: {
        Row: {
          active: boolean | null
          category: Database["public"]["Enums"]["extra_category"]
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          max_per_booking: number | null
          name: string
          price: number
          price_type: Database["public"]["Enums"]["extra_price_type"]
          slug: string
          sort_order: number | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: Database["public"]["Enums"]["extra_category"]
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          max_per_booking?: number | null
          name: string
          price: number
          price_type?: Database["public"]["Enums"]["extra_price_type"]
          slug: string
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: Database["public"]["Enums"]["extra_category"]
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          max_per_booking?: number | null
          name?: string
          price?: number
          price_type?: Database["public"]["Enums"]["extra_price_type"]
          slug?: string
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      extras_inventory: {
        Row: {
          available_count: number | null
          created_at: string | null
          date: string
          extra_id: string
          id: string
          reserved_count: number | null
          total_stock: number
          updated_at: string | null
        }
        Insert: {
          available_count?: number | null
          created_at?: string | null
          date: string
          extra_id: string
          id?: string
          reserved_count?: number | null
          total_stock: number
          updated_at?: string | null
        }
        Update: {
          available_count?: number | null
          created_at?: string | null
          date?: string
          extra_id?: string
          id?: string
          reserved_count?: number | null
          total_stock?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extras_inventory_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          category: string
          coordinates: Json | null
          created_at: string
          delivery_fee: number
          distance_from_base: number | null
          email: string | null
          id: string
          is_active: boolean | null
          label: string
          metadata: Json | null
          operating_hours: Json | null
          phone: string | null
          sort_order: number | null
          updated_at: string
          value: string
        }
        Insert: {
          address: string
          category: string
          coordinates?: Json | null
          created_at?: string
          delivery_fee?: number
          distance_from_base?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          metadata?: Json | null
          operating_hours?: Json | null
          phone?: string | null
          sort_order?: number | null
          updated_at?: string
          value: string
        }
        Update: {
          address?: string
          category?: string
          coordinates?: Json | null
          created_at?: string
          delivery_fee?: number
          distance_from_base?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          metadata?: Json | null
          operating_hours?: Json | null
          phone?: string | null
          sort_order?: number | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount: number | null
          booking_id: string | null
          created_at: string
          currency: string | null
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          status: string
          stripe_event_id: string | null
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          status: string
          stripe_event_id?: string | null
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          status?: string
          stripe_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          license_number: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_extra_availability: {
        Args: {
          p_extra_id: string
          p_start_date: string
          p_end_date: string
          p_quantity: number
        }
        Returns: boolean
      }
      cleanup_expired_draft_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      release_extras_inventory: {
        Args: { p_booking_id: number } | { p_booking_id: string }
        Returns: undefined
      }
      reserve_extras_inventory: {
        Args:
          | {
              p_booking_id: number
              p_extra_id: string
              p_start_date: string
              p_end_date: string
              p_quantity: number
            }
          | {
              p_booking_id: string
              p_extra_id: string
              p_quantity: number
              p_start_date: string
              p_end_date: string
            }
        Returns: undefined
      }
    }
    Enums: {
      extra_category: "services" | "safety" | "beach" | "tech" | "camping"
      extra_price_type: "per_day" | "one_time"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      extra_category: ["services", "safety", "beach", "tech", "camping"],
      extra_price_type: ["per_day", "one_time"],
    },
  },
} as const