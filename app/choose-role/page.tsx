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
  const returnUrl = searchParams?.get("returnUrl") ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-white/8 to-white/3"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/3 rounded-full blur-3xl animate-apple-float"></div>
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-apple-float"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <Link href="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-apple-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-white font-display">Choose Your Role</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Select whether you&apos;re joining as talent looking for opportunities or a client
              looking to hire talent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Talent Card */}
            <div className="apple-glass rounded-2xl overflow-hidden flex flex-col hover:bg-white/10 transition-all duration-300 group animate-apple-scale-in">
              <div className="relative h-64">
                <Image src="/images/talent-portrait.jpg" alt="Professional model portrait" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="text-white text-2xl font-bold mb-2">Join as Talent</h2>
                  <p className="text-gray-200 text-sm">Create your professional profile</p>
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Create a profile, showcase your portfolio, and get discovered by top clients
                  looking for talent like you.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 text-lg">✓</span>
                    <span className="text-gray-300">Apply to exclusive modeling opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 text-lg">✓</span>
                    <span className="text-gray-300">Build a professional portfolio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 text-lg">✓</span>
                    <span className="text-gray-300">Get discovered by top brands and agencies</span>
                  </li>
                </ul>
                <div className="mt-auto">
                  <ApplyAsTalentButton className="w-full apple-button py-4 text-lg font-semibold" />
                </div>
              </div>
            </div>

            {/* Client Card */}
            <div className="apple-glass rounded-2xl overflow-hidden flex flex-col hover:bg-white/10 transition-all duration-300 group animate-apple-scale-in" style={{ animationDelay: "0.1s" }}>
              <div className="relative h-64">
                <Image src="/images/client-professional.jpg" alt="Professional woman working on laptop" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="text-white text-2xl font-bold mb-2">Join as Client</h2>
                  <p className="text-gray-200 text-sm">Find the perfect talent for your projects</p>
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Post gigs, browse our talent roster, and find the perfect models for your
                  projects, campaigns, and events.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 text-lg">✓</span>
                    <span className="text-gray-300">Post modeling opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 text-lg">✓</span>
                    <span className="text-gray-300">Browse our curated talent roster</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 text-lg">✓</span>
                    <span className="text-gray-300">Manage bookings and communications</span>
                  </li>
                </ul>
                <div className="mt-auto">
                  <Link href={returnUrl ? `/client/apply?returnUrl=${returnUrl}` : "/client/apply"}>
                    <Button className="w-full apple-button py-4 text-lg font-semibold">
                      Apply as Client
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
