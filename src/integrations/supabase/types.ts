export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      conversation_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          created_at: string | null
          id: string
          phase: string | null
          roadmap_generated: boolean | null
          session_data: Json | null
          session_token: string | null
          updated_at: string | null
          user_profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          phase?: string | null
          roadmap_generated?: boolean | null
          session_data?: Json | null
          session_token?: string | null
          updated_at?: string | null
          user_profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phase?: string | null
          roadmap_generated?: boolean | null
          session_data?: Json | null
          session_token?: string | null
          updated_at?: string | null
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_suggestions: {
        Row: {
          created_at: string
          id: string
          message_context: string
          session_id: string
          suggestions: Json
        }
        Insert: {
          created_at?: string
          id?: string
          message_context: string
          session_id: string
          suggestions: Json
        }
        Update: {
          created_at?: string
          id?: string
          message_context?: string
          session_id?: string
          suggestions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "conversation_suggestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_domains: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_foundational: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_foundational?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_foundational?: boolean | null
          name?: string
        }
        Relationships: []
      }
      learning_phases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      resource_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_category_mappings: {
        Row: {
          category_id: string
          created_at: string
          id: string
          relevance_score: number | null
          resource_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          relevance_score?: number | null
          resource_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          relevance_score?: number | null
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_category_mappings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_domain_mappings: {
        Row: {
          created_at: string
          domain_id: string
          id: string
          relevance_score: number | null
          resource_id: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          id?: string
          relevance_score?: number | null
          resource_id: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          id?: string
          relevance_score?: number | null
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_domain_mappings_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "learning_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_domain_mappings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_phase_mappings: {
        Row: {
          created_at: string
          id: string
          phase_id: string
          relevance_score: number | null
          resource_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phase_id: string
          relevance_score?: number | null
          resource_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phase_id?: string
          relevance_score?: number | null
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_phase_mappings_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "learning_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_phase_mappings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          cost_type: string
          created_at: string
          description: string | null
          difficulty_level: string
          duration_hours: number | null
          id: string
          is_core_foundational: boolean | null
          learning_outcomes: string[] | null
          prerequisites: string[] | null
          provider: string
          quality_score: number | null
          rating: number | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          cost_type: string
          created_at?: string
          description?: string | null
          difficulty_level: string
          duration_hours?: number | null
          id?: string
          is_core_foundational?: boolean | null
          learning_outcomes?: string[] | null
          prerequisites?: string[] | null
          provider: string
          quality_score?: number | null
          rating?: number | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          cost_type?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string
          duration_hours?: number | null
          id?: string
          is_core_foundational?: boolean | null
          learning_outcomes?: string[] | null
          prerequisites?: string[] | null
          provider?: string
          quality_score?: number | null
          rating?: number | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          ai_interests: string[] | null
          available_time_per_week: number | null
          career_goals: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          experience_level: string | null
          id: string
          learning_goals: string[] | null
          name: string | null
          preferred_learning_style: string | null
          role_current: string | null
          technical_background: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_interests?: string[] | null
          available_time_per_week?: number | null
          career_goals?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          experience_level?: string | null
          id?: string
          learning_goals?: string[] | null
          name?: string | null
          preferred_learning_style?: string | null
          role_current?: string | null
          technical_background?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_interests?: string[] | null
          available_time_per_week?: number | null
          career_goals?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          experience_level?: string | null
          id?: string
          learning_goals?: string[] | null
          name?: string | null
          preferred_learning_style?: string | null
          role_current?: string | null
          technical_background?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_conversations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
