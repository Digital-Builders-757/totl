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

type ProfileData = {
  role: UserRole;
  avatar_url: string | null;
  avatar_path: string | null;
  display_name: string | null;
} | null;

type AuthContextType = {
  supabase: SupabaseClient<Database> | null;
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  profile: ProfileData;
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
        profile: null,
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
  const [profile, setProfile] = useState<ProfileData>(null);
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

        // Use maybeSingle() to prevent 406 errors when profile doesn't exist
        // Fetch ALL profile fields once to avoid N+1 queries
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, avatar_url, avatar_path, display_name")
          .eq("id", session.user.id)
          .maybeSingle();

        // Log profile query errors to Sentry for debugging
        if (profileError && profileError.code !== "PGRST116") {
          // Import Sentry dynamically to avoid SSR issues
          const Sentry = await import("@sentry/nextjs");
          Sentry.captureException(new Error(`Auth provider profile query error: ${profileError.message}`), {
            tags: {
              feature: "auth",
              error_type: "auth_provider_profile_error",
              error_code: profileError.code || "unknown",
            },
            extra: {
              userId: session.user.id,
              userEmail: session.user.email,
              errorCode: profileError.code,
              errorDetails: profileError.details,
              errorMessage: profileError.message,
              timestamp: new Date().toISOString(),
            },
            level: "error",
          });
        }

        if (!mounted) return;

        const role = (profileData?.role ?? null) as UserRole;
        setUserRole(role);
        // Store full profile data to avoid duplicate queries
        setProfile(profileData ? {
          role: role,
          avatar_url: profileData.avatar_url,
          avatar_path: profileData.avatar_path,
          display_name: profileData.display_name,
        } : null);
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
          // Use maybeSingle() to prevent 406 errors when profile doesn't exist
          // Fetch ALL profile fields once to avoid N+1 queries
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("role, avatar_url, avatar_path, display_name")
            .eq("id", session.user.id)
            .maybeSingle();

          // Log profile query errors to Sentry for debugging
          if (profileError && profileError.code !== "PGRST116") {
            const Sentry = await import("@sentry/nextjs");
            Sentry.captureException(new Error(`Auth state change profile query error: ${profileError.message}`), {
              tags: {
                feature: "auth",
                error_type: "auth_state_change_profile_error",
                error_code: profileError.code || "unknown",
              },
              extra: {
                userId: session.user.id,
                userEmail: session.user.email,
                pathname: pathname,
                errorCode: profileError.code,
                errorDetails: profileError.details,
                errorMessage: profileError.message,
                timestamp: new Date().toISOString(),
              },
              level: "error",
            });
          }

          if (!mounted) return;

          const role = (profileData?.role ?? null) as UserRole;
          setUserRole(role);
          // Store full profile data to avoid duplicate queries
          setProfile(profileData ? {
            role: role,
            avatar_url: profileData.avatar_url,
            avatar_path: profileData.avatar_path,
            display_name: profileData.display_name,
          } : null);
          setIsEmailVerified(session.user.email_confirmed_at !== null);

          // 🔧 FIX: Only redirect on ACTUAL sign-ins, not initial session loads
          // Check if this is a fresh sign-in (not an initial session load)
          // Also check if we're not on the login page (where server action handles redirect)
          if (hasHandledInitialSession && !pathname.startsWith("/login")) {
            // Also check if user is not already on an allowed page
            const allowedPages = ["/settings", "/profile", "/onboarding", "/choose-role", "/verification-pending"];
            const isOnAllowedPage = allowedPages.some((page) => pathname.startsWith(page));

            if (!isOnAllowedPage) {
              // Redirect based on role - only for actual sign-ins
              // Use router.refresh() to clear cache before redirect
              router.refresh();
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
        setProfile(null);
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

      // Fetch user role with a fresh query - use maybeSingle() to prevent 406 errors
      // Fetch ALL profile fields once to avoid N+1 queries
      try {
        const { data: profileData } = (await supabase
          .from("profiles")
          .select("role, avatar_url, avatar_path, display_name")
          .eq("id", data.session.user.id)
          .maybeSingle()) as { 
            data: { 
              role: string;
              avatar_url: string | null;
              avatar_path: string | null;
              display_name: string | null;
            } | null; 
            error: unknown 
          };

        const role = (profileData?.role ?? null) as UserRole;
        setUserRole(role);
        // Store full profile data to avoid duplicate queries
        setProfile(profileData ? {
          role: role,
          avatar_url: profileData.avatar_url,
          avatar_path: profileData.avatar_path,
          display_name: profileData.display_name,
        } : null);

        // Note: The login page uses handleLoginRedirect() server action for redirect
        // This ensures fresh session data and proper cache clearing
        // We don't redirect here to avoid conflicts with server-side redirect
      } catch (profileError) {
        console.error("Error fetching profile on sign in:", profileError);
        // Don't redirect here - let the server action handle it
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
      setProfile(null);
      setIsEmailVerified(false);
      setHasHandledInitialSession(false);
      
      // Sign out from Supabase - this clears server-side session and cookies
      const { error } = await supabase.auth.signOut();
      
      // Clear all client-side storage and cache
      if (typeof window !== "undefined") {
        // Clear localStorage - remove auth-related items
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          // Clear Supabase-specific localStorage keys
          const projectRef = supabaseUrl.split("//")[1].split(".")[0];
          localStorage.removeItem(`sb-${projectRef}-auth-token`);
        }
        
        // Clear any other auth-related localStorage items
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth") || key.includes("sb-")) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear all sessionStorage
        sessionStorage.clear();
        
        // Clear Supabase auth cookies specifically
        // Supabase SSR stores session in cookies with names like:
        // - sb-<project-ref>-auth-token
        // - sb-<project-ref>-auth-token.0, sb-<project-ref>-auth-token.1, etc.
        if (supabaseUrl) {
          const projectRef = supabaseUrl.split("//")[1].split(".")[0];
          const cookieBaseName = `sb-${projectRef}-auth-token`;
          
          // Clear base cookie and chunked cookies (0-9)
          for (let i = 0; i < 10; i++) {
            const cookieName = i === 0 ? cookieBaseName : `${cookieBaseName}.${i}`;
            // Clear with different path and domain combinations
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            if (window.location.hostname.includes(".")) {
              document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            }
          }
        }
      }
      
      // Use hard redirect to ensure complete session clear and page reload
      // This bypasses Next.js router cache and forces a full page reload
      if (typeof window !== "undefined") {
        // Small delay to ensure state is cleared before redirect
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = "/login";
      } else {
        // Fallback for server-side (shouldn't happen, but just in case)
        router.push("/login");
        router.refresh();
      }
      
      return { error };
    } catch (error) {
      console.error("Error during sign out:", error);
      // Even if there's an error, clear local state and force redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      setIsEmailVerified(false);
      setHasHandledInitialSession(false);
      
      // Force hard redirect even on error
      if (typeof window !== "undefined") {
        // Clear storage on error too
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          const projectRef = supabaseUrl.split("//")[1].split(".")[0];
          localStorage.removeItem(`sb-${projectRef}-auth-token`);
        }
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth") || key.includes("sb-")) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
        window.location.href = "/login";
      } else {
        router.push("/login");
        router.refresh();
      }
      
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
        profile,
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
