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
  UserCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
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
    paidActiveTalentTotal: number;
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
    <PageShell topPadding={false} fullBleed>
      <AdminHeader user={user} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-5">
          <PageHeader
            title="Overview"
            subtitle="Platform performance, activity, and quick actions."
          />

        <div className="mb-4 md:hidden">
          <MobileSummaryRow
            items={[
              { label: "Total opportunities", value: dashboardStats.totalGigs, icon: Briefcase },
              { label: "Active opportunities", value: dashboardStats.activeGigs, icon: Zap },
              { label: "Applications", value: dashboardStats.totalApplications, icon: Users },
              { label: "Pending", value: dashboardStats.pendingApplications, icon: Clock },
              { label: "Accepted", value: dashboardStats.acceptedApplications, icon: CheckCircle },
              {
                label: "Paid talent",
                value: paidTalentStats.paidActiveTalentTotal,
                icon: DollarSign,
              },
            ]}
          />
        </div>

        {/* Quick Stats */}
        <div className="mb-6 hidden grid-cols-2 gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="min-w-0 border-white/10 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)]">
            <CardContent className="space-y-3 p-4">
              <div className="card-header-row">
                <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                  <span>Total Opportunities</span>
                </div>
                <Badge variant="outline" className="status-chip">
                  All time
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardStats.totalGigs}</div>
              <div className="card-footer-row">
                <span>Next action</span>
                <Link href="/admin/gigs" className="text-[var(--oklch-text-primary)] hover:underline">
                  Review inventory
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-white/10 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)]">
            <CardContent className="space-y-3 p-4">
              <div className="card-header-row">
                <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span>Active Opportunities</span>
                </div>
                <Badge variant="outline" className="status-chip">
                  Live
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardStats.activeGigs}</div>
              <div className="card-footer-row">
                <span>Next action</span>
                <Link href="/admin/gigs" className="text-[var(--oklch-text-primary)] hover:underline">
                  Monitor activity
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-white/10 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)]">
            <CardContent className="space-y-3 p-4">
              <div className="card-header-row">
                <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>Applications</span>
                </div>
                <Badge variant="outline" className="status-chip">
                  Total
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardStats.totalApplications}</div>
              <div className="card-footer-row">
                <span>Next action</span>
                <Link href="/admin/applications" className="text-[var(--oklch-text-primary)] hover:underline">
                  Review queue
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-white/10 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)]">
            <CardContent className="space-y-3 p-4">
              <div className="card-header-row">
                <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span>Pending</span>
                </div>
                <Badge variant="outline" className="status-chip">
                  New
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardStats.pendingApplications}</div>
              <div className="card-footer-row">
                <span>Next action</span>
                <Link href="/admin/applications" className="text-[var(--oklch-text-primary)] hover:underline">
                  Triage now
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-white/10 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)]">
            <CardContent className="space-y-3 p-4">
              <div className="card-header-row">
                <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Accepted</span>
                </div>
                <Badge variant="outline" className="status-chip">
                  Closed
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardStats.acceptedApplications}</div>
              <div className="card-footer-row">
                <span>Next action</span>
                <Link href="/admin/applications" className="text-[var(--oklch-text-primary)] hover:underline">
                  Audit decisions
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card
            className="min-w-0 border-white/10 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)]"
            data-testid="paid-talent-card"
          >
            <CardContent className="space-y-3 p-4">
              <div className="card-header-row">
                <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                  <DollarSign className="h-4 w-4 text-orange-400" />
                  <span data-testid="paid-talent-card-title">Paid Talent</span>
                </div>
                <Badge variant="outline" className="status-chip">
                  Subscriptions
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                <span data-testid="paid-talent-mrr">{money(paidTalentStats.estimatedMrrCents)}</span>
                <span className="ml-1 text-base font-normal text-[var(--oklch-text-tertiary)]">/mo</span>
              </div>
              <div className="text-sm text-[var(--oklch-text-tertiary)]">
                <span data-testid="paid-talent-arr">{money(paidTalentStats.estimatedArrCents)}</span>
                <span className="text-xs ml-1">/yr</span>
              </div>
              <p className="text-sm font-medium text-white">
                <span data-testid="paid-talent-count">{paidTalentStats.paidActiveTalentTotal}</span>
                <span className="ml-1 font-normal text-[var(--oklch-text-tertiary)]">active subscribers</span>
              </p>
              <p className="text-xs text-[var(--oklch-text-tertiary)]" data-testid="paid-talent-breakdown">
                {paidTalentStats.monthlyCount} monthly · {paidTalentStats.annualCount} annual ·{" "}
                {paidTalentStats.unknownPlanCount} plan unknown
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <MobileTabRail scrollClassName="flex justify-center">
            <TabsList className="inline-flex h-auto min-w-max gap-3 rounded-2xl border border-white/10 panel-frosted p-1.5">
              <TabsTrigger
                value="overview"
                className="min-h-10 flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                <Activity className="h-3.5 w-3.5 shrink-0" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="gigs"
                className="min-h-10 flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                Opportunities
              </TabsTrigger>
              <TabsTrigger
                value="applications"
                className="min-h-10 flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                Applications
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="min-h-10 flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                <BarChart className="h-3.5 w-3.5 shrink-0" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </MobileTabRail>
          <TabsList className="hidden w-full grid-cols-4 rounded-2xl border border-white/10 panel-frosted p-1 md:grid lg:w-auto lg:grid-cols-4">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 rounded-xl text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="gigs"
              className="flex items-center gap-2 rounded-xl text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <Briefcase className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="flex items-center gap-2 rounded-xl text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 rounded-xl text-[var(--oklch-text-tertiary)] data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-1 border-white/10">
                <CardHeader>
                  <div className="card-header-row">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Zap className="h-5 w-5 text-blue-400" />
                      Quick Actions
                    </CardTitle>
                    <Badge variant="outline" className="status-chip">
                      Admin
                    </Badge>
                  </div>
                  <CardDescription className="text-[var(--oklch-text-secondary)]">
                    Manage your platform efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <Link href="/admin/gigs/create" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Opportunity
                    </Link>
                  </Button>
                  <Button className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline" asChild>
                    <Link href="/admin/applications" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Review Applications
                    </Link>
                  </Button>
                  <Button className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline" asChild>
                    <Link href="/" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Public Site View
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Platform Health */}
              <Card className="lg:col-span-1 border-white/10">
                <CardHeader>
                  <div className="card-header-row">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="h-5 w-5 text-green-400" />
                      Platform Health
                    </CardTitle>
                    <Badge variant="outline" className="status-chip">
                      Illustrative
                    </Badge>
                  </div>
                  <CardDescription className="text-[var(--oklch-text-secondary)]">
                    Placeholder labels only — not live infrastructure monitoring.
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
              <Card className="lg:col-span-1 border-white/10">
                <CardHeader>
                  <div className="card-header-row">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5 text-purple-400" />
                      Snapshot
                    </CardTitle>
                    <Badge variant="outline" className="status-chip">
                      Loaded data
                    </Badge>
                  </div>
                  <CardDescription className="text-[var(--oklch-text-secondary)]">
                    Counts from the records fetched for this page (not a separate analytics feed).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{applications.length}</div>
                    <p className="text-sm text-white">Total applications</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{dashboardStats.activeGigs}</div>
                    <p className="text-sm text-white">Active opportunities</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gigs" className="space-y-6">
            <Card className="border-white/10">
              <CardHeader>
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <CardTitle className="text-white">Opportunity Management</CardTitle>
                    <CardDescription className="text-gray-300">
                      Manage all your platform opportunities
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        placeholder="Search opportunities"
                        className="w-full pl-9 md:w-60"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                      <Filter size={16} />
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                      <Link href="/admin/gigs/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Opportunity
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
                      className="panel-frosted flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)] md:flex-row"
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
                          className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 md:flex-none"
                          asChild
                        >
                          <Link href={`/admin/gigs/${gig.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--oklch-text-tertiary)] hover:bg-white/10"
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
            <Card className="border-white/10">
              <CardHeader>
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <CardTitle className="text-white">Application Management</CardTitle>
                    <CardDescription className="text-gray-300">
                      Review and manage talent applications ({applications.length} total)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
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
                        className="panel-frosted flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-shadow hover:shadow-[0_18px_38px_rgba(10,10,18,0.22)] md:flex-row"
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
                              <span className="text-gray-300 italic truncate max-w-md">
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
                            className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 md:flex-none"
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
            <Card className="border-white/10 panel-frosted">
              <CardHeader>
                <CardTitle className="text-white">Operational data</CardTitle>
                <CardDescription className="text-[var(--oklch-text-secondary)]">
                  Aggregated analytics are not shipped yet. Use these admin views for live listings, applications, and
                  roster data.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline" asChild>
                  <Link href="/admin/gigs">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Opportunities
                  </Link>
                </Button>
                <Button className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline" asChild>
                  <Link href="/admin/applications">
                    <Users className="mr-2 h-4 w-4" />
                    Applications
                  </Link>
                </Button>
                <Button className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline" asChild>
                  <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </Link>
                </Button>
                <Button className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline" asChild>
                  <Link href="/admin/talent">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Talent roster
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </PageShell>
  );
}
