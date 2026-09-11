// Hand-written to match supabase/schema.sql exactly. Once a real Supabase
// project exists, regenerate this with the Supabase CLI for a guaranteed
// match instead of relying on this hand-kept copy:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
//
// Shaped to satisfy @supabase/postgrest-js's GenericSchema constraint
// (Tables/Views/Functions, each table carrying Row/Insert/Update/
// Relationships) so the client's generic type inference actually resolves
// instead of collapsing to `never`.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          experience_level: string;
          timezone: string;
          onboarding_goals: string[];
          preferred_duration_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          experience_level?: string;
          timezone?: string;
          onboarding_goals?: string[];
          preferred_duration_minutes?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      exercise_progress: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          status: string;
          clean_bpm: number;
          best_accuracy: number;
          consecutive_clean_count: number;
          attempts_count: number;
          mastered_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          status?: string;
          clean_bpm?: number;
          best_accuracy?: number;
          consecutive_clean_count?: number;
          attempts_count?: number;
          mastered_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_progress"]["Insert"]>;
        Relationships: [];
      };
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          client_attempt_id: string;
          exercise_id: string;
          target_bpm: number;
          clean_bpm: number;
          maximum_bpm: number | null;
          accuracy: number;
          duration_minutes: number;
          perceived_difficulty: number;
          notes: string | null;
          result: string;
          recommendation: string;
          session_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_attempt_id: string;
          exercise_id: string;
          target_bpm: number;
          clean_bpm: number;
          maximum_bpm?: number | null;
          accuracy: number;
          duration_minutes: number;
          perceived_difficulty?: number;
          notes?: string | null;
          result: string;
          recommendation: string;
          session_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["practice_sessions"]["Insert"]>;
        Relationships: [];
      };
      video_progress: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          watched: boolean;
          favorite: boolean;
          noted_aspects: string[];
          notes: string;
          watched_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          watched?: boolean;
          favorite?: boolean;
          noted_aspects?: string[];
          notes?: string;
          watched_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["video_progress"]["Insert"]>;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_achievements"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
