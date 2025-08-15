"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ApplyAsTalentButton } from "@/components/apply-as-talent-button";
import { Button } from "@/components/ui/button";

export default function ChooseRolePage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Choose Your Role</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select whether you&apos;re joining as talent looking for opportunities or a client
              looking to hire talent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Talent Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-48">
                <Image src="/images/totl-logo.png" alt="Talent" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                  <h2 className="text-white text-xl font-bold">Join as Talent</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Create a profile, showcase your portfolio, and get discovered by top clients
                  looking for talent like you.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">âœ“</span>
                    <span>Apply to exclusive modeling opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">âœ“</span>
                    <span>Build a professional portfolio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">âœ“</span>
                    <span>Get discovered by top brands and agencies</span>
                  </li>
                </ul>
                <ApplyAsTalentButton className="w-full" />
              </div>
            </div>

            {/* Client Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-48">
                <Image src="/images/totl-logo.png" alt="Client" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                  <h2 className="text-white text-xl font-bold">Join as Client</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Post gigs, browse our talent roster, and find the perfect models for your
                  projects, campaigns, and events.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">âœ“</span>
                    <span>Post modeling opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">âœ“</span>
                    <span>Browse our curated talent roster</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">âœ“</span>
                    <span>Manage bookings and communications</span>
                  </li>
                </ul>
                <Link href={returnUrl ? `/client/apply?returnUrl=${returnUrl}` : "/client/apply"}>
                  <Button className="w-full" variant="outline">
                    Apply as Client
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
