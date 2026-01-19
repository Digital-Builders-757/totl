"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type React from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
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

  // Hide the main navbar on admin and talent dashboard pages
  const showNavbar = !pathname?.startsWith("/admin") && !pathname?.startsWith("/talent/dashboard");

  return (
    <AuthProvider>
      <Ga4Analytics />
      <SupabaseEnvBanner />
      {showNavbar && <Navbar />}
      <CommandPalette open={open} onOpenChange={setOpen} />
      {children}
    </AuthProvider>
  );
}
