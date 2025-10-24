﻿import { createClient } from "@supabase/supabase-js";
import { Users } from "lucide-react";

import { ErrorState } from "./error-state";
import TalentClient from "./talent-client";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

interface TalentProfile {
  id: string;
  user_id: string;
  first_name: string; // Required in database
  last_name: string; // Required in database
  phone: string | null;
  age: number | null;
  location: string | null;
  experience: string | null;
  portfolio_url: string | null;
  height: string | null;
  measurements: string | null;
  hair_color: string | null;
  eye_color: string | null;
  shoe_size: string | null;
  languages: string[] | null;
  created_at: string;
  updated_at: string;
  experience_years: number | null;
  specialties: string[] | null;
  weight: number | null;
  profiles: {
    avatar_url: string | null;
    avatar_path: string | null;
    display_name: string | null;
  };
}

async function getTalentProfiles(): Promise<TalentProfile[]> {
  console.log("Server-side: Fetching talent profiles...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("talent_profiles")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      location,
      experience_years,
      specialties,
      portfolio_url,
      created_at,
      updated_at,
      profiles!inner(
        avatar_url,
        avatar_path,
        display_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Server-side Supabase error:", error);
    throw new Error(`Database error: ${error.message}`);
  }

  console.log("Server-side: Successfully loaded", data?.length || 0, "talent profiles");
  return data || [];
}

export default async function TalentPage() {
  let talent: TalentProfile[] = [];
  let error: string | null = null;

  try {
    talent = await getTalentProfiles();
  } catch (err) {
    // Log detailed error information for debugging
    console.error("Server-side error loading talent profiles:", {
      error: err,
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="min-h-screen bg-seamless-primary text-white pt-20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-20 animate-apple-fade-in">
          <h1 className="text-6xl lg:text-7xl font-bold text-white mb-8 font-display">
            Discover Amazing Talent
          </h1>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Browse our curated collection of professional models and talent ready for your next
            project
          </p>
          <div className="w-40 h-1 bg-gradient-to-r from-white to-gray-400 mx-auto rounded-full mt-8"></div>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : talent.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Talent Found</h2>
            <p className="text-gray-300">No talent profiles available at the moment.</p>
          </div>
        ) : (
          <TalentClient initialTalent={talent} />
        )}
      </div>
    </div>
  );
}
