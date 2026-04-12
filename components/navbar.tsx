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

  // Primary nav links stay high-contrast; secondary surfaces use OKLCH tokens (see gigs breadcrumbs).
  const textColor = "text-white";
  const navMutedHover =
    "text-[var(--oklch-text-tertiary)] hover:text-white transition-colors";
  const dropdownItemClass =
    "block px-4 py-2 text-sm text-[var(--oklch-text-tertiary)] hover:bg-white/10 hover:text-white";

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${navbarBg} ${navbarBorder}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center group">
            <Image
              src="/images/solo_logo.png"
              alt="TOTL Agency"
              width={180}
              height={70}
              className="h-12 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-16"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex lg:gap-10">
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
                  className={`${textColor} ${navMutedHover} font-medium flex items-center`}
                >
                  My Account
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
                <div className="absolute right-0 mt-2 z-20 w-48 overflow-hidden rounded-md panel-frosted shadow-lg opacity-0 shadow-black/30 transition-all duration-200 invisible group-hover:visible group-hover:opacity-100">
                  {userRole === "talent" && (
                    <Link href={PATHS.TALENT_DASHBOARD} prefetch={shouldPrefetch} className={dropdownItemClass}>
                      Talent Dashboard
                    </Link>
                  )}
                  {userRole === "client" && (
                    <Link href={PATHS.CLIENT_DASHBOARD} prefetch={shouldPrefetch} className={dropdownItemClass}>
                      Career Builder Dashboard
                    </Link>
                  )}
                  {userRole === "admin" && (
                    <Link href={PATHS.ADMIN_DASHBOARD} prefetch={shouldPrefetch} className={dropdownItemClass}>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/settings" prefetch={shouldPrefetch} className={dropdownItemClass}>
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`${dropdownItemClass} w-full text-left disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {isSigningOut ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href={PATHS.LOGIN}>
                  <Button variant="ghost" className={`${textColor} ${navMutedHover} font-medium`}>
                    Sign In
                  </Button>
                </Link>
                <Link href={PATHS.CHOOSE_ROLE} prefetch={false}>
                  <Button variant="default" className="rounded-full px-5 font-semibold">
                    Create account
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
              type="button"
              id="navbar-mobile-menu-button"
              aria-expanded={isMenuOpen}
              aria-controls="navbar-mobile-menu"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--oklch-text-tertiary)] transition-colors hover:text-white md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu — Subscribe stays compact in header; no duplicate full-width CTA here */}
      {isMenuOpen && (
        <div
          id="navbar-mobile-menu"
          className="panel-frosted border-t border-border/40 shadow-lg shadow-black/25 md:hidden"
          role="navigation"
          aria-label="Mobile"
        >
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {/* Opportunities link: only show for signed-in users (G1: list requires sign-in) */}
              {user && (
                <Link
                  href="/gigs"
                  className="py-2 font-medium text-white transition-colors hover:text-[var(--oklch-text-secondary)]"
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
                        className="block py-2 font-medium text-white transition-colors hover:text-[var(--oklch-text-secondary)]"
                      >
                        Talent Dashboard
                      </Link>
                    )}
                    {userRole === "client" && (
                      <Link
                        href={PATHS.CLIENT_DASHBOARD}
                        className="block py-2 font-medium text-white transition-colors hover:text-[var(--oklch-text-secondary)]"
                      >
                        Career Builder Dashboard
                      </Link>
                    )}
                    {userRole === "admin" && (
                      <Link
                        href={PATHS.ADMIN_DASHBOARD}
                        className="block py-2 font-medium text-white transition-colors hover:text-[var(--oklch-text-secondary)]"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      className="block py-2 font-medium text-white transition-colors hover:text-[var(--oklch-text-secondary)]"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="block py-2 text-left font-medium text-white transition-colors hover:text-[var(--oklch-text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSigningOut ? "Signing Out..." : "Sign Out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={PATHS.LOGIN}
                      className="block py-2 font-medium text-white transition-colors hover:text-[var(--oklch-text-secondary)]"
                    >
                      Sign In
                    </Link>
                    <div className="mt-4">
                      <Link href={PATHS.CHOOSE_ROLE} prefetch={false}>
                        <Button variant="default" className="w-full rounded-full font-semibold">
                          Create account
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
