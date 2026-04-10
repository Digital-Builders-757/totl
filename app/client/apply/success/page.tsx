import { CheckCircle, ArrowLeft, Clipboard } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { LongToken } from "@/components/ui/long-token";

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const applicationIdParam = resolvedSearchParams?.applicationId;
  const applicationId = typeof applicationIdParam === "string" ? applicationIdParam : "";

  return (
    <PageShell ambientTone="lifted" routeRole="client" containerClassName="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[var(--oklch-text-secondary)] transition-colors hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="panel-frosted overflow-hidden rounded-[30px] border border-white/10 bg-[var(--totl-surface-glass-strong)] shadow-[0_24px_90px_rgba(8,12,24,0.38)]">
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/12">
              <CheckCircle className="h-8 w-8 text-emerald-300" />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/75">
              Career Builder Application
            </p>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Application submitted successfully
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-[15px] leading-7 text-[var(--oklch-text-secondary)] sm:text-base">
              Thank you for applying to become a Career Builder with TOTL Agency. Our team will review your
              application and contact you within 2–3 business days.
            </p>
            {applicationId && (
              <div className="mb-6 space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-6 text-left">
                <div>
                  <p className="text-sm font-semibold text-white">Track your application</p>
                  <p className="text-sm leading-6 text-[var(--oklch-text-secondary)]">
                    Keep this ID handy. You&apos;ll need it along with your business email to check
                    your application status.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <LongToken
                    as="code"
                    value={applicationId}
                    className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-2 font-mono text-sm text-white"
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="gap-2 border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                  >
                    <Link href={`/client/application-status?applicationId=${applicationId}`}>
                      <Clipboard className="h-4 w-4" />
                      Check status
                    </Link>
                  </Button>
                </div>
              </div>
            )}
            <div className="mb-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
              <h2 className="mb-3 text-left text-lg font-semibold text-white">What happens next?</h2>
              <ol className="space-y-3 text-left text-[var(--oklch-text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">
                    1
                  </span>
                  <span>
                    Our team reviews your application, typically within 2–3 business days.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">
                    2
                  </span>
                  <span>
                    If approved, you&apos;ll receive an email with instructions to set up your
                    account and access our talent roster.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">
                    3
                  </span>
                  <span>
                    Our Career Builder success team will schedule an onboarding call to help you get started
                    and answer any questions.
                  </span>
                </li>
              </ol>
            </div>
            <Button asChild className="button-glow">
              <Link href="/">Return to homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
