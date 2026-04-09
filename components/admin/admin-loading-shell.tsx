import type React from "react";

/**
 * Dark-themed loading shell for admin routes.
 * Matches AdminHeader + PageShell aesthetic to prevent white flash and maintain immersion.
 * AdminHeader returns null when user is undefined (loading state), so we render a skeleton header.
 */
export function AdminLoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 page-ambient text-white">
      {/* Skeleton header matching AdminHeader layout */}
      <header className="panel-frosted sticky top-0 z-40 border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-48 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-9 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <nav className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-20 bg-white/10 rounded-lg animate-pulse" />
            ))}
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
