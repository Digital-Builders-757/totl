"use client";

import { usePathname } from "next/navigation";
import type React from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import Navbar from "@/components/navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide the main navbar on admin and talent dashboard pages
  const showNavbar = !pathname?.startsWith("/admin") && !pathname?.startsWith("/talent/dashboard");

  return (
    <AuthProvider>
      {showNavbar && <Navbar />}
      {children}
    </AuthProvider>
  );
}
