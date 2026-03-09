import "server-only";
import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { generateClientApplicationExistingUserLoginEmail } from "@/lib/services/email-templates";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

type RequestBody = {
  email?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
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
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Failed to verify admin role" }, { status: 500 });
    }

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: absoluteUrl("/auth/callback"),
      },
    });

    if (error || !data?.properties?.hashed_token) {
      return NextResponse.json(
        { error: error?.message || "Could not generate login link for this user" },
        { status: 404 }
      );
    }

    const callbackUrl = absoluteUrl(
      `/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink&returnUrl=${encodeURIComponent("/client/apply")}`
    );

    const emailTemplate = generateClientApplicationExistingUserLoginEmail({
      name: data.user?.email?.split("@")[0] || "there",
      loginUrl: callbackUrl,
    });

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    await logEmailSent(email, "client-application-existing-user-login", true);

    return NextResponse.json({
      success: true,
      email,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
