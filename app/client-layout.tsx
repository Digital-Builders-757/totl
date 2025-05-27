"use client"

import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/components/auth-provider"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Hide the main navbar on admin and talent dashboard pages
  const showNavbar = !pathname?.startsWith("/admin") && !pathname?.startsWith("/talent/dashboard")

  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        {showNavbar && <Navbar />}
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}
