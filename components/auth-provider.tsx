"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient, User, Session, AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import type { Database } from "@/types/supabase";

type UserRole = "talent" | "client" | "admin" | null;

type SignUpOptions = {
  data?: Record<string, unknown>;
  emailRedirectTo?: string;
};

type AuthContextType = {
  supabase: SupabaseClient<Database>;
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  isLoading: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  sendVerificationEmail: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback auth provider when Supabase is not configured
function FallbackAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        supabase: null as unknown as SupabaseClient<Database>,
        user: null,
        session: null,
        userRole: null,
        isLoading: false,
        isEmailVerified: false,
        signIn: async () => ({ error: { message: "Supabase not configured" } as AuthError }),
        signUp: async () => ({ error: { message: "Supabase not configured" } as AuthError }),
        signOut: async () => ({ error: { message: "Supabase not configured" } as AuthError }),
        sendVerificationEmail: async () => ({ error: new Error("Supabase not configured") }),
        resetPassword: async () => ({ error: { message: "Supabase not configured" } as AuthError }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Main auth provider with Supabase functionality
function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();

  const supabase = createClientComponentClient<Database>();

  // Session caching utilities
  const SESSION_CACHE_KEY = "totl_session_cache";
  const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const cacheSession = (session: Session | null) => {
    if (typeof window !== "undefined" && session) {
      localStorage.setItem(
        SESSION_CACHE_KEY,
        JSON.stringify({
          session,
          timestamp: Date.now(),
        })
      );
    }
  };

  const getCachedSession = (): Session | null => {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      if (!cached) return null;

      const { session, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid (5 minutes)
      if (now - timestamp < SESSION_CACHE_DURATION) {
        return session;
      }

      // Clear expired cache
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Prevent initialization during static generation
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Initial session check - only once on mount
    const initialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        // If there is no session on initial load, we can stop loading.
        if (!session) {
          setIsLoading(false);
          return;
        }

        // If there is a session, proceed to set user and fetch profile
        setUser(session.user);
        setSession(session);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!mounted) return;

        const role = profileData?.role as UserRole;
        setUserRole(role);
        setIsEmailVerified(session.user.email_confirmed_at !== null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in initial session check:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialSession();

    // Set up auth state change listener - this is the main way to handle auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setIsLoading(true);
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session) {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (!mounted) return;

          const role = profileData?.role as UserRole;
          setUserRole(role);
          setIsEmailVerified(session.user.email_confirmed_at !== null);

          // Redirect based on role - FIXED PATHS
          if (role === "talent") {
            router.push("/talent/dashboard");
          } else if (role === "client") {
            router.push("/client/dashboard");
          } else if (role === "admin") {
            router.push("/admin/dashboard");
          } else {
            // If no role, perhaps go to a role selection or onboarding page
            router.push("/choose-role");
          }
        } catch (error) {
          console.error("Error fetching profile on sign in:", error);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setIsEmailVerified(false);
        router.push("/login");
      } else if (event === "TOKEN_REFRESHED") {
        // Just update the session, no need to refetch profile
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          setIsEmailVerified(session.user.email_confirmed_at !== null);
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    options?: SignUpOptions
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      ...options,
    });
    return { error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setIsEmailVerified(false);
    router.push("/login");
    return { error };
  };

  const sendVerificationEmail = async (): Promise<{ error: Error | null }> => {
    if (!user?.email) {
      return { error: new Error("No user email found") };
    }

    try {
      // 1. Generate new verification link
      const supabaseAdmin = createSupabaseAdminClient();
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: user.email,
        password: "",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (linkError || !linkData.properties?.action_link) {
        return { error: linkError ?? new Error("No action link returned") };
      }

      // 2. Send the verification email using Resend
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          verificationLink: linkData.properties.action_link,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: new Error(errorData.error || "Failed to send verification email") };
      }

      return { error: null };
    } catch (error) {
      console.error("Error sending verification email:", error);
      return { error: error instanceof Error ? error : new Error("Unknown error") };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      return { error };
    } catch (error) {
      console.error("Password reset error:", error);
      return { error: { message: "Failed to send password reset email" } as AuthError };
    }
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase not configured, using fallback auth provider");
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }

  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useSupabaseStatus() {
  const checkConnection = async () => {
    try {
      const response = await fetch("/api/admin/test-connection");
      return response.ok;
    } catch {
      return false;
    }
  };

  return { checkConnection };
}
