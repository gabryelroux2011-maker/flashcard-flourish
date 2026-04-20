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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string
          deck_id: string
          id: string
          key_points: Json
          position: number
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          id?: string
          key_points?: Json
          position?: number
          summary: string
          title: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          id?: string
          key_points?: Json
          position?: number
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          created_at: string
          description: string | null
          folder_id: string | null
          grade_level: string | null
          id: string
          source_text: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          folder_id?: string | null
          grade_level?: string | null
          id?: string
          source_text?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          folder_id?: string | null
          grade_level?: string | null
          id?: string
          source_text?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      english_tests: {
        Row: {
          cefr_level: string
          comprehension_score: number | null
          created_at: string
          duration_seconds: number
          feedback: string | null
          grade_level: string | null
          grammar_score: number | null
          id: string
          overall_score: number
          question_count: number
          questions: Json
          speciality: string | null
          vocabulary_score: number | null
        }
        Insert: {
          cefr_level: string
          comprehension_score?: number | null
          created_at?: string
          duration_seconds?: number
          feedback?: string | null
          grade_level?: string | null
          grammar_score?: number | null
          id?: string
          overall_score?: number
          question_count?: number
          questions?: Json
          speciality?: string | null
          vocabulary_score?: number | null
        }
        Update: {
          cefr_level?: string
          comprehension_score?: number | null
          created_at?: string
          duration_seconds?: number
          feedback?: string | null
          grade_level?: string | null
          grammar_score?: number | null
          id?: string
          overall_score?: number
          question_count?: number
          questions?: Json
          speciality?: string | null
          vocabulary_score?: number | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      mindmaps: {
        Row: {
          created_at: string
          deck_id: string
          edges: Json
          id: string
          nodes: Json
          title: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          edges?: Json
          id?: string
          nodes?: Json
          title: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          edges?: Json
          id?: string
          nodes?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "mindmaps_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          attempts: Json
          created_at: string
          deck_id: string
          id: string
          questions: Json
          title: string
        }
        Insert: {
          attempts?: Json
          created_at?: string
          deck_id: string
          id?: string
          questions?: Json
          title: string
        }
        Update: {
          attempts?: Json
          created_at?: string
          deck_id?: string
          id?: string
          questions?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
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
