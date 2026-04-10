"use client";

import { Building2, CheckCircle2, Clock, Loader2, Mail, XCircle } from "lucide-react";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LongToken } from "@/components/ui/long-token";
import { checkClientApplicationStatus } from "@/lib/actions/client-actions";

type ApplicationStatusResult = {
  id: string;
  companyName: string;
  contactName: string;
  status: string;
  businessDescription: string;
  needsDescription: string;
  adminNotes: string | null;
  submittedAt: string;
  updatedAt: string;
};

const STATUS_STYLES: Record<
  string,
  { label: string; badge: string; helper: string; icon: ReactNode }
> = {
  pending: {
    label: "Pending Review",
    badge: "border-yellow-400/30 bg-yellow-500/12 text-yellow-100",
    helper: "Our team is reviewing your application. We'll reach out soon.",
    icon: <Clock className="h-5 w-5 text-yellow-300" />,
  },
  approved: {
    label: "Approved",
    badge: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100",
    helper: "You're all set! Check your email for onboarding instructions.",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
  },
  rejected: {
    label: "Needs More Info",
    badge: "border-rose-400/30 bg-rose-500/12 text-rose-100",
    helper: "We couldn't approve this submission. Review the notes below.",
    icon: <XCircle className="h-5 w-5 text-rose-300" />,
  },
};

type ApplicationStatusFormProps = {
  defaultApplicationId?: string;
};

export function ApplicationStatusForm({ defaultApplicationId = "" }: ApplicationStatusFormProps) {
  const [applicationId, setApplicationId] = useState(defaultApplicationId);
  const [result, setResult] = useState<ApplicationStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await checkClientApplicationStatus({
        applicationId: applicationId.trim() ? applicationId : undefined,
      });

      if (!response.success) {
        setError(response.error);
        setResult(null);
        return;
      }

      setResult(response.application);
    });
  };

  useEffect(() => {
    setApplicationId(defaultApplicationId);
  }, [defaultApplicationId]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const statusMeta =
    result && STATUS_STYLES[result.status as keyof typeof STATUS_STYLES]
      ? STATUS_STYLES[result.status as keyof typeof STATUS_STYLES]
      : null;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="panel-frosted space-y-6 rounded-[26px] border border-white/10 bg-[var(--totl-surface-glass-strong)] p-6 shadow-[0_20px_70px_rgba(8,12,24,0.32)]"
      >
        <div className="space-y-2">
          <Label htmlFor="applicationId" className="text-sm font-medium text-white">
            Application ID (optional)
          </Label>
          <Input
            id="applicationId"
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            placeholder="e.g. 4f4e99aa-..."
            className="md:max-w-md"
          />
          <p className="text-xs text-[var(--oklch-text-tertiary)]">
            Leave this blank to check your most recent application.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="button-glow w-full sm:w-auto sm:min-w-[14rem]">
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking status…
            </span>
          ) : (
            "Check application status"
          )}
        </Button>
      </form>

      {result && (
        <div className="panel-frosted space-y-6 rounded-[26px] border border-white/10 bg-[var(--totl-surface-glass-strong)] p-6 shadow-[0_24px_80px_rgba(8,12,24,0.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--oklch-text-tertiary)]">
                Application ID
              </p>
              <LongToken
                as="p"
                value={result.id}
                className="font-mono text-sm text-[var(--oklch-text-secondary)]"
              />
            </div>
            {statusMeta && (
              <div className="flex items-center gap-3">
                {statusMeta.icon}
                <Badge className={`border ${statusMeta.badge}`}>{statusMeta.label}</Badge>
              </div>
            )}
          </div>

          {statusMeta && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--oklch-text-secondary)]">
              {statusMeta.helper}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--oklch-text-tertiary)]">
                <Building2 className="h-4 w-4" />
                Company
              </div>
              <p className="mt-1 text-lg font-semibold text-white">{result.companyName}</p>
              <p className="text-sm text-[var(--oklch-text-secondary)]">{result.contactName}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--oklch-text-tertiary)]">
                <Mail className="h-4 w-4" />
                Timeline
              </div>
              <dl className="mt-2 space-y-1 text-sm text-[var(--oklch-text-secondary)]">
                <div className="flex justify-between gap-4">
                  <dt>Submitted</dt>
                  <dd className="font-medium text-white">{formatDate(result.submittedAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Last updated</dt>
                  <dd className="font-medium text-white">{formatDate(result.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--oklch-text-tertiary)]">
                About your business
              </p>
              <p className="whitespace-pre-line text-sm leading-6 text-[var(--oklch-text-secondary)]">
                {result.businessDescription}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--oklch-text-tertiary)]">
                Talent needs
              </p>
              <p className="whitespace-pre-line text-sm leading-6 text-[var(--oklch-text-secondary)]">
                {result.needsDescription}
              </p>
            </div>
          </div>

          {result.adminNotes && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
              <p className="mb-1 text-xs uppercase tracking-[0.24em] text-amber-100/80">
                Admin notes
              </p>
              <p className="whitespace-pre-line text-sm leading-6 text-amber-50">
                {result.adminNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

