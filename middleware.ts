import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

type AccountType = "unassigned" | "talent" | "client";
type ProfileRow = {
  role: Database["public"]["Tables"]["profiles"]["Row"]["role"];
  account_type: AccountType;
  is_suspended: boolean | null;
};

const publicRoutes = ["/", "/about", "/gigs", "/talent", "/suspended", "/client/signup", "/client/apply"];
const authRoutes = [
  "/login",
  "/reset-password",
  "/update-password",
  "/verification-pending",
  "/choose-role",
];
const onboardingPath = "/onboarding/select-account-type";

const isAssetOrApi = (path: string) =>
  path.startsWith("/_next") ||
  path.startsWith("/favicon") ||
  path.startsWith("/images") ||
  (path.startsWith("/api/") && !path.startsWith("/api/auth")) ||
  path.includes(".");

const safeReturnUrl = (value: string | null): string | null => {
  if (!value) return null;
  if (value.includes("://") || value.startsWith("//")) return null;
  if (!value.startsWith("/")) return null;
  return value;
};

const determineDestination = (profile: ProfileRow | null) => {
  if (!profile) return "/choose-role";
  if (profile.role === "admin") return "/admin/dashboard";
  if (profile.account_type === "client") return "/client/dashboard";
  if (profile.account_type === "talent") return "/talent/dashboard";
  return onboardingPath;
};

const needsClientAccess = (path: string) => path.startsWith("/client/") && path !== "/client/apply";
const needsTalentAccess = (path: string) => path.startsWith("/talent/") && path !== "/talent";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const res = NextResponse.next();

  if (isAssetOrApi(path)) {
    return res;
  }

  const returnUrl = safeReturnUrl(req.nextUrl.searchParams.get("returnUrl"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (authRoutes.includes(path) || publicRoutes.includes(path) || path === onboardingPath) {
      return res;
    }
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("returnUrl", encodeURIComponent(path));
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (authRoutes.includes(path) || publicRoutes.includes(path) || path === onboardingPath) {
      return res;
    }
    if (!publicRoutes.includes(path)) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("returnUrl", encodeURIComponent(path));
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_type, is_suspended")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Middleware profile query error:", profileError);
  }

  const isAdmin = profile?.role === "admin";
  const accountType: AccountType = (profile?.account_type ?? "unassigned") as AccountType;

  if (profile?.is_suspended && path !== "/suspended") {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  const needsOnboarding = !isAdmin && accountType === "unassigned";
  const onAuthRoute = authRoutes.includes(path);

  if (needsOnboarding && path !== onboardingPath && path !== "/choose-role") {
    return NextResponse.redirect(new URL(onboardingPath, req.url));
  }

  if (!needsOnboarding && path === onboardingPath && !isAdmin) {
    const destination = determineDestination(profile);
    return NextResponse.redirect(new URL(destination, req.url));
  }

  if (onAuthRoute && user) {
    if (returnUrl && !needsOnboarding && !isAdmin) {
      const returnPath = new URL(returnUrl, req.url);
      const target = returnPath.pathname;
      if (
        (!needsClientAccess(target) || accountType === "client") &&
        (!needsTalentAccess(target) || accountType === "talent") &&
        (!target.startsWith("/admin/") || isAdmin)
      ) {
        return NextResponse.redirect(returnPath);
      }
    }
    const destination = determineDestination(profile);
    return NextResponse.redirect(new URL(destination, req.url));
  }

  if (path === "/" && !needsOnboarding) {
    const destination = determineDestination(profile);
    return NextResponse.redirect(new URL(destination, req.url));
  }

  if (!isAdmin) {
    if (needsClientAccess(path) && accountType !== "client") {
      const destination = determineDestination(profile);
      return NextResponse.redirect(new URL(destination, req.url));
    }
    if (needsTalentAccess(path) && accountType !== "talent") {
      const destination = determineDestination(profile);
      return NextResponse.redirect(new URL(destination, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

