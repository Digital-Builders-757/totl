"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import type { FlagResourceType, FlagStatus, ModerationDatabase } from "@/lib/types/moderation";

type FlagContentArgs = {
  resourceType: FlagResourceType;
  resourceId: string;
  gigId?: string | null;
  reason: string;
  details?: string;
};

async function flagContentAction({ resourceType, resourceId, gigId, reason, details }: FlagContentArgs) {
  const supabase = await createSupabaseServer();
  const typedSupabase = supabase as SupabaseClient<ModerationDatabase>;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You need to be signed in to report gigs." };
  }

  if (!resourceId || !reason?.trim()) {
    return { error: "Resource and reason are required." };
  }

  const payload = {
    resource_type: resourceType,
    resource_id: resourceId,
    gig_id: gigId ?? null,
    reporter_id: user.id,
    reason: reason.trim(),
    details: details?.trim() || null,
  };

  const { error } = await typedSupabase.from("content_flags").insert(payload);

  if (error) {
    console.error("Error submitting content flag:", error);
    return { error: "Unable to submit report right now. Please try again." };
  }

  return { success: true };
}

type FlagGigArgs = {
  gigId: string;
  reason: string;
  details?: string;
};

export async function flagGigAction({ gigId, reason, details }: FlagGigArgs) {
  return flagContentAction({
    resourceType: "gig",
    resourceId: gigId,
    gigId,
    reason,
    details,
  });
}

type FlagProfileArgs = {
  profileId: string;
  reason: string;
  details?: string;
  profileType: "talent_profile" | "client_profile";
};

export async function flagProfileAction({ profileId, reason, details, profileType }: FlagProfileArgs) {
  return flagContentAction({
    resourceType: profileType,
    resourceId: profileId,
    reason,
    details,
  });
}

type UpdateFlagArgs = {
  flagId: string;
  status: FlagStatus;
  adminNotes?: string;
  closeGig?: boolean;
  suspendAccount?: boolean;
  reinstateAccount?: boolean;
  suspensionReason?: string;
};

export async function updateContentFlagAction({
  flagId,
  status,
  adminNotes,
  closeGig,
  suspendAccount,
  reinstateAccount,
  suspensionReason,
}: UpdateFlagArgs) {
  const supabase = await createSupabaseServer();
  const typedSupabase = supabase as SupabaseClient<ModerationDatabase>;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { error: "Not authorized." };
  }

  const { data: flagRecord, error: flagError } = await typedSupabase
    .from("content_flags")
    .select("id, resource_type, resource_id, gig_id, reporter_id, assigned_admin_id")
    .eq("id", flagId)
    .maybeSingle();

  if (flagError || !flagRecord) {
    return { error: "Flag not found." };
  }

  const isResolved = status === "resolved" || status === "dismissed";

  const { error: updateError } = await typedSupabase
    .from("content_flags")
    .update({
      status,
      admin_notes: adminNotes?.trim() || null,
      assigned_admin_id: user.id,
      resolved_at: isResolved ? new Date().toISOString() : null,
      resolution_action:
        closeGig && suspendAccount
          ? "close_gig_and_suspend_user"
          : closeGig
            ? "close_gig"
            : suspendAccount
              ? "suspend_user"
              : null,
    })
    .eq("id", flagId);

  if (updateError) {
    console.error("Error updating content flag:", updateError);
    return { error: "Failed to update moderation record." };
  }

  const adminClient = createSupabaseAdminClient();

  if (closeGig && flagRecord.gig_id) {
    const { error: gigError } = await adminClient
      .from("gigs")
      .update({ status: "closed" })
      .eq("id", flagRecord.gig_id);

    if (gigError) {
      console.error("Error closing gig:", gigError);
      return { error: "Flag updated but failed to close gig." };
    }
  }

  let targetProfileId: string | null = null;
  if (flagRecord.resource_type === "talent_profile" || flagRecord.resource_type === "client_profile") {
    targetProfileId = flagRecord.resource_id;
  } else if (flagRecord.resource_type === "gig" && flagRecord.gig_id) {
    const { data: gigOwner } = await adminClient
      .from("gigs")
      .select("client_id")
      .eq("id", flagRecord.gig_id)
      .maybeSingle();
    targetProfileId = gigOwner?.client_id || null;
  }

  if (reinstateAccount && targetProfileId) {
    const { error: reinstateError } = await adminClient
      .from("profiles")
      .update(
        {
          is_suspended: false,
          suspension_reason: null,
        } as Record<string, unknown>
      )
      .eq("id", targetProfileId);

    if (reinstateError) {
      console.error("Error reinstating account:", reinstateError);
      return { error: "Flag updated but failed to reinstate user." };
    }
  }

  if (suspendAccount && targetProfileId) {
    const { error: suspendError } = await adminClient
      .from("profiles")
      .update(
        {
          is_suspended: true,
          suspension_reason: suspensionReason?.trim() || "Account suspended by moderator",
        } as Record<string, unknown>
      )
      .eq("id", targetProfileId);

    if (suspendError) {
      console.error("Error suspending account:", suspendError);
      return { error: "Flag updated but failed to suspend user." };
    }
  } else if (suspendAccount && !targetProfileId) {
    return { error: "Unable to find a related account to suspend." };
  }

  revalidatePath("/admin/moderation");
  return { success: true };
}

