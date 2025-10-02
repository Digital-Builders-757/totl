import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // Skip middleware for static assets and API routes (except auth-related ones)
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/images") ||
    (path.startsWith("/api/") && !path.startsWith("/api/auth")) ||
    path.includes(".")
  ) {
    return res;
  }

  // Public routes that do not require any auth handling
  const publicRoutes = ["/", "/about", "/gigs", "/talent"];
  if (publicRoutes.includes(path)) {
    return res;
  }

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Only check auth for routes that actually need it
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Auth routes that should redirect if the user is already logged in
  const authRoutes = [
    "/login",
    "/talent/signup",
    "/client/signup",
    "/reset-password",
    "/update-password",
    "/verification-pending",
  ];
  const isAuthRoute = authRoutes.includes(path);

  if (isAuthRoute && session) {
    // If the user is logged in and tries to access an auth page, redirect to their dashboard based on role.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role === "talent") {
      return NextResponse.redirect(new URL("/talent/dashboard", req.url));
    }
    if (profile?.role === "client") {
      return NextResponse.redirect(new URL("/client/dashboard", req.url));
    }
    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    // If no role, go to choose-role
    return NextResponse.redirect(new URL("/choose-role", req.url));
  }

  // If there's no session, and the route is not public or auth-related, redirect to login
  const isProtectedRoute = !isAuthRoute && !publicRoutes.includes(path) && path !== "/choose-role";

  if (!session && isProtectedRoute) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("returnUrl", encodeURIComponent(path));
    return NextResponse.redirect(redirectUrl);
  }

  // If we have a session, we can proceed with role checks
  if (session) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // Handle case where user exists in auth but not in profiles table
    if (profileError && profileError.code === "PGRST116") {
      // User exists in auth but not in profiles - redirect to role selection
      if (path !== "/choose-role") {
        return NextResponse.redirect(new URL("/choose-role", req.url));
      }
      return res;
    }

    // If the user has a profile but no role, and is not already on the choose-role page, redirect them there.
    if (!profile?.role && path !== "/choose-role") {
      return NextResponse.redirect(new URL("/choose-role", req.url));
    }

    // If the user has a role, redirect them from the choose-role page to their dashboard.
    if (profile?.role && path === "/choose-role") {
      if (profile.role === "talent") {
        return NextResponse.redirect(new URL("/talent/dashboard", req.url));
      }
      if (profile.role === "client") {
        return NextResponse.redirect(new URL("/client/dashboard", req.url));
      }
      if (profile.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    // If the user has a role and is on the root, redirect to their dashboard
    if (profile?.role && path === "/") {
      if (profile.role === "talent") {
        return NextResponse.redirect(new URL("/talent/dashboard", req.url));
      }
      if (profile.role === "client") {
        return NextResponse.redirect(new URL("/client/dashboard", req.url));
      }
      if (profile.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    // Role-based route protection
    if (profile?.role) {
      // Talent routes
      if (path.startsWith("/talent/") && profile.role !== "talent") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // Client routes
      if (path.startsWith("/client/") && profile.role !== "client") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // Admin routes
      if (path.startsWith("/admin/") && profile.role !== "admin") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
