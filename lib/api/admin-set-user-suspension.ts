import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

type SupabaseLikeError = { message?: string };

function isMissingSuspensionReasonColumnError(error: SupabaseLikeError): boolean {
  const message = String(error?.message ?? "");
  return /column/i.test(message) && /suspension_reason/i.test(message);
}

export type AdminSetUserSuspensionInput = {
  userId: string;
  suspended: boolean;
  reason?: string;
};

/**
 * Admin-only: set profiles.is_suspended for Talent or Career Builder (client) accounts.
 * Does not support admin targets. Blocks acting on the requester's own account.
 */
export async function handleAdminSetUserSuspension(
  input: AdminSetUserSuspensionInput
): Promise<NextResponse> {
  const userId = input.userId.trim();
  const wantSuspend = input.suspended;
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: requesterProfile, error: requesterError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (requesterError) {
    return NextResponse.json({ error: "Failed to verify admin permissions" }, { status: 500 });
  }

  if (!requesterProfile || requesterProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  if (userId === user.id) {
    return NextResponse.json(
      { error: "Cannot suspend or reinstate your own account" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, is_suspended")
    .eq("id", userId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: "Failed to load target profile" }, { status: 500 });
  }

  if (!targetProfile) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  if (targetProfile.role === "admin") {
    return NextResponse.json(
      { error: "Suspension is not available for admin accounts" },
      { status: 400 }
    );
  }

  if (targetProfile.role !== "talent" && targetProfile.role !== "client") {
    return NextResponse.json(
      { error: "Suspension is only available for Talent and Career Builder accounts" },
      { status: 400 }
    );
  }

  if (wantSuspend) {
    if (targetProfile.is_suspended) {
      return NextResponse.json({
        success: true,
        message: "Account is already suspended.",
      });
    }

    const payload: Record<string, unknown> = { is_suspended: true };
    if (reason) {
      payload.suspension_reason = reason;
    }

    let { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(payload)
      .eq("id", userId);

    if (updateError && reason && isMissingSuspensionReasonColumnError(updateError as SupabaseLikeError)) {
      const retry = await supabaseAdmin.from("profiles").update({ is_suspended: true }).eq("id", userId);
      updateError = retry.error;
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    logger.info("[AdminSetUserSuspension] Suspended user", {
      actor_id: user.id,
      target_user_id: userId,
    });

    return NextResponse.json({
      success: true,
      message: "User suspended successfully.",
    });
  }

  // Reinstate
  if (!targetProfile.is_suspended) {
    return NextResponse.json({
      success: true,
      message: "Account is already active.",
    });
  }

  const { error: reinstateError } = await supabaseAdmin
    .from("profiles")
    .update({
      is_suspended: false,
      suspension_reason: null,
    })
    .eq("id", userId);

  if (reinstateError) {
    return NextResponse.json({ error: reinstateError.message }, { status: 500 });
  }

  logger.info("[AdminSetUserSuspension] Reinstated user", {
    actor_id: user.id,
    target_user_id: userId,
  });

  return NextResponse.json({
    success: true,
    message: "User reinstated successfully.",
  });
}
