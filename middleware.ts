import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the user is authenticated
  const isAuthenticated = !!session

  // Get the URL path
  const path = req.nextUrl.pathname

  // Define protected routes that require authentication
  const protectedRoutes = ["/admin", "/talent/dashboard", "/client/dashboard"]
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // Define auth routes (login, signup, etc.)
  const authRoutes = ["/login", "/talent/signup", "/client/signup", "/choose-role"]
  const isAuthRoute = authRoutes.some((route) => path === route)

  // Redirect logic
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login if trying to access protected route without authentication
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("returnUrl", encodeURIComponent(req.nextUrl.pathname))
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    // Redirect to appropriate dashboard if already authenticated
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (profile?.role === "talent") {
      return NextResponse.redirect(new URL("/admin/talentdashboard", req.url))
    } else if (profile?.role === "client") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    } else if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/applications", req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/talent/dashboard/:path*",
    "/client/dashboard/:path*",
    "/login",
    "/talent/signup",
    "/client/signup",
    "/choose-role",
  ],
}
