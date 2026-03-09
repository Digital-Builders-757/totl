import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

type SupabaseLikeError = { message?: string };

function isMissingSuspensionReasonColumnError(error: SupabaseLikeError): boolean {
  const message = String(error?.message ?? "");
  return /column/i.test(message) && /suspension_reason/i.test(message);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId?: string; reason?: string };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

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
      return NextResponse.json({ error: "Cannot disable your own account" }, { status: 400 });
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

    // Career Builder target = profiles.role === "client" only.
    if (targetProfile.role !== "client") {
      return NextResponse.json(
        { error: "Disable is only available for Career Builder (client) accounts" },
        { status: 400 }
      );
    }

    if (targetProfile.is_suspended) {
      return NextResponse.json({
        success: true,
        message: "Career Builder account is already disabled.",
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

    // Be schema-tolerant: if suspension_reason is absent, retry with is_suspended only.
    if (updateError && reason && isMissingSuspensionReasonColumnError(updateError as SupabaseLikeError)) {
      const retry = await supabaseAdmin.from("profiles").update({ is_suspended: true }).eq("id", userId);
      updateError = retry.error;
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    logger.info("[AdminDisableUser] Disabled Career Builder account", {
      disabled_by: user.id,
      disabled_user_id: userId,
    });

    return NextResponse.json({
      success: true,
      message: "Career Builder account disabled successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
