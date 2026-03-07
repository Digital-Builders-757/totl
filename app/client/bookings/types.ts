import type { Database } from "@/types/supabase";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  gigs?: {
    id: string;
    title: string;
    category?: string;
    location: string;
    date: string;
  };
  profiles?: {
    display_name: string | null;
    avatar_path: string | null;
    role: string;
  };
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};
