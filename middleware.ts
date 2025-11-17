import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
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

  // Allow public access to individual talent profiles
  if (path.startsWith("/talent/") && path !== "/talent/dashboard") {
    return res;
  }

  // Define auth routes early for environment variable fallback handling
  const authRoutes = [
    "/login",
    "/choose-role",
    "/client/signup",
    "/reset-password",
    "/update-password",
    "/verification-pending",
  ];
  const isAuthRoute = authRoutes.includes(path);

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      path,
      env: process.env.NODE_ENV,
    });
    
    // For auth routes, allow through without session check
    // User will see the login/signup page and proper error handling there
    if (isAuthRoute) {
      return res;
    }
    
    // For protected routes, redirect to login
    if (!publicRoutes.includes(path)) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("returnUrl", encodeURIComponent(path));
      return NextResponse.redirect(redirectUrl);
    }
    
    // For public routes, just continue
    return res;
  }

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
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
  ) as unknown as SupabaseClient<Database>;

  // Only check auth for routes that actually need it
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthRoute && user) {
    // If the user is logged in and tries to access an auth page, redirect to their dashboard based on role.
    // Force a fresh profile check to avoid stale data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, ensure it's created (fallback if trigger failed)
    if (profileError && profileError.code === "PGRST116") {
      // Extract name from user metadata
      const firstName = (user.user_metadata?.first_name as string) || "";
      const lastName = (user.user_metadata?.last_name as string) || "";
      const role = (user.user_metadata?.role as string) || "talent";

      // Create display name
      let displayName = "";
      if (firstName && lastName) {
        displayName = `${firstName} ${lastName}`;
      } else if (firstName) {
        displayName = firstName;
      } else if (lastName) {
        displayName = lastName;
      } else {
        displayName = user.email?.split("@")[0] || "User";
      }

      // Create profile (using admin client would be better, but middleware can't use it)
      // For now, redirect to choose-role and let the app handle profile creation
      return NextResponse.redirect(new URL("/choose-role", req.url));
    }

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

  // If there's no user, and the route is not public or auth-related, redirect to login
  const isProtectedRoute = !isAuthRoute && !publicRoutes.includes(path) && path !== "/choose-role";

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("returnUrl", encodeURIComponent(path));
    return NextResponse.redirect(redirectUrl);
  }

  // If we have a user, we can proceed with role checks
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Handle case where user exists in auth but not in profiles table
    if (profileError && profileError.code === "PGRST116") {
      // User exists in auth but not in profiles - redirect to role selection
      if (path !== "/choose-role") {
        return NextResponse.redirect(new URL("/choose-role", req.url));
      }
      return res;
    }

    // If the user has a profile but no role, try to determine it before redirecting
    if (!profile?.role && path !== "/choose-role") {
      // Try to determine role from talent_profiles or client_profiles
      const { data: talentProfile } = await supabase
        .from("talent_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (talentProfile) {
        // Update profile with talent role
        await supabase
          .from("profiles")
          .update({ role: "talent" })
          .eq("id", user.id);
        // Redirect to talent dashboard
        return NextResponse.redirect(new URL("/talent/dashboard", req.url));
      }

      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientProfile) {
        // Update profile with client role
        await supabase
          .from("profiles")
          .update({ role: "client" })
          .eq("id", user.id);
        // Redirect to client dashboard
        return NextResponse.redirect(new URL("/client/dashboard", req.url));
      }

      // If we can't determine role, check user metadata
      const roleFromMetadata = (user.user_metadata?.role as string) || null;
      if (roleFromMetadata) {
        // Update profile with metadata role
        await supabase
          .from("profiles")
          .update({ role: roleFromMetadata as "talent" | "client" | "admin" })
          .eq("id", user.id);
        
        // Redirect based on metadata role
        if (roleFromMetadata === "talent") {
          return NextResponse.redirect(new URL("/talent/dashboard", req.url));
        } else if (roleFromMetadata === "client") {
          return NextResponse.redirect(new URL("/client/dashboard", req.url));
        } else if (roleFromMetadata === "admin") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      }

      // Only redirect to choose-role if we truly can't determine the role
      return NextResponse.redirect(new URL("/choose-role", req.url));
    }

    // If the user has a role, redirect them from the choose-role page to their dashboard.
    // But first, re-fetch the profile to ensure we have the latest data (in case it was just updated)
    if (path === "/choose-role") {
      // Re-fetch profile to get the latest role (in case it was just updated above)
      const { data: latestProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (latestProfile?.role) {
        if (latestProfile.role === "talent") {
          return NextResponse.redirect(new URL("/talent/dashboard", req.url));
        }
        if (latestProfile.role === "client") {
          return NextResponse.redirect(new URL("/client/dashboard", req.url));
        }
        if (latestProfile.role === "admin") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      }
      // If no role, allow user to stay on choose-role page to select one
      return res;
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
