"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type React from "react";

import { ChunkLoadErrorHandler } from "@/components/chunk-load-error-handler";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import Navbar from "@/components/navbar";
import { SupabaseEnvBanner } from "@/components/supabase-env-banner";

import "./globals.css";

// Dynamically import Ga4Analytics to avoid chunk loading errors
// Load it client-side only with no SSR to prevent hydration issues
// This must be in a Client Component (not Server Component like layout.tsx)
const Ga4Analytics = dynamic(
  () => import("@/components/analytics/ga4-analytics").then((mod) => ({ default: mod.Ga4Analytics })),
  {
    ssr: false,
    loading: () => null, // Don't show anything while loading
  }
);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useCommandPalette();

  // Hide the main navbar on terminal dashboard routes that own their own header chrome.
  const isClientTerminalRoute =
    pathname?.startsWith("/client/dashboard") ||
    pathname?.startsWith("/client/applications") ||
    pathname?.startsWith("/client/gigs");

  const showNavbar =
    !pathname?.startsWith("/admin") &&
    !pathname?.startsWith("/talent/dashboard") &&
    !isClientTerminalRoute;

  // AuthProvider moved to root Providers component to prevent remounts on navigation
  return (
    <>
      <ChunkLoadErrorHandler />
      <Ga4Analytics />
      <SupabaseEnvBanner />
      {showNavbar && <Navbar />}
      <CommandPalette open={open} onOpenChange={setOpen} />
      {children}
    </>
  );
}
