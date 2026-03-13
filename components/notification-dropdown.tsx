"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import type { NotificationItem } from "@/components/notification-count-provider";
import { useNotificationCount } from "@/components/notification-count-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationDropdownProps {
  /** Link to view all (e.g. /client/applications or /talent/dashboard) */
  viewAllHref: string;
  /** Button variant for trigger */
  variant?: "ghost" | "outline";
  /** Size for mobile icon-only vs desktop with text */
  size?: "icon" | "sm";
  /** Additional className for trigger */
  className?: string;
  /** Show as icon-only (mobile) or with "Notifications" label (desktop) */
  showLabel?: boolean;
}

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationDropdown({
  viewAllHref,
  variant = "ghost",
  size = "icon",
  className,
  showLabel = false,
}: NotificationDropdownProps) {
  const { notificationCount, notifications } = useNotificationCount();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          aria-label="Notifications"
          className={`relative ${className ?? ""}`}
        >
          <Bell className={showLabel ? "mr-2 h-4 w-4" : "h-5 w-5"} />
          {showLabel && <span>Notifications</span>}
          {notificationCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[min(400px,70vh)] overflow-y-auto">
        <div className="px-2 py-2 border-b">
          <p className="text-sm font-semibold">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((n: NotificationItem) => (
              <Link key={n.id} href={viewAllHref}>
                <div
                  className={`px-3 py-2.5 text-sm hover:bg-accent cursor-pointer transition-colors ${
                    !n.read_at ? "bg-accent/50" : ""
                  }`}
                >
                  <p className="font-medium truncate">{n.title}</p>
                  {n.body ? (
                    <p className="text-muted-foreground truncate mt-0.5">{n.body}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNotificationTime(n.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href={viewAllHref}>View all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
