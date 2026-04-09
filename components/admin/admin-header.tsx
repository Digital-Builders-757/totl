"use client";

import type { User } from "@supabase/supabase-js";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  FileText,
  Menu,
  MoreHorizontal,
  LogOut,
  Settings,
  Shield,
  UserIcon,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminModerationCount } from "@/components/admin/admin-moderation-count-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PATHS } from "@/lib/constants/routes";
import { logger } from "@/lib/utils/logger";

interface AdminHeaderProps {
  user?: User;
  /** Override moderation count (e.g. from page data). Falls back to layout context when undefined. */
  notificationCount?: number;
}

const DEFAULT_AVATAR = "/images/totl-logo-transparent.png";

export function AdminHeader({ user, notificationCount: notificationCountProp }: AdminHeaderProps) {
  const { moderationCount } = useAdminModerationCount();
  const notificationCount = notificationCountProp ?? moderationCount;
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Prefer profile avatar (our storage) over OAuth metadata; fallback to default
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url;
  const effectiveAvatarSrc = avatarError || !avatarUrl ? DEFAULT_AVATAR : avatarUrl;

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  // Safety check: if user is not available yet, return null or loading state
  if (!user) {
    return null;
  }

  const navigationItems = [
    { href: PATHS.ADMIN_DASHBOARD, label: "Overview", icon: BarChart3 },
    { href: "/admin/applications", label: "Talent Applications", icon: FileText },
    { href: "/admin/client-applications", label: "Career Builder Applications", icon: Building2 },
    { href: "/admin/talent", label: "Talent", icon: Users },
    { href: "/admin/gigs", label: "Opportunities", icon: Briefcase },
    { href: "/admin/users", label: "Users", icon: UserIcon },
    { href: "/admin/moderation", label: "Moderation", icon: Shield },
  ];

  const mobileRouteLabelMap: Record<string, string> = {
    [PATHS.ADMIN_DASHBOARD]: "Overview",
    "/admin/applications": "Talent Applications",
    "/admin/client-applications": "Career Builder Applications",
    "/admin/talent": "Talent",
    "/admin/gigs": "Opportunities",
    "/admin/users": "Users",
    "/admin/moderation": "Moderation",
  };

  const isActive = (href: string) => {
    if (href === PATHS.ADMIN_DASHBOARD) {
      return pathname === PATHS.ADMIN_DASHBOARD;
    }
    return pathname.startsWith(href);
  };

  const mobileTitle =
    navigationItems.find((item) => pathname === item.href || pathname.startsWith(item.href))?.label ||
    mobileRouteLabelMap[pathname] ||
    "Admin";

  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      logger.error("Admin sign out error", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header
      data-testid="admin-header"
      className="sticky top-0 z-40 border-b border-border/50 bg-card/40 backdrop-blur-xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]"
    >
      {/* Mobile header */}
      <div className="h-14 px-4 md:hidden">
        <div className="relative flex h-full items-center justify-between">
          <div className="flex min-w-[2.5rem] shrink-0 items-center">
            <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open admin navigation"
                data-testid="admin-drawer-trigger"
                className="text-foreground hover:bg-card/30"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent
              data-testid="admin-drawer-panel"
              className="left-0 top-0 h-[100dvh] w-[min(85vw,320px)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-r border-border/50 bg-[var(--oklch-bg)] p-0 pb-[env(safe-area-inset-bottom)] text-foreground"
            >
              <DialogTitle className="sr-only">Admin Navigation</DialogTitle>
              <div className="flex h-full flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/35 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">Admin</p>
                    <p className="text-xs text-muted-foreground">Platform Management</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-testid="admin-drawer-close"
                    aria-label="Close admin navigation"
                    className="h-11 w-11 text-foreground hover:bg-card/30"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={`h-11 justify-start gap-3 px-3 ${
                          isActive(item.href)
                            ? "border border-border/50 bg-card/40 text-foreground"
                            : "text-muted-foreground hover:bg-card/25"
                        }`}
                        asChild
                      >
                        <Link href={item.href} onClick={() => setIsDrawerOpen(false)}>
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
              </div>
            </DialogContent>
          </Dialog>
          </div>
          <p className="pointer-events-none absolute left-0 right-0 truncate px-12 text-center text-base font-semibold text-foreground">
            {mobileTitle}
          </p>
          <div className="flex min-w-[5rem] shrink-0 items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative text-foreground hover:bg-card/30"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Admin actions"
                  data-testid="admin-overflow-trigger"
                  className="text-foreground hover:bg-card/30"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="panel-frosted border-border/50">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="text-foreground focus:bg-card/30">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/talent" className="text-foreground focus:bg-card/30">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Public Site View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-foreground hover:bg-card/30 focus:bg-card/30 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSignOut}
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

      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/images/totl-logo-transparent.png" alt="Admin Profile" />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                  <Shield className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-foreground">Admin Portal</h1>
                <p className="truncate text-sm text-muted-foreground">Platform Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="border-border/50 text-foreground hover:bg-card/30">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {notificationCount > 0 ? (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
                    {notificationCount}
                  </span>
                ) : null}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="border-border/50 text-foreground hover:bg-card/30"
              >
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border/50 text-foreground hover:bg-card/30"
                  >
                    <Avatar className="mr-2 h-6 w-6">
                      <AvatarImage
                        src={effectiveAvatarSrc}
                        alt={user.email || "Admin"}
                        onError={() => setAvatarError(true)}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-xs text-white">
                        {user.email?.charAt(0).toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[220px] truncate">{user.email || "Admin"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="panel-frosted border-border/50">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="text-foreground focus:bg-card/30">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/talent" className="text-foreground focus:bg-card/30">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Public Site View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-foreground hover:bg-card/30 focus:bg-card/30 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <nav className="mt-3 flex flex-wrap gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "border border-border/50 bg-card/40 text-foreground"
                      : "text-muted-foreground hover:bg-card/25 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
