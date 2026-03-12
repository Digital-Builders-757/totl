import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, role, phone } = await request.json();

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // PR #3: Creating Career Builder (client) is only allowed via client application approval.
    if (role === "client") {
      return NextResponse.json(
        { error: "Client promotion is only allowed via client application approval." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role,
      },
    });

    if (authError) {
      // If user already exists, that's fine for testing - user was created via UI
      // Just return success (the user exists and can be used for login)
      if (authError.message.includes("already been registered") || authError.code === "email_exists") {
        // For test determinism, return the existing user so callers can still access `user.id`.
        // NOTE: Supabase JS doesn't provide a direct getUserByEmail helper; use listUsers as a fallback.
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 });
        if (!listError) {
          const existing = usersData?.users?.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
          if (existing) {
            return NextResponse.json(
              { success: true, message: "User already exists", user: existing },
              { status: 200 }
            );
          }
        }

        return NextResponse.json(
          { success: true, message: "User already exists" },
          { status: 200 }
        );
      }
      
      logger.error("Auth user creation failed", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Step 2: Create/update profile record
    // NOTE: DB trigger will create the base Talent profile. For admin-provisioned users,
    // we upsert to ensure requested role is reflected (admin tooling only).
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authData.user.id,
          display_name: `${firstName} ${lastName}`,
          role,
          // Keep admin accounts routable by role; account_type is not a terminal for admins.
          account_type: role === "admin" ? "unassigned" : "talent",
          email_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileError) {
      logger.error("Profile creation failed", profileError);
      // Continue anyway since the auth user was created
    }

    // Step 3: Create role-specific profile if needed
    if (role === "talent") {
      // NOTE: the auth bootstrap trigger may already create this row; use upsert to keep this endpoint idempotent.
      const { error: talentError } = await supabase
        .from("talent_profiles")
        .upsert(
          {
            user_id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            phone: typeof phone === "string" ? phone : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (talentError) {
        logger.error("Talent profile creation failed", talentError);
      }
    }

    return NextResponse.json({ success: true, user: authData.user }, { status: 200 });
  } catch (error) {
    logger.error("Error creating user", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
