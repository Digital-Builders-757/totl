import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export const POST = async (request: Request) => {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    // Check if requester is authenticated and is admin
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

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Use admin client to delete user (cascade delete will handle all related data)
    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully. All related data has been cascaded.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
