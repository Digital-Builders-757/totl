"use client";

import { Lock, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { PATHS } from "@/lib/constants/routes";

interface SignInGateProps {
  variant: "gigs" | "talent";
  className?: string;
}

const variantConfig = {
  gigs: {
    icon: Lock,
    headline: "Unlock Amazing Gigs",
    subheadline: "Sign in to discover exclusive opportunities",
    description: "Join our trusted community of talent and clients. Access premium gigs, connect with industry professionals, and take your career to the next level.",
    primaryCta: "Sign in to view gigs",
    secondaryCta: "Create an account",
    primaryHref: PATHS.LOGIN,
    secondaryHref: PATHS.CHOOSE_ROLE,
    learnMoreHref: "/about",
  },
  talent: {
    icon: Users,
    headline: "Discover Top Talent",
    subheadline: "Sign in to explore our curated network",
    description: "Access our exclusive network of professional models and actors. Find the perfect talent for your next project with our premium discovery tools.",
    primaryCta: "Sign in to explore talent",
    secondaryCta: "Create an account", 
    primaryHref: PATHS.LOGIN,
    secondaryHref: PATHS.CHOOSE_ROLE,
    learnMoreHref: "/about",
  },
} as const;

export function SignInGate({ variant, className = "" }: SignInGateProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  // Analytics hook (non-blocking)
  React.useEffect(() => {
    // TODO: Implement analytics tracking
    // trackEvent('sign_in_gate_viewed', { page: variant });
  }, [variant]);

  return (
    <div className={`min-h-screen flex items-start justify-center pt-20 px-4 pb-8 sm:items-center sm:pt-0 ${className}`}>
      <div className="w-full max-w-md">
        {/* Frosted glass panel with backlit effect */}
        <div className="panel-frosted card-backlit grain-texture relative overflow-hidden">
          {/* Subtle animated glow halo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 motion-safe:animate-pulse" />
          
          {/* Content */}
          <div className="relative z-10 p-6 text-left sm:text-center sm:p-8">
            {/* Icon with subtle glow */}
            <div className="mb-4 flex justify-center sm:mb-6">
              <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 backdrop-blur-sm sm:p-4">
                <IconComponent 
                  className="h-6 w-6 text-blue-400 motion-safe:drop-shadow-lg sm:h-8 sm:w-8" 
                  aria-hidden="true"
                  data-testid={`${variant === 'gigs' ? 'lock' : 'users'}-icon`}
                />
              </div>
            </div>

            {/* Headline */}
            <h1 className="mb-2 text-xl font-bold text-white sm:mb-4 sm:text-2xl lg:text-3xl">
              {config.headline}
            </h1>

            {/* Subheadline */}
            <h2 className="mb-4 text-sm font-medium text-blue-300 sm:mb-6 sm:text-base">
              {config.subheadline}
            </h2>

            {/* Description */}
            <p className="mb-6 text-xs text-gray-300 leading-relaxed sm:mb-8 sm:text-sm lg:text-base">
              {config.description}
            </p>

            {/* CTAs */}
            <div className="space-y-3 sm:space-y-4">
              {/* Primary CTA */}
              <Link href={config.primaryHref} className="block">
                <Button 
                  className="w-full button-glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 text-sm sm:text-base sm:py-3 sm:px-6"
                  size="lg"
                >
                  {config.primaryCta}
                </Button>
              </Link>

              {/* Secondary CTA */}
              <Link href={config.secondaryHref} className="block">
                <Button 
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 py-3 px-4 text-sm sm:text-base sm:py-3 sm:px-6"
                  size="lg"
                >
                  {config.secondaryCta}
                </Button>
              </Link>

              {/* Learn more link */}
              <div className="pt-1 sm:pt-2">
                <Link 
                  href={config.learnMoreHref}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm sm:text-sm"
                >
                  Learn more about TOTL
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional visual elements */}
        <div className="mt-6 text-center sm:mt-8">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Trusted by industry professionals</span>
          </div>
        </div>
      </div>
    </div>
  );
}
