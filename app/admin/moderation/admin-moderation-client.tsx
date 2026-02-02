"use client";

import type { User } from "@supabase/supabase-js";
import { BadgeCheck, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { updateContentFlagAction } from "@/lib/actions/moderation-actions";
import type { ContentFlagRow, FlagStatus, FlagResourceType } from "@/lib/types/moderation";
import type { Database } from "@/types/supabase";

type FlagRecord = ContentFlagRow & {
  reporter: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
  assigned_admin: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
  gig: (Pick<
    Database["public"]["Tables"]["gigs"]["Row"],
    "id" | "title" | "status" | "location" | "compensation" | "category" | "client_id"
  > & {
    client_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
  }) | null;
  target_profile:
    | (Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name" | "role"> & {
        is_suspended?: boolean | null;
        suspension_reason?: string | null;
      })
    | null;
};

const STATUS_META: Record<FlagStatus, { label: string; badgeClass: string }> = {
  open: { label: "Open", badgeClass: "bg-red-500/15 text-red-400 border-red-500/30" },
  in_review: { label: "In Review", badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  resolved: { label: "Resolved", badgeClass: "bg-green-500/15 text-green-400 border-green-500/30" },
  dismissed: { label: "Dismissed", badgeClass: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

const RESOURCE_META: Record<FlagResourceType, { label: string; badgeClass: string }> = {
  gig: { label: "Gig", badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  talent_profile: { label: "Talent Profile", badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  client_profile: { label: "Career Builder", badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  application: { label: "Application", badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  booking: { label: "Booking", badgeClass: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
};

type AdminModerationClientProps = {
  flags: FlagRecord[];
  user: User;
  notice?: string;
};

export function AdminModerationClient({ flags, user, notice }: AdminModerationClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | FlagStatus>("open");
  const [selectedFlag, setSelectedFlag] = useState<FlagRecord | null>(null);
  const [statusValue, setStatusValue] = useState<FlagStatus>("open");
  const [adminNotes, setAdminNotes] = useState("");
  const [closeGig, setCloseGig] = useState(false);
  const [suspendAccount, setSuspendAccount] = useState(false);
  const [reinstateAccount, setReinstateAccount] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedFlag) {
      setStatusValue(selectedFlag.status);
      setAdminNotes(selectedFlag.admin_notes || "");
      setCloseGig(false);
      setSuspendAccount(false);
      setReinstateAccount(false);
      setSuspensionReason("");
    }
  }, [selectedFlag]);

  const stats = useMemo(() => {
    return flags.reduce(
      (acc, flag) => {
        acc.total += 1;
        acc.byStatus[flag.status] = (acc.byStatus[flag.status] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        byStatus: {
          open: 0,
          in_review: 0,
          resolved: 0,
          dismissed: 0,
        } as Record<FlagStatus, number>,
      }
    );
  }, [flags]);

  const filteredFlags = useMemo(() => {
    if (activeTab === "all") return flags;
    return flags.filter((flag) => flag.status === activeTab);
  }, [flags, activeTab]);

  const handleUpdateFlag = () => {
    if (!selectedFlag) return;

    startTransition(async () => {
      const result = await updateContentFlagAction({
        flagId: selectedFlag.id,
        status: statusValue,
        adminNotes,
        closeGig,
        suspendAccount,
        reinstateAccount,
        suspensionReason,
      });

      if (result.error) {
        toast({
          title: "Unable to update moderation record",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Moderation updated",
        description: "The report has been updated.",
      });
      setSelectedFlag(null);
    });
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen">
      <AdminHeader user={user} notificationCount={stats.byStatus.open} />
      <div className="container mx-auto px-4 py-8">
        {notice && (
          <Card className="mb-6 border-amber-500/40 bg-amber-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-100">Moderation not configured</CardTitle>
              <CardDescription className="text-amber-200/80">{notice}</CardDescription>
            </CardHeader>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-gray-800/40 border-gray-700">
            <CardHeader className="pb-2">
              <CardDescription>Total Reports</CardDescription>
              <CardTitle className="text-3xl text-white">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-red-950/30 border-red-900/50">
            <CardHeader className="pb-2">
              <CardDescription>Open</CardDescription>
              <CardTitle className="text-3xl text-red-200">{stats.byStatus.open}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-amber-900/30 border-amber-900/40">
            <CardHeader className="pb-2">
              <CardDescription>In Review</CardDescription>
              <CardTitle className="text-3xl text-amber-100">{stats.byStatus.in_review}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-emerald-900/30 border-emerald-900/40">
            <CardHeader className="pb-2">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-3xl text-emerald-100">{stats.byStatus.resolved}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-white">Moderation Queue</CardTitle>
                <CardDescription>Review reported gigs and take action</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "open", "in_review", "resolved", "dismissed"] as const).map((key) => {
                  const count = key === "all" ? stats.total : stats.byStatus[key as FlagStatus];
                  return (
                    <Button
                      key={key}
                      variant={activeTab === key ? "default" : "outline"}
                      className={
                        activeTab === key
                          ? "bg-white text-black"
                          : "border-gray-600 text-gray-300 hover:text-white"
                      }
                      onClick={() => setActiveTab(key)}
                    >
                      {key === "all" ? "All" : STATUS_META[key as FlagStatus].label}
                      {` (${count})`}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredFlags.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No reports in this bucket.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                        Resource
                      </th>
                      <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                        Reporter
                      </th>
                      <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                        Reason
                      </th>
                      <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                        Created
                      </th>
                      <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredFlags.map((flag) => (
                      <tr key={flag.id} className="hover:bg-gray-800/60 text-sm text-gray-200">
                        <td className="py-4 px-6">
                          <div className="font-medium">
                            {flag.gig?.title ??
                              flag.target_profile?.display_name ??
                              `${flag.resource_type} ${flag.resource_id}`}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                            <Badge className={`border ${RESOURCE_META[flag.resource_type].badgeClass}`}>
                              {RESOURCE_META[flag.resource_type].label}
                            </Badge>
                            {flag.gig?.location && <span className="text-gray-400">{flag.gig.location}</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {flag.reporter?.display_name || "Unknown"}
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <div className="line-clamp-2">{flag.reason}</div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`border ${STATUS_META[flag.status].badgeClass}`}>
                            {STATUS_META[flag.status].label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          {new Date(flag.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-200 hover:text-white"
                            onClick={() => setSelectedFlag(flag)}
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedFlag} onOpenChange={(open) => !open && setSelectedFlag(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFlag && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Review Report
                </DialogTitle>
                <DialogDescription>
                  Submitted {new Date(selectedFlag.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6">
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Reason</p>
                  <p className="text-gray-900 font-medium">{selectedFlag.reason}</p>
                  {selectedFlag.details && (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                      {selectedFlag.details}
                    </p>
                  )}
                </div>

                {selectedFlag.gig && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Gig</p>
                    <p className="font-semibold text-gray-900">{selectedFlag.gig.title}</p>
                    <p className="text-sm text-gray-600">{selectedFlag.gig.location}</p>
                    <p className="text-sm text-gray-600">
                      Client: {selectedFlag.gig.client_profile?.display_name || "N/A"}
                    </p>
                  </div>
                )}

                {selectedFlag.target_profile && (
                  <div className="rounded-xl border border-gray-200 p-4 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Account</p>
                    <p className="font-semibold text-gray-900">
                      {selectedFlag.target_profile.display_name || "Unknown user"}
                    </p>
                    <p className="text-sm text-gray-600">Role: {selectedFlag.target_profile.role || "N/A"}</p>
                    {selectedFlag.target_profile.is_suspended && (
                      <p className="text-sm text-rose-600">
                        Currently suspended
                        {selectedFlag.target_profile.suspension_reason
                          ? ` • ${selectedFlag.target_profile.suspension_reason}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Status</Label>
                    <Select value={statusValue} onValueChange={(value) => setStatusValue(value as typeof statusValue)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_META).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assigned Moderator</Label>
                    <Input value={user.email || selectedFlag.assigned_admin?.display_name || ""} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    rows={4}
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    placeholder="Document your investigation, applied policies, and next steps."
                  />
                </div>

                {(selectedFlag.gig || selectedFlag.target_profile) && (
                  <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                    <Label className="text-sm font-semibold text-gray-800">Automations</Label>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Close this gig</p>
                        <p className="text-sm text-gray-600">
                          Sets gig status to closed and removes it from listings.
                        </p>
                      </div>
                      <Switch checked={closeGig} onCheckedChange={setCloseGig} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Suspend account</p>
                        <p className="text-sm text-gray-600">
                          Prevents the account from signing in until reinstated.
                        </p>
                      </div>
                      <Switch
                        checked={suspendAccount}
                        onCheckedChange={(checked) => {
                          setSuspendAccount(checked);
                          if (checked) {
                            setReinstateAccount(false);
                          }
                        }}
                        disabled={!selectedFlag.target_profile && !selectedFlag.gig}
                      />
                    </div>
                    {suspendAccount && (
                      <div className="space-y-2">
                        <Label>Suspension reason</Label>
                        <Textarea
                          rows={3}
                          value={suspensionReason}
                          onChange={(event) => setSuspensionReason(event.target.value)}
                          placeholder="Explain why the account is suspended. This is visible to the user."
                        />
                      </div>
                    )}
                    {selectedFlag.target_profile?.is_suspended && (
                      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                        <div>
                          <p className="font-medium text-gray-900">Reinstate account</p>
                          <p className="text-sm text-gray-600">Lift the current suspension immediately.</p>
                        </div>
                        <Switch
                          checked={reinstateAccount}
                          onCheckedChange={(checked) => {
                            setReinstateAccount(checked);
                            if (checked) {
                              setSuspendAccount(false);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {STATUS_META[selectedFlag.status].label}
                  {selectedFlag.status === "resolved" && <BadgeCheck className="h-4 w-4 text-green-500" />}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedFlag(null)} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateFlag} disabled={isPending}>
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

