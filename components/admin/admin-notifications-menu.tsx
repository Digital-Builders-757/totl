"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchAdminSignupNotificationsForMenu,
  markAdminSignupNotificationsRead,
  type AdminSignupNotificationRow,
} from "@/lib/actions/admin-user-notification-actions";
import { logger } from "@/lib/utils/logger";

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Variant = "mobile-icon" | "desktop-button";

export function AdminNotificationsMenu({
  variant,
  badgeCount,
}: {
  variant: Variant;
  /** Total alerts (e.g. moderation + unread signup notifications). */
  badgeCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminSignupNotificationRow[]>([]);

  const loadAndMarkRead = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminSignupNotificationsForMenu(25);
      if (result.ok) {
        setItems(result.items);
        await markAdminSignupNotificationsRead();
        router.refresh();
      } else {
        setItems([]);
      }
    } catch (e) {
      logger.error("Admin notifications menu load failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        void loadAndMarkRead();
      }
    },
    [loadAndMarkRead]
  );

  const badge =
    badgeCount > 0 ? (
      <span
        className={
          variant === "mobile-icon"
            ? "absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white"
            : "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white"
        }
      >
        {badgeCount > 9 ? "9+" : badgeCount}
      </span>
    ) : null;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {variant === "mobile-icon" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative text-foreground hover:bg-white/10"
          >
            <Bell className="h-5 w-5" />
            {badge}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-foreground hover:bg-white/10"
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
            {badge}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="panel-frosted z-[60] flex max-h-[min(70vh,420px)] w-[min(calc(100vw-2rem),20rem)] flex-col border-white/10 p-0"
      >
        <div className="border-b border-white/10 px-3 py-2">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <p className="text-xs text-muted-foreground">New member signups and alerts</p>
        </div>
        <ScrollArea className="max-h-[min(50vh,320px)]">
          <div className="py-1">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No new member notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="border-b border-white/5 px-3 py-2 last:border-b-0"
                >
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">{n.body}</p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-muted-foreground/80">
                    {formatShortDate(n.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-card/30">
          <Link href="/admin/users" className="text-foreground">
            Open Users
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-card/30">
          <Link href="/admin/moderation" className="text-foreground">
            Open Moderation
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
