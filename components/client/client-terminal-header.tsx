"use client";

import { Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ClientTerminalHeaderProps {
  title: string;
  subtitle: string;
  desktopPrimaryAction?: ReactNode;
  mobileSecondaryAction?: ReactNode;
}

const drawerLinks = [
  { label: "Overview", href: "/client/dashboard" },
  { label: "My Gigs", href: "/client/gigs" },
  { label: "Applications", href: "/client/applications" },
  { label: "Bookings", href: "/client/bookings" },
  { label: "Settings", href: "/settings" },
];

export function ClientTerminalHeader({
  title,
  subtitle,
  desktopPrimaryAction,
  mobileSecondaryAction,
}: ClientTerminalHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <div data-testid="client-header-root" className="elev-2 sticky top-0 z-40 border-b border-white/10">
        <div className="container mx-auto px-4 py-2 pt-[env(safe-area-inset-top)] md:py-4">
          <div className="flex h-14 items-center justify-between md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid="client-drawer-trigger"
              aria-label="Open client navigation menu"
              className="h-11 w-11 text-white hover:bg-white/10"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 px-3 text-center">
              <p className="truncate text-base font-semibold text-white">{title}</p>
              <p className="truncate text-xs text-gray-300">{subtitle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go to settings"
              className="h-11 w-11 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="hidden items-center justify-between gap-4 md:flex">
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-gray-300">{subtitle}</p>
            </div>
            {desktopPrimaryAction}
          </div>
          {mobileSecondaryAction ? <div className="pt-2 md:hidden">{mobileSecondaryAction}</div> : null}
        </div>
      </div>

      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent
          data-testid="client-drawer-panel"
          className="left-0 top-0 h-[100dvh] w-[min(85vw,320px)] max-w-none translate-x-0 translate-y-0 rounded-none border-r border-white/10 bg-black p-0 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-300">Menu</p>
                <p className="truncate text-base font-semibold">Career Builder</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-testid="client-drawer-close"
                aria-label="Close client navigation menu"
                className="h-11 w-11 text-white hover:bg-white/10"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-3">
              {drawerLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-lg px-3 py-3 text-base text-white hover:bg-white/10"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-white/10 px-3 py-3">
              <button
                type="button"
                disabled={isSigningOut}
                className="flex min-h-11 w-full items-center rounded-lg px-3 py-3 text-left text-base text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={async () => {
                  if (isSigningOut) return;
                  setIsDrawerOpen(false);
                  setIsSigningOut(true);
                  try {
                    await signOut();
                  } catch {
                    setIsSigningOut(false);
                  }
                }}
              >
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

