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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendees: {
        Row: {
          created_at: string
          discord_handle: string | null
          email: string | null
          engagement_score: number | null
          event_id: string
          has_engaged: boolean | null
          id: string
          name: string
          rsvp_status: string | null
          ticket_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_handle?: string | null
          email?: string | null
          engagement_score?: number | null
          event_id: string
          has_engaged?: boolean | null
          id?: string
          name: string
          rsvp_status?: string | null
          ticket_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_handle?: string | null
          email?: string | null
          engagement_score?: number | null
          event_id?: string
          has_engaged?: boolean | null
          id?: string
          name?: string
          rsvp_status?: string | null
          ticket_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_activity_logs: {
        Row: {
          action_type: string
          command_name: string | null
          created_at: string | null
          details: Json | null
          discord_id: string
          error_message: string | null
          id: string
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          command_name?: string | null
          created_at?: string | null
          details?: Json | null
          discord_id: string
          error_message?: string | null
          id?: string
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          command_name?: string | null
          created_at?: string | null
          details?: Json | null
          discord_id?: string
          error_message?: string | null
          id?: string
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discord_users"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_metadata: {
        Row: {
          ai_personality_context: Json | null
          channel_id: string
          channel_name: string
          channel_purpose: string | null
          created_at: string
          created_by: string
          guild_id: string
          id: string
          last_activity: string | null
          message_count: number | null
          updated_at: string
        }
        Insert: {
          ai_personality_context?: Json | null
          channel_id: string
          channel_name: string
          channel_purpose?: string | null
          created_at?: string
          created_by: string
          guild_id: string
          id?: string
          last_activity?: string | null
          message_count?: number | null
          updated_at?: string
        }
        Update: {
          ai_personality_context?: Json | null
          channel_id?: string
          channel_name?: string
          channel_purpose?: string | null
          created_at?: string
          created_by?: string
          guild_id?: string
          id?: string
          last_activity?: string | null
          message_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          ai_response: string | null
          channel_id: string
          context_used: Json | null
          created_at: string
          guild_id: string
          id: string
          message_content: string | null
          message_timestamp: string
          sender_id: string
          sender_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          channel_id: string
          context_used?: Json | null
          created_at?: string
          guild_id: string
          id?: string
          message_content?: string | null
          message_timestamp?: string
          sender_id: string
          sender_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_response?: string | null
          channel_id?: string
          context_used?: Json | null
          created_at?: string
          guild_id?: string
          id?: string
          message_content?: string | null
          message_timestamp?: string
          sender_id?: string
          sender_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_analysis: Json | null
          ai_response: string | null
          channel_id: string
          created_at: string
          discord_message_id: string
          discord_user_id: string
          engagement_level: string | null
          event_id: string | null
          id: string
          message_content: string | null
          response_message_id: string | null
          sentiment_score: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_response?: string | null
          channel_id: string
          created_at?: string
          discord_message_id: string
          discord_user_id: string
          engagement_level?: string | null
          event_id?: string | null
          id?: string
          message_content?: string | null
          response_message_id?: string | null
          sentiment_score?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_response?: string | null
          channel_id?: string
          created_at?: string
          discord_message_id?: string
          discord_user_id?: string
          engagement_level?: string | null
          event_id?: string | null
          id?: string
          message_content?: string | null
          response_message_id?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_users: {
        Row: {
          created_at: string | null
          discord_id: string
          discord_tag: string | null
          discord_username: string | null
          first_interaction: string | null
          id: string
          is_event_host: boolean | null
          last_activity: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discord_id: string
          discord_tag?: string | null
          discord_username?: string | null
          first_interaction?: string | null
          id?: string
          is_event_host?: boolean | null
          last_activity?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discord_id?: string
          discord_tag?: string | null
          discord_username?: string | null
          first_interaction?: string | null
          id?: string
          is_event_host?: boolean | null
          last_activity?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_forwards: {
        Row: {
          body_preview: string | null
          created_at: string | null
          discord_message_id: string | null
          email_id: string
          error_message: string | null
          forwarded_at: string | null
          forwarded_to_discord: boolean | null
          from_address: string
          id: string
          subject: string | null
          to_address: string
          user_id: string | null
        }
        Insert: {
          body_preview?: string | null
          created_at?: string | null
          discord_message_id?: string | null
          email_id: string
          error_message?: string | null
          forwarded_at?: string | null
          forwarded_to_discord?: boolean | null
          from_address: string
          id?: string
          subject?: string | null
          to_address: string
          user_id?: string | null
        }
        Update: {
          body_preview?: string | null
          created_at?: string | null
          discord_message_id?: string | null
          email_id?: string
          error_message?: string | null
          forwarded_at?: string | null
          forwarded_to_discord?: boolean | null
          from_address?: string
          id?: string
          subject?: string | null
          to_address?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_forwards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discord_users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          channel_id: string | null
          created_at: string
          event_date: string | null
          event_name: string
          event_theme: string | null
          event_time: string | null
          guild_id: string
          host_discord_id: string
          id: string
          others: Json | null
          post_event_channel_id: string | null
          status: string | null
          total_attendees: number | null
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          event_date?: string | null
          event_name: string
          event_theme?: string | null
          event_time?: string | null
          guild_id: string
          host_discord_id: string
          id?: string
          others?: Json | null
          post_event_channel_id?: string | null
          status?: string | null
          total_attendees?: number | null
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          event_date?: string | null
          event_name?: string
          event_theme?: string | null
          event_time?: string | null
          guild_id?: string
          host_discord_id?: string
          id?: string
          others?: Json | null
          post_event_channel_id?: string | null
          status?: string | null
          total_attendees?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      guild_settings: {
        Row: {
          admin_role: string | null
          ai_personality: string | null
          analytics_enabled: boolean | null
          bot_added_by: string
          created_at: string
          event_channel: string | null
          guild_id: string
          id: string
          settings: Json | null
          tagging_mode: string | null
          updated_at: string
        }
        Insert: {
          admin_role?: string | null
          ai_personality?: string | null
          analytics_enabled?: boolean | null
          bot_added_by: string
          created_at?: string
          event_channel?: string | null
          guild_id: string
          id?: string
          settings?: Json | null
          tagging_mode?: string | null
          updated_at?: string
        }
        Update: {
          admin_role?: string | null
          ai_personality?: string | null
          analytics_enabled?: boolean | null
          bot_added_by?: string
          created_at?: string
          event_channel?: string | null
          guild_id?: string
          id?: string
          settings?: Json | null
          tagging_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_channel_preferences: {
        Row: {
          channel_id: string
          created_at: string
          guild_id: string
          id: string
          is_active: boolean | null
          preference_description: string | null
          preference_type: string
          preference_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          guild_id: string
          id?: string
          is_active?: boolean | null
          preference_description?: string | null
          preference_type: string
          preference_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          guild_id?: string
          id?: string
          is_active?: boolean | null
          preference_description?: string | null
          preference_type?: string
          preference_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_temp_emails: {
        Row: {
          created_at: string | null
          deactivated_at: string | null
          email_address: string
          email_domain: string
          email_password: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deactivated_at?: string | null
          email_address: string
          email_domain: string
          email_password: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deactivated_at?: string | null
          email_address?: string
          email_domain?: string
          email_password?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_temp_emails_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discord_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_temp_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "discord_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deactivate_expired_emails: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_conversation_context: {
        Args: { p_channel_id: string; p_limit?: number; p_user_id: string }
        Returns: {
          ai_response: string
          message_content: string
          message_timestamp: string
          sender_id: string
          sender_username: string
        }[]
      }
      get_user_channel_preferences: {
        Args: { p_channel_id: string; p_user_id: string }
        Returns: {
          preference_description: string
          preference_type: string
          preference_value: string
        }[]
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
