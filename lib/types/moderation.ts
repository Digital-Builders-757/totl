import type { Database } from "@/types/supabase";

export type FlagResourceType =
  | "gig"
  | "talent_profile"
  | "client_profile"
  | "application"
  | "booking";

export type FlagStatus = "open" | "in_review" | "resolved" | "dismissed";

export type ContentFlagRow = {
  id: string;
  resource_type: FlagResourceType;
  resource_id: string;
  gig_id: string | null;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: FlagStatus;
  admin_notes: string | null;
  assigned_admin_id: string | null;
  resolution_action: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ModerationDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      content_flags: {
        Row: ContentFlagRow;
        Insert: Partial<ContentFlagRow>;
        Update: Partial<ContentFlagRow>;
        Relationships: [];
      };
    };
    Enums: Database["public"]["Enums"] & {
      flag_status: FlagStatus;
      flag_resource_type: FlagResourceType;
    };
  };
};

