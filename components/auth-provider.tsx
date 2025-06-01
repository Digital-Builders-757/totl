"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient, User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client"
import { useRouter } from "next/navigation"

type UserRole = "talent" | "client" | "admin" | null

type AuthContextType = {
  supabase: SupabaseClient<Database>
  user: User | null
  session: Session | null
  userRole: UserRole
  isLoading: boolean
  isEmailVerified: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: any }>
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
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        setUser(null)
        router.replace("/login")
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase, router])

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true)

      // Get session and user
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error getting session:", error)
        setIsLoading(false)
        return
      }

      if (session) {
        setSession(session)
        setUser(session.user)

        // Check if email is verified
        setIsEmailVerified(session.user.email_confirmed_at !== null)

        // Get user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          console.error("Error getting user role:", profileError)
        } else if (profile) {
          setUserRole(profile.role as UserRole)
        }
      }

      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      // Update email verification status when auth state changes
      if (session?.user) {
        setIsEmailVerified(session.user.email_confirmed_at !== null)

        // Get user role when auth state changes
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

        setUserRole((profile?.role as UserRole) ?? null)
      } else {
        setUserRole(null)
        setIsEmailVerified(false)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      // 1. Create user in Supabase Auth with email confirmation disabled
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error("Signup error:", signUpError)
        return { error: signUpError }
      }

      // 2. Create profile record
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user?.id,
          role,
          email_verified: false,
        },
      ])

      if (profileError) {
        console.error("Profile creation error:", profileError)
        return { error: profileError }
      }

      // 3. Generate verification link using Supabase admin
      const supabaseAdmin = createSupabaseAdminClient()
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (linkError || !linkData.properties?.action_link) {
        console.error("Error generating verification link:", linkError)
        return { error: linkError }
      }

      // 4. Send custom verification email via Resend
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userId: data.user?.id,
          verificationUrl: linkData.properties.action_link,
        }),
      })

      if (!response.ok) {
        console.error("Error sending verification email")
        // Continue anyway since the account was created
      }

      return { error: null }
    } catch (error) {
      console.error("Unexpected error during signup:", error)
      return { error }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
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
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      // Try to make a simple query to check connection
      const { error } = await supabase.from("profiles").select("id").limit(1)
      setIsConnected(!error)
      return !error
    } catch (e) {
      console.error("Supabase connection error:", e)
      setIsConnected(false)
      return false
    } finally {
      setIsChecking(false)
    }
  }

  return { isConnected, isChecking, checkConnection }
}

async function fetchWithAuth(url, supabase) {
  let { data, error } = await supabase.from(url).select("*")
  if (error && error.status === 401) {
    // Try to refresh session
    await supabase.auth.refreshSession()
    // Retry the request
    return await supabase.from(url).select("*")
  }
  return { data, error }
}
