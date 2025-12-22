"use client";

import type { User } from "@supabase/supabase-js";
import {
  Bell,
  LogOut,
  Settings,
  UserIcon,
  Shield,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PATHS } from "@/lib/constants/routes";

interface AdminHeaderProps {
  user?: User;
  notificationCount?: number;
}

export function AdminHeader({ user, notificationCount = 0 }: AdminHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Safety check: if user is not available yet, return null or loading state
  if (!user) {
    return null;
  }

  const navigationItems = [
    { href: PATHS.ADMIN_DASHBOARD, label: "Overview", icon: "📊" },
    { href: "/admin/applications", label: "Talent Applications", icon: "📝" },
    { href: "/admin/client-applications", label: "Career Builder Applications", icon: "🏢" },
    { href: "/admin/talent", label: "Talent", icon: "👥" },
    { href: "/admin/gigs", label: "Gigs", icon: "💼" },
    { href: "/admin/users", label: "Users", icon: "👤" },
    { href: "/admin/moderation", label: "Moderation", icon: "🛡️" },
  ];

  const isActive = (href: string) => {
    if (href === PATHS.ADMIN_DASHBOARD) {
      return pathname === PATHS.ADMIN_DASHBOARD;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src="/images/totl-logo-transparent.png"
                alt="Admin Profile"
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                <Crown className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-400" />
                Admin Portal
              </h1>
              <p className="text-gray-300">Platform Management Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-gray-800 text-white border border-gray-600"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {notificationCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url}
                      alt={user?.email || "Admin"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs">
                      {user?.email?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user?.email || "Admin"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="text-white hover:bg-gray-800">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/talent" className="text-white hover:bg-gray-800">
                    <span className="mr-2">👁️</span>
                    Public Site View
                  </Link>
                </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                if (isSigningOut) return;
                try {
                  setIsSigningOut(true);
                  await signOut();
                } catch (error) {
                  console.error("Admin sign out error:", error);
                } finally {
                  setIsSigningOut(false);
                }
              }}
              disabled={isSigningOut}
            >
                  <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
