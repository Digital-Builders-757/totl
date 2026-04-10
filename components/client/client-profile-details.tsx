"use client";

import { Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Database } from "@/types/supabase";

type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"];

interface ClientProfileDetailsProps {
  clientProfile: ClientProfile | null;
}

export function ClientProfileDetails({ clientProfile }: ClientProfileDetailsProps) {
  if (!clientProfile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-[var(--oklch-text-tertiary)]">No client profile data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          Client profile details (read-only admin view)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[var(--oklch-text-tertiary)]">Company Name</Label>
          <p className="text-white">{clientProfile.company_name || "—"}</p>
        </div>

        {clientProfile.industry && (
          <div className="space-y-2">
            <Label className="text-[var(--oklch-text-tertiary)]">Industry</Label>
            <p className="text-white">{clientProfile.industry}</p>
          </div>
        )}

        {clientProfile.website && (
          <div className="space-y-2">
            <Label className="text-[var(--oklch-text-tertiary)]">Website</Label>
            <p className="text-white">
              <a
                href={clientProfile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--oklch-text-primary)] underline transition-colors hover:text-white"
              >
                {clientProfile.website}
              </a>
            </p>
          </div>
        )}

        {clientProfile.contact_name && (
          <div className="space-y-2">
            <Label className="text-[var(--oklch-text-tertiary)]">Contact Name</Label>
            <p className="text-white">{clientProfile.contact_name}</p>
          </div>
        )}

        {clientProfile.contact_email && (
          <div className="space-y-2">
            <Label className="text-[var(--oklch-text-tertiary)]">Contact Email</Label>
            <p className="text-white">
              <a
                href={`mailto:${clientProfile.contact_email}`}
                className="text-[var(--oklch-text-primary)] underline transition-colors hover:text-white"
              >
                {clientProfile.contact_email}
              </a>
            </p>
          </div>
        )}

        {clientProfile.contact_phone && (
          <div className="space-y-2">
            <Label className="text-[var(--oklch-text-tertiary)]">Contact Phone</Label>
            <p className="text-white">
              <a
                href={`tel:${clientProfile.contact_phone}`}
                className="text-[var(--oklch-text-primary)] underline transition-colors hover:text-white"
              >
                {clientProfile.contact_phone}
              </a>
            </p>
          </div>
        )}

        {clientProfile.company_size && (
          <div className="space-y-2">
            <Label className="text-[var(--oklch-text-tertiary)]">Company Size</Label>
            <p className="text-white">{clientProfile.company_size}</p>
          </div>
        )}

        <div className="border-t border-white/10 pt-4">
          <div className="flex justify-between text-sm text-[var(--oklch-text-tertiary)]">
            <span>Created:</span>
            <span>{clientProfile.created_at ? new Date(clientProfile.created_at).toLocaleDateString() : "—"}</span>
          </div>
          {clientProfile.updated_at && (
            <div className="mt-2 flex justify-between text-sm text-[var(--oklch-text-tertiary)]">
              <span>Last Updated:</span>
              <span>{new Date(clientProfile.updated_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

