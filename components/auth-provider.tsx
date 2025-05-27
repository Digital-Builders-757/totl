"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient, User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

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
      console.log("Starting signup process...")

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

      console.log("User created successfully:", data.user?.id)

      // Create profile record with role
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user?.id,
          role,
          email_verified: false,
        },
      ])

      if (profileError) {
        console.error("Profile creation error:", profileError)
      }

      return { error: profileError }
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

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { error }
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
