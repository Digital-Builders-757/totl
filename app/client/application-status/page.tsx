import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatusForm } from "./application-status-form";

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
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-3 text-center md:text-left">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Client Applications
              </p>
              <h1 className="text-3xl font-bold text-gray-900">
                Check Your Application Status
              </h1>
              <p className="text-gray-600">
                You must be signed in to view your Career Builder application status. Enter an
                application ID to look up a specific submission, or leave it blank to view your most
                recent application.
              </p>
            </div>
          </div>

          <ApplicationStatusForm defaultApplicationId={prefillId} />
        </div>
      </div>
    </div>
  );
}

