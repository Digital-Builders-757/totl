import { createClient } from "@supabase/supabase-js";
import { Search, ArrowRight, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import TalentClient from "./talent-client";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

interface TalentProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
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
}

async function getTalentProfiles(): Promise<TalentProfile[]> {
  console.log("Server-side: Fetching talent profiles...");
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("talent_profiles")
    .select("*")
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
    console.error("Server-side error:", err);
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
                   Browse our curated collection of professional models and talent ready for your next project
                 </p>
                 <div className="w-40 h-1 bg-gradient-to-r from-white to-gray-400 mx-auto rounded-full mt-8"></div>
               </div>

               {error ? (
                 <div className="text-center py-12">
                   <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                   <h2 className="text-xl font-semibold text-white mb-2">Error Loading Talent</h2>
                   <p className="text-gray-300 mb-4">{error}</p>
                   <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-gray-200">Try Again</Button>
                 </div>
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