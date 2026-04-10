import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatusForm } from "./application-status-form";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Client Application Status | TOTL Agency",
  description: "Check the status of your client application (signed-in).",
};

export default async function ClientApplicationStatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const applicationIdParam = resolvedSearchParams?.applicationId;
  const prefillId = typeof applicationIdParam === "string" ? applicationIdParam : "";

  return (
    <PageShell ambientTone="lifted" routeRole="client" containerClassName="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[var(--oklch-text-secondary)] transition-colors hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="panel-frosted rounded-[28px] border border-white/10 bg-[var(--totl-surface-glass-strong)] p-8 shadow-[0_24px_80px_rgba(8,12,24,0.35)] sm:p-10">
          <div className="space-y-3 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Client Applications
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Check your application status
            </h1>
            <p className="max-w-3xl text-[15px] leading-7 text-[var(--oklch-text-secondary)] sm:text-base">
              You must be signed in to view your Career Builder application status. Enter an
              application ID to look up a specific submission, or leave it blank to view your most
              recent application.
            </p>
          </div>
        </div>

        <ApplicationStatusForm defaultApplicationId={prefillId} />
      </div>
    </PageShell>
  );
}

