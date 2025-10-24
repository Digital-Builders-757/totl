"use client";

import { Lock, Users, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface SignInGateProps {
  variant: "gigs" | "talent";
  className?: string;
}

const variantConfig = {
  gigs: {
    icon: Lock,
    headline: "Sign in to view gigs",
    description: "Join our trusted community of talent and clients. Sign in to discover amazing opportunities and connect with industry professionals.",
    primaryCta: "Sign in",
    secondaryCta: "Create an account",
    primaryHref: "/login",
    secondaryHref: "/choose-role",
    learnMoreHref: "/about",
  },
  talent: {
    icon: Users,
    headline: "Sign in to explore talent",
    description: "Access our curated network of professional models and actors. Sign in to find the perfect talent for your next project.",
    primaryCta: "Sign in",
    secondaryCta: "Create an account", 
    primaryHref: "/login",
    secondaryHref: "/choose-role",
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
    <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
      <div className="w-full max-w-md">
        {/* Frosted glass panel with backlit effect */}
        <div className="panel-frosted card-backlit grain-texture relative overflow-hidden">
          {/* Subtle animated glow halo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 motion-safe:animate-pulse" />
          
          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Icon with subtle glow */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 backdrop-blur-sm">
                <IconComponent 
                  className="h-8 w-8 text-blue-400 motion-safe:drop-shadow-lg" 
                  aria-hidden="true"
                  data-testid={`${variant === 'gigs' ? 'lock' : 'users'}-icon`}
                />
              </div>
            </div>

            {/* Headline */}
            <h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
              {config.headline}
            </h1>

            {/* Description */}
            <p className="mb-8 text-sm text-gray-300 leading-relaxed sm:text-base">
              {config.description}
            </p>

            {/* CTAs */}
            <div className="space-y-4">
              {/* Primary CTA */}
              <Link href={config.primaryHref} className="block">
                <Button 
                  className="w-full button-glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  size="lg"
                >
                  {config.primaryCta}
                </Button>
              </Link>

              {/* Secondary CTA */}
              <Link href={config.secondaryHref} className="block">
                <Button 
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  size="lg"
                >
                  {config.secondaryCta}
                </Button>
              </Link>

              {/* Learn more link */}
              <div className="pt-2">
                <Link 
                  href={config.learnMoreHref}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
                >
                  Learn more about TOTL
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional visual elements */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">Trusted by industry professionals</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add React import for useEffect
import React from "react";
