"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Plus,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
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
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  status?: string;
  image_url?: string;
  created_at: string;
  application_deadline?: string;
}

export default function ClientGigsPage() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured ? createClientComponentClient() : null;

  const fetchGigs = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from("gigs")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching gigs:", fetchError);
        setError("Failed to load gigs");
      } else {
        setGigs(data || []);
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
    } else if (!isSupabaseConfigured) {
      setError("Supabase is not configured");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user, supabase, isSupabaseConfigured, fetchGigs]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "editorial":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "commercial":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "runway":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "beauty":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "fitness":
        return "bg-green-50 text-green-700 border-green-200";
      case "e-commerce":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || gig.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && gig.status === "Active") ||
      (activeTab === "completed" && gig.status === "Completed") ||
      (activeTab === "draft" && gig.status === "Draft");

    return matchesSearch && matchesStatus && matchesTab;
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "draft":
        return <Clock className="h-4 w-4 text-gray-600" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Show error state if Supabase is not configured
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Gigs</h1>
                <p className="text-gray-600">Manage your posted gigs and track applications</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/post-gig">
                <Plus className="h-4 w-4 mr-2" />
                Post New Gig
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gigs</p>
                  <p className="text-2xl font-bold text-gray-900">{gigs.length}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gigs.filter((g) => g.status === "Active").length}
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gigs.reduce((sum, gig) => sum + (gig.applications_count || 0), 0)}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gigs.filter((g) => g.status === "Completed").length}
                  </p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
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
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
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
              <Card>
                <CardContent className="p-12 text-center">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Get started by posting your first gig"}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
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
                  <Card key={gig.id} className="hover:shadow-lg transition-shadow">
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
                        src={gig.image_url}
                        alt={gig.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                        fallbackSrc="/images/totl-logo-transparent.png"
                      />

                      <p className="text-sm text-gray-600 line-clamp-2">{gig.description}</p>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getCategoryColor(gig.category || "")}>
                          {gig.category}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(gig.status || "")}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(gig.status || "")}
                            {gig.status}
                          </div>
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Pay Rate:</span>
                          <span className="font-medium">{gig.compensation}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Applications:</span>
                          <span className="font-medium">{gig.applications_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Posted:</span>
                          <span className="font-medium">{gig.created_at}</span>
                        </div>
                        {gig.deadline && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Deadline:</span>
                            <span className="font-medium">{gig.deadline}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/gigs/${gig.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/client/applications?gig=${gig.id}`}>
                            <Users className="h-4 w-4 mr-2" />
                            Applications
                          </Link>
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
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
