import { ArrowLeft, BadgeInfo } from "lucide-react";
import Link from "next/link";

import { ClientTerminalHeader } from "@/components/client/client-terminal-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function ClientHelpApplicationsPage() {
  return (
    <PageShell topPadding={false} fullBleed className="bg-black text-white">
      <ClientTerminalHeader
        title="Applications help"
        subtitle="How to read statuses and what to do next"
        desktopPrimaryAction={
          <Button asChild variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
            <Link href="/client/applications">Back to applications</Link>
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-gray-800 bg-gray-900 p-2">
              <BadgeInfo className="h-5 w-5 text-blue-300" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-white">How applications work</h1>
              <p className="text-sm text-gray-300">
                Talent can only apply to opportunities you post. New applications show up in your Applications queue.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-200">
            <section className="space-y-1">
              <h2 className="font-semibold text-white">Statuses</h2>
              <ul className="list-disc space-y-1 pl-5 text-gray-300">
                <li>
                  <span className="font-medium text-white">New</span>: just received — review profile + portfolio.
                </li>
                <li>
                  <span className="font-medium text-white">Shortlisted</span>: you’re interested — follow up / schedule.
                </li>
                <li>
                  <span className="font-medium text-white">Accepted</span>: confirmed — proceed to booking details.
                </li>
                <li>
                  <span className="font-medium text-white">Rejected</span>: not a fit — optionally add a reason.
                </li>
              </ul>
            </section>

            <section className="space-y-1">
              <h2 className="font-semibold text-white">Suggested workflow</h2>
              <ol className="list-decimal space-y-1 pl-5 text-gray-300">
                <li>Open Applications → filter to New.</li>
                <li>Open a talent profile and skim portfolio/experience.</li>
                <li>Shortlist the top candidates.</li>
                <li>Accept when you’re ready to confirm.</li>
              </ol>
            </section>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="ghost" className="justify-start text-gray-300 hover:text-white hover:bg-white/10">
              <Link href="/client/applications">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Applications
              </Link>
            </Button>
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
              <Link href="/client/post-gig">Post a new opportunity</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
