export interface DashboardApplication {
  id: string;
  gig_id: string;
  talent_id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  gigs?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
  };
  talent_profiles?: {
    first_name: string;
    last_name: string;
    location: string | null;
    experience: string | null;
  } | null;
  profiles?: {
    display_name: string | null;
    email_verified: boolean;
    role: string;
    avatar_url: string | null;
  };
}

export interface DashboardGig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  status?: string;
  image_url?: string | null;
  created_at: string;
  applications_count?: number;
  application_deadline?: string | null;
}
