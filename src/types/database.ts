/**
 * Hand-maintained Supabase Database types for Phase 2H.
 * Replace with `supabase gen types` once a live project is linked.
 * Do not use `any` in repositories — prefer these row types.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          handle: string
          display_name: string
          bio: string
          location_text: string | null
          avatar_path: string | null
          social_links: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          handle: string
          display_name: string
          bio?: string
          location_text?: string | null
          avatar_path?: string | null
          social_links?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handle?: string
          display_name?: string
          bio?: string
          location_text?: string | null
          avatar_path?: string | null
          social_links?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          category_id: string
          subcategory_id: string | null
          tags: string[]
          cover_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          category_id: string
          subcategory_id?: string | null
          tags?: string[]
          cover_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          category_id?: string
          subcategory_id?: string | null
          tags?: string[]
          cover_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          owner_id: string
          collection_id: string
          title: string
          category_id: string
          subcategory_id: string | null
          tags: string[]
          story: string | null
          provenance: string | null
          condition: string | null
          status: string | null
          metadata: Json
          cover_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          collection_id: string
          title: string
          category_id: string
          subcategory_id?: string | null
          tags?: string[]
          story?: string | null
          provenance?: string | null
          condition?: string | null
          status?: string | null
          metadata?: Json
          cover_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          collection_id?: string
          title?: string
          category_id?: string
          subcategory_id?: string | null
          tags?: string[]
          story?: string | null
          provenance?: string | null
          condition?: string | null
          status?: string | null
          metadata?: Json
          cover_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      item_likes: {
        Row: { user_id: string; item_id: string; created_at: string }
        Insert: { user_id: string; item_id: string; created_at?: string }
        Update: { user_id?: string; item_id?: string; created_at?: string }
        Relationships: []
      }
      item_saves: {
        Row: { user_id: string; item_id: string; created_at: string }
        Insert: { user_id: string; item_id: string; created_at?: string }
        Update: { user_id?: string; item_id?: string; created_at?: string }
        Relationships: []
      }
      collection_likes: {
        Row: { user_id: string; collection_id: string; created_at: string }
        Insert: { user_id: string; collection_id: string; created_at?: string }
        Update: { user_id?: string; collection_id?: string; created_at?: string }
        Relationships: []
      }
      collection_saves: {
        Row: { user_id: string; collection_id: string; created_at: string }
        Insert: { user_id: string; collection_id: string; created_at?: string }
        Update: { user_id?: string; collection_id?: string; created_at?: string }
        Relationships: []
      }
      collection_views: {
        Row: { collection_id: string; viewer_id: string; first_viewed_at: string; last_viewed_at: string }
        Insert: { collection_id: string; viewer_id: string; first_viewed_at?: string; last_viewed_at?: string }
        Update: { last_viewed_at?: string }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          author_id: string
          collection_id: string | null
          item_id: string | null
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          collection_id?: string | null
          item_id?: string | null
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          body?: string
          updated_at?: string
        }
        Relationships: []
      }
      direct_conversations: {
        Row: {
          id: string
          member_one_id: string
          member_two_id: string
          created_by: string
          created_at: string
          updated_at: string
          last_message_at: string | null
        }
        Insert: {
          id?: string
          member_one_id: string
          member_two_id: string
          created_by: string
          created_at?: string
          updated_at?: string
          last_message_at?: string | null
        }
        Update: {
          updated_at?: string
          last_message_at?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          context_collection_id: string | null
          context_item_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          context_collection_id?: string | null
          context_item_id?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      direct_conversation_reads: {
        Row: { conversation_id: string; user_id: string; last_read_at: string; updated_at: string }
        Insert: { conversation_id: string; user_id: string; last_read_at?: string; updated_at?: string }
        Update: { last_read_at?: string; updated_at?: string }
        Relationships: []
      }
      user_blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string }
        Insert: { blocker_id: string; blocked_id: string; created_at?: string }
        Update: { blocker_id?: string; blocked_id?: string; created_at?: string }
        Relationships: []
      }
      content_reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: string
          target_id: string
          reason: string
          details: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: string
          target_id: string
          reason: string
          details?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          reason?: string
          details?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_read_state: {
        Row: { user_id: string; last_read_at: string; updated_at: string }
        Insert: { user_id: string; last_read_at?: string; updated_at?: string }
        Update: { last_read_at?: string; updated_at?: string }
        Relationships: []
      }
      daily_checkin_challenges: {
        Row: {
          request_id: string
          user_id: string
          expected_memo: string
          expires_at: string
          consumed_at: string | null
          created_at: string
        }
        Insert: {
          request_id?: string
          user_id: string
          expected_memo: string
          expires_at: string
          consumed_at?: string | null
          created_at?: string
        }
        Update: { consumed_at?: string | null }
        Relationships: []
      }
      daily_check_ins: {
        Row: {
          id: string
          user_id: string
          checkin_day: string
          transaction_signature: string
          network: string
          block_time: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          checkin_day: string
          transaction_signature: string
          network?: string
          block_time: string
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      collector_badges: {
        Row: { user_id: string; badge_id: string; awarded_at: string; expires_at: string | null }
        Insert: { user_id: string; badge_id: string; awarded_at: string; expires_at?: string | null }
        Update: { awarded_at?: string; expires_at?: string | null }
        Relationships: []
      }
      seeker_verifications: {
        Row: {
          user_id: string
          wallet_lookup_hash: string
          sgt_mint_lookup_hash: string | null
          status: string
          checked_at: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          wallet_lookup_hash: string
          sgt_mint_lookup_hash?: string | null
          status: string
          checked_at: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          wallet_lookup_hash?: string
          sgt_mint_lookup_hash?: string | null
          status?: string
          checked_at?: string
          expires_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallet_auth_challenges: {
        Row: {
          request_id: string
          wallet_lookup_hash: string
          nonce_hash: string
          signed_message_hash: string
          expected_fields: Json
          expires_at: string
          consumed_at: string | null
          created_at: string
        }
        Insert: {
          request_id?: string
          wallet_lookup_hash: string
          nonce_hash: string
          signed_message_hash: string
          expected_fields: Json
          expires_at: string
          consumed_at?: string | null
          created_at?: string
        }
        Update: {
          consumed_at?: string | null
        }
        Relationships: []
      }
      wallet_identities: {
        Row: {
          wallet_lookup_hash: string
          user_id: string
          provider: string
          first_verified_at: string
          last_verified_at: string
          created_at: string
        }
        Insert: {
          wallet_lookup_hash: string
          user_id: string
          provider?: string
          first_verified_at?: string
          last_verified_at?: string
          created_at?: string
        }
        Update: {
          last_verified_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      catalog_schema_version: { Args: Record<string, never>; Returns: number }
      consume_wallet_auth_challenge: {
        Args: {
          challenge_request_id: string
          expected_wallet_lookup_hash: string
          expected_signed_message_hash: string
        }
        Returns: boolean
      }
      consume_daily_checkin_challenge: {
        Args: { challenge_request_id: string; expected_user_id: string }
        Returns: boolean
      }
      apply_seeker_verification: {
        Args: {
          expected_user_id: string
          expected_wallet_lookup_hash: string
          verified_mint_lookup_hash: string | null
          verification_checked_at: string
          verification_expires_at: string
        }
        Returns: undefined
      }
      open_direct_conversation: {
        Args: { peer_user_id: string }
        Returns: string
      }
      record_collection_view: {
        Args: { target_collection_id: string }
        Returns: undefined
      }
      collection_engagement_counts: {
        Args: { target_collection_ids: string[] }
        Returns: {
          collection_id: string
          like_count: number
          comment_count: number
          view_count: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type CollectionRow = Database['public']['Tables']['collections']['Row']
export type ItemRow = Database['public']['Tables']['items']['Row']
export type CommentRow = Database['public']['Tables']['comments']['Row']
export type DirectConversationRow = Database['public']['Tables']['direct_conversations']['Row']
export type DirectMessageRow = Database['public']['Tables']['direct_messages']['Row']
