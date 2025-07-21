"use client";

import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ApplyAsTalentButton } from "@/components/apply-as-talent-button";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user, userRole, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set mounted state for client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  };

  // Determine if the current page is the homepage
  const isHomepage = pathname === "/";

  // Determine navbar background color based on scroll position and current page
  const navbarBg = isScrolled ? "bg-white shadow-sm" : isHomepage ? "bg-transparent" : "bg-white";

  // Determine text color based on scroll position and current page
  const textColor = isScrolled || !isHomepage ? "text-gray-800" : "text-white";

  if (!mounted) {
    return null;
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBg}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={
                isScrolled || !isHomepage
                  ? "/images/totl-logo-new.png"
                  : "/images/totl-logo-transparent.png"
              }
              alt="TOTL Agency"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/gigs"
              className={`${textColor} hover:text-gray-600 font-medium transition-colors`}
            >
              Gigs
            </Link>
            <Link
              href="/talent"
              className={`${textColor} hover:text-gray-600 font-medium transition-colors`}
            >
              Talent
            </Link>
            <Link
              href="/about"
              className={`${textColor} hover:text-gray-600 font-medium transition-colors`}
            >
              About
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative group">
                <Button
                  variant="ghost"
                  className={`${textColor} hover:text-gray-600 font-medium transition-colors flex items-center`}
                >
                  My Account
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                  {userRole === "talent" && (
                    <Link
                      href="/admin/talentdashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Talent Dashboard
                    </Link>
                  )}
                  {userRole === "client" && (
                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Client Dashboard
                    </Link>
                  )}
                  {userRole === "admin" && (
                    <Link
                      href="/admin/applications"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className={`${textColor} hover:text-gray-600 font-medium transition-colors`}
                  >
                    Sign In
                  </Button>
                </Link>
                <ApplyAsTalentButton
                  variant={isScrolled || !isHomepage ? "default" : "outline"}
                  className={
                    isScrolled || !isHomepage
                      ? ""
                      : "text-white border-white hover:bg-white hover:text-black"
                  }
                />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/gigs"
                className="text-gray-800 hover:text-gray-600 font-medium transition-colors py-2"
              >
                Gigs
              </Link>
              <Link
                href="/talent"
                className="text-gray-800 hover:text-gray-600 font-medium transition-colors py-2"
              >
                Talent
              </Link>
              <Link
                href="/about"
                className="text-gray-800 hover:text-gray-600 font-medium transition-colors py-2"
              >
                About
              </Link>
              <div className="border-t border-gray-200 pt-4 mt-2">
                {user ? (
                  <>
                    {userRole === "talent" && (
                      <Link
                        href="/admin/talentdashboard"
                        className="block py-2 text-gray-800 hover:text-gray-600 font-medium transition-colors"
                      >
                        Talent Dashboard
                      </Link>
                    )}
                    {userRole === "client" && (
                      <Link
                        href="/admin/dashboard"
                        className="block py-2 text-gray-800 hover:text-gray-600 font-medium transition-colors"
                      >
                        Client Dashboard
                      </Link>
                    )}
                    {userRole === "admin" && (
                      <Link
                        href="/admin/applications"
                        className="block py-2 text-gray-800 hover:text-gray-600 font-medium transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="block py-2 text-gray-800 hover:text-gray-600 font-medium transition-colors"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block py-2 text-gray-800 hover:text-gray-600 font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block py-2 text-gray-800 hover:text-gray-600 font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <div className="mt-4">
                      <ApplyAsTalentButton className="w-full" />
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
