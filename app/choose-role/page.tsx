"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ApplyAsTalentButton } from "@/components/apply-as-talent-button";
import { useAuth } from "@/components/auth/auth-provider";
import TalentSignupForm from "@/components/forms/talent-signup-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
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
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PATHS } from "@/lib/constants/routes";

export default function ChooseRolePage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showCareerBuilderDialog, setShowCareerBuilderDialog] = useState(false);
  const [showTalentSignupDialog, setShowTalentSignupDialog] = useState(false);
  const router = useRouter();
  const { user, profile, userRole, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setIsHydrated(true);
  }, [user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (userRole === "client" || profile?.role === "client") {
      router.replace(PATHS.CLIENT_DASHBOARD);
    }
  }, [authLoading, user, userRole, profile?.role, router]);

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
    router.push(PATHS.CLIENT_APPLY);
  };

  return (
    <PageShell
      fullBleed
      className="grain-texture glow-backplate relative overflow-hidden text-white"
    >
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/3 via-white/8 to-white/3" />
      <div className="pointer-events-none absolute top-0 left-1/4 z-[1] h-72 w-72 rounded-full bg-white/3 blur-3xl animate-apple-float" />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 z-[1] h-96 w-96 rounded-full bg-white/3 blur-3xl animate-apple-float"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 container mx-auto px-4 py-4 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Hydration marker for E2E stability */}
        <span data-testid="choose-role-hydrated" className="sr-only">
          {isHydrated ? "ready" : "loading"}
        </span>
        <Link
          href={PATHS.HOME}
          className="focus-hint mb-4 inline-flex items-center text-gray-300 transition-colors hover:text-white sm:mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 animate-apple-fade-in text-center sm:mb-16">
            <h1 className="mb-4 font-display text-3xl font-bold text-white sm:mb-6 sm:text-5xl lg:text-6xl">
              Choose Your Role
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
              Select whether you&apos;re joining as talent looking for opportunities or a client
              looking to hire talent.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-8 md:grid-cols-2">
            {/* Talent Card */}
            <SectionCard
              className="group flex flex-col overflow-hidden transition-all duration-300 hover:bg-white/5 animate-apple-scale-in"
              paddingClassName="p-0"
            >
              <div className="relative h-64">
                <Image
                  src="/images/talent-professional.png"
                  alt="Professional model portrait"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="mb-2 text-2xl font-bold text-white">Join as Talent</h2>
                  <p className="text-sm text-gray-200">Create your professional profile</p>
                </div>
              </div>
              <div className="flex flex-grow flex-col p-4 sm:p-8">
                <p className="mb-6 leading-relaxed text-gray-300">
                  Create a profile, showcase your portfolio, and get discovered by top clients
                  looking for talent like you.
                </p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-start">
                    <span className="mr-3 text-lg text-green-400">✓</span>
                    <span className="text-gray-300">Apply to exclusive opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-lg text-green-400">✓</span>
                    <span className="text-gray-300">Build a professional portfolio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-lg text-green-400">✓</span>
                    <span className="text-gray-300">Get discovered by top brands and agencies</span>
                  </li>
                </ul>
                <div className="mt-auto">
                  <ApplyAsTalentButton
                    data-testid="choose-role-talent"
                    className="apple-button w-full py-4 text-lg font-semibold"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Client Card - Disabled */}
            <SectionCard
              className="flex flex-col overflow-hidden opacity-60 transition-all duration-300 [animation-delay:100ms] animate-apple-scale-in"
              paddingClassName="p-0"
            >
              <div
                className="flex cursor-not-allowed flex-col outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={handleCareerBuilderClick}
                onKeyDown={handleCareerBuilderKeyDown}
                role="button"
                tabIndex={0}
                aria-label="Apply as Career Builder - requires Talent account first"
              >
                <div className="relative h-64">
                  <Image
                    src="/images/client-professional.png"
                    alt="Professional woman working on laptop"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h2 className="mb-2 text-2xl font-bold text-white">Join as Career Builder</h2>
                    <p className="text-sm text-gray-200">Find the perfect talent for your projects</p>
                  </div>
                </div>
                <div className="flex flex-grow flex-col p-4 sm:p-8">
                  <p className="mb-6 leading-relaxed text-gray-300">
                    Post gigs, connect with talent, and find the perfect professionals for your
                    projects, campaigns, and events.
                  </p>
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-start">
                      <span className="mr-3 text-lg text-green-400">✓</span>
                      <span className="text-gray-300">Post opportunities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-lg text-green-400">✓</span>
                      <span className="text-gray-300">Connect with verified talent through applications</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-lg text-green-400">✓</span>
                      <span className="text-gray-300">Manage bookings and communications</span>
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Button
                      className="apple-button w-full cursor-not-allowed py-4 text-lg font-semibold opacity-50"
                      disabled
                      onClick={handleCareerBuilderClick}
                    >
                      Apply as Career Builder
                    </Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Career Builder Dialog */}
      <Dialog open={showCareerBuilderDialog} onOpenChange={setShowCareerBuilderDialog}>
        <DialogContent className="panel-frosted border-border/50 text-white sm:max-w-md">
          <DialogHeader data-testid="career-builder-dialog">
            <DialogTitle className="text-white text-xl font-bold">Apply to Become a Career Builder</DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">
              To become a Career Builder, you need to have a Talent account first. This helps us verify your identity and ensures a smooth onboarding process.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              Once you have a Talent account, you can apply to become a Career Builder. Our team will review your application and contact you within 2-3 business days.
            </p>
            {user && (userRole === "client" || profile?.role === "client") ? (
              <Alert className="bg-green-900/30 border-green-700">
                <AlertDescription className="text-green-300">
                  You already have Career Builder access. Use your dashboard to post opportunities and hire talent.
                </AlertDescription>
              </Alert>
            ) : user ? (
              <Alert className="bg-green-900/30 border-green-700">
                <AlertDescription className="text-green-300">
                  You&apos;re already logged in! You can apply to become a Career Builder now.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-lg panel-frosted p-3">
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
              className="border-border/50 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            {user && (userRole === "client" || profile?.role === "client") ? (
              <Button
                onClick={() => {
                  setShowCareerBuilderDialog(false);
                  router.push(PATHS.CLIENT_DASHBOARD);
                }}
                className="bg-amber-500 text-black hover:bg-amber-400"
              >
                Open Career Builder dashboard
              </Button>
            ) : user ? (
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
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0 panel-frosted">
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
    </PageShell>
  );
}
