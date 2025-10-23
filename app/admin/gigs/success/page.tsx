"use client";

import { CheckCircle, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { useToast } from "@/components/ui/use-toast";

export default function GigSuccessPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const gigId = searchParams?.get("gigId") ?? null;

  useEffect(() => {
    // Show success toast
    toast({
      title: "Gig Submitted Successfully!",
      description: "Your gig has been submitted and is pending review.",
    });
  }, [toast]);

  if (!gigId) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold">Invalid Gig ID</h2>
              <p className="text-gray-600 mt-2">No gig ID provided. Please submit a gig first.</p>
              <Button asChild className="mt-4">
                <Link href="/post-gig">Create New Gig</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-8">
                <SafeImage
                  src="/images/totl-logo-transparent.png"
                  alt="TOTL Agency"
                  width={100}
                  height={40}
                  placeholderQuery="agency logo"
                  className="brightness-100"
                />
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin/dashboard" className="text-gray-600 hover:text-black">
                  Dashboard
                </Link>
                <Link href="/admin/gigs" className="text-black font-medium">
                  My Gigs
                </Link>
                <Link href="/admin/applications" className="text-gray-600 hover:text-black">
                  Applications
                </Link>
                <Link href="/admin/messages" className="text-gray-600 hover:text-black">
                  Messages
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold">Your gig has been submitted!</h2>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Our team is reviewing your casting call. Once approved, it will appear on the talent
              dashboard for submissions.
            </p>
          </div>

          {/* Gig Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Gig Summary</h2>
                <Badge className="bg-amber-100 text-amber-800">
                  <Clock className="mr-1 h-4 w-4" /> Pending Review
                </Badge>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Gig ID: {gigId}</h3>
                <p className="text-gray-600">
                  Your gig has been successfully submitted and is now pending review.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-500">
                    â€¢ You&apos;ll receive an email notification once it&apos;s approved
                  </p>
                  <p className="text-sm text-gray-500">
                    â€¢ Approved gigs appear on the talent dashboard within 24 hours
                  </p>
                  <p className="text-sm text-gray-500">
                    â€¢ You can track applications in your dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/admin/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/post-gig">Create Another Gig</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
