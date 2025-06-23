"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient, User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

type UserRole = "talent" | "client" | "admin" | null

type AuthContextType = {
  supabase: SupabaseClient<Database>
  user: User | null
  session: Session | null
  userRole: UserRole
  isLoading: boolean
  isEmailVerified: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, options?: { data?: any; emailRedirectTo?: string }) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  sendVerificationEmail: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      setIsLoading(true)
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        // Network or server error, try again after a short delay
        setTimeout(checkSession, 2000)
        return
      }

      if (!data.session) {
        // No session, try to refresh
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshed?.session) {
          setUser(refreshed.session.user)
        } else {
          // Still no session, redirect to login
          router.replace("/login")
        }
      } else {
        setUser(data.session.user)
      }
      setIsLoading(false)
    }

    checkSession()

    // Optionally, listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session) {
        try {
          const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

          if (error) {
            // This is the most likely source of the 404 error.
            // Throw the error to be caught by the outer catch block.
            throw error
          }

          const role = profile?.role as UserRole
          setUserRole(role)
          setIsEmailVerified(session.user.email_confirmed_at !== null)

          // Redirect based on role
          if (role === "talent") {
            router.push("/admin/talentdashboard")
          } else if (role === "client") {
            router.push("/admin/dashboard")
          } else if (role === "admin") {
            router.push("/admin/dashboard")
          } else {
            // If role is null or not found, it's a configuration issue.
            // Let's redirect to a safe page and log an error.
            console.error("User signed in but has no role. Redirecting to dashboard.")
            router.push("/admin/dashboard") // Fallback
          }
        } catch (error: any) {
          console.error("Error fetching user profile after sign-in:", error)
          toast({
            title: "Failed to fetch user profile",
            description: `There was an error getting your role from the database. Message: ${error.message}`,
            variant: "destructive",
          })
          // Sign the user out to prevent a loop
          await supabase.auth.signOut()
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setSession(null)
        setUserRole(null)
        setIsEmailVerified(false)
        router.push("/login")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, options?: { data?: any; emailRedirectTo?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    // After signing out, we should manually clear the state and redirect
    // to ensure a clean slate, preventing issues with stale sessions.
    setUser(null)
    setSession(null)
    setUserRole(null)
    setIsEmailVerified(false)
    router.push("/login")
    return { error }
  }

  const sendVerificationEmail = async () => {
    if (!user?.email) {
      return { error: new Error("No user email found") }
    }

    try {
      // 1. Generate new verification link
      const supabaseAdmin = createSupabaseAdminClient()
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: user.email,
        password: "",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (linkError || !linkData.properties?.action_link) {
        return { error: linkError }
      }

      // 2. Send custom verification email
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          verificationUrl: linkData.properties.action_link,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send verification email")
      }

      return { error: null }
    } catch (error) {
      console.error("Error sending verification email:", error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    return { error }
  }

  const value = {
    supabase,
    user,
    session,
    userRole,
    isLoading,
    isEmailVerified,
    signIn,
    signUp,
    signOut,
    sendVerificationEmail,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useSupabaseStatus() {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true)

  const checkConnection = async () => {
    try {
      const supabaseAdmin = createSupabaseAdminClient()
      const { error } = await supabaseAdmin.from("profiles").select("id").limit(1)

      if (error) {
        throw error
      }
      setIsSupabaseConnected(true)
    } catch (error) {
      setIsSupabaseConnected(false)
    }
  }

  return { isSupabaseConnected, checkConnection }
}

async function fetchWithAuth(url: string, supabase: SupabaseClient<Database>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers = new Headers()
  if (session?.access_token) {
    headers.append("Authorization", `Bearer ${session.access_token}`)
  }

  return fetch(url, { headers })
}
