import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

type Action = "delete-profile" | "check-profile" | "blank-onboarding-fields";

type PostBody = {
  action: Action;
  userId: string;
};

export async function POST(request: Request) {
  // DEV-ONLY helper for contract proofs + Playwright.
  // Never allow this in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Partial<PostBody>;

    const action = body.action;
    const userId = body.userId;

    if (!action || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    if (action === "delete-profile") {
      const { error } = await supabaseAdmin.from("profiles").delete().eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "check-profile") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, role, account_type")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          exists: Boolean(data),
          profile: data
            ? {
                id: data.id,
                role: data.role,
                account_type: data.account_type,
              }
            : null,
        },
        { status: 200 }
      );
    }

    if (action === "blank-onboarding-fields") {
      // Intentionally create an "incomplete profile" state to exercise onboarding gating in dev/tests.
      // - Blank profiles.display_name
      // - Blank talent_profiles first/last name
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ display_name: "" })
        .eq("id", userId);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      const { error: talentError } = await supabaseAdmin
        .from("talent_profiles")
        .update({ first_name: "", last_name: "" })
        .eq("user_id", userId);

      if (talentError) {
        return NextResponse.json({ error: talentError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
