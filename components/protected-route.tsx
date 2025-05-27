"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: "talent" | "client" | "admin"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (!isLoading && requiredRole && userRole !== requiredRole) {
      // Redirect based on role
      if (userRole === "talent") {
        router.push("/admin/talentdashboard")
      } else if (userRole === "client") {
        router.push("/admin/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, userRole, isLoading, router, requiredRole])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && userRole !== requiredRole) {
    return null
  }

  return <>{children}</>
}
