"use client";

import type { User, Session, AuthError, AuthChangeEvent, SupabaseClient } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";

import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { Database } from "@/types/supabase";

type UserRole = "talent" | "client" | "admin" | null;

type SignUpOptions = {
  data?: Record<string, unknown>;
  emailRedirectTo?: string;
};

type AuthContextType = {
  supabase: SupabaseClient<Database> | null;
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
        supabase: null,
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
  const [hasHandledInitialSession, setHasHandledInitialSession] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const supabase = createSupabaseBrowser();

  useEffect(() => {
    // Prevent initialization during static generation
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // Check if supabase is available
    if (!supabase) {
      setIsLoading(false);
      setHasHandledInitialSession(true);
      return;
    }

    let mounted = true;

    // Initial session check - only once on mount
    const initialSession = async () => {
      try {
        if (!supabase) return;
        
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        // If there is no session on initial load, we can stop loading.
        if (!session) {
          setIsLoading(false);
          setHasHandledInitialSession(true);
          return;
        }

        // If there is a session, proceed to set user and fetch profile
        setUser(session.user);
        setSession(session);

        const { data: profileData } = (await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()) as { data: { role: string } | null; error: unknown };

        if (!mounted) return;

        const role = (profileData?.role ?? null) as UserRole;
        setUserRole(role);
        setIsEmailVerified(session.user.email_confirmed_at !== null);
        setIsLoading(false);
        setHasHandledInitialSession(true);
      } catch (error) {
        console.error("Error in initial session check:", error);
        if (mounted) {
          setIsLoading(false);
          setHasHandledInitialSession(true);
        }
      }
    };

    initialSession();

    // Set up auth state change listener - this is the main way to handle auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      setIsLoading(true);
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session) {
        try {
          const { data: profileData } = (await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()) as { data: { role: string } | null; error: unknown };

          if (!mounted) return;

          const role = (profileData?.role ?? null) as UserRole;
          setUserRole(role);
          setIsEmailVerified(session.user.email_confirmed_at !== null);

          // 🔧 FIX: Only redirect on ACTUAL sign-ins, not initial session loads
          // Check if this is a fresh sign-in (not an initial session load)
          if (hasHandledInitialSession) {
            // Also check if user is not already on an allowed page
            const allowedPages = ["/settings", "/profile", "/onboarding", "/choose-role"];
            const isOnAllowedPage = allowedPages.some((page) => pathname.startsWith(page));

            if (!isOnAllowedPage) {
              // Redirect based on role - only for actual sign-ins
              if (role === "talent") {
                router.push("/talent/dashboard");
              } else if (role === "client") {
                router.push("/client/dashboard");
              } else if (role === "admin") {
                router.push("/admin/dashboard");
              } else {
                router.push("/choose-role");
              }
            }
          }
        } catch (error) {
          console.error("Error fetching profile on sign in:", error);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setIsEmailVerified(false);
        setHasHandledInitialSession(false);
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
  }, [supabase, router, pathname, hasHandledInitialSession]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: null };
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.session) {
      // Manually set the session if the sign-in was successful
      setUser(data.session.user);
      setSession(data.session);
      setIsEmailVerified(data.session.user.email_confirmed_at !== null);

      // Fetch user role
      try {
        const { data: profileData } = (await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single()) as { data: { role: string } | null; error: unknown };

        const role = (profileData?.role ?? null) as UserRole;
        setUserRole(role);

        // Redirect based on role
        if (role === "talent") {
          router.push("/talent/dashboard");
        } else if (role === "client") {
          router.push("/client/dashboard");
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/choose-role");
        }
      } catch (profileError) {
        console.error("Error fetching profile on sign in:", profileError);
        router.push("/choose-role");
      }
    }

    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    options?: SignUpOptions
  ): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: null };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      ...options,
    });
    return { error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: null };
    
    try {
      // Clear all local state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsEmailVerified(false);
      setHasHandledInitialSession(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Clear any cached data
      if (typeof window !== "undefined") {
        // Clear localStorage using environment variable
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          localStorage.removeItem("sb-" + supabaseUrl.split("//")[1].split(".")[0] + "-auth-token");
        }
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear any other auth-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.includes("supabase") || key.includes("auth")) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Force redirect to login
      router.push("/login");
      router.refresh(); // Force a refresh to clear any cached data
      
      return { error };
    } catch (error) {
      console.error("Error during sign out:", error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsEmailVerified(false);
      router.push("/login");
      return { error: error as AuthError };
    }
  };

  const sendVerificationEmail = async (): Promise<{ error: Error | null }> => {
    if (!user?.email) {
      return { error: new Error("No user email found") };
    }

    try {
      // Send the verification email using our API route that handles admin operations
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
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
      if (!supabase) return { error: null };
      
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
