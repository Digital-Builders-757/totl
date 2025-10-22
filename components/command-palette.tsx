"use client";

import { Command } from "cmdk";
import {
  Home,
  Search,
  Settings,
  User,
  Briefcase,
  FileText,
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [search, setSearch] = React.useState("");

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  // Navigation commands based on user role
  const navigationCommands = React.useMemo(() => {
    const commands = [
      {
        icon: Home,
        label: "Home",
        description: "Go to homepage",
        action: () => router.push("/"),
        shortcut: "H",
      },
      {
        icon: Search,
        label: "Browse Gigs",
        description: "View all available gigs",
        action: () => router.push("/gigs"),
        shortcut: "G",
      },
    ];

    if (user && profile) {
      if (profile.role === "talent") {
        commands.push(
          {
            icon: LayoutDashboard,
            label: "Talent Dashboard",
            description: "View your talent dashboard",
            action: () => router.push("/talent/dashboard"),
            shortcut: "D",
          },
          {
            icon: User,
            label: "Complete Profile",
            description: "Update your talent profile",
            action: () => router.push("/talent/profile"),
            shortcut: "P",
          },
          {
            icon: FileText,
            label: "My Applications",
            description: "View your gig applications",
            action: () => router.push("/talent/dashboard"),
            shortcut: "A",
          }
        );
      } else if (profile.role === "client") {
        commands.push(
          {
            icon: LayoutDashboard,
            label: "Client Dashboard",
            description: "View your client dashboard",
            action: () => router.push("/client/dashboard"),
            shortcut: "D",
          },
          {
            icon: Briefcase,
            label: "My Gigs",
            description: "Manage your posted gigs",
            action: () => router.push("/client/gigs"),
            shortcut: "M",
          },
          {
            icon: Users,
            label: "Applications",
            description: "Review talent applications",
            action: () => router.push("/client/applications"),
            shortcut: "A",
          },
          {
            icon: Calendar,
            label: "Bookings",
            description: "Manage your bookings",
            action: () => router.push("/client/bookings"),
            shortcut: "B",
          }
        );
      } else if (profile.role === "admin") {
        commands.push(
          {
            icon: LayoutDashboard,
            label: "Admin Dashboard",
            description: "Access admin panel",
            action: () => router.push("/admin"),
            shortcut: "D",
          },
          {
            icon: Users,
            label: "Manage Users",
            description: "View and manage users",
            action: () => router.push("/admin/users"),
            shortcut: "U",
          },
          {
            icon: Briefcase,
            label: "Create Gig",
            description: "Post a new gig",
            action: () => router.push("/admin/gigs/create"),
            shortcut: "C",
          }
        );
      }

      // Common authenticated user commands
      commands.push(
        {
          icon: Settings,
          label: "Settings",
          description: "Manage your account settings",
          action: () => router.push("/settings"),
          shortcut: "S",
        },
        {
          icon: LogOut,
          label: "Sign Out",
          description: "Log out of your account",
          action: () => signOut(),
          shortcut: "Q",
        }
      );
    }

    return commands;
  }, [user, profile, router, signOut]);

  // Help & Info commands
  const helpCommands = [
    {
      icon: HelpCircle,
      label: "Help Center",
      description: "Get help and support",
      action: () => router.push("/help"),
    },
    {
      icon: FileText,
      label: "Terms of Service",
      description: "Read our terms",
      action: () => router.push("/terms"),
    },
    {
      icon: FileText,
      label: "Privacy Policy",
      description: "View our privacy policy",
      action: () => router.push("/privacy"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border-zinc-800 bg-zinc-950">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          shouldFilter={true}
        >
          <div className="flex items-center border-b border-zinc-800 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-zinc-400" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              value={search}
              onValueChange={setSearch}
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-zinc-400">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-zinc-400">
              No results found.
            </Command.Empty>

            {/* Navigation Commands */}
            <Command.Group heading="Navigation" className="mb-2">
              {navigationCommands.map((command) => (
                <Command.Item
                  key={command.label}
                  value={command.label}
                  onSelect={() => runCommand(command.action)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none",
                    "hover:bg-zinc-800/50 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white",
                    "transition-colors duration-150"
                  )}
                >
                  <command.icon className="mr-3 h-4 w-4 text-zinc-400" />
                  <div className="flex-1">
                    <div className="font-medium text-white">{command.label}</div>
                    <div className="text-xs text-zinc-500">{command.description}</div>
                  </div>
                  {command.shortcut && (
                    <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-zinc-400">
                      ⌘{command.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Help & Info */}
            <Command.Group heading="Help & Info" className="mb-2">
              {helpCommands.map((command) => (
                <Command.Item
                  key={command.label}
                  value={command.label}
                  onSelect={() => runCommand(command.action)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none",
                    "hover:bg-zinc-800/50 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white",
                    "transition-colors duration-150"
                  )}
                >
                  <command.icon className="mr-3 h-4 w-4 text-zinc-400" />
                  <div className="flex-1">
                    <div className="font-medium text-white">{command.label}</div>
                    <div className="text-xs text-zinc-500">{command.description}</div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer with keyboard shortcuts */}
          <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
                    ↵
                  </kbd>
                  Select
                </span>
              </div>
              <span className="text-zinc-600">
                Press{" "}
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
                  ⌘K
                </kbd>{" "}
                to open
              </span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage command palette state and keyboard shortcuts
 */
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}

