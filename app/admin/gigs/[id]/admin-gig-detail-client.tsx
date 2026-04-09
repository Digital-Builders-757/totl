"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Eye, MapPin, Calendar, DollarSign, Building2, Pencil, Users } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GigStatusBadge } from "@/components/ui/status-badge";

type Gig = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  compensation: string;
  duration: string;
  date: string;
  application_deadline: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type ClientProfile = {
  user_id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
};

type GigApplication = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  talent_id: string;
  talent: { name: string; location: string | null };
};

const statusTone: Record<
  string,
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-amber-500/15 text-amber-200 border-amber-500/30" },
  under_review: { label: "Under review", className: "bg-blue-500/15 text-blue-200 border-blue-500/30" },
  shortlisted: { label: "Shortlisted", className: "bg-purple-500/15 text-purple-200 border-purple-500/30" },
  accepted: { label: "Accepted", className: "bg-green-500/15 text-green-200 border-green-500/30" },
  rejected: { label: "Rejected", className: "bg-rose-500/15 text-rose-200 border-rose-500/30" },
};

export function AdminGigDetailClient({
  user,
  gig,
  clientProfile,
  applications,
}: {
  user: User;
  gig: Gig;
  clientProfile: ClientProfile | null;
  applications: GigApplication[];
}) {
  void user;

  return (
    <PageShell topPadding={false} fullBleed className="bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="container mx-auto space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
            <Link href="/admin/gigs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        <PageHeader
          title={gig.title}
          subtitle="Opportunity details and applicant activity"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="bg-purple-600 text-white hover:bg-purple-700">
                <Link href={`/admin/gigs/${gig.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                <Link href={`/gigs/${gig.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View public page
                </Link>
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-white">Details</CardTitle>
                <GigStatusBadge status={gig.status} showIcon />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-200">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="h-4 w-4" />
                  <span>{gig.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(gig.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <DollarSign className="h-4 w-4" />
                  <span>{gig.compensation}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Users className="h-4 w-4" />
                  <span>{applications.length} application{applications.length === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Description</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{gig.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-300" />
                Career Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-300">
              <p className="text-white font-medium">{clientProfile?.company_name ?? "N/A"}</p>
              {clientProfile?.contact_name ? <p>{clientProfile.contact_name}</p> : null}
              {clientProfile?.contact_email ? <p>{clientProfile.contact_email}</p> : null}
              <p className="text-gray-500 break-all">{gig.client_id}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-white">Applications</CardTitle>
              <div className="text-xs text-gray-400">{applications.length} total</div>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-sm text-gray-400">No applications yet.</p>
            ) : (
              <div className="divide-y divide-border/35">
                {applications.map((a) => {
                  const tone = statusTone[a.status] ?? {
                    label: a.status,
                    className: "border-border/40 bg-card/35 text-gray-200",
                  };

                  return (
                    <div
                      key={a.id}
                      className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/talent/${a.talent_id}`}
                            className="text-sm text-white font-medium truncate hover:underline focus-hint"
                          >
                            {a.talent.name}
                          </Link>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${tone.className}`}
                          >
                            {tone.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {a.talent.location ?? "Location unknown"} • {new Date(a.created_at).toLocaleDateString()} • {a.id.slice(0, 8)}…
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                          <Link href={`/admin/applications/${a.id}`}>View application</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
