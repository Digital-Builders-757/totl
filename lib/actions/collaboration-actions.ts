"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { insertNotification } from "@/lib/actions/notification-actions";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import { isValidUuid } from "@/lib/validation/is-uuid";

type CollaborationActionResult =
  | { ok: true; alreadyRequested: boolean }
  | { ok: false; error: string };

function collaborationReferenceId(senderId: string, recipientId: string): string {
  const hash = createHash("sha1").update(`${senderId}:${recipientId}`).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function displayNameForProfile(profile: { id: string; display_name: string | null } | null): string {
  const trimmed = profile?.display_name?.trim();
  if (trimmed) return trimmed;
  if (!profile?.id) return "A member";
  return `Member ${profile.id.slice(0, 8)}`;
}

export async function sendCollaborationRequestAction(recipientId: string): Promise<CollaborationActionResult> {
  if (!isValidUuid(recipientId)) {
    return { ok: false, error: "This member could not be found." };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "You must be signed in to send a collaboration request." };
  }

  if (user.id === recipientId) {
    return { ok: false, error: "You cannot send a collaboration request to yourself." };
  }

  const { data: pairProfiles, error: pairError } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_suspended")
    .in("id", [user.id, recipientId]);

  if (pairError) {
    logger.error("[collaboration] Failed to load profiles", pairError, { senderId: user.id, recipientId });
    return { ok: false, error: "We could not verify this request right now. Please try again." };
  }

  const senderProfile = (pairProfiles ?? []).find((p) => p.id === user.id) ?? null;
  const recipientProfile = (pairProfiles ?? []).find((p) => p.id === recipientId) ?? null;

  if (!senderProfile || senderProfile.is_suspended) {
    return { ok: false, error: "Your account is not eligible to send collaboration requests." };
  }

  if (!recipientProfile || recipientProfile.is_suspended) {
    return { ok: false, error: "This member is not available for collaboration requests." };
  }

  const referenceId = collaborationReferenceId(user.id, recipientId);
  const senderLabel = displayNameForProfile(senderProfile);
  const recipientLabel = displayNameForProfile(recipientProfile);

  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("user_notifications")
    .select("id")
    .eq("recipient_id", recipientId)
    .eq("type", "collaboration_request" as never)
    .eq("reference_id", referenceId)
    .maybeSingle();

  if (existingRequestError) {
    logger.error("[collaboration] Failed to check existing request", existingRequestError, {
      senderId: user.id,
      recipientId,
      referenceId,
    });
  } else if (existingRequest) {
    return { ok: true, alreadyRequested: true };
  }

  const recipientInsert = await insertNotification({
    recipientId,
    type: "collaboration_request",
    referenceId,
    title: "New collaboration request",
    body: `${senderLabel} wants to collaborate with you on a future project.`,
  });

  if ("error" in recipientInsert && recipientInsert.error) {
    return { ok: false, error: recipientInsert.error };
  }

  const { data: admins, error: adminsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (adminsError) {
    logger.error("[collaboration] Failed to load admins", adminsError, { senderId: user.id, recipientId });
  } else if (admins?.length) {
    await Promise.all(
      admins
        .filter((admin) => admin.id !== user.id)
        .map((admin) =>
          insertNotification({
            recipientId: admin.id,
            type: "collaboration_request",
            referenceId,
            title: "Member collaboration request",
            body: `${senderLabel} requested collaboration with ${recipientLabel}.`,
          })
        )
    );
  }

  revalidatePath("/admin/users");
  revalidatePath("/talent/dashboard");
  revalidatePath("/client/dashboard");

  return { ok: true, alreadyRequested: false };
}
