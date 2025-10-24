"use client";

import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";

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

interface TalentClientProps {
  initialTalent: TalentProfile[];
}

export default function TalentClient({ initialTalent }: TalentClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll(
      ".scroll-fade-in, .scroll-slide-left, .scroll-slide-right, .scroll-scale-in"
    );
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const filteredTalent = initialTalent.filter(
    (person) =>
      `${person.first_name} ${person.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      person.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.experience?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-16">
      {/* Search */}
      <div className="max-w-3xl mx-auto animate-apple-slide-up">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by name, location, or experience..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="apple-input py-6 text-xl placeholder-gray-400 focus:ring-4 focus:ring-white/20 transition-all duration-300"
          />
        </div>
      </div>

      {/* Results */}
      {filteredTalent.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Talent Found</h2>
          <p className="text-gray-300 text-lg">
            {searchTerm
              ? `No talent profiles match "${searchTerm}". Try adjusting your search.`
              : "No talent profiles available at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredTalent.map((person) => (
            <div
              key={person.id}
              className="group apple-card hover-lift cursor-pointer overflow-hidden scroll-fade-in scroll-stagger-1"
              onClick={() => router.push(`/talent/${person.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/talent/${person.id}`);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="relative h-80 image-sophisticated">
                <SafeImage
                  src={
                    person.profiles?.avatar_url ||
                    person.profiles?.avatar_path ||
                    (person.portfolio_url &&
                    !person.portfolio_url.includes("youtube.com") &&
                    !person.portfolio_url.includes("youtu.be")
                      ? person.portfolio_url
                      : null)
                  }
                  alt={`${person.first_name} ${person.last_name}`}
                  fill
                  className="object-cover"
                  context="talent-profile"
                  fallbackSrc="/images/solo_logo.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {person.first_name} {person.last_name}
                  </h3>
                  <p className="text-gray-300 text-sm font-medium">{person.location}</p>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  {/* Only show public-safe information */}
                  {person.specialties && person.specialties.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-400">Specialties</span>
                      <div className="flex flex-wrap gap-2">
                        {person.specialties.slice(0, 3).map((specialty, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                        {person.specialties.length > 3 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                            +{person.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {person.experience_years && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-400">Experience</span>
                      <span className="text-sm font-semibold text-white">{person.experience_years} years</span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full apple-button hover-lift focus-ring"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/talent/${person.id}`);
                  }}
                >
                  View Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
