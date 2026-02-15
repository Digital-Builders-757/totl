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
import { logger } from "@/lib/utils/logger";
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

type AuthEventSnapshot = {
  event: AuthChangeEvent;
  session: Session | null;
  pathname: string;
  search: string;
  ts: number;
};

type EnsureAndHydrateProfile = (user: User) => Promise<ProfileData | null>;
type ApplyProfileToState = (nextProfile: ProfileData, currentSession: Session | null) => void;
type GetBootStateWithRetry = (returnUrlRaw: string | null, maxAttempts?: number) => Promise<BootStateRedirectResult>;
type PerformRedirect = (
  routerInstance: ReturnType<typeof useRouter>,
  target: string,
  currentPathname: string
) => void;

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
  const [authTick, setAuthTick] = useState(0);
  
  // hasHandledInitialSession is set but not read - kept for debugging/future use
  // Suppress linter warning
  void hasHandledInitialSession;
  const manualSignOutInProgressRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const softTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOutRef = useRef(false);
  const isLoadingRef = useRef(isLoading);
  const authQueueRef = useRef<AuthEventSnapshot[]>([]);
  // In-flight bootstrap guard: prevents concurrent bootstrap operations
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
  // Redirect guard: prevents double navigation during SIGNED_IN
  const redirectInFlightRef = useRef(false);

  // Hard reload de-dupe: avoid spamming Sentry + avoid reload loops when navigation is slow/flaky.
  const lastHardReloadRef = useRef<{ ts: number; target: string } | null>(null);

  // Sync ref with state so timeout callback can read current value
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const router = useRouter();
  const pathname = usePathname();
  const routerRef = useRef(router);
  const ensureAndHydrateProfileRef = useRef<EnsureAndHydrateProfile | null>(null);
  const applyProfileToStateRef = useRef<ApplyProfileToState | null>(null);
  const getBootStateWithRetryRef = useRef<GetBootStateWithRetry | null>(null);
  const performRedirectRef = useRef<PerformRedirect | null>(null);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

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

  const isLikelyNetworkErrorMessage = (message: string | undefined) => {
    const m = (message || "").toLowerCase();
    return (
      m.includes("load failed") ||
      m.includes("failed to fetch") ||
      m.includes("networkerror") ||
      m.includes("network error")
    );
  };

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

      // shared helper: isLikelyNetworkErrorMessage

      // Bounded retry: transient network failures (Safari especially) can produce "Load failed"
      // even when the request would succeed shortly after.
      const maxAttempts = 3;
      const backoffMs = [0, 250, 600];

      let lastError: { message?: string; code?: string | null; details?: string | null } | null = null;
      let data: unknown = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
          const delay = backoffMs[attempt] ?? 250;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const res = await supabase
          .from("profiles")
          .select(selectColumns)
          .eq("id", userId)
          .maybeSingle();

        data = res.data;
        const error = res.error;

        if (!error || error.code === "PGRST116") {
          lastError = null;
          break;
        }

        lastError = { message: error.message, code: error.code, details: error.details };

        // Only retry likely network errors.
        if (!isLikelyNetworkErrorMessage(error.message)) {
          break;
        }

        // If offline, don't spin.
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          break;
        }
      }

      if (lastError && lastError.code !== "PGRST116") {
        const Sentry = await import("@sentry/nextjs");

        const level = isLikelyNetworkErrorMessage(lastError.message) ? "warning" : "error";

        Sentry.captureException(new Error(`Auth provider profile query error: ${lastError.message}`), {
          tags: {
            feature: "auth",
            error_type: "auth_provider_profile_error",
            error_code: lastError.code || "unknown",
          },
          extra: {
            userId,
            errorCode: lastError.code,
            errorDetails: lastError.details,
            errorMessage: lastError.message,
            attempts: maxAttempts,
            timestamp: new Date().toISOString(),
            navigatorOnline: typeof navigator !== "undefined" ? navigator.onLine : null,
          },
          level,
        });
      }

      return { profile: mapProfileRow(data as ProfileData) };
    },
    [getSupabase]
  );

  const resetAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

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
          logger.error("Error ensuring profile exists", profileResult.error, { attempt });
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
        logger.error("[auth] Invalid redirect target", undefined, { target });
        return;
      }

      const targetPathname = target.split("?")[0]; // Strip query params for comparison
      const startPathname = currentPathname.split("?")[0];

      logger.debug("[auth.onAuthStateChange] Attempting redirect via router.replace()", {
        target,
        startPathname,
        targetPathname,
      });

      // Try SPA navigation first (better for tests and UX)
      try {
        routerInstance.replace(target);

        const navigationPollMs = 150;

        const isMobileSafari =
          typeof navigator !== "undefined" &&
          /iP(hone|ad|od)/.test(navigator.userAgent) &&
          /Safari/.test(navigator.userAgent) &&
          !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

        // Safari + slow networks can legitimately exceed 1.5s between replace() and the URL reflecting.
        // Use a longer timeout in production to avoid false-positive hard reloads.
        const navigationTimeoutMs =
          process.env.NODE_ENV === "production" ? (isMobileSafari ? 4500 : 3000) : 2000;

        // Wait up to navigationTimeoutMs to see if navigation happens.
        // In production (and on slower devices), route transitions can take longer than a single 500ms tick.
        const startedAt = Date.now();

        const checkNavigation = () => {
          if (typeof window === "undefined") {
            return; // SSR safety check
          }

          const newPathname = window.location.pathname.split("?")[0];
          const navigated = newPathname === targetPathname && newPathname !== startPathname;

          if (navigated) {
            logger.debug("[auth.onAuthStateChange] router.replace() succeeded, navigation detected", {
              expected: targetPathname,
              actual: newPathname,
              navigationTimeoutMs,
            });
            return;
          }

          if (newPathname !== startPathname) {
            logger.debug("[auth.onAuthStateChange] router.replace() navigated to a different route", {
              expected: targetPathname,
              actual: newPathname,
              navigationTimeoutMs,
            });
            return;
          }

          const elapsedMs = Date.now() - startedAt;
          if (elapsedMs < navigationTimeoutMs) {
            setTimeout(checkNavigation, navigationPollMs);
            return;
          }

          // Navigation didn't happen within timeout, fallback to hard reload
          // De-dupe: avoid spamming Sentry and avoid reload loops.
          const now = Date.now();
          const last = lastHardReloadRef.current;
          const dedupeWindowMs = 10_000;
          if (last && last.target === target && now - last.ts < dedupeWindowMs) {
            logger.info(
              "[auth.onAuthStateChange] router.replace() still not navigated; skipping repeat hard reload",
              {
                expected: targetPathname,
                actual: newPathname,
                startPathname,
                navigationTimeoutMs,
                dedupeWindowMs,
              }
            );
            return;
          }

          lastHardReloadRef.current = { ts: now, target };

          logger.warn(
            "[auth.onAuthStateChange] router.replace() didn't navigate within timeout, using hard reload",
            {
              expected: targetPathname,
              actual: newPathname,
              startPathname,
              navigationTimeoutMs,
            }
          );

          try {
            window.location.replace(target);
            logger.debug("[auth.onAuthStateChange] window.location.replace() called as fallback");
          } catch (hardReloadError) {
            logger.error("[auth.onAuthStateChange] Hard reload also failed", hardReloadError);
            window.location.assign(target);
          }
        };

        // Give router.replace() a tick to schedule before we start checking.
        setTimeout(checkNavigation, 50);
      } catch (routerError) {
        // If router.replace() throws, immediately fallback to hard reload
        logger.error("[auth.onAuthStateChange] router.replace() threw, using hard reload", routerError);
        try {
          window.location.replace(target);
          logger.debug("[auth.onAuthStateChange] window.location.replace() called after router error");
        } catch (hardReloadError) {
          logger.error("[auth.onAuthStateChange] Hard reload also failed", hardReloadError);
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
            logger.debug(`[auth] getBootStateRedirect attempt ${attempt + 1} returned null`, { reason: result.reason });
          }
          
          // Retry with backoff unless last attempt
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt] ?? 200));
          }
        } catch (error) {
          // Log but don't throw - we'll use fallback
          lastReason = "error";
          if (process.env.NODE_ENV === "development") {
            logger.debug(`[auth] getBootStateRedirect attempt ${attempt + 1} threw`, { error });
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
    ensureAndHydrateProfileRef.current = ensureAndHydrateProfile;
  }, [ensureAndHydrateProfile]);

  useEffect(() => {
    applyProfileToStateRef.current = applyProfileToState;
  }, [applyProfileToState]);

  useEffect(() => {
    getBootStateWithRetryRef.current = getBootStateWithRetry;
  }, [getBootStateWithRetry]);

  useEffect(() => {
    performRedirectRef.current = performRedirect;
  }, [performRedirect]);

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
          logger.warn("[auth.init] Bootstrap guard timeout or error, clearing ref", { error });
          bootstrapPromiseRef.current = null;
        }
        return;
      }

      // Create bootstrap promise and store in ref
      const bootstrapPromise = (async () => {
        setIsLoading(true);
        setShowTimeoutRecovery(false);
        const bootstrapStartedAt = Date.now();
        
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
        
        logger.debug("[auth.init] Starting auth bootstrap");
        await breadcrumb({ phase: "init_start" });

        const softTimeoutMs = 8000;
        const hardTimeoutMs = 12000;

        hasTimedOutRef.current = false;

        // Soft timeout: signal slow bootstrap without showing recovery UI
        softTimeoutRef.current = setTimeout(() => {
          if (mounted && isLoadingRef.current && !hasTimedOutRef.current) {
            const elapsedMs = Date.now() - bootstrapStartedAt;
            logger.info("[auth.timeout] Bootstrap slow", { thresholdMs: softTimeoutMs, elapsedMs });
            breadcrumb({ phase: "timeout_soft", threshold: softTimeoutMs, elapsedMs });
          }
        }, softTimeoutMs);

        // Hard timeout: show recovery UI and warn
        timeoutRef.current = setTimeout(() => {
          if (mounted && isLoadingRef.current && !hasTimedOutRef.current) {
            const elapsedMs = Date.now() - bootstrapStartedAt;
            hasTimedOutRef.current = true;
            logger.warn("[auth.timeout] Bootstrap exceeded timeout threshold", {
              thresholdMs: hardTimeoutMs,
              elapsedMs,
            });
            breadcrumb({ phase: "timeout_hard", threshold: hardTimeoutMs, elapsedMs });
            setShowTimeoutRecovery(true);
          }
        }, hardTimeoutMs);

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
          
          const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

          // CRITICAL FIX: Check for session before calling getUser()
          // This prevents AuthSessionMissingError on public pages (guest mode)
          const currentPathname = typeof window !== "undefined" ? (pathname || window.location.pathname) : (pathname ?? "");
          
          // Helper: Deny-by-default protected path check
          // Protected if starts with /talent, /client, /admin (except public marketing profiles)
          // Auth callback routes are special public (no redirect during exchange)
          const isProtectedPath = (p: string): boolean => {
            // Auth callback routes are special public (no redirect during exchange)
            if (p.startsWith("/auth/callback") || p === PATHS.RESET_PASSWORD || p === PATHS.UPDATE_PASSWORD) {
              return false;
            }
            
            // /choose-role requires auth (protected)
            if (p === PATHS.CHOOSE_ROLE) {
              return true;
            }
            
            // Protected prefixes
            if (p.startsWith("/client") || p.startsWith("/admin")) {
              return true;
            }
            
            // /talent prefix: explicit allowlist for public marketing profiles
            if (p.startsWith("/talent")) {
              // /talent landing page is public
              if (p === PATHS.TALENT_LANDING) {
                return false;
              }
              
              // Check if it's a public marketing profile: /talent/[slug] where slug is not reserved
              const RESERVED_TALENT_SEGMENTS = new Set([
                "dashboard",
                "profile",
                "settings",
                "subscribe",
                "signup",
                "apply",
                "portfolio",
                "messages",
                "applications",
                "bookings",
              ]);
              
              const isPublicTalentProfile = (path: string): boolean => {
                // Must match pattern: /talent/[slug] (exactly one segment after /talent/)
                const match = path.match(/^\/talent\/([^/]+)$/);
                if (!match) return false;
                const slug = match[1];
                // Public only if slug is NOT in reserved set
                return !RESERVED_TALENT_SEGMENTS.has(slug);
              };
              
              // If it's a public marketing profile, it's not protected
              if (isPublicTalentProfile(p)) {
                return false;
              }
              
              // Everything else under /talent is protected
              return true;
            }
            
            // /gigs is public (browsing + SEO)
            // /gigs/[id] is public (gig detail pages)
            // /gigs/[id]/apply is protected (talent-only, handled by middleware)
            
            // Default: public
            return false;
          };
          
          await breadcrumb({ phase: "getSession_start" });
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          
          await breadcrumb({ 
            phase: "getSession_done", 
            hasSession: !!session,
            hasError: !!sessionError,
          });

          if (sessionError) {
            await breadcrumb({ phase: "getSession_error", error: sessionError.message });
            logger.debug("[auth.init] getSession() error", { error: sessionError });
            // Don't throw - treat as no session and continue
          }

          // If no session, exit early (this is normal on public pages)
          if (!session) {
            const isProtected = isProtectedPath(currentPathname);
            await breadcrumb({ 
              phase: "no_session_exit", 
              pathname: currentPathname,
              isProtectedPath: isProtected,
            });
            logger.debug("[auth.init] No session found - exiting bootstrap", { 
              pathname: currentPathname,
              isProtectedPath: isProtected,
            });
            
            if (mounted) {
              resetAuthState();
              setIsLoading(false);
              setHasHandledInitialSession(true);
              
              // Only redirect to login if on protected route (and not already on login)
              if (isProtected && currentPathname !== PATHS.LOGIN) {
                logger.debug("[auth.init] Redirecting to login from protected route", { pathname: currentPathname });
                router.replace(PATHS.LOGIN);
              }
            }
            return;
          }

          // Session exists - proceed with getUser() for server-validated user
          await breadcrumb({ phase: "getUser_start" });

          let currentUser: User | null = null;

          // shared helper: isLikelyNetworkErrorMessage

          // Bounded retry: Safari and some networks can produce transient "Load failed" errors.
          const maxGetUserAttempts = 3;
          const getUserBackoffMs = [0, 250, 600];

          for (let attempt = 0; attempt < maxGetUserAttempts; attempt++) {
            if (attempt > 0) {
              await sleep(getUserBackoffMs[attempt] ?? 250);
            }

            try {
              const { data, error } = await supabase.auth.getUser();
              if (error) throw error;
              currentUser = data.user ?? null;
              break;
            } catch (error) {
              if (error instanceof Error && error.name === "AbortError" && attempt === 0) {
                await breadcrumb({ phase: "getUser_abort_retry", attempt });
                await sleep(100 + Math.floor(Math.random() * 200));
                continue;
              }
              if (error instanceof Error && error.name === "AbortError") {
                logger.debug("[auth.init] Bootstrap aborted during navigation (expected)");
                await breadcrumb({ phase: "aborted", reason: "navigation" });
                return;
              }

              const errorMessage = error instanceof Error ? error.message : String(error);
              const errorName = error instanceof Error ? error.name : undefined;

              // Handle session missing errors by name or message content.
              // Supabase may throw AuthSessionMissingError or similar errors.
              const isSessionMissingError =
                errorName === "AuthSessionMissingError" ||
                (errorMessage?.includes("session") &&
                  (errorMessage?.includes("missing") ||
                    errorMessage?.includes("not found") ||
                    errorMessage?.includes("invalid")) &&
                  !errorMessage?.includes("expired") &&
                  !errorMessage?.includes("refresh"));

              if (isSessionMissingError) {
                const isProtected = isProtectedPath(currentPathname);
                await breadcrumb({
                  phase: "no_session_expected",
                  error: errorMessage,
                  errorName: errorName || "unknown",
                  pathname: currentPathname,
                  isProtectedPath: isProtected,
                });
                logger.debug("[auth.init] AuthSessionMissingError - treating as no session (expected)", {
                  pathname: currentPathname,
                  isProtectedPath: isProtected,
                  errorName,
                });

                if (mounted) {
                  resetAuthState();
                  setIsLoading(false);
                  setHasHandledInitialSession(true);

                  // Only redirect to login if on protected route (and not already on login)
                  if (isProtected && currentPathname !== PATHS.LOGIN) {
                    logger.debug("[auth.init] Redirecting to login from protected route (session missing)", {
                      pathname: currentPathname,
                    });
                    router.replace(PATHS.LOGIN);
                  }
                }
                return;
              }

              // Retry only likely network errors (and don't spin if offline).
              const shouldRetryNetwork =
                isLikelyNetworkErrorMessage(errorMessage) &&
                !(typeof navigator !== "undefined" && navigator.onLine === false) &&
                attempt < maxGetUserAttempts - 1;

              if (shouldRetryNetwork) {
                await breadcrumb({
                  phase: "getUser_network_retry",
                  attempt,
                  error: errorMessage,
                  errorName: errorName || "unknown",
                });
                continue;
              }

              // Final failure: record breadcrumb + clear auth state.
              await breadcrumb({ phase: "getUser_error", error: errorMessage, errorName: errorName || "unknown" });

              const isNetworkError = isLikelyNetworkErrorMessage(errorMessage);
              logger.warn("[auth.init] getUser() failed; clearing auth state", {
                errorName,
                navigatorOnline: typeof navigator !== "undefined" ? navigator.onLine : null,
                isNetworkError,
              });

              // Observability: don't silently swallow non-network auth failures.
              if (!isNetworkError) {
                const Sentry = await import("@sentry/nextjs");
                Sentry.captureException(new Error(`Auth getUser error: ${errorMessage}`), {
                  tags: {
                    feature: "auth",
                    error_type: "auth_get_user_error",
                    error_code: "unknown",
                  },
                  extra: {
                    errorName: errorName || "unknown",
                    errorMessage,
                    navigatorOnline: typeof navigator !== "undefined" ? navigator.onLine : null,
                    attempt,
                    maxGetUserAttempts,
                    timestamp: new Date().toISOString(),
                  },
                  level: "error",
                });
              }

              if (mounted) {
                resetAuthState();
                setIsLoading(false);
                setHasHandledInitialSession(true);

                const isProtected = isProtectedPath(currentPathname);
                if (isProtected && currentPathname !== PATHS.LOGIN) {
                  router.replace(PATHS.LOGIN);
                }
              }

              return;
            }
          }

          await breadcrumb({
            phase: "getUser_done",
            hasUser: !!currentUser,
            userId: currentUser?.id || null,
            elapsedMs: Date.now() - bootstrapStartedAt,
          });

          if (!mounted) return;

          // If there is no user on initial load, we can stop loading.
          if (!currentUser) {
            await breadcrumb({ phase: "no_user_exit" });
            setIsLoading(false);
            setHasHandledInitialSession(true);
            return;
          }

          // If there is a user, proceed to set user immediately
          // This makes UI interactive faster - profile hydration happens async
          setUser(currentUser);
          setSession(null);
          
          // CRITICAL FIX: Set isLoading = false immediately after session is set
          // Profile hydration happens in background (non-blocking)
          setIsLoading(false);
          setHasHandledInitialSession(true);
          
          // Breadcrumb: profile hydration start
          await breadcrumb({ phase: "ensureAndHydrateProfile_start", userId: currentUser.id });
          
          // Profile hydration happens async - doesn't block UI
          // Use IIFE to handle async breadcrumbs properly
          (async () => {
            try {
              const hydratedProfile = await ensureAndHydrateProfile(currentUser);
              
              if (!mounted) return;
              
              // Breadcrumb: profile hydration done
              await breadcrumb({ 
                phase: "ensureAndHydrateProfile_done",
                hasProfile: !!hydratedProfile,
                profileRole: hydratedProfile?.role || null,
              });
              
              applyProfileToState(hydratedProfile, null);
              
              // Breadcrumb: bootstrap complete
              await breadcrumb({
                phase: "bootstrap_complete",
                elapsedMs: Date.now() - bootstrapStartedAt,
              });
              logger.debug("[auth.bootstrap.complete] Auth bootstrap finished successfully");
            } catch (error) {
              // Gracefully handle AbortError during profile fetch
              if (error instanceof Error && error.name === "AbortError") {
                logger.debug("[auth.init] Profile fetch aborted during navigation (expected)");
                await breadcrumb({ phase: "profile_fetch_aborted", reason: "navigation" }).catch(() => {});
                return; // Early return - don't update state if unmounted
              }
              // Log other errors but don't block UI
              logger.error("[auth.init] Profile hydration error (non-blocking)", error);
              await breadcrumb({ phase: "profile_hydration_error", error: error instanceof Error ? error.message : String(error) }).catch(() => {});
            }
          })();
        } catch (error) {
          // Only log non-abort errors and non-session-missing errors
          // All other errors (network, CORS, invalid JWT, etc.) should be logged
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorName = error instanceof Error ? error.name : undefined;
          const isAbortError = errorName === "AbortError";
          
          // Only swallow AuthSessionMissingError - be precise to avoid hiding real problems
          const isSessionMissingError = 
            errorName === "AuthSessionMissingError" ||
            (errorMessage?.includes("session") && 
             (errorMessage?.includes("missing") || errorMessage?.includes("not found") || errorMessage?.includes("invalid")) &&
             !errorMessage?.includes("expired") &&
             !errorMessage?.includes("refresh"));
          
          if (!isAbortError && !isSessionMissingError) {
            // Real errors: network failures, invalid JWT, refresh token errors, CORS, etc.
            logger.error("[auth.init] Error in initial session check", error);
            await breadcrumb({ phase: "error", error: errorMessage, errorName: errorName || "unknown" });
            // Don't throw here - let error bubble up naturally if needed
          } else if (isAbortError) {
            logger.debug("[auth.init] Bootstrap aborted (expected during navigation)");
          } else if (isSessionMissingError) {
            // Session missing errors are already handled above, but catch here as safety net
            logger.debug("[auth.init] Session missing error caught in outer catch (should be handled above)");
            if (mounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setIsLoading(false);
              setHasHandledInitialSession(true);
            }
          }
        } finally {
          // Clear timeouts if bootstrap completed
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (softTimeoutRef.current) {
            clearTimeout(softTimeoutRef.current);
            softTimeoutRef.current = null;
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
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      // TRUTH #1: Prove SIGNED_IN fires + TRUTH #2: Prove cookies exist in browser
      const currentPathname = typeof window !== "undefined" ? (pathname || window.location.pathname) : (pathname ?? "");
      const currentSearch = typeof window !== "undefined" ? window.location.search : "";
      const cookieSb =
        typeof window !== "undefined"
          ? document.cookie.split(";").some((c) => c.trim().startsWith("sb-"))
          : false;

      logger.debug("[auth.onAuthStateChange]", {
        event,
        hasSession: !!session,
        userId: session?.user?.id ?? null,
        pathname: currentPathname,
        cookieSb,
      });

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setIsLoading(true);
      }

      // Important: session/user can be set optimistically here, but must be cleared on downstream verification failure.
      setSession(session);
      setUser(session?.user ?? null);

      authQueueRef.current.push({
        event,
        session,
        pathname: currentPathname,
        search: currentSearch,
        ts: Date.now(),
      });
      setAuthTick((tick) => tick + 1);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      // Clear timeouts on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (softTimeoutRef.current) {
        clearTimeout(softTimeoutRef.current);
        softTimeoutRef.current = null;
      }
      // Clear bootstrap promise ref on unmount to allow fresh bootstrap on remount
      bootstrapPromiseRef.current = null;
      // Clear redirect guard on unmount
      redirectInFlightRef.current = false;
    };
  }, [router, pathname, ensureAndHydrateProfile, applyProfileToState, getSupabase, getBootStateWithRetry, performRedirect, resetAuthState]);

  useEffect(() => {
    const eventQueue = authQueueRef.current.splice(0);
    if (eventQueue.length === 0) return;

    const routerInstance = routerRef.current;
    const ensureAndHydrateProfileSafe = ensureAndHydrateProfileRef.current;
    const applyProfileToStateSafe = applyProfileToStateRef.current;
    const getBootStateWithRetrySafe = getBootStateWithRetryRef.current;
    const performRedirectSafe = performRedirectRef.current;

    if (
      !ensureAndHydrateProfileSafe ||
      !applyProfileToStateSafe ||
      !getBootStateWithRetrySafe ||
      !performRedirectSafe
    ) {
      return;
    }

    for (const eventSnapshot of eventQueue) {
      const { event, session: currentSession, pathname: currentPathname, search: currentSearch } = eventSnapshot;

      // Breadcrumb: auth state change (async, outside the auth callback)
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
      void breadcrumb({ event, hasSession: !!currentSession, userId: currentSession?.user?.id || null });

      if (event === "SIGNED_IN" && currentSession) {
      // CRITICAL: Redirect is the PRIMARY MISSION - everything else is best-effort, bounded, non-blocking
      // Single redirect owner (SIGNED_IN):
      // - Only redirect away when we're currently on an auth route (login/choose-role/reset/verification-pending).
      // - Use server-owned BootState so redirects are consistent with middleware and remain loop-safe.
      // - Honor returnUrl only when safe (validated internal path).
      // Redirect on SIGNED_IN when we are on an auth surface.
      // Do NOT gate on hasHandledInitialSession: under load, SIGNED_IN can race the initial
      // session check and we'd get "stuck on /login" flakes.

        logger.debug("[auth.onAuthStateChange] SIGNED_IN handler entered", {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          pathname: currentPathname,
        });

        const currentPath = currentPathname.split("?")[0];

        // Check if we should redirect (must be on auth route)
        const shouldRedirect = currentPath && isAuthRoute(currentPath);

        logger.debug("[auth.onAuthStateChange] Redirect check", {
          currentPath,
          shouldRedirect,
          isAuthRoute: currentPath ? isAuthRoute(currentPath) : false,
        });

        // If not on auth route, skip redirect logic entirely
        if (!shouldRedirect || typeof window === "undefined") {
          // Still try to hydrate profile in background (best-effort)
          ensureAndHydrateProfileSafe(currentSession.user)
            .then((profile) => {
              if (profile) {
                applyProfileToStateSafe(profile, currentSession);
              }
            })
            .catch((error) => {
              // Silently handle errors - profile hydration is non-blocking
              if (process.env.NODE_ENV === "development" && error instanceof Error && error.name !== "AbortError") {
                logger.debug("[auth.onAuthStateChange] Background profile hydration failed", { error });
              }
            });
          setIsLoading(false);
          continue;
        }

        // CRITICAL: Prevent double navigation (multi-tab, rapid events)
        if (redirectInFlightRef.current) {
          logger.debug("[auth.onAuthStateChange] Redirect already in flight, skipping");
          setIsLoading(false);
          continue;
        }
        redirectInFlightRef.current = true;

        // CRITICAL: Compute fallback redirect IMMEDIATELY (before any async operations)
        // This ensures redirect target is always available, even if everything fails
        const returnUrlRaw = new URLSearchParams(currentSearch).get("returnUrl");

        // Validate returnUrl is safe (internal path only)
        const safeReturnUrlValue = safeReturnUrl(returnUrlRaw);

        // Compute fallback redirect target (safe default)
        // CRITICAL: Always ensure fallbackRedirect is a valid internal path
        const fallbackRedirect = safeReturnUrlValue ?? PATHS.TALENT_DASHBOARD;

        // Safety check: ensure fallbackRedirect is always valid
        if (!fallbackRedirect || !fallbackRedirect.startsWith("/")) {
          logger.error("[auth.onAuthStateChange] Invalid fallbackRedirect, using hardcoded", undefined, {
            fallbackRedirect,
          });
          const safeFallback = PATHS.TALENT_DASHBOARD;
          performRedirectSafe(routerInstance, safeFallback, currentPath);
          setIsLoading(false);
          continue;
        }

        logger.debug("[auth.onAuthStateChange] Starting redirect flow", {
          returnUrlRaw,
          safeReturnUrlValue,
          fallbackRedirect,
        });

        // CRITICAL: Start all async operations in parallel (fire-and-forget pattern)
        // Profile hydration is NON-BLOCKING - happens in background
        const hydrationPromise = ensureAndHydrateProfileSafe(currentSession.user).catch((error) => {
          // Silently handle all errors - hydration is best-effort
          if (process.env.NODE_ENV === "development" && error instanceof Error && error.name !== "AbortError") {
            logger.debug("[auth.onAuthStateChange] Profile hydration failed (non-blocking)", { error });
          }
          return null; // Return null on error
        });

        // BootState with retry (bounded, non-blocking)
        // Race against timeout to ensure redirect happens quickly
        const bootStatePromise = getBootStateWithRetrySafe(returnUrlRaw);

        // CRITICAL: Race BootState against timeout (max 800ms wait)
        // Redirect must happen quickly, even if BootState is slow
        const redirectTimeout = 800; // ms
        const redirectTargetPromise = Promise.race([
          bootStatePromise.then((result) => ({
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
              logger.error("[auth.onAuthStateChange] Invalid redirect target, using hardcoded fallback", undefined, {
                finalTarget,
              });
              const safeFallback = PATHS.TALENT_DASHBOARD;
              performRedirectSafe(routerInstance, safeFallback, currentPath);
              return;
            }

            // Log redirect decision with observability
            logger.debug("[auth.onAuthStateChange] Redirect target resolved", {
              finalTarget,
              source: result.redirectTo ? "bootState" : "fallback",
              reason: result.reason,
              returnUrl: safeReturnUrlValue,
              bootStateRedirectTo: result.redirectTo,
              fallbackRedirect,
            });

            // CRITICAL: Try router.replace() first (SPA navigation), then fallback to hard reload
            performRedirectSafe(routerInstance, finalTarget, currentPath);
          })
          .catch((error) => {
            // Even if redirect decision fails, we MUST redirect
            logger.error("[auth.onAuthStateChange] Redirect decision failed, using fallback", error);
            performRedirectSafe(routerInstance, fallbackRedirect, currentPath);
          });

        // CRITICAL: Profile hydration happens AFTER redirect (best-effort, non-blocking)
        // This updates state quietly in the background
        hydrationPromise
          .then((hydratedProfile) => {
            if (hydratedProfile) {
              applyProfileToStateSafe(hydratedProfile, currentSession);
            }
          })
          .catch(() => {
            // Silently ignore - hydration is best-effort
          });

        // Reset redirect guard after a delay (allows redirect to complete)
        setTimeout(() => {
          redirectInFlightRef.current = false;
        }, 2000);

        setIsLoading(false);
        continue;
      }

      if (event === "SIGNED_OUT") {
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
            continue;
          }

          // Check if current path is an auth route
          const isAuthRouteMatch = isAuthRoute(currentPathname);

          // Only redirect if we're not already on a public or auth route
          if (!isPublicPath(currentPathname) && !isAuthRouteMatch) {
            // Use hard redirect to ensure complete session clear
            // Always include signedOut=true to avoid middleware "helpful" redirects during auth-clearing window
            window.location.replace(`${PATHS.LOGIN}?signedOut=true`);
          }
        } else {
          // Fallback for server-side (shouldn't happen, but just in case)
          routerInstance.push(PATHS.LOGIN);
        }

        setIsLoading(false);
        continue;
      }

      if (event === "TOKEN_REFRESHED") {
        // Just update the session, no need to refetch profile
        if (currentSession?.user) {
          setIsEmailVerified(currentSession.user.email_confirmed_at !== null);
        }
      }

      setIsLoading(false);
    }
  }, [authTick]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    // Event handler - safe to call getSupabase() after mount
    const supabase = getSupabase();
    
    // SIGNED_IN event handler owns hydration + redirect (BootState-driven).
    // Avoid split-brain profile fetch/sets here, which can race bootstrap and feel “random”.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // TRUTH #1: Prove signInWithPassword result
    logger.debug("[auth.signIn] signInWithPassword result", {
      hasError: !!error,
      error: error?.message ?? null,
      hasSession: !!data?.session,
      userId: data?.session?.user?.id ?? null,
    });

    // TRUTH #2: Prove cookie storage wrote something *now*
    // Use setTimeout to check cookies after browser has processed the response
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const cookieSb = document.cookie
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.startsWith("sb-") || s.includes("supabase"));
        logger.debug("[auth.signIn] document.cookie sb*", { cookieSb });
      }, 0);
    }
    
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
        logger.warn("Server-side sign out API call failed", { apiError });
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
      logger.error("Error during sign out", error);
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
      logger.error("Error sending verification email", error);
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
      logger.error("Password reset error", error);
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
    logger.warn("Supabase not configured, using fallback auth provider");
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
