import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, role } = await request.json();

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      console.error("Auth user creation failed:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Step 2: Create profile record
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        role,
        email_verified: true,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      console.error("Profile creation failed:", profileError);
      // Continue anyway since the auth user was created
    }

    // Step 3: Create role-specific profile if needed
    if (role === "talent") {
      const { error: talentError } = await supabase.from("talent_profiles").insert([
        {
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
        },
      ]);

      if (talentError) {
        console.error("Talent profile creation failed:", talentError);
      }
    }

    return NextResponse.json({ success: true, user: authData.user }, { status: 200 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
