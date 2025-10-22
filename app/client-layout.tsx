"use client";

import { usePathname } from "next/navigation";
import type React from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import Navbar from "@/components/navbar";

import "./globals.css";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useCommandPalette();

  // Hide the main navbar on admin and talent dashboard pages
  const showNavbar = !pathname?.startsWith("/admin") && !pathname?.startsWith("/talent/dashboard");

  return (
    <AuthProvider>
      {showNavbar && <Navbar />}
      <CommandPalette open={open} onOpenChange={setOpen} />
      {children}
    </AuthProvider>
  );
}
