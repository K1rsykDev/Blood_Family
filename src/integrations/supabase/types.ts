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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          age: number
          created_at: string | null
          discord_id: string | null
          id: number
          motive: string
          playtime: string
          static: string
          status: Database["public"]["Enums"]["application_status"] | null
          timezone: string
          username: string
        }
        Insert: {
          age: number
          created_at?: string | null
          discord_id?: string | null
          id?: number
          motive: string
          playtime: string
          static: string
          status?: Database["public"]["Enums"]["application_status"] | null
          timezone: string
          username: string
        }
        Update: {
          age?: number
          created_at?: string | null
          discord_id?: string | null
          id?: number
          motive?: string
          playtime?: string
          static?: string
          status?: Database["public"]["Enums"]["application_status"] | null
          timezone?: string
          username?: string
        }
        Relationships: []
      }
      bc_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_leaders: {
        Row: {
          content: string
          id: number
          updated_at: string | null
        }
        Insert: {
          content?: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          content?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      cinema_chat: {
        Row: {
          created_at: string
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cinema_chat_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "cinema_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cinema_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cinema_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cinema_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "cinema_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cinema_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cinema_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          current_video_url: string | null
          id: string
          max_seats: number
          name: string
          updated_at: string
          video_playing: boolean | null
          video_time: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_video_url?: string | null
          id?: string
          max_seats?: number
          name: string
          updated_at?: string
          video_playing?: boolean | null
          video_time?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_video_url?: string | null
          id?: string
          max_seats?: number
          name?: string
          updated_at?: string
          video_playing?: boolean | null
          video_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cinema_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          discord_id: string | null
          id: number
          image_url: string | null
          notified: boolean | null
          status: Database["public"]["Enums"]["contract_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: number
          image_url?: string | null
          notified?: boolean | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          discord_id?: string | null
          id?: number
          image_url?: string | null
          notified?: boolean | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          last_message_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          id?: string
          last_message_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          id?: string
          last_message_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          can_change_username: boolean
          can_view_contracts: boolean
          color: string
          created_at: string | null
          created_by: string | null
          display_name: string
          has_admin_access: boolean
          has_developer_access: boolean
          has_giveaways_access: boolean
          has_news_access: boolean
          has_reports_access: boolean
          has_roulette_access: boolean
          id: string
          name: string
        }
        Insert: {
          can_change_username?: boolean
          can_view_contracts?: boolean
          color?: string
          created_at?: string | null
          created_by?: string | null
          display_name: string
          has_admin_access?: boolean
          has_developer_access?: boolean
          has_giveaways_access?: boolean
          has_news_access?: boolean
          has_reports_access?: boolean
          has_roulette_access?: boolean
          id?: string
          name: string
        }
        Update: {
          can_change_username?: boolean
          can_view_contracts?: boolean
          color?: string
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          has_admin_access?: boolean
          has_developer_access?: boolean
          has_giveaways_access?: boolean
          has_news_access?: boolean
          has_reports_access?: boolean
          has_roulette_access?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      general_chat: {
        Row: {
          created_at: string | null
          id: string
          message: string
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_chat_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "general_chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_participants: {
        Row: {
          created_at: string
          giveaway_id: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          giveaway_id: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          giveaway_id?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_participants_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaway_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          created_at: string | null
          description: string
          ends_at: string
          id: number
          image_url: string | null
          is_active: boolean | null
          prize: string
          title: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          ends_at: string
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          prize: string
          title: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          ends_at?: string
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          prize?: string
          title?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaways_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          id: string
          reason: string
          responded_by: string | null
          status: string
          updated_at: string
          user_id: string
          username_ingame: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          responded_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username_ingame: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          responded_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username_ingame?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          message_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          message_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          message_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          content: string
          created_at: string | null
          id: number
          image_url: string | null
          published_at: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          published_at?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          published_at?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_likes: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_likes_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_likes_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_code_verified: boolean | null
          avatar_url: string | null
          banner_url: string | null
          bc_balance: number
          created_at: string | null
          custom_role_id: string | null
          discord_id: string | null
          has_nickname_glow: boolean
          id: string
          nickname_gradient_end: string | null
          nickname_gradient_start: string | null
          password_reset_required: boolean | null
          position_responsibility: string | null
          position_title: string | null
          position_title_color: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          sort_priority: number
          static: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          admin_code_verified?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          bc_balance?: number
          created_at?: string | null
          custom_role_id?: string | null
          discord_id?: string | null
          has_nickname_glow?: boolean
          id: string
          nickname_gradient_end?: string | null
          nickname_gradient_start?: string | null
          password_reset_required?: boolean | null
          position_responsibility?: string | null
          position_title?: string | null
          position_title_color?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          sort_priority?: number
          static?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          admin_code_verified?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          bc_balance?: number
          created_at?: string | null
          custom_role_id?: string | null
          discord_id?: string | null
          has_nickname_glow?: boolean
          id?: string
          nickname_gradient_end?: string | null
          nickname_gradient_start?: string | null
          password_reset_required?: boolean | null
          position_responsibility?: string | null
          position_title?: string | null
          position_title_color?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          sort_priority?: number
          static?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          created_at: string
          description: string
          field: string
          icon: string
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          field: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          field?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          admin_code: string | null
          background_url: string | null
          garland_enabled: boolean | null
          id: number
          maintenance_mode: boolean | null
          member_count: number | null
          nav_labels: Json | null
          primary_color: string | null
          show_admin_code: boolean | null
          snow_enabled: boolean | null
          social_discord: string | null
          social_telegram: string | null
          social_tiktok: string | null
          social_youtube: string | null
          updated_at: string | null
        }
        Insert: {
          admin_code?: string | null
          background_url?: string | null
          garland_enabled?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          member_count?: number | null
          nav_labels?: Json | null
          primary_color?: string | null
          show_admin_code?: boolean | null
          snow_enabled?: boolean | null
          social_discord?: string | null
          social_telegram?: string | null
          social_tiktok?: string | null
          social_youtube?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_code?: string | null
          background_url?: string | null
          garland_enabled?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          member_count?: number | null
          nav_labels?: Json | null
          primary_color?: string | null
          show_admin_code?: boolean | null
          snow_enabled?: boolean | null
          social_discord?: string | null
          social_telegram?: string | null
          social_tiktok?: string | null
          social_youtube?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          responded_by: string | null
          status: string
          telegram_chat_id: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          responded_by?: string | null
          status?: string
          telegram_chat_id: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          responded_by?: string | null
          status?: string
          telegram_chat_id?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_connections: {
        Row: {
          connected_at: string | null
          connection_code: string
          created_at: string
          id: string
          is_connected: boolean
          telegram_chat_id: string | null
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          connection_code: string
          created_at?: string
          id?: string
          is_connected?: boolean
          telegram_chat_id?: string | null
          user_id: string
        }
        Update: {
          connected_at?: string | null
          connection_code?: string
          created_at?: string
          id?: string
          is_connected?: boolean
          telegram_chat_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vacations: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string
          responded_by: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
          vacation_type: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason: string
          responded_by?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
          vacation_type?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          responded_by?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          vacation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacations_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_connection_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_developer: { Args: { _user_id: string }; Returns: boolean }
      is_developer: { Args: { _user_id: string }; Returns: boolean }
      is_member_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "guest" | "member" | "admin" | "developer"
      application_status: "pending" | "accepted" | "rejected"
      contract_status: "pending" | "approved" | "paid" | "rejected"
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
      app_role: ["guest", "member", "admin", "developer"],
      application_status: ["pending", "accepted", "rejected"],
      contract_status: ["pending", "approved", "paid", "rejected"],
    },
  },
} as const
