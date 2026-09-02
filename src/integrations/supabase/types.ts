export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_roles: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      artist_knowledge: {
        Row: {
          artist_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artist_knowledge_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      artist_music_genres: {
        Row: {
          artist_id: string;
          created_at: string;
          id: string;
          music_genre_id: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          id?: string;
          music_genre_id: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          id?: string;
          music_genre_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artist_music_genres_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "artist_music_genres_music_genre_id_fkey";
            columns: ["music_genre_id"];
            isOneToOne: false;
            referencedRelation: "music_genres";
            referencedColumns: ["id"];
          },
        ];
      };
      artist_notes: {
        Row: {
          artist_id: string;
          created_at: string;
          id: string;
          note_content: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          id?: string;
          note_content: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          id?: string;
          note_content?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      artists: {
        Row: {
          added_by: string;
          archived: boolean;
          created_at: string;
          description: string | null;
          estimated_date: string | null;
          id: string;
          image_url: string | null;
          name: string;
          slug: string;
          soundcloud_url: string | null;
          spotify_url: string | null;
          stage: string | null;
          time_end: string | null;
          time_start: string | null;
          updated_at: string;
        };
        Insert: {
          added_by: string;
          archived?: boolean;
          created_at?: string;
          description?: string | null;
          estimated_date?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          slug: string;
          soundcloud_url?: string | null;
          spotify_url?: string | null;
          stage?: string | null;
          time_end?: string | null;
          time_start?: string | null;
          updated_at?: string;
        };
        Update: {
          added_by?: string;
          archived?: boolean;
          created_at?: string;
          description?: string | null;
          estimated_date?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          slug?: string;
          soundcloud_url?: string | null;
          spotify_url?: string | null;
          stage?: string | null;
          time_end?: string | null;
          time_start?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      custom_links: {
        Row: {
          created_at: string | null;
          display_order: number | null;
          festival_id: string;
          id: string;
          link_type: Database["public"]["Enums"]["link_type"];
          title: string;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number | null;
          festival_id: string;
          id?: string;
          link_type?: Database["public"]["Enums"]["link_type"];
          title: string;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          display_order?: number | null;
          festival_id?: string;
          id?: string;
          link_type?: Database["public"]["Enums"]["link_type"];
          title?: string;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_links_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      festival_editions: {
        Row: {
          archived: boolean;
          created_at: string;
          description: string | null;
          end_date: string | null;
          festival_id: string;
          id: string;
          is_active: boolean;
          location: string | null;
          name: string;
          phase_override: Database["public"]["Enums"]["festival_phase"] | null;
          published: boolean | null;
          schedule_reveal_level: Database["public"]["Enums"]["schedule_reveal_level"];
          slug: string;
          start_date: string | null;
          updated_at: string;
          year: number;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          festival_id: string;
          id?: string;
          is_active?: boolean;
          location?: string | null;
          name: string;
          phase_override?: Database["public"]["Enums"]["festival_phase"] | null;
          published?: boolean | null;
          schedule_reveal_level?: Database["public"]["Enums"]["schedule_reveal_level"];
          slug: string;
          start_date?: string | null;
          updated_at?: string;
          year: number;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          festival_id?: string;
          id?: string;
          is_active?: boolean;
          location?: string | null;
          name?: string;
          phase_override?: Database["public"]["Enums"]["festival_phase"] | null;
          published?: boolean | null;
          schedule_reveal_level?: Database["public"]["Enums"]["schedule_reveal_level"];
          slug?: string;
          start_date?: string | null;
          updated_at?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "festival_editions_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      festival_info: {
        Row: {
          created_at: string;
          facebook_url: string | null;
          festival_id: string;
          id: string;
          info_text: string | null;
          instagram_url: string | null;
          map_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          facebook_url?: string | null;
          festival_id: string;
          id?: string;
          info_text?: string | null;
          instagram_url?: string | null;
          map_image_url?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          facebook_url?: string | null;
          festival_id?: string;
          id?: string;
          info_text?: string | null;
          instagram_url?: string | null;
          map_image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "festival_info_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: true;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      festivals: {
        Row: {
          archived: boolean;
          created_at: string;
          day_start_hour: number;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          published: boolean | null;
          slug: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          day_start_hour?: number;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          published?: boolean | null;
          slug: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          day_start_hour?: number;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          published?: boolean | null;
          slug?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_invites: {
        Row: {
          created_at: string;
          created_by: string;
          expires_at: string | null;
          group_id: string;
          id: string;
          invite_token: string;
          is_active: boolean;
          max_uses: number | null;
          used_count: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          group_id: string;
          id?: string;
          invite_token: string;
          is_active?: boolean;
          max_uses?: number | null;
          used_count?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          group_id?: string;
          id?: string;
          invite_token?: string;
          is_active?: boolean;
          max_uses?: number | null;
          used_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          archived: boolean;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      music_genres: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active_group_id: string | null;
          active_scope: Database["public"]["Enums"]["active_scope"] | null;
          completed_onboarding: boolean | null;
          created_at: string;
          email: string | null;
          id: string;
          use_24_hour: boolean;
          username: string | null;
        };
        Insert: {
          active_group_id?: string | null;
          active_scope?: Database["public"]["Enums"]["active_scope"] | null;
          completed_onboarding?: boolean | null;
          created_at?: string;
          email?: string | null;
          id: string;
          use_24_hour?: boolean;
          username?: string | null;
        };
        Update: {
          active_group_id?: string | null;
          active_scope?: Database["public"]["Enums"]["active_scope"] | null;
          completed_onboarding?: boolean | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          use_24_hour?: boolean;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_active_group_id_fkey";
            columns: ["active_group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      set_artists: {
        Row: {
          artist_id: string;
          created_at: string;
          id: string;
          role: string | null;
          set_id: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          id?: string;
          role?: string | null;
          set_id: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          id?: string;
          role?: string | null;
          set_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "set_artists_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "set_artists_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "sets";
            referencedColumns: ["id"];
          },
        ];
      };
      sets: {
        Row: {
          archived: boolean;
          created_at: string;
          created_by: string;
          description: string | null;
          external_url: string | null;
          festival_edition_id: string;
          id: string;
          name: string;
          set_type: string | null;
          slug: string;
          stage_id: string | null;
          time_end: string | null;
          time_start: string | null;
          updated_at: string;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          created_by: string;
          description?: string | null;
          external_url?: string | null;
          festival_edition_id: string;
          id?: string;
          name: string;
          set_type?: string | null;
          slug: string;
          stage_id?: string | null;
          time_end?: string | null;
          time_start?: string | null;
          updated_at?: string;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          external_url?: string | null;
          festival_edition_id?: string;
          id?: string;
          name?: string;
          set_type?: string | null;
          slug?: string;
          stage_id?: string | null;
          time_end?: string | null;
          time_start?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sets_festival_edition_id_fkey";
            columns: ["festival_edition_id"];
            isOneToOne: false;
            referencedRelation: "festival_editions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sets_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
      soundcloud: {
        Row: {
          artist_id: string;
          created_at: string | null;
          display_name: string | null;
          followers_count: number | null;
          id: string;
          last_sync: string | null;
          playlist_title: string | null;
          playlist_url: string | null;
          soundcloud_id: number | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          artist_id: string;
          created_at?: string | null;
          display_name?: string | null;
          followers_count?: number | null;
          id?: string;
          last_sync?: string | null;
          playlist_title?: string | null;
          playlist_url?: string | null;
          soundcloud_id?: number | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          artist_id?: string;
          created_at?: string | null;
          display_name?: string | null;
          followers_count?: number | null;
          id?: string;
          last_sync?: string | null;
          playlist_title?: string | null;
          playlist_url?: string | null;
          soundcloud_id?: number | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "soundcloud_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: true;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      stages: {
        Row: {
          archived: boolean;
          color: string | null;
          created_at: string;
          festival_edition_id: string;
          id: string;
          name: string;
          slug: string;
          stage_order: number;
          updated_at: string;
        };
        Insert: {
          archived?: boolean;
          color?: string | null;
          created_at?: string;
          festival_edition_id: string;
          id?: string;
          name: string;
          slug: string;
          stage_order?: number;
          updated_at?: string;
        };
        Update: {
          archived?: boolean;
          color?: string | null;
          created_at?: string;
          festival_edition_id?: string;
          id?: string;
          name?: string;
          slug?: string;
          stage_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          created_at: string;
          id: string;
          set_id: string;
          updated_at: string;
          user_id: string;
          vote_type: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          set_id: string;
          updated_at?: string;
          user_id: string;
          vote_type: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          set_id?: string;
          updated_at?: string;
          user_id?: string;
          vote_type?: number;
        };
        Relationships: [
          {
            foreignKeyName: "votes_user_id_profiles_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "sets";
            referencedColumns: ["id"];
          },
        ];
      };
      set_ratings: {
        Row: {
          created_at: string;
          id: string;
          rating: number;
          set_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          rating: number;
          set_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          rating?: number;
          set_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "set_ratings_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "sets";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bootstrap_super_admin: { Args: { user_email: string }; Returns: boolean };
      can_edit_artists: { Args: { check_user_id: string }; Returns: boolean };
      check_username_exists: {
        Args: { check_username: string; exclude_user_id?: string };
        Returns: boolean;
      };
      duplicate_set_with_votes:
        | {
            Args: {
              new_time_end: string;
              new_time_start: string;
              source_set_id: string;
            };
            Returns: string;
          }
        | {
            Args: {
              new_description?: string;
              new_stage_id?: string;
              new_time_end: string;
              new_time_start: string;
              source_set_id: string;
            };
            Returns: string;
          };
      get_user_id_by_email: { Args: { user_email: string }; Returns: string };
      group_member_counts: {
        Args: { p_group_ids: string[] };
        Returns: {
          group_id: string;
          member_count: number;
        }[];
      };
      has_admin_role: {
        Args: {
          check_role: Database["public"]["Enums"]["admin_role"];
          check_user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { check_user_id: string }; Returns: boolean };
      is_group_creator: { Args: { group_id_param: string }; Returns: boolean };
      is_group_member: { Args: { group_id_param: string }; Returns: boolean };
      promote_user_to_admin: {
        Args: {
          target_role?: Database["public"]["Enums"]["admin_role"];
          user_email: string;
        };
        Returns: boolean;
      };
      use_invite_token: {
        Args: { token: string; user_id: string };
        Returns: {
          group_id: string;
          message: string;
          success: boolean;
        }[];
      };
      user_vote_counts: {
        Args: { p_user_ids: string[] };
        Returns: {
          user_id: string;
          vote_count: number;
        }[];
      };
      users_share_group: {
        Args: { user1_id: string; user2_id: string };
        Returns: boolean;
      };
      validate_invite_token: {
        Args: { token: string };
        Returns: {
          group_id: string;
          group_name: string;
          invite_id: string;
          is_valid: boolean;
          reason: string;
        }[];
      };
      validate_profile_update: {
        Args: { new_username?: string; user_id: string };
        Returns: string;
      };
    };
    Enums: {
      active_scope: "group" | "everyone" | "me";
      admin_role: "super_admin" | "admin" | "moderator";
      festival_phase: "pre-schedule" | "planning" | "live" | "post-festival";
      link_type: "website" | "tickets" | "custom";
      schedule_reveal_level: "draft" | "days" | "stages" | "full";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["super_admin", "admin", "moderator"],
      link_type: ["website", "tickets", "custom"],
    },
  },
} as const;
