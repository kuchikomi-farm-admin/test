export type MemberRank = "standard" | "gold" | "platinum" | "diamond"
export type UserRole = "member" | "admin"
export type UserStatus = "pending" | "active" | "suspended"
export type DbContentType = "article" | "video" | "external"
export type DbContentStatus = "draft" | "scheduled" | "published"
export type InteractionType = "view" | "like" | "bookmark"
export type UnlockConditionType =
  | "content_views_3"
  | "profile_completed"
  | "first_share"
  | "feedback_sent"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          member_id: string
          display_name: string
          email: string
          phone: string | null
          bio: string | null
          location: string | null
          company: string | null
          position: string | null
          avatar_url: string | null
          rank: MemberRank
          role: UserRole
          status: UserStatus
          screening_answer: string | null
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          email: string
          member_id?: string
          phone?: string | null
          bio?: string | null
          location?: string | null
          company?: string | null
          position?: string | null
          avatar_url?: string | null
          rank?: MemberRank
          role?: UserRole
          status?: UserStatus
          screening_answer?: string | null
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          email?: string
          member_id?: string
          phone?: string | null
          bio?: string | null
          location?: string | null
          company?: string | null
          position?: string | null
          avatar_url?: string | null
          rank?: MemberRank
          role?: UserRole
          status?: UserStatus
          screening_answer?: string | null
          invited_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          id: string
          code: string
          created_by: string
          used_by: string | null
          is_used: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          code: string
          created_by: string
          id?: string
          used_by?: string | null
          is_used?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          code?: string
          created_by?: string
          id?: string
          used_by?: string | null
          is_used?: boolean
          expires_at?: string | null
        }
        Relationships: []
      }
      invite_slots: {
        Row: {
          id: string
          user_id: string
          initial_slots: number
          bonus_slots: number
          used_slots: number
          updated_at: string
        }
        Insert: {
          user_id: string
          id?: string
          initial_slots?: number
          bonus_slots?: number
          used_slots?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          initial_slots?: number
          bonus_slots?: number
          used_slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      slot_unlock_conditions: {
        Row: {
          id: string
          user_id: string
          condition: UnlockConditionType
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          user_id: string
          condition: UnlockConditionType
          id?: string
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string | null
          invite_code_id: string | null
          clicked_at: string
          registered_at: string | null
        }
        Insert: {
          referrer_id: string
          id?: string
          referred_id?: string | null
          invite_code_id?: string | null
          clicked_at?: string
          registered_at?: string | null
        }
        Update: {
          referred_id?: string | null
          registered_at?: string | null
        }
        Relationships: []
      }
      contents: {
        Row: {
          id: string
          type: DbContentType
          title: string
          description: string | null
          body: string | null
          status: DbContentStatus
          publish_date: string | null
          author_id: string | null
          author_name: string
          author_bio: string | null
          thumbnail_url: string | null
          url: string | null
          duration: string | null
          views: number
          likes: number
          premium: boolean
          required_rank: MemberRank
          created_at: string
          updated_at: string
        }
        Insert: {
          type: DbContentType
          title: string
          author_name: string
          id?: string
          description?: string | null
          body?: string | null
          status?: DbContentStatus
          publish_date?: string | null
          author_id?: string | null
          author_bio?: string | null
          thumbnail_url?: string | null
          url?: string | null
          duration?: string | null
          views?: number
          likes?: number
          premium?: boolean
          required_rank?: MemberRank
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: DbContentType
          title?: string
          author_name?: string
          description?: string | null
          body?: string | null
          status?: DbContentStatus
          publish_date?: string | null
          author_id?: string | null
          author_bio?: string | null
          thumbnail_url?: string | null
          url?: string | null
          duration?: string | null
          views?: number
          likes?: number
          premium?: boolean
          required_rank?: MemberRank
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          name: string
          id?: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          content_id: string
          tag_id: string
        }
        Insert: {
          content_id: string
          tag_id: string
        }
        Update: {
          content_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      content_interactions: {
        Row: {
          id: string
          user_id: string
          content_id: string
          type: InteractionType
          created_at: string
        }
        Insert: {
          user_id: string
          content_id: string
          type: InteractionType
          id?: string
          created_at?: string
        }
        Update: {
          type?: InteractionType
        }
        Relationships: []
      }
      rewards: {
        Row: {
          id: string
          title: string
          description: string
          required_referrals: number
          icon: string
          status: string
          created_at: string
        }
        Insert: {
          title: string
          description: string
          required_referrals: number
          id?: string
          icon?: string
          status?: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          required_referrals?: number
          icon?: string
          status?: string
        }
        Relationships: []
      }
      reward_claims: {
        Row: {
          id: string
          user_id: string
          reward_id: string
          status: string
          claimed_at: string
          granted_at: string | null
        }
        Insert: {
          user_id: string
          reward_id: string
          id?: string
          status?: string
          claimed_at?: string
          granted_at?: string | null
        }
        Update: {
          status?: string
          granted_at?: string | null
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          id: string
          title: string
          body: string
          target_rank: string
          status: string
          sent_at: string
          created_by: string | null
        }
        Insert: {
          title: string
          body: string
          id?: string
          target_rank?: string
          status?: string
          sent_at?: string
          created_by?: string | null
        }
        Update: {
          title?: string
          body?: string
          target_rank?: string
          status?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          user_id: string
          email_new_content: boolean
          email_newsletter: boolean
          email_invite_update: boolean
          line_new_content: boolean
          line_reward: boolean
          push_browser: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          email_new_content?: boolean
          email_newsletter?: boolean
          email_invite_update?: boolean
          line_new_content?: boolean
          line_reward?: boolean
          push_browser?: boolean
          updated_at?: string
        }
        Update: {
          email_new_content?: boolean
          email_newsletter?: boolean
          email_invite_update?: boolean
          line_new_content?: boolean
          line_reward?: boolean
          push_browser?: boolean
        }
        Relationships: []
      }
      login_history: {
        Row: {
          id: string
          user_id: string
          device: string | null
          ip_address: string | null
          logged_in_at: string
        }
        Insert: {
          user_id: string
          id?: string
          device?: string | null
          ip_address?: string | null
          logged_in_at?: string
        }
        Update: {
          device?: string | null
          ip_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      verify_invite_code: {
        Args: { input_code: string }
        Returns: { valid: boolean; referrer_name?: string }
      }
      generate_invite_code: {
        Args: Record<string, never>
        Returns: { code?: string; error?: string }
      }
    }
    Enums: {
      member_rank: MemberRank
      user_role: UserRole
      user_status: UserStatus
      content_type: DbContentType
      content_status: DbContentStatus
      interaction_type: InteractionType
      unlock_condition_type: UnlockConditionType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
