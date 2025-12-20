import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { computeEmailSendWindowForNow, EmailSendPurpose } from "@/lib/server/email/claim-email-send";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export const runtime = "nodejs";

const querySchema = z.object({
  purpose: z.enum([EmailSendPurpose.VERIFY_EMAIL, EmailSendPurpose.PASSWORD_RESET]),
  email: z.string().email(),
});

/**
 * Admin-only debug endpoint to answer "was this request throttled?" without exposing ledger to users.
 *
 * Auth posture:
 * - Requires signed-in user with profiles.role='admin'
 * - Reads ledger via service role (RLS has no user-facing policies)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      purpose: url.searchParams.get("purpose"),
      email: url.searchParams.get("email"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Failed to check role" }, { status: 500 });
    }

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const computed = computeEmailSendWindowForNow({
      purpose: parsed.data.purpose,
      recipientEmail: parsed.data.email,
    });

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: ledgerRow, error: ledgerError } = await supabaseAdmin
      .from("email_send_ledger")
      .select("id, created_at, status, provider_message_id")
      .eq("idempotency_key", computed.idempotencyKey)
      .maybeSingle();

    if (ledgerError) {
      return NextResponse.json({ error: "Ledger lookup failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      computed: {
        purpose: parsed.data.purpose,
        normalizedEmail: computed.normalizedEmail,
        cooldownMs: computed.cooldownMs,
        cooldownBucketIso: computed.cooldownBucketIso,
        idempotencyKey: computed.idempotencyKey,
      },
      ledger: ledgerRow
        ? {
            id: ledgerRow.id,
            createdAt: ledgerRow.created_at,
            status: ledgerRow.status,
            providerMessageId: ledgerRow.provider_message_id,
          }
        : null,
    });
  } catch (e) {
    console.error("[totl][admin][email-ledger-debug] error", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


