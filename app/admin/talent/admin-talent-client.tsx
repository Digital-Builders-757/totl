"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  Filter,
  User as UserIcon,
  MapPin,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createNameSlug } from "@/lib/utils/slug";

type TalentProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  experience: string | null;
  experience_years: number | null;
  specialties: string[] | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    avatar_path: string | null;
    email_verified: boolean;
    created_at: string;
  };
};

interface AdminTalentClientProps {
  talent: TalentProfile[];
  user: User;
}

export function AdminTalentClient({ talent: initialTalent, user }: AdminTalentClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter talent based on search query
  const filteredTalent = useMemo(() => {
    if (!searchQuery) return initialTalent;

    const query = searchQuery.toLowerCase();
    return initialTalent.filter(
      (t) =>
        t.first_name.toLowerCase().includes(query) ||
        t.last_name.toLowerCase().includes(query) ||
        (t.profiles?.display_name && t.profiles.display_name.toLowerCase().includes(query)) ||
        (t.location && t.location.toLowerCase().includes(query)) ||
        (t.experience && t.experience.toLowerCase().includes(query)) ||
        (t.specialties && t.specialties.some((s) => s.toLowerCase().includes(query)))
    );
  }, [initialTalent, searchQuery]);

  const totalTalent = initialTalent.length;
  const verifiedTalent = initialTalent.filter((t) => t.profiles?.email_verified).length;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen">
      <AdminHeader user={user} notificationCount={3} />

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              All Talent
            </h1>
            <p className="text-gray-400 text-lg">View and manage all talent on the platform</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium">
              {totalTalent} Total
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium">
              {verifiedTalent} Verified
            </div>
          </div>
        </div>

        {/* Talent Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-700/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Talent Profiles</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search by name, location, or specialty..."
                    className="pl-9 w-full md:w-60 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter size={16} />
                </Button>
              </div>
            </div>
          </div>

          {filteredTalent.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                <UserIcon className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">No Talent Found</h3>
              <p className="text-gray-400 text-lg">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "No talent profiles have been created yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                      Talent
                    </th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                      Location
                    </th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                      Experience
                    </th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                      Specialties
                    </th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                      Joined
                    </th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredTalent.map((talent) => (
                    <tr key={talent.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {talent.first_name.charAt(0)}{talent.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">
                              {talent.first_name} {talent.last_name}
                            </div>
                            {talent.profiles?.display_name && (
                              <div className="text-gray-400 text-xs">{talent.profiles.display_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {talent.location ? (
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="h-3 w-3" />
                            {talent.location}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-400 text-sm">
                          {talent.experience_years ? `${talent.experience_years} years` : "—"}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {talent.specialties && talent.specialties.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {talent.specialties.slice(0, 2).map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                              >
                                {specialty}
                              </span>
                            ))}
                            {talent.specialties.length > 2 && (
                              <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                                +{talent.specialties.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-sm">
                        {new Date(talent.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        {talent.profiles?.email_verified ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/50">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/talent/${createNameSlug(talent.first_name, talent.last_name)}`}
                                className="text-gray-300 hover:bg-gray-700 flex items-center"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

