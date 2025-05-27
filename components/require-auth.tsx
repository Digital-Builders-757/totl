"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useState, useEffect, type ReactNode } from "react"

type RequireAuthProps = {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  preserveReturnUrl?: boolean
}

/**
 * Component that requires the user to be authenticated
 * Redirects to login or role selection page if not authenticated
 */
export function RequireAuth({
  children,
  fallback,
  redirectTo = "/choose-role",
  preserveReturnUrl = true,
}: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      // Store the current URL to redirect back after auth
      if (preserveReturnUrl && typeof window !== "undefined") {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
        router.push(`${redirectTo}?returnUrl=${returnUrl}`)
      } else {
        router.push(redirectTo)
      }
    }
  }, [user, isLoading, router, redirectTo, preserveReturnUrl, mounted])

  // Don't render anything on the server or while loading
  if (!mounted || isLoading) return null

  // If user is authenticated, render children
  if (user) return <>{children}</>

  // Otherwise, render fallback (if provided)
  return fallback ? <>{fallback}</> : null
}
