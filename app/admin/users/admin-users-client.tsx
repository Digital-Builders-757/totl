"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  User as UserIcon,
  Shield,
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  ArrowUp,
  Loader2,
  Trash2,
  AlertCircle,
  Undo2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MobileListRowCard } from "@/components/dashboard/mobile-list-row-card";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { DataTableShell } from "@/components/layout/data-table-shell";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SafeDate } from "@/components/safe-date";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { getRoleDisplayName } from "@/lib/constants/user-roles";
import { logActionFailure } from "@/lib/errors/log-action-failure";
import { userSafeMessage } from "@/lib/errors/user-safe-message";
import { getPlanDisplayName, getSubscriptionStatusColor, getSubscriptionStatusText } from "@/lib/subscription";
import { cn } from "@/lib/utils";

type SubscriptionFilter = "all" | "paid" | "free" | "past_due" | "canceled";

type UserProfile = {
  id: string;
  role: "talent" | "client" | "admin";
  display_name: string | null;
  is_suspended: boolean | null;
  avatar_url: string | null;
  avatar_path: string | null;
  email_verified: boolean | null;
  created_at: string;
  updated_at: string;
  subscription_status: "none" | "active" | "past_due" | "canceled";
  subscription_plan: string | null;
  subscription_current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

function talentSubscriptionListLabel(u: UserProfile): string {
  if (u.subscription_status === "active") {
    const plan =
      u.subscription_plan === "monthly"
        ? "Monthly"
        : u.subscription_plan === "annual"
          ? "Annual"
          : "Plan unset";
    return `Paid · ${plan}`;
  }
  if (u.subscription_status === "none") return "Free";
  if (u.subscription_status === "past_due") return "Past due";
  return "Canceled";
}

function matchesSubscriptionFilter(u: UserProfile, filter: SubscriptionFilter): boolean {
  if (filter === "all") return true;
  if (u.role !== "talent") return false;
  switch (filter) {
    case "paid":
      return u.subscription_status === "active";
    case "free":
      return u.subscription_status === "none";
    case "past_due":
      return u.subscription_status === "past_due";
    case "canceled":
      return u.subscription_status === "canceled";
    default:
      return true;
  }
}

interface AdminUsersClientProps {
  users: UserProfile[];
  user: User;
  loadError?: string | null;
}

export function AdminUsersClient({
  users: initialUsers,
  user,
  loadError = null,
}: AdminUsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>("all");
  const [subscriptionDetailUser, setSubscriptionDetailUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<UserProfile | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspendConfirmChecked, setSuspendConfirmChecked] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [reinstateDialogOpen, setReinstateDialogOpen] = useState(false);
  const [userToReinstate, setUserToReinstate] = useState<UserProfile | null>(null);
  const [isReinstating, setIsReinstating] = useState(false);
  const [reinstateConfirmChecked, setReinstateConfirmChecked] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const getUserDisplayName = (u: UserProfile) => {
    const talentName = u.talent_profiles
      ? `${u.talent_profiles.first_name ?? ""} ${u.talent_profiles.last_name ?? ""}`.trim()
      : "";

    return u.display_name || talentName || "No name";
  };

  const getUserInitial = (u: UserProfile) => {
    const name = getUserDisplayName(u);
    return name && name !== "No name" ? name.charAt(0).toUpperCase() : u.id.charAt(0).toUpperCase();
  };

  // Filter users based on search query and active tab
  const filteredUsers = useMemo(() => {
    let filtered: typeof users;

    if (activeTab === "suspended") {
      // Suspended tab: only users where is_suspended === true
      filtered = users.filter((u) => u.is_suspended === true);
    } else {
      // All other tabs: exclude suspended users by default
      filtered = users.filter((u) => u.is_suspended !== true);
      // Filter by role based on active tab
      if (activeTab === "talent") {
        filtered = filtered.filter((u) => u.role === "talent");
      } else if (activeTab === "career-builders") {
        filtered = filtered.filter((u) => u.role === "client");
      } else if (activeTab === "admins") {
        filtered = filtered.filter((u) => u.role === "admin");
      }
    }

    if (subscriptionFilter !== "all") {
      filtered = filtered.filter((u) => matchesSubscriptionFilter(u, subscriptionFilter));
    }

    // Filter by search query (within tab's dataset)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u) => {
        const displayName = getUserDisplayName(u).toLowerCase();
        const roleName = getRoleDisplayName(u.role).toLowerCase();

        return (
          displayName.includes(query) ||
          u.id.toLowerCase().includes(query) ||
          roleName.includes(query)
        );
      });
    }

    return filtered;
  }, [users, searchQuery, activeTab, subscriptionFilter]);

  // Group by role for stats (exclude suspended from active tab counts)
  const talentUsers = users.filter((u) => u.role === "talent" && u.is_suspended !== true);
  const careerBuilderUsers = users.filter((u) => u.role === "client" && u.is_suspended !== true);
  const adminUsers = users.filter((u) => u.role === "admin" && u.is_suspended !== true);
  const suspendedUsers = users.filter((u) => u.is_suspended === true);
  const activeAllCount = users.filter((u) => u.is_suspended !== true).length;

  const canShowHardDelete = (target: UserProfile) =>
    target.role === "talent" && target.id !== user.id;

  const canSuspendUser = (target: UserProfile) =>
    target.id !== user.id &&
    (target.role === "talent" || target.role === "client") &&
    target.is_suspended !== true;

  const canReinstateUser = (target: UserProfile) =>
    target.id !== user.id &&
    (target.role === "talent" || target.role === "client") &&
    target.is_suspended === true;

  const handleDeleteUser = async () => {
    if (!userToDelete || !deleteConfirmChecked) return;

    const userIdToDelete = userToDelete.id;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdToDelete }),
      });

      const data = (await response.json()) as { error?: string; message?: string; success?: boolean };
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: data.message || "User deleted successfully.",
        variant: "success",
      });

      setUsers((prevUsers) => prevUsers.filter((profile) => profile.id !== userIdToDelete));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setDeleteConfirmChecked(false);
      router.refresh();
    } catch (error) {
      logActionFailure("admin.users.delete", error, { userId: userIdToDelete });
      toast({
        title: "Couldn’t delete user",
        description: userSafeMessage(
          error,
          "We couldn’t complete delete. Try again, or suspend the user if the problem continues."
        ),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (userProfile: UserProfile) => {
    if (!canShowHardDelete(userProfile)) {
      let description = "Hard delete is only available for Talent accounts from this screen.";
      if (userProfile.id === user.id) {
        description = "Cannot delete your own account.";
      } else if (userProfile.role === "client") {
        description =
          "Hard delete is not available for Career Builder accounts. Use Suspend User instead.";
      } else if (userProfile.role === "admin") {
        description = "Cannot hard-delete admin accounts.";
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(userProfile);
    setDeleteConfirmChecked(false);
    setDeleteDialogOpen(true);
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend || !suspendConfirmChecked) return;

    const userIdToSuspend = userToSuspend.id;
    const reasonToSend = suspendReason.trim();

    setIsSuspending(true);
    try {
      const response = await fetch("/api/admin/set-user-suspension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdToSuspend,
          suspended: true,
          reason: reasonToSend || undefined,
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to suspend user");
      }

      toast({
        title: "Success",
        description: data.message || "User suspended successfully.",
        variant: "success",
      });

      setUsers((prevUsers) =>
        prevUsers.map((profile) =>
          profile.id === userIdToSuspend ? { ...profile, is_suspended: true } : profile
        )
      );
      setSuspendDialogOpen(false);
      setUserToSuspend(null);
      setSuspendConfirmChecked(false);
      setSuspendReason("");
      router.refresh();
    } catch (error) {
      logActionFailure("admin.users.suspend", error, { userId: userIdToSuspend });
      toast({
        title: "Couldn’t suspend user",
        description: userSafeMessage(error, "We couldn’t suspend this account. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSuspending(false);
    }
  };

  const handleReinstateUser = async () => {
    if (!userToReinstate || !reinstateConfirmChecked) return;

    const userIdToReinstate = userToReinstate.id;

    setIsReinstating(true);
    try {
      const response = await fetch("/api/admin/set-user-suspension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdToReinstate, suspended: false }),
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to reinstate user");
      }

      toast({
        title: "Success",
        description: data.message || "User reinstated successfully.",
        variant: "success",
      });

      setUsers((prevUsers) =>
        prevUsers.map((profile) =>
          profile.id === userIdToReinstate ? { ...profile, is_suspended: false } : profile
        )
      );
      setReinstateDialogOpen(false);
      setUserToReinstate(null);
      setReinstateConfirmChecked(false);
      router.refresh();
    } catch (error) {
      logActionFailure("admin.users.reinstate", error, { userId: userIdToReinstate });
      toast({
        title: "Couldn’t reinstate user",
        description: userSafeMessage(error, "We couldn’t reinstate this account. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsReinstating(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "talent" | "client") => {
    setIsUpdatingRole(userId);
    try {
      const response = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      toast({
        title: "Success",
        description: `User promoted to ${newRole === "talent" ? "Talent" : "Career Builder"}`,
        variant: "success",
      });
      
      // Update local state using functional update to avoid stale closure issues
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      
      router.refresh();
    } catch (error) {
      logActionFailure("admin.users.updateRole", error, { userId, newRole });
      toast({
        title: "Couldn’t update role",
        description: userSafeMessage(error, "We couldn’t update this user’s role. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const openSuspendDialog = (userProfile: UserProfile) => {
    if (!canSuspendUser(userProfile)) {
      toast({
        title: "Error",
        description:
          userProfile.id === user.id
            ? "Cannot suspend your own account."
            : "Suspend is only available for Talent and Career Builder accounts.",
        variant: "destructive",
      });
      return;
    }
    setUserToSuspend(userProfile);
    setSuspendReason("");
    setSuspendConfirmChecked(false);
    setSuspendDialogOpen(true);
  };

  const openReinstateDialog = (userProfile: UserProfile) => {
    if (!canReinstateUser(userProfile)) {
      toast({
        title: "Error",
        description:
          userProfile.id === user.id
            ? "Cannot reinstate your own account."
            : "Reinstate is only available for suspended Talent and Career Builder accounts.",
        variant: "destructive",
      });
      return;
    }
    setUserToReinstate(userProfile);
    setReinstateConfirmChecked(false);
    setReinstateDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-purple-400" />;
      case "client":
        return <Briefcase className="h-4 w-4 text-blue-400" />;
      case "talent":
        return <Users className="h-4 w-4 text-green-400" />;
      default:
        return <UserIcon className="h-4 w-4 text-[var(--oklch-text-tertiary)]" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
            Admin
          </Badge>
        );
      case "client":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            Career Builder
          </Badge>
        );
      case "talent":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            Talent
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getSuspensionBadge = (isSuspended?: boolean | null) => {
    if (!isSuspended) return null;

    return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/50">Suspended</Badge>;
  };

  const getCombinedBadges = (userId: string, role: string, isSuspended?: boolean | null) => (
    <div className="flex flex-wrap gap-2" data-testid={`mobile-user-badges-${userId}`}>
      {getRoleBadge(role)}
      {getSuspensionBadge(isSuspended)}
    </div>
  );

  const renderTalentSubscriptionBadge = (userProfile: UserProfile) => {
    if (userProfile.role !== "talent") {
      return (
        <span
          className="text-xs text-[var(--oklch-text-tertiary)]"
          data-testid={`user-subscription-${userProfile.id}`}
        >
          N/A
        </span>
      );
    }
    const label = talentSubscriptionListLabel(userProfile);
    return (
      <Badge
        variant="outline"
        className={cn(
          "status-chip max-w-[12rem] truncate border font-medium",
          getSubscriptionStatusColor(userProfile.subscription_status)
        )}
        data-testid={`user-subscription-${userProfile.id}`}
        title={label}
      >
        {label}
      </Badge>
    );
  };

  const renderUserActions = (userProfile: UserProfile) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-[var(--oklch-text-tertiary)] hover:bg-white/10 hover:text-white">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="panel-frosted border-border/50">
        {userProfile.role === "talent" && (
          <DropdownMenuItem asChild>
            <Link
              href={`/talent/${userProfile.id}`}
              className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Talent Profile
            </Link>
          </DropdownMenuItem>
        )}
        {userProfile.role === "talent" && (
          <DropdownMenuItem
            onClick={() => setSubscriptionDetailUser(userProfile)}
            className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription details
          </DropdownMenuItem>
        )}
        {userProfile.role === "client" && (
          <DropdownMenuItem asChild>
            <Link
              href={`/client/profile?userId=${userProfile.id}`}
              className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Career Builder Profile
            </Link>
          </DropdownMenuItem>
        )}
        {userProfile.role !== "talent" && (
          <DropdownMenuItem
            onClick={() => handleUpdateRole(userProfile.id, "talent")}
            disabled={isUpdatingRole === userProfile.id}
            className="flex items-center text-green-300 hover:bg-white/10"
          >
            {isUpdatingRole === userProfile.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="mr-2 h-4 w-4" />
            )}
            Promote to Talent
          </DropdownMenuItem>
        )}
        {canSuspendUser(userProfile) && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => openSuspendDialog(userProfile)}
              className="flex items-center text-amber-300 hover:bg-white/10"
            >
              <Shield className="mr-2 h-4 w-4" />
              Suspend User
            </DropdownMenuItem>
          </>
        )}
        {canReinstateUser(userProfile) && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => openReinstateDialog(userProfile)}
              className="flex items-center text-emerald-300 hover:bg-white/10"
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Reinstate User
            </DropdownMenuItem>
          </>
        )}
        {canShowHardDelete(userProfile) && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => openDeleteDialog(userProfile)}
              className="flex items-center text-rose-300 hover:bg-white/10 focus:text-rose-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderUsersContent = () => {
    if (!loadError && filteredUsers.length === 0) {
      return (
        <div className="text-center py-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
            <UserIcon className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Users Found</h3>
          <p className="mt-2 text-sm text-[var(--oklch-text-secondary)]">
            {searchQuery ? "Try adjusting your search query." : "No users have been created yet."}
          </p>
        </div>
      );
    }

    if (loadError && filteredUsers.length === 0) {
      return null;
    }

    return (
      <>
        <div className="space-y-3 md:hidden">
          {filteredUsers.map((userProfile) => (
            <MobileListRowCard
              key={`mobile-${userProfile.id}`}
              title={getUserDisplayName(userProfile)}
              subtitle={getRoleDisplayName(userProfile.role)}
              meta={[
                { label: "User ID", value: `${userProfile.id.slice(0, 8)}...` },
                {
                  label: "Email",
                  value: userProfile.email_verified ? "Verified" : "Unverified",
                },
                {
                  label: "Subscription",
                  value:
                    userProfile.role === "talent"
                      ? talentSubscriptionListLabel(userProfile)
                      : "N/A",
                },
                { label: "Joined", value: new Date(userProfile.created_at).toLocaleDateString() },
              ]}
              badge={getCombinedBadges(userProfile.id, userProfile.role, userProfile.is_suspended)}
              trailing={renderUserActions(userProfile)}
            />
          ))}
        </div>
        <DataTableShell className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-card/45 to-card/28">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Role
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]"
                  data-testid="columnheader-subscription"
                >
                  Subscription
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Email Verified
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  User ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredUsers.map((userProfile) => (
                <tr key={userProfile.id} className="hover:bg-card/22 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {getUserInitial(userProfile)}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">
                          {getUserDisplayName(userProfile)}
                        </div>
                        <div className="text-xs text-[var(--oklch-text-tertiary)]">{userProfile.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userProfile.role)}
                      {getRoleBadge(userProfile.role)}
                      {getSuspensionBadge(userProfile.is_suspended)}
                    </div>
                  </td>
                  <td className="py-4 px-6">{renderTalentSubscriptionBadge(userProfile)}</td>
                  <td className="py-4 px-6">
                    {userProfile.email_verified ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 text-sm">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">Unverified</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--oklch-text-tertiary)]">
                    <SafeDate date={userProfile.created_at} />
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-mono text-xs text-[var(--oklch-text-tertiary)]">{userProfile.id.slice(0, 8)}...</div>
                  </td>
                  <td className="py-4 px-6">{renderUserActions(userProfile)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </>
    );
  };

  return (
    <PageShell topPadding={false} fullBleed>
      <AdminHeader user={user} />

      <div className="container mx-auto space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        <PageHeader
          title="All Users"
          subtitle="View and manage all users on the platform."
          actions={
            <Button asChild className="gap-2 bg-purple-600 text-white hover:bg-purple-700">
              <Link href="/admin/users/create">
                <Plus className="h-4 w-4" />
                Create User
              </Link>
            </Button>
          }
        />

        {loadError ? (
          <Alert
            variant="destructive"
            className="border-rose-500/40 bg-rose-500/10 text-rose-100 [&>svg]:text-rose-200"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load users</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="md:hidden">
          <MobileSummaryRow
            items={[
              { label: "Talent", value: talentUsers.length, icon: Users },
              { label: "Career Builders", value: careerBuilderUsers.length, icon: Briefcase },
              { label: "Admins", value: adminUsers.length, icon: Shield },
              { label: "Suspended", value: suspendedUsers.length, icon: XCircle },
            ]}
          />
        </div>

        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-medium text-white">
            {talentUsers.length} Talent
          </div>
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-2 text-sm font-medium text-white">
            {careerBuilderUsers.length} Career Builders
          </div>
          <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-sm font-medium text-white">
            {adminUsers.length} Admins
          </div>
          <div className="rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-2 text-sm font-medium text-white">
            {suspendedUsers.length} Suspended
          </div>
        </div>

        {/* Users Section */}
        <div className="mb-8 overflow-hidden rounded-2xl panel-frosted card-backlit shadow-lg">
          <div className="border-b border-border/40 bg-gradient-to-r from-card/40 to-card/25 p-4 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <h2 className="text-2xl font-bold text-white">Users</h2>
              <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full sm:w-auto">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                      size={16}
                    />
                    <Input
                      placeholder="Search by name, ID, or role..."
                      className="w-full pl-9 sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div
                  className="flex flex-wrap gap-1.5 sm:justify-end"
                  role="group"
                  aria-label="Filter by subscription"
                >
                  {(
                    [
                      { id: "all" as const, label: "All" },
                      { id: "paid" as const, label: "Paid" },
                      { id: "free" as const, label: "Free" },
                      { id: "past_due" as const, label: "Past due" },
                      { id: "canceled" as const, label: "Canceled" },
                    ] as const
                  ).map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      size="sm"
                      variant={subscriptionFilter === opt.id ? "default" : "outline"}
                      className={cn(
                        "h-8 rounded-lg border px-2.5 text-xs",
                        subscriptionFilter === opt.id
                          ? "border-orange-500/50 bg-orange-500/20 text-orange-100 hover:bg-orange-500/30 hover:text-white"
                          : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                      )}
                      aria-pressed={subscriptionFilter === opt.id}
                      onClick={() => setSubscriptionFilter(opt.id)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} className="w-full space-y-4" onValueChange={setActiveTab}>
            <div className="border-b border-white/10 px-4 sm:px-6">
              <MobileTabRail edgeColorClassName="from-[rgba(6,8,18,0.98)]">
                <TabsList className="panel-frosted inline-flex h-auto min-w-max gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                  <TabsTrigger value="all" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    All ({activeAllCount})
                  </TabsTrigger>
                  <TabsTrigger value="talent" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    Talent ({talentUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="career-builders" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    Career Builders ({careerBuilderUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="admins" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    Admins ({adminUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="suspended" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    Suspended ({suspendedUsers.length})
                  </TabsTrigger>
                </TabsList>
              </MobileTabRail>
              <TabsList className="panel-frosted hidden h-12 border border-white/10 bg-white/5 md:grid md:grid-cols-5">
                <TabsTrigger
                  value="all"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  All ({activeAllCount})
                </TabsTrigger>
                <TabsTrigger
                  value="talent"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  Talent ({talentUsers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="career-builders"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  Career Builders ({careerBuilderUsers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="admins"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                >
                  Admins ({adminUsers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="suspended"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white"
                >
                  Suspended ({suspendedUsers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="p-0">
              {renderUsersContent()}
            </TabsContent>

            <TabsContent value="talent" className="p-0">
              {renderUsersContent()}
            </TabsContent>

            <TabsContent value="career-builders" className="p-0">
              {renderUsersContent()}
            </TabsContent>

            <TabsContent value="admins" className="p-0">
              {renderUsersContent()}
            </TabsContent>

            <TabsContent value="suspended" className="p-0">
              {renderUsersContent()}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Suspend User */}
      <Dialog
        open={suspendDialogOpen}
        onOpenChange={(open) => {
          if (!open && isSuspending) return;
          setSuspendDialogOpen(open);
          if (!open) {
            setUserToSuspend(null);
            setSuspendConfirmChecked(false);
            setSuspendReason("");
          }
        }}
      >
        <DialogContent className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-300">Suspend User</DialogTitle>
            <DialogDescription className="text-[var(--oklch-text-secondary)]">
              This suspends the account: the user will be signed out from protected areas and blocked
              from signing in or accessing the app until you reinstate them. They will see the
              standard suspended experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm text-[var(--oklch-text-secondary)]">
                Optional reason (shown on the suspended page):
              </p>
              <Input
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                placeholder="Policy violation, fraud risk, or internal note..."
                disabled={isSuspending}
              />
            </div>
            <div className="flex items-start gap-3 text-sm text-[var(--oklch-text-secondary)]">
              <Checkbox
                aria-label="Confirm suspend user account"
                checked={suspendConfirmChecked}
                onCheckedChange={(checked) => setSuspendConfirmChecked(checked === true)}
                disabled={isSuspending}
              />
              <span>I understand this will immediately block this account until reinstated.</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false);
                setUserToSuspend(null);
                setSuspendConfirmChecked(false);
                setSuspendReason("");
              }}
              disabled={isSuspending}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspendUser}
              disabled={isSuspending || !suspendConfirmChecked}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSuspending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Suspend User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reinstate User */}
      <Dialog
        open={reinstateDialogOpen}
        onOpenChange={(open) => {
          if (!open && isReinstating) return;
          setReinstateDialogOpen(open);
          if (!open) {
            setUserToReinstate(null);
            setReinstateConfirmChecked(false);
          }
        }}
      >
        <DialogContent className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle className="text-emerald-300">Reinstate User</DialogTitle>
            <DialogDescription className="text-[var(--oklch-text-secondary)]">
              This removes the suspension so the user can sign in and use the app again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 text-sm text-[var(--oklch-text-secondary)]">
              <Checkbox
                aria-label="Confirm reinstate user account"
                checked={reinstateConfirmChecked}
                onCheckedChange={(checked) => setReinstateConfirmChecked(checked === true)}
                disabled={isReinstating}
              />
              <span>I understand this will restore access for this account.</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReinstateDialogOpen(false);
                setUserToReinstate(null);
                setReinstateConfirmChecked(false);
              }}
              disabled={isReinstating}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReinstateUser}
              disabled={isReinstating || !reinstateConfirmChecked}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isReinstating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reinstating...
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reinstate User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && isDeleting) return;
          setDeleteDialogOpen(open);
          if (!open) {
            setUserToDelete(null);
            setDeleteConfirmChecked(false);
          }
        }}
      >
        <DialogContent className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle className="text-rose-300">Delete user permanently?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-[var(--oklch-text-secondary)]">
                <p>
                  This permanently deletes the account and signs the user out everywhere. Related
                  application data may be removed automatically by the database (cascades). This
                  cannot be undone.
                </p>
                {userToDelete ? (
                  <p className="text-sm font-medium text-white">
                    {getUserDisplayName(userToDelete)}
                    <span className="ml-2 font-mono text-xs font-normal text-[var(--oklch-text-tertiary)]">
                      ({userToDelete.id.slice(0, 8)}…)
                    </span>
                  </p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 text-sm text-[var(--oklch-text-secondary)]">
              <Checkbox
                aria-label="Confirm permanent deletion of this user account"
                checked={deleteConfirmChecked}
                onCheckedChange={(checked) => setDeleteConfirmChecked(checked === true)}
                disabled={isDeleting}
              />
              <span>
                I understand this is a hard delete, it cannot be undone, and I am deleting the
                correct user.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
                setDeleteConfirmChecked(false);
              }}
              disabled={isDeleting}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting || !deleteConfirmChecked}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={subscriptionDetailUser !== null}
        onOpenChange={(open) => {
          if (!open) setSubscriptionDetailUser(null);
        }}
      >
        <DialogContent className="panel-frosted max-h-[85vh] overflow-y-auto border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-orange-400" />
              Subscription details
            </DialogTitle>
            <DialogDescription className="text-[var(--oklch-text-secondary)]">
              {subscriptionDetailUser ? (
                <>
                  Talent account:{" "}
                  <span className="font-medium text-white">{getUserDisplayName(subscriptionDetailUser)}</span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {subscriptionDetailUser ? (
            <dl className="space-y-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-[var(--oklch-text-tertiary)]">Plan</dt>
                <dd className="font-medium text-white">{getPlanDisplayName(subscriptionDetailUser.subscription_plan)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[var(--oklch-text-tertiary)]">Status</dt>
                <dd className="font-medium text-white">
                  {getSubscriptionStatusText(subscriptionDetailUser.subscription_status)}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[var(--oklch-text-tertiary)]">Billing interval</dt>
                <dd className="font-medium text-white">
                  {subscriptionDetailUser.subscription_plan === "monthly"
                    ? "Monthly"
                    : subscriptionDetailUser.subscription_plan === "annual"
                      ? "Annual"
                      : subscriptionDetailUser.subscription_plan
                        ? subscriptionDetailUser.subscription_plan
                        : "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[var(--oklch-text-tertiary)]">Current period ends</dt>
                <dd className="font-medium text-white">
                  {subscriptionDetailUser.subscription_current_period_end ? (
                    <SafeDate date={subscriptionDetailUser.subscription_current_period_end} />
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {subscriptionDetailUser.stripe_customer_id ? (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[var(--oklch-text-tertiary)]">Stripe customer ID</dt>
                  <dd className="break-all font-mono text-xs text-[var(--oklch-text-secondary)]">
                    {subscriptionDetailUser.stripe_customer_id}
                  </dd>
                </div>
              ) : null}
              {subscriptionDetailUser.stripe_subscription_id ? (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[var(--oklch-text-tertiary)]">Stripe subscription ID</dt>
                  <dd className="break-all font-mono text-xs text-[var(--oklch-text-secondary)]">
                    {subscriptionDetailUser.stripe_subscription_id}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubscriptionDetailUser(null)}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

