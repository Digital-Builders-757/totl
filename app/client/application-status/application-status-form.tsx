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
    badge: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    helper: "Our team is reviewing your application. We'll reach out soon.",
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
  },
  approved: {
    label: "Approved",
    badge: "bg-green-500/15 text-green-600 border-green-500/30",
    helper: "You're all set! Check your email for onboarding instructions.",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  },
  rejected: {
    label: "Needs More Info",
    badge: "bg-red-500/15 text-red-600 border-red-500/30",
    helper: "We couldn't approve this submission. Review the notes below.",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
};

type ApplicationStatusFormProps = {
  defaultApplicationId?: string;
};

export function ApplicationStatusForm({ defaultApplicationId = "" }: ApplicationStatusFormProps) {
  const [applicationId, setApplicationId] = useState(defaultApplicationId);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ApplicationStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await checkClientApplicationStatus({
        applicationId,
        email,
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
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6"
      >
        <div className="space-y-1">
          <Label htmlFor="applicationId" className="text-sm font-medium text-gray-700">
            Application ID
          </Label>
          <Input
            id="applicationId"
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            placeholder="e.g. 4f4e99aa-..."
            required
          />
          <p className="text-xs text-gray-500">
            You can find this in the confirmation email we sent right after you applied.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Business Email Used on the Application
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-black text-white hover:bg-black/90"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking status…
            </span>
          ) : (
            "Check Application Status"
          )}
        </Button>
      </form>

      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500">Application ID</p>
              <LongToken as="p" value={result.id} className="font-mono text-sm text-gray-800" />
            </div>
            {statusMeta && (
              <div className="flex items-center gap-3">
                {statusMeta.icon}
                <Badge className={`border ${statusMeta.badge}`}>{statusMeta.label}</Badge>
              </div>
            )}
          </div>

          {statusMeta && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700">
              {statusMeta.helper}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Company
              </div>
              <p className="mt-1 text-lg font-semibold text-gray-900">{result.companyName}</p>
              <p className="text-sm text-gray-500">{result.contactName}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Mail className="h-4 w-4" />
                Timeline
              </div>
              <dl className="mt-2 space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <dt>Submitted</dt>
                  <dd className="font-medium">{formatDate(result.submittedAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Last updated</dt>
                  <dd className="font-medium">{formatDate(result.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">About your business</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{result.businessDescription}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Talent needs</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{result.needsDescription}</p>
            </div>
          </div>

          {result.adminNotes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700 mb-1">Admin notes</p>
              <p className="text-sm text-amber-900 whitespace-pre-line">{result.adminNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

