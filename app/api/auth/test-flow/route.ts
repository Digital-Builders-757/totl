import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "No authenticated user found",
          userError: userError?.message,
        },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          error: "Profile not found",
          profileError: profileError.message,
          userId: user.id,
          userEmail: user.email,
        },
        { status: 404 }
      );
    }

    // Get role-specific profile
    let roleProfile = null;
    if (profile.role === "talent") {
      const { data: talentProfile } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      roleProfile = talentProfile;
    } else if (profile.role === "client") {
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      roleProfile = clientProfile;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at,
      },
      profile: {
        id: profile.id,
        role: profile.role,
        displayName: profile.display_name,
        emailVerified: profile.email_verified,
        createdAt: profile.created_at,
      },
      roleProfile,
      authFlow: {
        hasUser: !!user,
        hasProfile: !!profile,
        hasRoleProfile: !!roleProfile,
        emailVerified: user.email_confirmed_at !== null,
        profileEmailVerified: profile.email_verified,
      },
    });
  } catch (error) {
    console.error("Auth flow test error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
