"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ApplyAsTalentButton } from "@/components/apply-as-talent-button";
import { useAuth } from "@/components/auth/auth-provider";
import TalentSignupForm from "@/components/forms/talent-signup-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChooseRolePage() {
  const [mounted, setMounted] = useState(false);
  const [showCareerBuilderDialog, setShowCareerBuilderDialog] = useState(false);
  const [showTalentSignupDialog, setShowTalentSignupDialog] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCareerBuilderClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setShowCareerBuilderDialog(true);
  };

  const handleCareerBuilderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowCareerBuilderDialog(true);
    }
  };

  const handleCreateTalentAccount = () => {
    setShowCareerBuilderDialog(false);
    // Open the talent signup form dialog instead of routing
    setShowTalentSignupDialog(true);
  };

  const handleApplyAsCareerBuilder = () => {
    setShowCareerBuilderDialog(false);
    router.push("/client/apply");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-20 sm:pt-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-white/8 to-white/3"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/3 rounded-full blur-3xl animate-apple-float"></div>
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-apple-float"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="container mx-auto px-4 py-4 sm:py-12 relative z-10">
        <Link href="/" className="inline-flex items-center text-gray-300 hover:text-white mb-4 sm:mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 animate-apple-fade-in">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white font-display">Choose Your Role</h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Select whether you&apos;re joining as talent looking for opportunities or a client
              looking to hire talent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {/* Talent Card */}
            <div className="apple-glass rounded-2xl overflow-hidden flex flex-col hover:bg-white/10 transition-all duration-300 group animate-apple-scale-in">
              <div className="relative h-64">
                <Image src="/images/talent-professional.png" alt="Professional model portrait" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="text-white text-2xl font-bold mb-2">Join as Talent</h2>
                  <p className="text-gray-200 text-sm">Create your professional profile</p>
                </div>
              </div>
              <div className="p-4 sm:p-8 flex flex-col flex-grow">
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

            {/* Client Card - Disabled */}
            <div 
              className="apple-glass rounded-2xl overflow-hidden flex flex-col opacity-60 cursor-not-allowed transition-all duration-300 animate-apple-scale-in" 
              style={{ animationDelay: "0.1s" }}
              onClick={handleCareerBuilderClick}
              onKeyDown={handleCareerBuilderKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Apply as Career Builder - requires Talent account first"
            >
              <div className="relative h-64">
                <Image src="/images/client-professional.png" alt="Professional woman working on laptop" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="text-white text-2xl font-bold mb-2">Join as Client</h2>
                  <p className="text-gray-200 text-sm">Find the perfect talent for your projects</p>
                </div>
              </div>
              <div className="p-4 sm:p-8 flex flex-col flex-grow">
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
                  <Button 
                    className="w-full apple-button py-4 text-lg font-semibold opacity-50 cursor-not-allowed" 
                    disabled
                    onClick={handleCareerBuilderClick}
                  >
                    Apply as Career Builder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Career Builder Dialog */}
      <Dialog open={showCareerBuilderDialog} onOpenChange={setShowCareerBuilderDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Apply to Become a Career Builder</DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">
              To become a Career Builder, you need to have a Talent account first. This helps us verify your identity and ensures a smooth onboarding process.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              Once you have a Talent account, you can apply to become a Career Builder. Our team will review your application and contact you within 2-3 business days.
            </p>
            {user ? (
              <Alert className="bg-green-900/30 border-green-700">
                <AlertDescription className="text-green-300">
                  You&apos;re already logged in! You can apply to become a Career Builder now.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-gray-300 text-xs">
                  <strong className="text-white">Note:</strong> Career Builder access requires approval. You&apos;ll need to create a Talent account first, then submit an application.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCareerBuilderDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            {user ? (
              <Button
                onClick={handleApplyAsCareerBuilder}
                className="bg-amber-500 text-black hover:bg-amber-400"
              >
                Apply as Career Builder
              </Button>
            ) : (
              <Button
                onClick={handleCreateTalentAccount}
                className="bg-amber-500 text-black hover:bg-amber-400"
              >
                Create Talent Account First
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Talent Signup Form Dialog */}
      <Dialog open={showTalentSignupDialog} onOpenChange={setShowTalentSignupDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle>Create Your Talent Account</DialogTitle>
                <DialogDescription>
                  Apply to join our talent roster. It&apos;s completely free to create an account.
                </DialogDescription>
              </DialogHeader>

              <TalentSignupForm onComplete={() => setShowTalentSignupDialog(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
