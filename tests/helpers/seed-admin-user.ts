import { createSupabaseAdminClientForTests } from "./supabase-admin";

export async function seedUserWithRole(role: "talent" | "client" | "admin", runId: number) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const email = `pw-admin-lifecycle-${role}-${runId}@example.com`;
  const password = "TestPassword123!";

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Lifecycle",
      last_name: `${role}${runId}`,
      role,
    },
  });

  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message ?? "failed to create lifecycle user");
  }

  const userId = created.data.user.id;
  const accountType = role === "admin" ? "unassigned" : role;

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      role,
      account_type: accountType,
      email_verified: true,
      display_name: `Lifecycle ${role} ${runId}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { userId, email, password, displayName: `Lifecycle ${role} ${runId}` };
}
