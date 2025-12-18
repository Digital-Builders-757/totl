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

    // PR #3: Client promotion is a product-state transition, not a generic admin role toggle.
    // Only allow Career Builder (client) promotion via client application approval.
    if (newRole === "client") {
      return NextResponse.json(
        { error: "Client promotion is only allowed via client application approval." },
        { status: 400 }
      );
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

    // Update profile role + keep account_type self-consistent
    // - talent => account_type: talent
    // - admin  => account_type: unassigned (admins route by role; account_type is not a terminal)
    const nextAccountType = newRole === "talent" ? "talent" : "unassigned";

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ role: newRole, account_type: nextAccountType })
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

    // NOTE: We no longer allow setting role=client in this endpoint.
    // If the user was previously a client, switching away should remove client_profiles.
    if (oldRole === "client") {
      await supabaseAdmin.from("client_profiles").delete().eq("user_id", userId);
    }

    // Create role-specific profile if needed
    if (newRole === "talent") {
      // Check if talent profile exists
      const { data: existingTalentProfile } = await supabaseAdmin
        .from("talent_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingTalentProfile) {
        // Create basic talent profile
        await supabaseAdmin.from("talent_profiles").insert({
          user_id: userId,
          first_name: "",
          last_name: "",
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

