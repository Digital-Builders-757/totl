"use client";

import {
  Plus,
  MapPin,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  Eye,
  Edit,
  Trash2,
  Search,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { ClientTerminalHeader } from "@/components/client/client-terminal-header";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { SecondaryActionLink } from "@/components/dashboard/secondary-action-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { GigStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategoryLabel } from "@/lib/constants/gig-categories";
import { useSupabase } from "@/lib/hooks/use-supabase";
import type { Database } from "@/types/supabase";

interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  status?: string;
  image_url?: string | null;
  created_at: string;
  application_deadline?: string | null;
  applications_count?: number;
}

export default function ClientGigsClient() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // HARDENING: Use hook instead of direct call - ensures browser-only execution
  // Hook throws if env vars missing (fail-fast, no zombie state)
  const supabase = useSupabase();

  const fetchGigs = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from("gigs")
        .select(
          `
          id,
          client_id,
          title,
          description,
          category,
          location,
          compensation,
          status,
          image_url,
          created_at,
          application_deadline,
          applications_count:applications(count)
        `
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching gigs:", fetchError);
        setError("Failed to load gigs");
      } else {
        // Transform the data to flatten the applications_count
        // Type assertion needed for aggregated query
        type GigWithCount = Pick<
          Database["public"]["Tables"]["gigs"]["Row"],
          | "id"
          | "client_id"
          | "title"
          | "description"
          | "category"
          | "location"
          | "compensation"
          | "status"
          | "image_url"
          | "created_at"
          | "application_deadline"
        > & {
          applications_count: Array<{ count: number }>;
        };
        const transformedData =
          (data as unknown as GigWithCount[])?.map((gig) => ({
            ...gig,
            applications_count: gig.applications_count?.[0]?.count || 0,
          })) || [];
        setGigs(transformedData);
      }
    } catch (err) {
      console.error("Error in fetchGigs:", err);
      setError("Failed to load gigs");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user && supabase) {
      fetchGigs();
    } else {
      setLoading(false);
    }
  }, [user, supabase, fetchGigs]);

  // Removed getStatusColor - now using GigStatusBadge component

  // Note: Category color logic can be enhanced with getCategoryBadgeVariant if needed
  // For now, keeping a simple fallback since badge styling may vary
  const getCategoryColor = (category: string) => {
    // Default fallback - can be enhanced with getCategoryBadgeVariant
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && gig.status === "Active") ||
      (activeTab === "completed" && gig.status === "Completed") ||
      (activeTab === "draft" && gig.status === "Draft");

    return matchesSearch && matchesTab;
  });

  // Removed getStatusIcon - now using GigStatusBadge component

  // Show error state if Supabase is not configured
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Configuration Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ClientTerminalHeader
        title="My Gigs"
        subtitle="Manage your posted gigs and track applications"
        desktopPrimaryAction={
          <Button asChild>
            <Link href="/post-gig">
              <Plus className="h-4 w-4 mr-2" />
              Post New Gig
            </Link>
          </Button>
        }
        mobileSecondaryAction={<SecondaryActionLink href="/post-gig">Post new gig →</SecondaryActionLink>}
      />

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Stats Overview */}
        <div className="mb-4 md:hidden">
          <details>
            <summary className="cursor-pointer list-none text-sm font-medium text-gray-300">
              <span className="inline-flex items-center gap-2">
                Show stats
                <span className="text-xs text-gray-500">({gigs.length} total)</span>
              </span>
            </summary>
            <div className="mt-2">
              <MobileSummaryRow
                items={[
                  { label: "Total gigs", value: gigs.length, icon: Building },
                  { label: "Active", value: gigs.filter((g) => g.status === "Active").length, icon: CheckCircle },
                  {
                    label: "Applications",
                    value: gigs.reduce((sum, gig) => sum + (gig.applications_count || 0), 0),
                    icon: Users,
                  },
                  { label: "Completed", value: gigs.filter((g) => g.status === "Completed").length, icon: CheckCircle },
                ]}
              />
            </div>
          </details>
        </div>

        <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Gigs</p>
                  <p className="text-2xl font-bold text-white">{gigs.length}</p>
                </div>
                <div className="bg-blue-500/20 p-2 rounded-full">
                  <Building className="h-4 w-4 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Active</p>
                  <p className="text-2xl font-bold text-white">
                    {gigs.filter((g) => g.status === "Active").length}
                  </p>
                </div>
                <div className="bg-green-500/20 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Applications</p>
                  <p className="text-2xl font-bold text-white">
                    {gigs.reduce((sum, gig) => sum + (gig.applications_count || 0), 0)}
                  </p>
                </div>
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {gigs.filter((g) => g.status === "Completed").length}
                  </p>
                </div>
                <div className="bg-emerald-500/20 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search gigs by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="relative md:hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-black to-transparent" />
            <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
                <TabsTrigger value="all" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  All Gigs ({gigs.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  Active ({gigs.filter((g) => g.status === "Active").length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  Completed ({gigs.filter((g) => g.status === "Completed").length})
                </TabsTrigger>
                <TabsTrigger value="draft" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  Draft ({gigs.filter((g) => g.status === "Draft").length})
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsList className="hidden w-full grid-cols-4 md:grid">
            <TabsTrigger value="all">All Gigs ({gigs.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({gigs.filter((g) => g.status === "Active").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({gigs.filter((g) => g.status === "Completed").length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({gigs.filter((g) => g.status === "Draft").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredGigs.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No gigs found</h3>
                  <p className="text-gray-300 mb-6">
                    {searchTerm
                      ? "Try adjusting your search or filters"
                      : "Get started by posting your first gig"}
                  </p>
                  {!searchTerm && (
                    <Button asChild>
                      <Link href="/post-gig">
                        <Plus className="h-4 w-4 mr-2" />
                        Post Your First Gig
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGigs.map((gig) => (
                  <Card key={gig.id} className="hover:shadow-lg transition-shadow bg-gray-900 border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{gig.title}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {gig.location}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SafeImage
                        src={gig.image_url || "/images/totl-logo.png"}
                        alt={gig.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                        fallbackSrc="/images/totl-logo-transparent.png"
                      />

                      <p className="text-sm text-gray-300 line-clamp-2">{gig.description}</p>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getCategoryColor(gig.category || "")}>
                          {getCategoryLabel(gig.category || "")}
                        </Badge>
                        <GigStatusBadge status={gig.status || "draft"} showIcon={true} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Pay Rate:</span>
                          <span className="font-medium text-white">{gig.compensation}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Applications:</span>
                          <span className="font-medium text-white">{gig.applications_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Posted:</span>
                          <span className="font-medium text-white">{gig.created_at}</span>
                        </div>
                        {gig.application_deadline && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">Deadline:</span>
                            <span className="font-medium text-white">{gig.application_deadline}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 apple-glass border-white/30 text-white" asChild>
                          <Link href={`/gigs/${gig.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 apple-glass border-white/30 text-white" asChild>
                          <Link href={`/client/applications?gig=${gig.id}`}>
                            <Users className="h-4 w-4 mr-2" />
                            Applications
                          </Link>
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 apple-glass border-white/30 text-white">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 apple-glass border-white/30 text-white">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
