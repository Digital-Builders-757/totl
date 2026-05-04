import "server-only";
import { NextResponse } from "next/server";
import { PATHS } from "@/lib/constants/routes";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

type InviteRequestBody = {
  email?: string;
};

const isAlreadyRegisteredError = (message: string) =>
  message.toLowerCase().includes("already been registered") ||
  message.toLowerCase().includes("already registered") ||
  message.toLowerCase().includes("email_exists");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InviteRequestBody;
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Failed to verify admin role" }, { status: 500 });
    }

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const redirectTo = absoluteUrl(
      `/auth/callback?returnUrl=${encodeURIComponent(PATHS.CLIENT_APPLY)}`
    );
    const invitedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        invited_for: "career_builder_application",
        invited_by_admin_id: user.id,
        invited_by_admin_name:
          typeof profile.display_name === "string" && profile.display_name.trim().length > 0
            ? profile.display_name.trim()
            : null,
        invited_at: invitedAt,
      },
    });

    if (error) {
      if (isAlreadyRegisteredError(error.message)) {
        return NextResponse.json(
          {
            error:
              "A user with this email already exists. Ask them to sign in and use /client/apply.",
          },
          { status: 409 }
        );
      }

      logger.error("[invite-career-builder] inviteUserByEmail failed", error, { email });
      return NextResponse.json(
        { error: "We couldn’t send the invite. Please try again or contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      invitedUserId: data.user?.id ?? null,
      redirectTo,
      invitedAt,
    });
  } catch (error) {
    logger.error("[invite-career-builder] unexpected", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

