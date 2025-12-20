import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export const EmailSendPurpose = {
  VERIFY_EMAIL: "verify_email",
  PASSWORD_RESET: "password_reset",
} as const;

export type EmailSendPurpose = (typeof EmailSendPurpose)[keyof typeof EmailSendPurpose];

type ClaimArgs = {
  purpose: EmailSendPurpose;
  recipientEmail: string;
  userId?: string | null;
};

export type ClaimEmailSendResult =
  | {
      didClaim: true;
      ledgerId: string;
      idempotencyKey: string;
      cooldownBucketIso: string;
    }
  | {
      didClaim: false;
      idempotencyKey: string;
      cooldownBucketIso: string;
      reason: "already-claimed" | "claim-failed";
    };

const COOLDOWN_MS_BY_PURPOSE: Record<EmailSendPurpose, number> = {
  [EmailSendPurpose.VERIFY_EMAIL]: 60_000, // 60s (friendly)
  [EmailSendPurpose.PASSWORD_RESET]: 5 * 60_000, // 5m (stronger abuse protection)
};

export function normalizeEmailForLedger(email: string) {
  return email.trim().toLowerCase();
}

function computeCooldownBucket(nowMs: number, cooldownMs: number) {
  const bucketMs = Math.floor(nowMs / cooldownMs) * cooldownMs;
  return new Date(bucketMs);
}

export function buildEmailSendIdempotencyKey(args: {
  purpose: EmailSendPurpose;
  normalizedEmail: string;
  cooldownBucketIso: string;
}) {
  return `${args.purpose}:${args.normalizedEmail}:${args.cooldownBucketIso}`;
}

export function computeEmailSendWindowForNow(args: { purpose: EmailSendPurpose; recipientEmail: string; nowMs?: number }) {
  const normalizedEmail = normalizeEmailForLedger(args.recipientEmail);
  const nowMs = args.nowMs ?? Date.now();
  const cooldownMs = COOLDOWN_MS_BY_PURPOSE[args.purpose];
  const cooldownBucket = computeCooldownBucket(nowMs, cooldownMs);
  const cooldownBucketIso = cooldownBucket.toISOString();
  const idempotencyKey = `${args.purpose}:${normalizedEmail}:${cooldownBucketIso}`;
  return { normalizedEmail, cooldownMs, cooldownBucketIso, idempotencyKey };
}

/**
 * Atomically claims an email send slot for a recipient within a cooldown bucket.
 * If the claim is already taken, returns didClaim=false (caller must not send).
 *
 * Security posture:
 * - Writes are performed with the server-side service role (admin client).
 * - RLS is enabled on `public.email_send_ledger`; no user-facing policies are added.
 */
export async function claimEmailSend(args: ClaimArgs): Promise<ClaimEmailSendResult> {
  const { normalizedEmail, cooldownBucketIso, idempotencyKey } = computeEmailSendWindowForNow({
    purpose: args.purpose,
    recipientEmail: args.recipientEmail,
  });

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("email_send_ledger")
      .insert([
        {
          purpose: args.purpose,
          recipient_email: normalizedEmail,
          user_id: args.userId ?? null,
          idempotency_key: idempotencyKey,
          cooldown_bucket: cooldownBucketIso,
          status: "claimed",
        },
      ])
      .select("id")
      .single();

    if (error) {
      // Uniqueness violation means "already claimed" — caller must not send.
      // We intentionally treat conflicts as a safe no-send and do not surface them to callers.
      const msg = typeof error.message === "string" ? error.message.toLowerCase() : "";
      const details = typeof error.details === "string" ? error.details.toLowerCase() : "";
      const hint = typeof error.hint === "string" ? error.hint.toLowerCase() : "";
      const isUniqueViolation =
        error.code === "23505" ||
        msg.includes("duplicate key") ||
        msg.includes("unique constraint") ||
        details.includes("duplicate key") ||
        details.includes("unique constraint") ||
        hint.includes("23505");

      if (isUniqueViolation) {
        return { didClaim: false, idempotencyKey, cooldownBucketIso, reason: "already-claimed" };
      }

      console.error("[totl][email-ledger] claim failed", {
        purpose: args.purpose,
        cooldownBucketIso,
        errorMessage: error.message,
        errorCode: (error as { code?: string }).code ?? null,
      });
      return { didClaim: false, idempotencyKey, cooldownBucketIso, reason: "claim-failed" };
    }

    return { didClaim: true, ledgerId: data.id, idempotencyKey, cooldownBucketIso };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unknown error";
    console.error("[totl][email-ledger] claim threw", { purpose: args.purpose, cooldownBucketIso, reason });
    return { didClaim: false, idempotencyKey, cooldownBucketIso, reason: "claim-failed" };
  }
}


