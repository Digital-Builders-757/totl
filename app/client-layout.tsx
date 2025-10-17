"use client";

import { usePathname } from "next/navigation";
import type React from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/hooks/use-toast";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide the main navbar on admin and talent dashboard pages
  const showNavbar = !pathname?.startsWith("/admin") && !pathname?.startsWith("/talent/dashboard");

  return (
    <AuthProvider>
      <ToastProvider>
        {showNavbar && <Navbar />}
        {children}
        <Toaster />
      </ToastProvider>
    </AuthProvider>
  );
}
