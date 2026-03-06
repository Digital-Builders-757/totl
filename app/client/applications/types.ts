export interface Application {
  id: string;
  gig_id: string;
  talent_id: string;
  status: "new" | "under_review" | "shortlisted" | "rejected" | "accepted";
  message: string | null;
  created_at: string;
  updated_at: string;
  gigs?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
  };
  profiles?: {
    display_name: string | null;
    email_verified: boolean;
    role: string;
    avatar_url: string | null;
    avatar_path: string | null;
  };
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}
