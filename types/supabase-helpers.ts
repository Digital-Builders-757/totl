// Helper to bypass complex Supabase type issues
export type SupabaseUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  created_at?: string;
};

export type SupabaseProfile = {
  id: string;
  role: string;
  display_name?: string | null;
  email_verified?: boolean | null;
  avatar_path?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
};

export type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseError | null;
};
