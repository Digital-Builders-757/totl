"use client";

import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PATHS, isAuthRoute } from "@/lib/constants/routes";
import { needsSubscription } from "@/lib/subscription";
import { logger } from "@/lib/utils/logger";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const { user, userRole, profile, signOut } = useAuth();
  const isTalentUser = userRole === "talent";
  const subscriptionAwareProfile =
    profile && profile.role
      ? {
          role: profile.role as "talent" | "client" | "admin",
          subscription_status: profile.subscription_status ?? "none",
        }
      : null;
  const shouldPromptSubscription = isTalentUser && needsSubscription(subscriptionAwareProfile);
  const isOnTalentDashboard = pathname?.startsWith(PATHS.TALENT_DASHBOARD);
  const showPersistentSubscribeCta =
    shouldPromptSubscription && !isOnTalentDashboard;
  const isAuthSurface = pathname ? isAuthRoute(pathname) : false;
  const shouldPrefetch = !isAuthSurface;
  const isActive = (href: string) => (pathname ? pathname.startsWith(href) : false);

  // Determine if the current page is the homepage - safe for SSR
  const isHomepage = pathname === "/" || pathname === null;

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle sign out
  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    try {
      setIsSigningOut(true);
      // Close mobile menu if open
      setIsMenuOpen(false);
      
      // Call signOut and wait for it to complete
      await signOut();
    } catch (error) {
      logger.error("Sign out error", error);
      setIsSigningOut(false);
    }
  };

  // Determine navbar background color based on scroll position and current page
  const navbarBg = isScrolled
    ? "panel-frosted shadow-lg shadow-black/25"
    : isHomepage
      ? "panel-frosted"
      : "bg-black";
  const navbarBorder = isScrolled ? "border-b border-border/35" : "border-b border-transparent";

  // Determine text color based on scroll position and current page
  const textColor = isScrolled || !isHomepage ? "text-white" : "text-white";

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${navbarBg} ${navbarBorder}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/images/solo_logo.png"
              alt="TOTL Agency"
              width={180}
              height={70}
              className="h-16 w-auto group-hover:scale-110 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-16">
            {/* Opportunities link: only show for signed-in users (G1: list requires sign-in) */}
            {user && (
              <Link
                href="/gigs"
                prefetch={shouldPrefetch}
                className={`${textColor} hover:text-white font-medium transition-all duration-300 hover-lift relative group ${
                  isActive("/gigs") ? "nav-active" : ""
                }`}
              >
                Opportunities
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
            {/* Talent directory removed per Approach B: no roster browsing */}
            {/* Admin-only: optional talent directory access via admin terminal */}
            {userRole === "admin" && (
              <Link
                href={PATHS.ADMIN_DASHBOARD}
                prefetch={shouldPrefetch}
                className={`${textColor} hover:text-white font-medium transition-all duration-300 hover-lift relative group ${
                  isActive(PATHS.ADMIN_DASHBOARD) ? "nav-active" : ""
                }`}
              >
                Admin
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {showPersistentSubscribeCta && (
              <Link href="/talent/subscribe" prefetch={shouldPrefetch}>
                <Button
                  variant="default"
                  className="rounded-full bg-amber-400 text-black shadow-lg shadow-amber-400/30 hover:bg-amber-300"
                >
                  Subscribe
                </Button>
              </Link>
            )}
            {user ? (
              <div className="relative group">
                <Button
                  variant="ghost"
                  className={`${textColor} hover:text-gray-300 font-medium transition-colors flex items-center`}
                >
                  My Account
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
                <div className="absolute right-0 mt-2 z-20 w-48 overflow-hidden rounded-md panel-frosted shadow-lg opacity-0 shadow-black/30 transition-all duration-200 invisible group-hover:visible group-hover:opacity-100">
                  {userRole === "talent" && (
                    <Link
                      href={PATHS.TALENT_DASHBOARD}
                      prefetch={shouldPrefetch}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      Talent Dashboard
                    </Link>
                  )}
                  {userRole === "client" && (
                    <Link
                      href={PATHS.CLIENT_DASHBOARD}
                      prefetch={shouldPrefetch}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      Career Builder Dashboard
                    </Link>
                  )}
                  {userRole === "admin" && (
                    <Link
                      href={PATHS.ADMIN_DASHBOARD}
                      prefetch={shouldPrefetch}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    prefetch={shouldPrefetch}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSigningOut ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href={PATHS.LOGIN}>
                  <Button
                    variant="ghost"
                    className={`${textColor} hover:text-gray-300 font-medium transition-colors`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href={PATHS.CHOOSE_ROLE} prefetch={false}>
                  <Button
                    variant="default"
                    className="bg-white text-black hover:bg-gray-200 font-semibold"
                  >
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
          {/* Mobile Subscribe CTA + Menu */}
          <div className="flex items-center gap-3">
            {showPersistentSubscribeCta && (
              <Link
                href="/talent/subscribe"
                className="md:hidden rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black shadow-lg shadow-amber-400/30 transition hover:bg-amber-300"
              >
                Subscribe
              </Link>
            )}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
          {isMenuOpen && (
        <div className="panel-frosted border-t border-border/40 shadow-lg shadow-black/25 md:hidden">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
                  {showPersistentSubscribeCta && (
                    <Link
                      href="/talent/subscribe"
                      className="w-full inline-flex justify-center rounded-full bg-amber-400 text-black font-semibold py-3"
                    >
                      Subscribe & Apply
                    </Link>
                  )}
              {/* Opportunities link: only show for signed-in users (G1: list requires sign-in) */}
              {user && (
                <Link
                  href="/gigs"
                  className="text-white hover:text-gray-300 font-medium transition-colors py-2"
                >
                  Opportunities
                </Link>
              )}
              {/* Talent directory removed per Approach B: no roster browsing */}
              <div className="mt-2 border-t border-border/35 pt-4">
                {user ? (
                  <>
                    {userRole === "talent" && (
                      <Link
                        href={PATHS.TALENT_DASHBOARD}
                        className="block py-2 text-white hover:text-gray-300 font-medium transition-colors"
                      >
                        Talent Dashboard
                      </Link>
                    )}
                    {userRole === "client" && (
                      <Link
                        href={PATHS.CLIENT_DASHBOARD}
                        className="block py-2 text-white hover:text-gray-300 font-medium transition-colors"
                      >
                        Career Builder Dashboard
                      </Link>
                    )}
                    {userRole === "admin" && (
                      <Link
                        href={PATHS.ADMIN_DASHBOARD}
                        className="block py-2 text-white hover:text-gray-300 font-medium transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      className="block py-2 text-white hover:text-gray-300 font-medium transition-colors"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="block py-2 text-white hover:text-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSigningOut ? "Signing Out..." : "Sign Out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={PATHS.LOGIN}
                      className="block py-2 text-white hover:text-gray-300 font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <div className="mt-4">
                      <Link href={PATHS.CHOOSE_ROLE} prefetch={false}>
                        <Button className="w-full bg-white text-black hover:bg-gray-200">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
