"use client";

import type { User, Session, AuthError, AuthChangeEvent, SupabaseClient } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import type React from "react";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

import { AuthTimeoutRecovery } from "./auth-timeout-recovery";
import { ensureProfileExists } from "@/lib/actions/auth-actions";
import { getBootState } from "@/lib/actions/boot-actions";
import {
  PATHS,
  isAuthRoute,
  isPublicPath,
} from "@/lib/constants/routes";
import { createSupabaseBrowser, resetSupabaseBrowserClient } from "@/lib/supabase/supabase-browser";
import type { Database } from "@/types/supabase";

type UserRole = "talent" | "client" | "admin" | null;
type AccountType = "unassigned" | "talent" | "client";

type SignUpOptions = {
  data?: Record<string, unknown>;
  emailRedirectTo?: string;
};

type ProfileData = {
  role: UserRole;
  account_type: AccountType;
  avatar_url: string | null;
  avatar_path: string | null;
  display_name: string | null;
  subscription_status: Database['public']['Enums']['subscription_status'];
  subscription_plan: string | null;
  subscription_current_period_end: string | null;
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
  const [showTimeoutRecovery, setShowTimeoutRecovery] = useState(false);
  const manualSignOutInProgressRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(isLoading);

  // Sync ref with state so timeout callback can read current value
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const router = useRouter();
  const pathname = usePathname();

  // Browser client ref - initialized in useEffect (after mount, never during render)
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);

  // Accessor function - throws if accessed before initialization (fail-fast)
  const getSupabase = useCallback((): SupabaseClient<Database> => {
    if (!supabaseRef.current) {
      throw new Error("Supabase client not initialized yet. This should only be called after mount in useEffect or event handlers.");
    }
    return supabaseRef.current;
  }, []);

  // Initialize browser client after mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      supabaseRef.current = createSupabaseBrowser();
    }
  }, []);

  const mapProfileRow = (row: {
    role: UserRole;
    account_type: AccountType | null;
    avatar_url: string | null;
    avatar_path: string | null;
    display_name: string | null;
    subscription_status: Database["public"]["Enums"]["subscription_status"] | null;
    subscription_plan: string | null;
    subscription_current_period_end: string | null;
  } | null): ProfileData => {
    if (!row) return null;
    return {
      role: (row.role ?? null) as UserRole,
      account_type: (row.account_type ?? "unassigned") as AccountType,
      avatar_url: row.avatar_url ?? null,
      avatar_path: row.avatar_path ?? null,
      display_name: row.display_name ?? null,
      subscription_status: (row.subscription_status ?? "none") as Database["public"]["Enums"]["subscription_status"],
      subscription_plan: row.subscription_plan ?? null,
      subscription_current_period_end: row.subscription_current_period_end ?? null,
    };
  };

  const fetchProfile = useCallback(
    async (userId: string) => {
      // Only call after mount (in useEffect/handlers), so getSupabase() is safe
      const supabase = getSupabase();

      const selectColumns =
        "role, account_type, avatar_url, avatar_path, display_name, subscription_status, subscription_plan, subscription_current_period_end";

      const { data, error } = await supabase
        .from("profiles")
        .select(selectColumns)
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(new Error(`Auth provider profile query error: ${error.message}`), {
          tags: {
            feature: "auth",
            error_type: "auth_provider_profile_error",
            error_code: error.code || "unknown",
          },
          extra: {
            userId,
            errorCode: error.code,
            errorDetails: error.details,
            errorMessage: error.message,
            timestamp: new Date().toISOString(),
          },
          level: "error",
        });
      }

      return { profile: mapProfileRow(data as ProfileData) };
    },
    [getSupabase]
  );

  const ensureAndHydrateProfile = useCallback(
    async (user: User) => {
      const { profile: existingProfile } = await fetchProfile(user.id);
      if (existingProfile) return existingProfile;

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const breadcrumb = async (data: Record<string, unknown>) => {
        try {
          const Sentry = await import("@sentry/nextjs");
          Sentry.addBreadcrumb({
            category: "auth.bootstrap",
            message: "ensureAndHydrateProfile",
            level: "info",
            data: {
              userId: user.id,
              ...data,
            },
          });
        } catch {
          // Ignore if Sentry isn't available (or blocked) in dev/test.
        }
      };

      // Bounded retry: first login after signup can race server-session cookie propagation.
      // Goal: avoid settling into `user != null` + `profile == null` until a hard refresh.
      for (let attempt = 0; attempt < 2; attempt++) {
        await breadcrumb({ phase: "attempt_start", attempt });
        const profileResult = await ensureProfileExists();
        if (profileResult?.error) {
          console.error("Error ensuring profile exists:", profileResult.error);
          await breadcrumb({ phase: "ensure_error", attempt, error: profileResult.error });
          return null;
        }

        if (profileResult?.profile) {
          await breadcrumb({ phase: "ensure_returned_profile", attempt });
          return mapProfileRow(profileResult.profile as ProfileData);
        }

        if (profileResult?.exists) {
          const { profile: retryProfile } = await fetchProfile(user.id);
          await breadcrumb({ phase: "ensure_reported_exists", attempt, fetchedAfterExists: Boolean(retryProfile) });
          return retryProfile;
        }

        // If server action reports "skipped" (no session yet) or returns no useful signal,
        // wait briefly and retry once. Also re-check the profile directly after waiting.
        await breadcrumb({
          phase: "no_signal_wait",
          attempt,
          skipped: Boolean((profileResult as { skipped?: boolean } | null)?.skipped),
        });
        await sleep(attempt === 0 ? 300 : 600);
        const { profile: afterWait } = await fetchProfile(user.id);
        await breadcrumb({ phase: "after_wait_fetch", attempt, found: Boolean(afterWait) });
        if (afterWait) return afterWait;
      }

      await breadcrumb({ phase: "exhausted", attempts: 2 });
      return null;
    },
    [fetchProfile]
  );

  const applyProfileToState = useCallback(
    (nextProfile: ProfileData, currentSession: Session | null) => {
      setUserRole(nextProfile?.role ?? null);
      setProfile(nextProfile ?? null);
      if (currentSession?.user) {
        setIsEmailVerified(currentSession.user.email_confirmed_at !== null);
      }
    },
    []
  );

  useEffect(() => {
    // Prevent initialization during static generation
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // Check if supabase is available (after mount, so ref should be initialized)
    if (!supabaseRef.current) {
      setIsLoading(false);
      setHasHandledInitialSession(true);
      return;
    }

    const supabase = supabaseRef.current;
    let mounted = true;

    // Initial session check - only once on mount
    const initialSession = async () => {
      setIsLoading(true);
      setShowTimeoutRecovery(false);
      
      // Breadcrumb: auth init
      const breadcrumb = async (data: Record<string, unknown>) => {
        try {
          const Sentry = await import("@sentry/nextjs");
          Sentry.addBreadcrumb({
            category: "auth.bootstrap",
            message: "auth.init",
            level: "info",
            data: { timestamp: new Date().toISOString(), ...data },
          });
        } catch {
          // Sentry not available, skip
        }
      };
      
      console.log("[auth.init] Starting auth bootstrap");
      await breadcrumb({ phase: "init_start" });

      // Set 8-second timeout guard
      timeoutRef.current = setTimeout(() => {
        if (mounted && isLoadingRef.current) {
          console.warn("[auth.timeout] Bootstrap exceeded 8s threshold");
          breadcrumb({ phase: "timeout", threshold: 8000 });
          setShowTimeoutRecovery(true);
        }
      }, 8000);

      try {
        // supabase is already checked above and assigned to const, this check is redundant but safe
        if (!supabase) {
          await breadcrumb({ phase: "no_supabase_client" });
          if (mounted) {
            setIsLoading(false);
            setHasHandledInitialSession(true);
          }
          return;
        }
        
        // Breadcrumb: session read start
        await breadcrumb({ phase: "getSession_start" });
        
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Breadcrumb: session read done
        await breadcrumb({ 
          phase: "getSession_done", 
          hasSession: !!session,
          userId: session?.user?.id || null,
        });

        if (!mounted) return;

        // If there is no session on initial load, we can stop loading.
        if (!session) {
          await breadcrumb({ phase: "no_session_exit" });
          setIsLoading(false);
          setHasHandledInitialSession(true);
          return;
        }

        // If there is a session, proceed to set user and fetch profile
        setUser(session.user);
        setSession(session);
        
        // Breadcrumb: profile hydration start
        await breadcrumb({ phase: "ensureAndHydrateProfile_start", userId: session.user.id });
        
        const hydratedProfile = await ensureAndHydrateProfile(session.user);
        
        // Breadcrumb: profile hydration done
        await breadcrumb({ 
          phase: "ensureAndHydrateProfile_done",
          hasProfile: !!hydratedProfile,
          profileRole: hydratedProfile?.role || null,
        });
        
        if (!mounted) return;
        applyProfileToState(hydratedProfile, session);
        setHasHandledInitialSession(true);
        
        // Breadcrumb: bootstrap complete
        await breadcrumb({ phase: "bootstrap_complete" });
        console.log("[auth.bootstrap.complete] Auth bootstrap finished successfully");
      } catch (error) {
        console.error("[auth.init] Error in initial session check:", error);
        await breadcrumb({ phase: "error", error: error instanceof Error ? error.message : String(error) });
      } finally {
        // Clear timeout if bootstrap completed
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
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

      // Breadcrumb: auth state change
      const breadcrumb = async (data: Record<string, unknown>) => {
        try {
          const Sentry = await import("@sentry/nextjs");
          Sentry.addBreadcrumb({
            category: "auth.bootstrap",
            message: `auth.onAuthStateChange.${event}`,
            level: "info",
            data: { timestamp: new Date().toISOString(), ...data },
          });
        } catch {
          // Sentry not available, skip
        }
      };
      
      console.log(`[auth.onAuthStateChange] Event: ${event}`, { hasSession: !!session, userId: session?.user?.id || null });
      await breadcrumb({ event, hasSession: !!session, userId: session?.user?.id || null });

      setIsLoading(true);
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session) {
        try {
          const hydratedProfile = await ensureAndHydrateProfile(session.user);
          if (!mounted) return;
          applyProfileToState(hydratedProfile, session);

          // Single redirect owner (SIGNED_IN):
          // - Only redirect away when we're currently on an auth route (login/choose-role/reset/verification-pending).
          // - Use server-owned BootState so redirects are consistent with middleware and remain loop-safe.
          // - Honor returnUrl only when safe (BootState uses the shared routing brain).
          // Redirect on SIGNED_IN when we are on an auth surface.
          // Do NOT gate on hasHandledInitialSession: under load, SIGNED_IN can race the initial
          // session check and we'd get "stuck on /login" flakes.
          const currentPath =
            typeof window !== "undefined"
              ? (pathname || window.location.pathname).split("?")[0]
              : pathname;

          if (currentPath && isAuthRoute(currentPath)) {
            const returnUrlRaw =
              typeof window !== "undefined"
                ? new URLSearchParams(window.location.search).get("returnUrl")
                : null;

            const boot = await getBootState({ postAuth: true, returnUrlRaw });
            const bootTarget = boot?.nextPath ?? PATHS.TALENT_DASHBOARD;

            router.push(bootTarget);
          }
        } catch (error) {
          console.error("Error fetching profile on sign in:", error);
        }
      } else if (event === "SIGNED_OUT") {
        const wasManualSignOut = manualSignOutInProgressRef.current;
        manualSignOutInProgressRef.current = false;

        // Reset the browser client singleton to ensure clean state
        // This prevents the old authenticated client from being reused
        resetSupabaseBrowserClient();
        
        setUser(null);
        setSession(null);
        setUserRole(null);
        setProfile(null);
        setIsEmailVerified(false);
        setHasHandledInitialSession(false);
        
        // Redirect to login if we're on a protected route
        // SIGNED_OUT events fire independently when:
        // - Sessions expire naturally
        // - Sessions are cleared externally (admin deletes user, etc.)
        // - Other tabs sign out (cross-tab sync)
        // In these cases, we need to redirect to prevent users from viewing protected content while logged out
        //
        // IMPORTANT: For user-initiated signOut(), the signOut() method is the single redirect owner.
        // The SIGNED_OUT handler should act as a safety net only (expiry, admin deletion, cross-tab sync).
        if (typeof window !== "undefined") {
          if (wasManualSignOut) {
            // signOut() will handle the canonical redirect (/login?signedOut=true).
            // Avoid competing redirects that can drop signedOut=true and trigger middleware bounce.
            setIsLoading(false);
            return;
          }

          // Get current pathname, stripping any query parameters
          // pathname from usePathname() already excludes query params, but window.location.pathname is more reliable
          const currentPath = (pathname || window.location.pathname).split("?")[0];
          
          // Check if current path is an auth route
          const isAuthRouteMatch = isAuthRoute(currentPath);
          
          // Only redirect if we're not already on a public or auth route
          if (!isPublicPath(currentPath) && !isAuthRouteMatch) {
            // Use hard redirect to ensure complete session clear
            // Always include signedOut=true to avoid middleware "helpful" redirects during auth-clearing window
            window.location.replace(`${PATHS.LOGIN}?signedOut=true`);
          }
        } else {
          // Fallback for server-side (shouldn't happen, but just in case)
          router.push(PATHS.LOGIN);
        }
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
      // Clear timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [router, pathname, hasHandledInitialSession, ensureAndHydrateProfile, applyProfileToState, getSupabase]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    // Event handler - safe to call getSupabase() after mount
    const supabase = getSupabase();
    
    // SIGNED_IN event handler owns hydration + redirect (BootState-driven).
    // Avoid split-brain profile fetch/sets here, which can race bootstrap and feel “random”.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    options?: SignUpOptions
  ): Promise<{ error: AuthError | null }> => {
    // Event handler - safe to call getSupabase() after mount
    const supabase = getSupabase();
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      ...options,
    });
    return { error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    // Event handler - safe to call getSupabase() after mount
    const supabase = getSupabase();

    try {
      manualSignOutInProgressRef.current = true;
      setIsLoading(true);
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      setIsEmailVerified(false);
      setHasHandledInitialSession(false);
      resetSupabaseBrowserClient();

      // Try to clear HTTP-only cookies on the server first; ignore failures.
      try {
        await fetch("/api/auth/signout", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch (apiError) {
        console.warn("Server-side sign out API call failed:", apiError);
      }

      const { error: clientError } = await supabase.auth.signOut();

      const to = `${PATHS.LOGIN}?signedOut=true`;
      if (typeof window !== "undefined") {
        setIsLoading(false);
        window.location.replace(to);
      } else {
        setIsLoading(false);
        router.replace(to);
        router.refresh();
      }

      return { error: clientError };
    } catch (error) {
      console.error("Error during sign out:", error);
      manualSignOutInProgressRef.current = false;
      resetSupabaseBrowserClient();
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      setIsEmailVerified(false);
      setHasHandledInitialSession(false);
      setIsLoading(false);

      const to = `${PATHS.LOGIN}?signedOut=true`;
      if (typeof window !== "undefined") {
        window.location.replace(to);
      } else {
        router.replace(to);
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
      // Use our public email route to avoid existence leaks and keep email logic governed by the Email Contract.
      const response = await fetch("/api/email/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        return { error: { message: data?.error || "Failed to send password reset email" } as AuthError };
      }

      return { error: null };
    } catch (error) {
      console.error("Password reset error:", error);
      return { error: { message: "Failed to send password reset email" } as AuthError };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        supabase: supabaseRef.current, // Expose ref value for backward compatibility (can be null during SSR)
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
      {showTimeoutRecovery && <AuthTimeoutRecovery />}
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
