"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Clock,
  CheckCircle,
  Filter,
  Users,
  Briefcase,
  BarChart,
  Activity,
  Calendar,
  DollarSign,
  MapPin,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GigStatusBadge, ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/types/supabase";

type Gig = Database["public"]["Tables"]["gigs"]["Row"];
type Application = Database["public"]["Tables"]["applications"]["Row"];

interface AdminDashboardClientProps {
  user: User;
  gigs: Gig[];
  applications: Application[];
  paidTalentStats: {
    monthlyCount: number;
    annualCount: number;
    unknownPlanCount: number;
    estimatedMrrCents: number;
    estimatedArrCents: number;
  };
}

export function AdminDashboardClient({ user, gigs, applications, paidTalentStats }: AdminDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  // Filter gigs based on search query
  const filteredGigs = gigs.filter(
    (gig) =>
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate dashboard stats
  const dashboardStats = {
    totalGigs: gigs.length,
    activeGigs: gigs.filter((g) => g.status === "active").length,
    totalApplications: applications.length,
    pendingApplications: applications.filter((a) => a.status === "new").length,
    acceptedApplications: applications.filter((a) => a.status === "accepted").length,
  };

  return (
    <PageShell topPadding={false} fullBleed className="bg-black">
      <AdminHeader user={user} notificationCount={3} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <PageHeader
            title="Overview"
            subtitle="Platform performance, activity, and quick actions."
          />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Total Gigs</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalGigs}</p>
                </div>
                <div className="bg-blue-900/30 p-2 rounded-full">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Active Gigs</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.activeGigs}</p>
                </div>
                <div className="bg-green-900/30 p-2 rounded-full">
                  <Zap className="h-4 w-4 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Applications</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalApplications}</p>
                </div>
                <div className="bg-purple-900/30 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Pending</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.pendingApplications}</p>
                </div>
                <div className="bg-yellow-900/30 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Accepted</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.acceptedApplications}</p>
                </div>
                <div className="bg-emerald-900/30 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800"
            data-testid="paid-talent-card"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white" data-testid="paid-talent-card-title">
                    Paid Talent (Subscriptions)
                  </p>
                  <p className="text-2xl font-bold text-white">
                    <span data-testid="paid-talent-total">
                      {paidTalentStats.monthlyCount + paidTalentStats.annualCount}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Monthly: <span data-testid="paid-talent-monthly">{paidTalentStats.monthlyCount}</span> · Annual:{" "}
                    <span data-testid="paid-talent-annual">{paidTalentStats.annualCount}</span> · Unknown:{" "}
                    <span data-testid="paid-talent-unknown">{paidTalentStats.unknownPlanCount}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Est. MRR:{" "}
                    <span data-testid="paid-talent-mrr">{money(paidTalentStats.estimatedMrrCents)}</span> · Est. ARR:{" "}
                    <span data-testid="paid-talent-arr">{money(paidTalentStats.estimatedArrCents)}</span>
                  </p>
                </div>
                <div className="bg-orange-900/30 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 text-white data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="gigs"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Briefcase className="h-4 w-4" />
              Gigs
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Zap className="h-5 w-5 text-blue-400" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage your platform efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <Link href="/admin/gigs/create" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Gig
                    </Link>
                  </Button>
                  <Button className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800" variant="outline" asChild>
                    <Link href="/admin/applications" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Review Applications
                    </Link>
                  </Button>
                  <Button className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800" variant="outline" asChild>
                    <Link href="/talent" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Talent Portal
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Platform Health */}
              <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="h-5 w-5 text-green-400" />
                    Platform Health
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    System status and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-white">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Database
                      </span>
                      <Badge className="bg-green-900/30 text-green-400 border-green-700">
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-white">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Authentication
                      </span>
                      <Badge className="bg-green-900/30 text-green-400 border-green-700">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-white">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Storage
                      </span>
                      <Badge className="bg-green-900/30 text-green-400 border-green-700">
                        Normal
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Activity className="h-5 w-5 text-purple-400" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Latest platform updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{applications.length}</div>
                    <p className="text-sm text-white">New applications today</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{gigs.length}</div>
                    <p className="text-sm text-white">Total active gigs</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gigs" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-white">Gig Management</CardTitle>
                    <CardDescription className="text-gray-300">
                      Manage all your platform gigs
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        placeholder="Search gigs"
                        className="pl-9 w-full md:w-60 bg-gray-800 border-gray-700 text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon" className="border-gray-700 text-white hover:bg-gray-800">
                      <Filter size={16} />
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                      <Link href="/admin/gigs/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Gig
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredGigs.map((gig) => (
                    <div
                      key={gig.id}
                      className="flex flex-col md:flex-row gap-4 p-4 border border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-gray-800"
                    >
                      <div className="flex-grow space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <h4 className="font-semibold text-lg text-white">{gig.title}</h4>
                          <GigStatusBadge status={gig.status} showIcon={true} />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {gig.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(gig.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {gig.compensation || "TBD"}
                          </span>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none bg-transparent border-gray-700 text-white hover:bg-gray-700"
                          asChild
                        >
                          <Link href={`/gigs/${gig.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:bg-gray-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-white">Application Management</CardTitle>
                    <CardDescription className="text-gray-300">
                      Review and manage talent applications ({applications.length} total)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="border-gray-700 text-white hover:bg-gray-800">
                      <Filter size={16} />
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
                      <Link href="/admin/applications">
                        <Users className="h-4 w-4 mr-2" />
                        View All Applications
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-4">No applications found.</p>
                    </div>
                  ) : (
                    applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex flex-col md:flex-row gap-4 p-4 border border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-gray-800"
                      >
                        <div className="flex-grow space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-semibold text-white">Application #{application.id.slice(0, 8)}</h4>
                                <p className="text-sm text-gray-400">Gig: {application.gig_id.slice(0, 8)}...</p>
                              </div>
                            </div>
                            <ApplicationStatusBadge status={application.status} showIcon={true} />
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Talent: {application.talent_id.slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(application.created_at).toLocaleDateString()}
                            </span>
                            {application.message && (
                              <span className="text-gray-500 italic truncate max-w-md">
                                {application.message.length > 50 
                                  ? `${application.message.substring(0, 50)}...` 
                                  : application.message}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex md:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 md:flex-none bg-transparent border-gray-700 text-white hover:bg-gray-700"
                            asChild
                          >
                            <Link href={`/admin/applications/${application.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Platform Analytics</CardTitle>
                <CardDescription className="text-gray-300">
                  Insights and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">Analytics dashboard coming soon.</p>
                  <p className="text-sm text-gray-400">Track platform performance, user engagement, and business metrics.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </PageShell>
  );
}
