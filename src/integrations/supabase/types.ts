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
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      aiml_badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      aiml_capstones: {
        Row: {
          ai_feedback: string | null
          created_at: string
          day_number: number | null
          description: string | null
          github_url: string | null
          graded_at: string | null
          id: string
          phase: string | null
          score_code_quality: number | null
          score_correctness: number | null
          score_documentation: number | null
          score_ml_soundness: number | null
          score_originality: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          created_at?: string
          day_number?: number | null
          description?: string | null
          github_url?: string | null
          graded_at?: string | null
          id?: string
          phase?: string | null
          score_code_quality?: number | null
          score_correctness?: number | null
          score_documentation?: number | null
          score_ml_soundness?: number | null
          score_originality?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          created_at?: string
          day_number?: number | null
          description?: string | null
          github_url?: string | null
          graded_at?: string | null
          id?: string
          phase?: string | null
          score_code_quality?: number | null
          score_correctness?: number | null
          score_documentation?: number | null
          score_ml_soundness?: number | null
          score_originality?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aiml_journal: {
        Row: {
          blocker: boolean
          confusing: string | null
          created_at: string
          day_number: number
          id: string
          learned: string | null
          minutes_spent: number | null
          skip_reason: string | null
          skipped: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          blocker?: boolean
          confusing?: string | null
          created_at?: string
          day_number: number
          id?: string
          learned?: string | null
          minutes_spent?: number | null
          skip_reason?: string | null
          skipped?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          blocker?: boolean
          confusing?: string | null
          created_at?: string
          day_number?: number
          id?: string
          learned?: string | null
          minutes_spent?: number | null
          skip_reason?: string | null
          skipped?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aiml_lessons: {
        Row: {
          content: string
          created_at: string
          day_number: number
          id: string
          resources: Json
          track: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          day_number: number
          id?: string
          resources?: Json
          track?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          day_number?: number
          id?: string
          resources?: Json
          track?: string
          user_id?: string
        }
        Relationships: []
      }
      aiml_progress: {
        Row: {
          completed_at: string
          created_at: string
          day_number: number
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          day_number: number
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          day_number?: number
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      aiml_quizzes: {
        Row: {
          answers: Json | null
          attempts: number
          best_score: number | null
          created_at: string
          day_number: number
          id: string
          questions: Json
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempts?: number
          best_score?: number | null
          created_at?: string
          day_number: number
          id?: string
          questions: Json
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempts?: number
          best_score?: number | null
          created_at?: string
          day_number?: number
          id?: string
          questions?: Json
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aiml_resources: {
        Row: {
          created_at: string
          day_number: number
          id: string
          items: Json
          track: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          items?: Json
          track?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          items?: Json
          track?: string
          user_id?: string
        }
        Relationships: []
      }
      aiml_settings: {
        Row: {
          created_at: string
          daily_minutes: number | null
          freeze_tokens: number
          freezes_used: number
          id: string
          pace: string
          public_leaderboard: boolean
          reminder_enabled: boolean
          reminder_time: string | null
          start_date: string
          track: string
          updated_at: string
          user_id: string
          vacation_until: string | null
        }
        Insert: {
          created_at?: string
          daily_minutes?: number | null
          freeze_tokens?: number
          freezes_used?: number
          id?: string
          pace?: string
          public_leaderboard?: boolean
          reminder_enabled?: boolean
          reminder_time?: string | null
          start_date?: string
          track?: string
          updated_at?: string
          user_id: string
          vacation_until?: string | null
        }
        Update: {
          created_at?: string
          daily_minutes?: number | null
          freeze_tokens?: number
          freezes_used?: number
          id?: string
          pace?: string
          public_leaderboard?: boolean
          reminder_enabled?: boolean
          reminder_time?: string | null
          start_date?: string
          track?: string
          updated_at?: string
          user_id?: string
          vacation_until?: string | null
        }
        Relationships: []
      }
      aiml_subtasks: {
        Row: {
          created_at: string
          day_number: number
          done: boolean
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          done?: boolean
          id?: string
          position?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          done?: boolean
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      career_progress: {
        Row: {
          completed_at: string
          created_at: string
          day_index: number
          id: string
          note: string | null
          status: string
          track: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          day_index: number
          id?: string
          note?: string | null
          status?: string
          track: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          day_index?: number
          id?: string
          note?: string | null
          status?: string
          track?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          start_time: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          event_type?: string
          id?: string
          start_time: string
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          start_time?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          due_date: string
          ease: number
          front: string
          id: string
          interval_days: number
          last_reviewed: string | null
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          due_date?: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          due_date?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_minutes: number
          id: string
          session_type: string
          started_at: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_minutes: number
          id?: string
          session_type?: string
          started_at?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          started_at?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          subject_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_board: string
          ai_class: string
          ai_curriculum: string
          ai_difficulty: string
          ai_focus_subjects: string[]
          ai_image_gen: boolean
          ai_tone: string
          ai_web_search: boolean
          aiml_public: boolean
          avatar_url: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          last_active_date: string | null
          level: number
          streak_days: number
          theme: string
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          ai_board?: string
          ai_class?: string
          ai_curriculum?: string
          ai_difficulty?: string
          ai_focus_subjects?: string[]
          ai_image_gen?: boolean
          ai_tone?: string
          ai_web_search?: boolean
          aiml_public?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          theme?: string
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          ai_board?: string
          ai_class?: string
          ai_curriculum?: string
          ai_difficulty?: string
          ai_focus_subjects?: string[]
          ai_image_gen?: boolean
          ai_tone?: string
          ai_web_search?: boolean
          aiml_public?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          theme?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      timer_presets: {
        Row: {
          created_at: string
          id: string
          label: string
          minutes: number
          session_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          minutes: number
          session_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          minutes?: number
          session_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          handle: string | null
          level: number | null
          streak_days: number | null
          user_id: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          handle?: string | null
          level?: number | null
          streak_days?: number | null
          user_id?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          handle?: string | null
          level?: number | null
          streak_days?: number | null
          user_id?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_aiml_xp: {
        Args: { _amount?: number; _event: string }
        Returns: {
          level: number
          streak_days: number
          xp: number
        }[]
      }
      award_xp: {
        Args: { _event_type: string; _ref_id?: string }
        Returns: {
          level: number
          streak_days: number
          xp: number
        }[]
      }
      streak_multiplier: { Args: { _streak: number }; Returns: number }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
