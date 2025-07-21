import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Public routes that do not require any specific handling
  const publicRoutes = ["/"];
  if (publicRoutes.includes(path)) {
    return res;
  }

  // Auth routes that should redirect if the user is already logged in
  const authRoutes = ["/login", "/talent/signup", "/client/signup"];
  const isAuthRoute = authRoutes.includes(path);

  if (isAuthRoute && session) {
    // If the user is logged in and tries to access an auth page, redirect to their dashboard based on role.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    if (profile?.role === "talent") {
      return NextResponse.redirect(new URL("/admin/talentdashboard", req.url));
    }
    if (profile?.role === "client") {
      return NextResponse.redirect(new URL("/client/dashboard", req.url));
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // If the user has a profile but no role, and is not already on the choose-role page, redirect them there.
    if (!profile?.role && path !== "/choose-role") {
      return NextResponse.redirect(new URL("/choose-role", req.url));
    }

    // If the user has a role, redirect them from the choose-role page to their dashboard.
    if (profile?.role && path === "/choose-role") {
      if (profile.role === "talent") {
        return NextResponse.redirect(new URL("/admin/talentdashboard", req.url));
      }
      if (profile.role === "client") {
        return NextResponse.redirect(new URL("/client/dashboard", req.url));
      }
    }
    // If the user has a role and is on the root, redirect to their dashboard
    if (profile?.role && path === "/") {
      if (profile.role === "talent") {
        return NextResponse.redirect(new URL("/admin/talentdashboard", req.url));
      }
      if (profile.role === "client") {
        return NextResponse.redirect(new URL("/client/dashboard", req.url));
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
     * - api/ (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
