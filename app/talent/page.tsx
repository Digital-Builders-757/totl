"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Search, ArrowRight, AlertCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthAction } from "@/components/auth-action";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import type { Database } from "@/types/supabase";

interface TalentProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  age?: number | null;
  location?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  height?: string | null;
  measurements?: string | null;
  hair_color?: string | null;
  eye_color?: string | null;
  shoe_size?: string | null;
  languages?: string[] | null;
  created_at: string;
  updated_at?: string | null;
}

export default function TalentPage() {
  const router = useRouter();
  const [talent, setTalent] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchTalent();
  }, []);

  const fetchTalent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching talent:", error);
        setError("Failed to load talent profiles");
        return;
      }

      setTalent(data || []);
    } catch (err) {
      console.error("Error fetching talent:", err);
      setError("Failed to load talent profiles");
    } finally {
      setLoading(false);
    }
  };

  const filteredTalent = talent.filter(
    (person) =>
      `${person.first_name || ""} ${person.last_name || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      person.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.experience?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading talent profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-12">
          <EmptyState
            icon={AlertCircle}
            title="Error Loading Talent"
            description={error}
            action={{
              label: "Try Again",
              onClick: fetchTalent,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Amazing Talent</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with professional models, actors, and performers for your next project
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name, specialty, or look"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto">
          {filteredTalent.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Talent Found"
              description={
                searchTerm
                  ? `No talent profiles match "${searchTerm}". Try adjusting your search.`
                  : "No talent profiles available at the moment."
              }
            />
          ) : (
            <>
              {/* Talent Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTalent.map((person) => (
                  <div
                    key={person.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden group"
                  >
                    <div className="relative aspect-[3/4]">
                      <SafeImage
                        src={person.portfolio_url || ""}
                        alt={`${person.first_name || ""} ${person.last_name || ""}`}
                        fill
                        placeholderQuery="fashion model"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <AuthAction
                          className="w-full bg-white text-black hover:bg-white/90 flex items-center justify-center"
                          unauthenticatedText="Sign in to View Profile"
                          onAction={() => router.push(`/talent/${person.id}`)}
                        >
                          View Profile <ArrowRight className="ml-2 h-4 w-4" />
                        </AuthAction>
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-bold">{`${person.first_name || ""} ${person.last_name || ""}`}</h2>
                      <p className="text-gray-600 mb-2">
                        {person.location || "Location not specified"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {person.experience && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {person.experience}
                          </span>
                        )}
                        {person.height && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {person.height}
                          </span>
                        )}
                        {person.hair_color && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {person.hair_color}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination or Load More */}
              <div className="mt-12 text-center">
                <Button variant="outline" className="mx-auto">
                  Load More Talent
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
