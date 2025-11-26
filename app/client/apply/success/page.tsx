import { CheckCircle, ArrowLeft, Clipboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const applicationIdParam = resolvedSearchParams?.applicationId;
  const applicationId = typeof applicationIdParam === "string" ? applicationIdParam : "";

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Application Submitted Successfully</h1>
            <p className="text-gray-600 mb-6">
              Thank you for applying to become a client with TOTL Agency. Our team will review your
              application and contact you within 2-3 business days.
            </p>
            {applicationId && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-100 text-left space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Track your application</p>
                  <p className="text-sm text-gray-600">
                    Keep this ID handy. You&apos;ll need it along with your business email to check
                    your application status.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <code className="font-mono text-sm bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900">
                    {applicationId}
                  </code>
                  <Button
                    asChild
                    variant="outline"
                    className="border-gray-300 text-gray-700 gap-2 bg-white"
                  >
                    <Link href={`/client/application-status?applicationId=${applicationId}`}>
                      <Clipboard className="h-4 w-4" />
                      Check Status
                    </Link>
                  </Button>
                </div>
              </div>
            )}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h2 className="font-medium mb-2">What happens next?</h2>
              <ol className="text-left text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    1
                  </span>
                  <span>
                    Our team reviews your application (typically within 2-3 business days)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    2
                  </span>
                  <span>
                    If approved, you&apos;ll receive an email with instructions to set up your
                    account and access our talent roster
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                    3
                  </span>
                  <span>
                    Our client success team will schedule an onboarding call to help you get started
                    and answer any questions
                  </span>
                </li>
              </ol>
            </div>
            <Button asChild className="bg-black text-white hover:bg-black/90">
              <Link href="/">Return to Homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
