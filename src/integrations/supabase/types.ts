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
      activities: {
        Row: {
          created_at: string
          id: string
          message: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crab_entries: {
        Row: {
          box_number: string
          category: Database["public"]["Enums"]["crab_category"]
          crab_status: Database["public"]["Enums"]["crab_status"][] | null
          created_at: string
          created_by: string
          damaged_details: string | null
          date: string
          female_count: number
          health_status: Database["public"]["Enums"]["health_status"]
          id: string
          male_count: number
          report_type: Database["public"]["Enums"]["report_type"]
          supplier: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          box_number: string
          category: Database["public"]["Enums"]["crab_category"]
          crab_status?: Database["public"]["Enums"]["crab_status"][] | null
          created_at?: string
          created_by: string
          damaged_details?: string | null
          date?: string
          female_count?: number
          health_status?: Database["public"]["Enums"]["health_status"]
          id?: string
          male_count?: number
          report_type?: Database["public"]["Enums"]["report_type"]
          supplier: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          box_number?: string
          category?: Database["public"]["Enums"]["crab_category"]
          crab_status?: Database["public"]["Enums"]["crab_status"][] | null
          created_at?: string
          created_by?: string
          damaged_details?: string | null
          date?: string
          female_count?: number
          health_status?: Database["public"]["Enums"]["health_status"]
          id?: string
          male_count?: number
          report_type?: Database["public"]["Enums"]["report_type"]
          supplier?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "crab_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dead_crabs: {
        Row: {
          box_number: string
          category: Database["public"]["Enums"]["crab_category"]
          cause_of_death: string | null
          created_at: string
          created_by: string
          date: string
          id: string
          notes: string | null
          time: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          box_number: string
          category: Database["public"]["Enums"]["crab_category"]
          cause_of_death?: string | null
          created_at?: string
          created_by: string
          date?: string
          id?: string
          notes?: string | null
          time?: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          box_number?: string
          category?: Database["public"]["Enums"]["crab_category"]
          cause_of_death?: string | null
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          notes?: string | null
          time?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "dead_crabs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      grn: {
        Row: {
          condition_remarks: string | null
          created_at: string
          created_by: string | null
          date: string
          delivered_by: string
          grn_number: string | null
          id: string
          item: string
          price: number | null
          quantity: number
          received_condition: boolean
          receiving_time: string
          status: string
          supplier_name: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          condition_remarks?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          delivered_by: string
          grn_number?: string | null
          id?: string
          item: string
          price?: number | null
          quantity: number
          received_condition: boolean
          receiving_time: string
          status?: string
          supplier_name: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          condition_remarks?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          delivered_by?: string
          grn_number?: string | null
          id?: string
          item?: string
          price?: number | null
          quantity?: number
          received_condition?: boolean
          receiving_time?: string
          status?: string
          supplier_name?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          date: string
          delivery_date: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_terms: string
          status: string
          supplier_details: Json
          supplier_name: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          date: string
          delivery_date: string
          id?: string
          items: Json
          notes?: string | null
          order_number: string
          payment_terms: string
          status?: string
          supplier_details: Json
          supplier_name: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          date?: string
          delivery_date?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_terms?: string
          status?: string
          supplier_details?: Json
          supplier_name?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          created_by: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          date: string
          id: string
          items: Json
          notes: string | null
          payment_method: string
          sale_number: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          date?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          sale_number?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          sale_number?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string
          contact_person: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          rating: number
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          contact_person: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          rating?: number
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          rating?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          severity: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      purchase_statistics: {
        Row: {
          avg_unit_price: number | null
          month: string | null
          order_count: number | null
          total_amount: number | null
          total_quantity: number | null
        }
        Relationships: []
      }
      stock_summary: {
        Row: {
          category: Database["public"]["Enums"]["crab_category"] | null
          damaged_pieces: number | null
          healthy_pieces: number | null
          last_updated: string | null
          report_type: Database["public"]["Enums"]["report_type"] | null
          total_entries: number | null
          total_pieces: number | null
          total_weight: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_grn_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sale_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      init_boxes_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_activity: {
        Args: {
          activity_type: string
          activity_message: string
          activity_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      box_status: "damaged" | "filled" | "empty"
      crab_category: "Boil" | "Large" | "XL" | "XXL" | "Jumbo"
      crab_status:
        | "Without one claw"
        | "Without two claw"
        | "Without one leg"
        | "Without two leg"
        | "Without three legs"
        | "Without four legs"
        | "Shell damage"
      health_status: "healthy" | "damaged"
      report_type: "TSF" | "Dutch_Trails"
      user_role: "admin" | "quality_control" | "purchasing" | "sale"
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
      box_status: ["damaged", "filled", "empty"],
      crab_category: ["Boil", "Large", "XL", "XXL", "Jumbo"],
      crab_status: [
        "Without one claw",
        "Without two claw",
        "Without one leg",
        "Without two leg",
        "Without three legs",
        "Without four legs",
        "Shell damage",
      ],
      health_status: ["healthy", "damaged"],
      report_type: ["TSF", "Dutch_Trails"],
      user_role: ["admin", "quality_control", "purchasing", "sale"],
    },
  },
} as const
