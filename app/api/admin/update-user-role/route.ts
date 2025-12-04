import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export async function POST(request: Request) {
  try {
    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: "User ID and new role are required" }, { status: 400 });
    }

    // Validate role
    if (!["talent", "client", "admin"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role. Must be 'talent', 'client', or 'admin'" }, { status: 400 });
    }

    // Check if requester is authenticated and is admin
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify requester is admin
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!requesterProfile || requesterProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Prevent self-demotion from admin
    if (userId === user.id && newRole !== "admin") {
      return NextResponse.json({ error: "Cannot change your own role from admin" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Get current user profile to check existing role
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!currentProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const oldRole = currentProfile.role;

    // Update profile role
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile role:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Handle role-specific profile creation/deletion
    if (oldRole === "talent" && newRole !== "talent") {
      // Delete talent profile if switching away from talent
      await supabaseAdmin.from("talent_profiles").delete().eq("user_id", userId);
    }

    if (oldRole === "client" && newRole !== "client") {
      // Delete client profile if switching away from client
      await supabaseAdmin.from("client_profiles").delete().eq("user_id", userId);
    }

    // Create role-specific profile if needed
    if (newRole === "talent") {
      // Check if talent profile exists
      const { data: existingTalentProfile } = await supabaseAdmin
        .from("talent_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!existingTalentProfile) {
        // Create basic talent profile
        await supabaseAdmin.from("talent_profiles").insert({
          user_id: userId,
          first_name: "",
          last_name: "",
        });
      }
    }

    if (newRole === "client") {
      // Check if client profile exists
      const { data: existingClientProfile } = await supabaseAdmin
        .from("client_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!existingClientProfile) {
        // Create basic client profile
        await supabaseAdmin.from("client_profiles").insert({
          user_id: userId,
          company_name: "",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `User role updated from ${oldRole} to ${newRole}`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

