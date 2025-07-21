"use client";

import { Search, Filter, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthAction } from "@/components/auth-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";

export default function TalentPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Browse Talent</h1>
            <p className="text-gray-600 max-w-3xl">
              Discover our diverse roster of professional models and talent. Filter by specialty,
              look, and experience to find the perfect match for your project.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  placeholder="Search by name, specialty, or look"
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  Filters
                </Button>
                <Button className="bg-black text-white hover:bg-black/90">Search</Button>
              </div>
            </div>
          </div>

          {/* Talent Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {talent.map((person, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden group">
                <div className="relative aspect-[3/4]">
                  {/* Using SafeImage instead of Image */}
                  <SafeImage
                    src={person.image}
                    alt={person.name}
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
                  <h2 className="text-lg font-bold">{person.name}</h2>
                  <p className="text-gray-600 mb-2">{person.specialty}</p>
                  <div className="flex flex-wrap gap-2">
                    {person.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
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
        </div>
      </div>
    </div>
  );
}

// Sample talent data
const talent = [
  {
    name: "Sophia Chen",
    specialty: "Editorial & Runway",
    tags: ["Editorial", "High Fashion", "Runway"],
    image: "/images/model-1.png",
    id: "1",
  },
  {
    name: "Marcus Williams",
    specialty: "Commercial & Print",
    tags: ["Commercial", "Print", "Lifestyle"],
    image: "/images/model-2.png",
    id: "2",
  },
  {
    name: "Ava Rodriguez",
    specialty: "High Fashion & Campaigns",
    tags: ["Campaigns", "Editorial", "Luxury"],
    image: "/images/model-3.png",
    id: "3",
  },
  {
    name: "James Thompson",
    specialty: "Fitness & Commercial",
    tags: ["Fitness", "Sports", "Commercial"],
    image: "/athletic-woman-stretching.png",
    id: "4",
  },
  {
    name: "Zoe Parker",
    specialty: "Beauty & Cosmetics",
    tags: ["Beauty", "Cosmetics", "Close-up"],
    image: "/radiant-portrait.png",
    id: "5",
  },
  {
    name: "Elijah Washington",
    specialty: "Urban & Streetwear",
    tags: ["Urban", "Streetwear", "Casual"],
    image: "", // This will use the fallback
    id: "6",
  },
];
