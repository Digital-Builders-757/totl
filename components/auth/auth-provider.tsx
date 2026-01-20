"use client";

import type { User, Session, AuthError, AuthChangeEvent, SupabaseClient } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import type React from "react";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

import { AuthTimeoutRecovery } from "./auth-timeout-recovery";
import { ensureProfileExists } from "@/lib/actions/auth-actions";
import { getBootStateRedirect, type BootStateRedirectResult } from "@/lib/actions/boot-actions";
import {
  PATHS,
  isAuthRoute,
  isPublicPath,
} from "@/lib/constants/routes";
import { createSupabaseBrowser, resetSupabaseBrowserClient } from "@/lib/supabase/supabase-browser";
import { safeReturnUrl } from "@/lib/utils/return-url";
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
  
  // hasHandledInitialSession is set but not read - kept for debugging/future use
  // Suppress linter warning
  void hasHandledInitialSession;
  const manualSignOutInProgressRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(isLoading);
  // In-flight bootstrap guard: prevents concurrent bootstrap operations
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
  // Redirect guard: prevents double navigation during SIGNED_IN
  const redirectInFlightRef = useRef(false);

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

  // Helper: Perform redirect with router.replace() first, fallback to window.location.replace()
  // This provides better testability and SPA navigation, while ensuring redirect always happens
  // Uses Promise-based timeout instead of polling for cleaner implementation
  const performRedirect = useCallback(
    (routerInstance: ReturnType<typeof useRouter>, target: string, currentPathname: string) => {
      if (!target || !target.startsWith("/")) {
        console.error("[auth] Invalid redirect target:", target);
        return;
      }

      const targetPathname = target.split("?")[0]; // Strip query params for comparison
      const startPathname = currentPathname.split("?")[0];

      console.log("[auth.onAuthStateChange] Attempting redirect via router.replace():", target, {
        startPathname,
        targetPathname,
      });

      // Try SPA navigation first (better for tests and UX)
      try {
        routerInstance.replace(target);

        // Wait up to 500ms to see if navigation happens
        // Use Promise-based timeout - check once after delay instead of polling
        setTimeout(() => {
          if (typeof window === "undefined") {
            return; // SSR safety check
          }

          // Check if pathname changed to target (navigation succeeded)
          const newPathname = window.location.pathname.split("?")[0];
          const navigated = newPathname === targetPathname && newPathname !== startPathname;

          if (navigated) {
            console.log("[auth.onAuthStateChange] router.replace() succeeded, navigation detected", {
              expected: targetPathname,
              actual: newPathname,
            });
          } else {
            // Navigation didn't happen within timeout, fallback to hard reload
            console.warn(
              "[auth.onAuthStateChange] router.replace() didn't navigate within 500ms, using hard reload",
              {
                expected: targetPathname,
                actual: newPathname,
                startPathname,
              }
            );
            try {
              window.location.replace(target);
              console.log("[auth.onAuthStateChange] window.location.replace() called as fallback");
            } catch (hardReloadError) {
              console.error("[auth.onAuthStateChange] Hard reload also failed:", hardReloadError);
              window.location.assign(target);
            }
          }
        }, 500);
      } catch (routerError) {
        // If router.replace() throws, immediately fallback to hard reload
        console.error("[auth.onAuthStateChange] router.replace() threw, using hard reload:", routerError);
        try {
          window.location.replace(target);
          console.log("[auth.onAuthStateChange] window.location.replace() called after router error");
        } catch (hardReloadError) {
          console.error("[auth.onAuthStateChange] Hard reload also failed:", hardReloadError);
          window.location.assign(target);
        }
      }
    },
    []
  );

  // Helper: getBootStateRedirect with retry logic (handles cookie timing issues)
  // Returns safe shape with reason for observability (never throws) - redirect uses fallback
  // Preserves all reason types: "success" | "cookie_not_ready" | "no_profile" | "no_user" | "error"
  const getBootStateWithRetry = useCallback(
    async (returnUrlRaw: string | null, maxAttempts = 3): Promise<BootStateRedirectResult> => {
      const backoffMs = [200, 400, 600]; // Progressive backoff
      let lastReason: BootStateRedirectResult["reason"] = "cookie_not_ready";

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const result = await getBootStateRedirect({ postAuth: true, returnUrlRaw });
          
          // Preserve the reason from the result for observability
          lastReason = result.reason;
          
          // If we got a successful redirect, return immediately
          if (result.redirectTo) {
            return result;
          }
          
          // If redirectTo is null, log reason and retry (unless last attempt)
          if (process.env.NODE_ENV === "development") {
            console.debug(`[auth] getBootStateRedirect attempt ${attempt + 1} returned null:`, result.reason);
          }
          
          // Retry with backoff unless last attempt
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt] ?? 200));
          }
        } catch (error) {
          // Log but don't throw - we'll use fallback
          lastReason = "error";
          if (process.env.NODE_ENV === "development") {
            console.debug(`[auth] getBootStateRedirect attempt ${attempt + 1} threw:`, error);
          }
          // Retry with backoff unless last attempt
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt] ?? 200));
          }
        }
      }

      // All attempts failed - return safe shape with preserved reason for observability
      return {
        redirectTo: null,
        reason: lastReason,
        bootState: null,
      };
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
    // Use in-flight guard to prevent concurrent bootstrap operations
    const initialSession = async () => {
      // If bootstrap is already in flight, await it instead of starting a new one
      if (bootstrapPromiseRef.current) {
        try {
          // Add timeout to prevent infinite waits if bootstrap gets stuck
          await Promise.race([
            bootstrapPromiseRef.current,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Bootstrap guard timeout')), 10000)
            )
          ]);
        } catch (error) {
          // Bootstrap timed out or failed - clear ref and continue
          console.warn("[auth.init] Bootstrap guard timeout or error, clearing ref:", error);
          bootstrapPromiseRef.current = null;
        }
        return;
      }

      // Create bootstrap promise and store in ref
      const bootstrapPromise = (async () => {
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
          
          let session: Session | null = null;
          try {
            const {
              data: { session: fetchedSession },
            } = await supabase.auth.getSession();
            session = fetchedSession;
          } catch (error) {
            // Gracefully handle AbortError during navigation/unmount
            if (error instanceof Error && error.name === "AbortError") {
              console.log("[auth.init] Bootstrap aborted during navigation (expected)");
              await breadcrumb({ phase: "aborted", reason: "navigation" });
              return; // Early return - don't update state if unmounted
            }
            throw error; // Re-throw non-abort errors
          }

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

          // If there is a session, proceed to set user and session immediately
          // This makes UI interactive faster - profile hydration happens async
          setUser(session.user);
          setSession(session);
          
          // CRITICAL FIX: Set isLoading = false immediately after session is set
          // Profile hydration happens in background (non-blocking)
          setIsLoading(false);
          setHasHandledInitialSession(true);
          
          // Breadcrumb: profile hydration start
          await breadcrumb({ phase: "ensureAndHydrateProfile_start", userId: session.user.id });
          
          // Profile hydration happens async - doesn't block UI
          // Use IIFE to handle async breadcrumbs properly
          (async () => {
            try {
              const hydratedProfile = await ensureAndHydrateProfile(session.user);
              
              if (!mounted) return;
              
              // Breadcrumb: profile hydration done
              await breadcrumb({ 
                phase: "ensureAndHydrateProfile_done",
                hasProfile: !!hydratedProfile,
                profileRole: hydratedProfile?.role || null,
              });
              
              applyProfileToState(hydratedProfile, session);
              
              // Breadcrumb: bootstrap complete
              await breadcrumb({ phase: "bootstrap_complete" });
              console.log("[auth.bootstrap.complete] Auth bootstrap finished successfully");
            } catch (error) {
              // Gracefully handle AbortError during profile fetch
              if (error instanceof Error && error.name === "AbortError") {
                console.log("[auth.init] Profile fetch aborted during navigation (expected)");
                await breadcrumb({ phase: "profile_fetch_aborted", reason: "navigation" }).catch(() => {});
                return; // Early return - don't update state if unmounted
              }
              // Log other errors but don't block UI
              console.error("[auth.init] Profile hydration error (non-blocking):", error);
              await breadcrumb({ phase: "profile_hydration_error", error: error instanceof Error ? error.message : String(error) }).catch(() => {});
            }
          })();
        } catch (error) {
          // Only log non-abort errors
          if (!(error instanceof Error && error.name === "AbortError")) {
            console.error("[auth.init] Error in initial session check:", error);
            await breadcrumb({ phase: "error", error: error instanceof Error ? error.message : String(error) });
          } else {
            console.log("[auth.init] Bootstrap aborted (expected during navigation)");
          }
        } finally {
          // Clear timeout if bootstrap completed
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          // Note: isLoading and hasHandledInitialSession are set earlier (after session check)
          // This finally block only clears the promise ref
          
          // Clear bootstrap promise ref when done
          bootstrapPromiseRef.current = null;
        }
      })();

      // Store promise in ref so concurrent calls can await it
      bootstrapPromiseRef.current = bootstrapPromise;
      await bootstrapPromise;
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
        // CRITICAL: Redirect is the PRIMARY MISSION - everything else is best-effort, bounded, non-blocking
        // Single redirect owner (SIGNED_IN):
        // - Only redirect away when we're currently on an auth route (login/choose-role/reset/verification-pending).
        // - Use server-owned BootState so redirects are consistent with middleware and remain loop-safe.
        // - Honor returnUrl only when safe (validated internal path).
        // Redirect on SIGNED_IN when we are on an auth surface.
        // Do NOT gate on hasHandledInitialSession: under load, SIGNED_IN can race the initial
        // session check and we'd get "stuck on /login" flakes.
        
        console.log("[auth.onAuthStateChange] SIGNED_IN handler entered", {
          hasSession: !!session,
          userId: session?.user?.id,
          pathname,
        });
        
        const currentPath =
          typeof window !== "undefined"
            ? (pathname || window.location.pathname).split("?")[0]
            : pathname;

        // Check if we should redirect (must be on auth route)
        const shouldRedirect = currentPath && isAuthRoute(currentPath);
        
        console.log("[auth.onAuthStateChange] Redirect check", {
          currentPath,
          shouldRedirect,
          isAuthRoute: currentPath ? isAuthRoute(currentPath) : false,
        });
        
        // If not on auth route, skip redirect logic entirely
        if (!shouldRedirect || typeof window === "undefined") {
          // Still try to hydrate profile in background (best-effort)
          ensureAndHydrateProfile(session.user)
            .then((profile) => {
              if (mounted && profile) {
                applyProfileToState(profile, session);
              }
            })
            .catch((error) => {
              // Silently handle errors - profile hydration is non-blocking
              if (process.env.NODE_ENV === "development" && error instanceof Error && error.name !== "AbortError") {
                console.debug("[auth.onAuthStateChange] Background profile hydration failed:", error);
              }
            });
          return;
        }

        // CRITICAL: Prevent double navigation (multi-tab, rapid events)
        if (redirectInFlightRef.current) {
          console.log("[auth.onAuthStateChange] Redirect already in flight, skipping");
          return;
        }
        redirectInFlightRef.current = true;

        // CRITICAL: Compute fallback redirect IMMEDIATELY (before any async operations)
        // This ensures redirect target is always available, even if everything fails
        const returnUrlRaw =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("returnUrl")
            : null;
        
        // Validate returnUrl is safe (internal path only)
        const safeReturnUrlValue = safeReturnUrl(returnUrlRaw);
        
        // Compute fallback redirect target (safe default)
        // CRITICAL: Always ensure fallbackRedirect is a valid internal path
        const fallbackRedirect = safeReturnUrlValue ?? PATHS.TALENT_DASHBOARD;
        
          // Safety check: ensure fallbackRedirect is always valid
          if (!fallbackRedirect || !fallbackRedirect.startsWith("/")) {
            console.error("[auth.onAuthStateChange] Invalid fallbackRedirect, using hardcoded:", fallbackRedirect);
            const safeFallback = PATHS.TALENT_DASHBOARD;
            performRedirect(router, safeFallback, currentPath);
            return;
          }
        
        console.log("[auth.onAuthStateChange] Starting redirect flow", {
          returnUrlRaw,
          safeReturnUrlValue,
          fallbackRedirect,
        });

        // CRITICAL: Start all async operations in parallel (fire-and-forget pattern)
        // Profile hydration is NON-BLOCKING - happens in background
        const hydrationPromise = ensureAndHydrateProfile(session.user)
          .catch((error) => {
            // Silently handle all errors - hydration is best-effort
            if (process.env.NODE_ENV === "development" && error instanceof Error && error.name !== "AbortError") {
              console.debug("[auth.onAuthStateChange] Profile hydration failed (non-blocking):", error);
            }
            return null; // Return null on error
          });

        // BootState with retry (bounded, non-blocking)
        // Race against timeout to ensure redirect happens quickly
        const bootStatePromise = getBootStateWithRetry(returnUrlRaw);
        
        // CRITICAL: Race BootState against timeout (max 800ms wait)
        // Redirect must happen quickly, even if BootState is slow
        const redirectTimeout = 800; // ms
        const redirectTargetPromise = Promise.race([
          bootStatePromise.then(result => ({
            redirectTo: result.redirectTo,
            reason: result.reason,
          })),
          new Promise<{ redirectTo: string | null; reason: string }>((resolve) => 
            setTimeout(() => resolve({ redirectTo: null, reason: "timeout" }), redirectTimeout)
          ),
        ]);

        // CRITICAL: Redirect decision happens HERE (unavoidable)
        // This block ALWAYS executes and ALWAYS redirects
        redirectTargetPromise
          .then((result) => {
            // Determine final redirect target (CRITICAL: fallbackRedirect is always a valid path)
            const finalTarget = result.redirectTo ?? fallbackRedirect;
            
            // Validate finalTarget is a valid internal path (safety check)
            if (!finalTarget || !finalTarget.startsWith("/")) {
              console.error("[auth.onAuthStateChange] Invalid redirect target, using hardcoded fallback:", finalTarget);
              const safeFallback = PATHS.TALENT_DASHBOARD;
              performRedirect(router, safeFallback, currentPath);
              return;
            }
            
            // Log redirect decision with observability
            console.log("[auth.onAuthStateChange] Redirect target resolved:", finalTarget, {
              source: result.redirectTo ? "bootState" : "fallback",
              reason: result.reason,
              returnUrl: safeReturnUrlValue,
              bootStateRedirectTo: result.redirectTo,
              fallbackRedirect,
            });
            
            // CRITICAL: Try router.replace() first (SPA navigation), then fallback to hard reload
            performRedirect(router, finalTarget, currentPath);
          })
          .catch((error) => {
            // Even if redirect decision fails, we MUST redirect
            console.error("[auth.onAuthStateChange] Redirect decision failed, using fallback:", error);
            performRedirect(router, fallbackRedirect, currentPath);
          });

        // CRITICAL: Profile hydration happens AFTER redirect (best-effort, non-blocking)
        // This updates state quietly in the background
        hydrationPromise
          .then((hydratedProfile) => {
            if (mounted && hydratedProfile) {
              applyProfileToState(hydratedProfile, session);
            }
          })
          .catch(() => {
            // Silently ignore - hydration is best-effort
          });

        // Reset redirect guard after a delay (allows redirect to complete)
        setTimeout(() => {
          redirectInFlightRef.current = false;
        }, 2000);
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
      // Clear bootstrap promise ref on unmount to allow fresh bootstrap on remount
      bootstrapPromiseRef.current = null;
      // Clear redirect guard on unmount
      redirectInFlightRef.current = false;
    };
  }, [router, pathname, ensureAndHydrateProfile, applyProfileToState, getSupabase, getBootStateWithRetry, performRedirect]);

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
      // Reset in-memory state immediately (good UX)
      setIsLoading(true);
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      setIsEmailVerified(false);
      setHasHandledInitialSession(false);
      resetSupabaseBrowserClient();

      // Await server-side cookie clearing before client-side sign-out
      // Add keepalive: true to prevent navigation from aborting the request
      let serverSignOutError: Error | null = null;
      try {
        const response = await fetch("/api/auth/signout", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          keepalive: true, // Helps if browser begins navigating
        });
        if (!response.ok) {
          serverSignOutError = new Error(`Server sign-out failed: ${response.status}`);
        }
      } catch (apiError) {
        serverSignOutError = apiError instanceof Error ? apiError : new Error(String(apiError));
        console.warn("Server-side sign out API call failed:", apiError);
        // Log to Sentry but don't block sign-out (telemetry never blocks cleanup)
        try {
          const Sentry = await import("@sentry/nextjs");
          Sentry.captureException(serverSignOutError, {
            tags: { feature: "auth", error_type: "signout_api_failure" },
          });
        } catch {
          // Sentry not available or import failed - don't break sign-out
        }
      }

      // Then run supabase.auth.signOut() (clears localStorage + triggers events)
      const { error: clientError } = await supabase.auth.signOut();

      // Then redirect
      const to = `${PATHS.LOGIN}?signedOut=true`;
      setIsLoading(false);
      
      if (typeof window !== "undefined") {
        // Hard redirect bypasses RSC cache anyway, so router.refresh() is mostly wasted
        // Keep it only for soft fallback path
        window.location.replace(to);
      } else {
        // Soft redirect path - refresh router cache
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
