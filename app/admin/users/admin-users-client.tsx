"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  Filter,
  User as UserIcon,
  Shield,
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { SafeDate } from "@/components/safe-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { createNameSlug } from "@/lib/utils/slug";
import { logger } from "@/lib/utils/logger";

type UserProfile = {
  id: string;
  role: "talent" | "client" | "admin";
  display_name: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  email_verified: boolean | null;
  created_at: string;
  updated_at: string;
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

interface AdminUsersClientProps {
  users: UserProfile[];
  user: User;
}

export function AdminUsersClient({ users: initialUsers, user }: AdminUsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState(initialUsers);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  // Filter users based on search query and active tab
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role based on active tab
    if (activeTab === "talent") {
      filtered = filtered.filter((u) => u.role === "talent");
    } else if (activeTab === "career-builders") {
      filtered = filtered.filter((u) => u.role === "client");
    } else if (activeTab === "admins") {
      filtered = filtered.filter((u) => u.role === "admin");
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query) ||
          getRoleDisplayName(u.role).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, searchQuery, activeTab]);

  // Group by role for stats
  const talentUsers = users.filter((u) => u.role === "talent");
  const careerBuilderUsers = users.filter((u) => u.role === "client");
  const adminUsers = users.filter((u) => u.role === "admin");

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    // Capture the user ID at the start to avoid stale closure issues
    // if another delete operation starts while this one is in flight
    const userIdToDelete = userToDelete.id;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdToDelete }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully. All related data has been removed.",
        variant: "success",
      });
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userIdToDelete));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      router.refresh();
    } catch (error) {
      logger.error("Error deleting user", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
      logger.error("Error updating user role", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const openDeleteDialog = (userProfile: UserProfile) => {
    // Prevent deleting yourself
    if (userProfile.id === user.id) {
      toast({
        title: "Error",
        description: "Cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(userProfile);
    setDeleteDialogOpen(true);
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
        return <UserIcon className="h-4 w-4 text-gray-400" />;
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

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen">
      <AdminHeader user={user} notificationCount={3} />

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Dashboard Header */}
        <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-1 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              All Users
            </h1>
            <p className="text-sm text-gray-400 sm:text-base">View and manage all users on the platform</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 md:mt-0">
            <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-medium text-white">
              {talentUsers.length} Talent
            </div>
            <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-2 text-sm font-medium text-white">
              {careerBuilderUsers.length} Career Builders
            </div>
            <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-sm font-medium text-white">
              {adminUsers.length} Admins
            </div>
            <Button
              asChild
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              <Link href="/admin/users/create">
                <Plus className="h-4 w-4" />
                Create User
              </Link>
            </Button>
          </div>
        </div>

        {/* Users Section */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/50 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-700/80 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Users</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search by name, ID, or role..."
                    className="pl-9 w-full md:w-60 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter size={16} />
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <div className="border-b border-gray-700 px-4 sm:px-6">
              <TabsList className="h-12 bg-gray-700/50 border border-gray-600">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  All ({users.length})
                </TabsTrigger>
                <TabsTrigger
                  value="talent"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Talent ({talentUsers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="career-builders"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Career Builders ({careerBuilderUsers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="admins"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Admins ({adminUsers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <UserIcon className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Users Found</h3>
                  <p className="text-gray-400 text-lg">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "No users have been created yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Role
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Email Verified
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Joined
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((userProfile) => (
                        <tr key={userProfile.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {userProfile.display_name?.charAt(0).toUpperCase() || userProfile.id.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {userProfile.display_name || "No name"}
                                </div>
                                <div className="text-gray-400 text-xs">{userProfile.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {getRoleIcon(userProfile.role)}
                              {getRoleBadge(userProfile.role)}
                            </div>
                          </td>
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
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            <SafeDate date={userProfile.created_at} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-mono text-xs text-gray-400">{userProfile.id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                {userProfile.role === "talent" && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={userProfile.talent_profiles
                                        ? `/talent/${createNameSlug(userProfile.talent_profiles.first_name, userProfile.talent_profiles.last_name)}`
                                        : `/talent/${userProfile.id}`}
                                      className="text-gray-300 hover:bg-gray-700 flex items-center"
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Talent Profile
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {userProfile.role === "client" && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/client/profile?userId=${userProfile.id}`}
                                      className="text-gray-300 hover:bg-gray-700 flex items-center"
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
                                    className="text-green-400 hover:bg-gray-700 flex items-center"
                                  >
                                    {isUpdatingRole === userProfile.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                    )}
                                    Promote to Talent
                                  </DropdownMenuItem>
                                )}
                                {userProfile.id !== user.id && (
                                  <>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialog(userProfile)}
                                      className="text-red-400 hover:bg-gray-700 flex items-center"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="talent" className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Users className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Talent Users</h3>
                  <p className="text-gray-400 text-lg">There are currently no talent users.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Role
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Email Verified
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Joined
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((userProfile) => (
                        <tr key={userProfile.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {userProfile.display_name?.charAt(0).toUpperCase() || userProfile.id.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {userProfile.display_name || "No name"}
                                </div>
                                <div className="text-gray-400 text-xs">{userProfile.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {getRoleBadge(userProfile.role)}
                          </td>
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
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            <SafeDate date={userProfile.created_at} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-mono text-xs text-gray-400">{userProfile.id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={
                                      userProfile.talent_profiles
                                        ? `/talent/${createNameSlug(userProfile.talent_profiles.first_name, userProfile.talent_profiles.last_name)}`
                                        : `/talent/${userProfile.id}`
                                    }
                                    className="text-gray-300 hover:bg-gray-700 flex items-center"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Talent Profile
                                  </Link>
                                </DropdownMenuItem>
                                {userProfile.role !== "client" && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href="/admin/client-applications"
                                      className="text-blue-400 hover:bg-gray-700 flex items-center"
                                    >
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                      Review Career Builder Applications
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {userProfile.id !== user.id && (
                                  <>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialog(userProfile)}
                                      className="text-red-400 hover:bg-gray-700 flex items-center"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="career-builders" className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Briefcase className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Career Builder Users</h3>
                  <p className="text-gray-400 text-lg">There are currently no Career Builder users.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Role
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Email Verified
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Joined
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((userProfile) => (
                        <tr key={userProfile.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {userProfile.display_name?.charAt(0).toUpperCase() || userProfile.id.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {userProfile.display_name || "No name"}
                                </div>
                                <div className="text-gray-400 text-xs">{userProfile.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {getRoleBadge(userProfile.role)}
                          </td>
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
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            <SafeDate date={userProfile.created_at} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-mono text-xs text-gray-400">{userProfile.id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/client/profile`}
                                    className="text-gray-300 hover:bg-gray-700 flex items-center"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Career Builder Profile
                                  </Link>
                                </DropdownMenuItem>
                                {userProfile.role !== "talent" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateRole(userProfile.id, "talent")}
                                    disabled={isUpdatingRole === userProfile.id}
                                    className="text-green-400 hover:bg-gray-700 flex items-center"
                                  >
                                    {isUpdatingRole === userProfile.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                    )}
                                    Promote to Talent
                                  </DropdownMenuItem>
                                )}
                                {userProfile.id !== user.id && (
                                  <>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialog(userProfile)}
                                      className="text-red-400 hover:bg-gray-700 flex items-center"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="admins" className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Shield className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Admin Users</h3>
                  <p className="text-gray-400 text-lg">There are currently no admin users.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Role
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Email Verified
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Joined
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          User ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((userProfile) => (
                        <tr key={userProfile.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {userProfile.display_name?.charAt(0).toUpperCase() || userProfile.id.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {userProfile.display_name || "No name"}
                                </div>
                                <div className="text-gray-400 text-xs">{userProfile.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {getRoleBadge(userProfile.role)}
                          </td>
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
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            <SafeDate date={userProfile.created_at} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-mono text-xs text-gray-400">{userProfile.id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                                  <Shield className="mr-2 h-4 w-4" />
                                  Admin Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this user? This action cannot be undone.
              <br />
              <br />
              <strong className="text-white">
                All related data will be permanently deleted:
              </strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>User profile and account</li>
                <li>All applications</li>
                <li>All bookings</li>
                <li>Portfolio items</li>
                <li>Gigs (if Career Builder)</li>
                <li>All other related data</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={isDeleting}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
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
    </div>
  );
}

