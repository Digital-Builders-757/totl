import type { SupabaseClient } from "@supabase/supabase-js";
import type { APIRequestContext } from "@playwright/test";
import type { Database } from "@/types/supabase";
import type { TestUserIdentity } from "./test-data";
import { createSupabaseAdminClientForTests } from "./supabase-admin";

type UserRole = "admin" | "client" | "talent";

type FixtureUser = TestUserIdentity & {
  role: UserRole;
};

async function findAuthUserByEmail(
  supabaseAdmin: SupabaseClient<Database>,
  email: string
) {
  let page = 1;
  const perPage = 200;
  const target = email.toLowerCase();

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const found = data.users.find((user) => user.email?.toLowerCase() === target);
    if (found) return found;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

export async function ensureAuthUser(
  supabaseAdmin: SupabaseClient<Database>,
  user: FixtureUser
) {
  const existing = await findAuthUserByEmail(supabaseAdmin, user.email);
  const metadata = {
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
  };

  if (existing?.id) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user?.id) {
      throw new Error(error?.message ?? `Failed to update auth user: ${user.email}`);
    }
    return data.user.id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user?.id) {
    throw new Error(error?.message ?? `Failed to create auth user: ${user.email}`);
  }
  return data.user.id;
}

export async function ensureTalentFixture(user: TestUserIdentity) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const userId = await ensureAuthUser(supabaseAdmin, { ...user, role: "talent" });

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      role: "talent",
      account_type: "talent",
      email_verified: true,
      display_name: `${user.firstName} ${user.lastName}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (profileError) throw new Error(profileError.message);

  const { error: talentError } = await supabaseAdmin.from("talent_profiles").upsert(
    {
      user_id: userId,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: "555-0101",
      location: "New York, NY",
      experience: "Playwright fixture talent profile.",
      specialties: ["Commercial"],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (talentError) throw new Error(talentError.message);

  return { userId };
}

export async function ensureClientFixture(user: TestUserIdentity) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const userId = await ensureAuthUser(supabaseAdmin, { ...user, role: "client" });

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      role: "client",
      account_type: "client",
      email_verified: true,
      display_name: `${user.firstName} ${user.lastName}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (profileError) throw new Error(profileError.message);

  const { error: clientError } = await supabaseAdmin.from("client_profiles").upsert(
    {
      user_id: userId,
      company_name: `${user.firstName} Studio`,
      contact_name: `${user.firstName} ${user.lastName}`,
      contact_email: user.email,
      industry: "Fashion",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (clientError) throw new Error(clientError.message);

  return { userId };
}

export async function ensureTalentUserViaAdminApi(
  request: APIRequestContext,
  user: TestUserIdentity
) {
  const res = await request.post("/api/admin/create-user", {
    data: {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: "talent",
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to create talent via admin API (${res.status()}): ${await res.text()}`);
  }

  const payload = (await res.json()) as { user?: { id?: string } };
  if (payload.user?.id) {
    return payload.user.id;
  }

  const supabaseAdmin = createSupabaseAdminClientForTests();
  const existing = await findAuthUserByEmail(supabaseAdmin, user.email);
  if (!existing?.id) {
    throw new Error(`Talent user was not returned and not found by email: ${user.email}`);
  }
  return existing.id;
}

export function createNameSlug(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createActiveGigForClient(
  clientId: string,
  titleSuffix: string
) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const { data, error } = await supabaseAdmin
    .from("gigs")
    .insert({
      client_id: clientId,
      title: `PW Integration Gig ${titleSuffix}`,
      description: "Deterministic Playwright integration fixture gig.",
      category: "Commercial",
      location: "New York, NY",
      compensation: "$1000",
      duration: "1 day",
      date: "2026-12-31",
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to create deterministic gig fixture");
  }

  return data.id;
}
