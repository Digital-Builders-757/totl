import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(workspaceRoot, ".env.local") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: "admin@totlagency.com",
    password: "AdminPassword123!",
    role: "admin",
    accountType: "unassigned",
    displayName: "TOTL Admin",
    firstName: "Admin",
    lastName: "User",
  },
  {
    email: "cameron.seed@thetotlagency.local",
    password: "Password123!",
    role: "client",
    accountType: "client",
    displayName: "Cameron Seed",
    firstName: "Cameron",
    lastName: "Seed",
  },
  {
    email: "emma.seed@thetotlagency.local",
    password: "Password123!",
    role: "talent",
    accountType: "talent",
    displayName: "Emma Seed",
    firstName: "Emma",
    lastName: "Seed",
  },
];

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  const target = email.toLowerCase();

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((user) => (user.email ?? "").toLowerCase() === target);
    if (found) return found;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAuthUser(userConfig) {
  const existing = await findUserByEmail(userConfig.email);
  const userMetadata = {
    first_name: userConfig.firstName,
    last_name: userConfig.lastName,
    role: userConfig.role,
  };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: userConfig.email,
    password: userConfig.password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (error) throw error;
  return data.user;
}

async function ensureProfile(userId, userConfig) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: userConfig.role,
      account_type: userConfig.accountType,
      display_name: userConfig.displayName,
      email_verified: true,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

async function ensureRoleRow(userId, userConfig) {
  if (userConfig.role === "client") {
    const { error } = await supabase.from("client_profiles").upsert(
      {
        user_id: userId,
        company_name: "Cameron Creative Studio",
        contact_name: "Cameron Seed",
        contact_email: userConfig.email,
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
  }

  if (userConfig.role === "talent") {
    const { error } = await supabase.from("talent_profiles").upsert(
      {
        user_id: userId,
        first_name: userConfig.firstName,
        last_name: userConfig.lastName,
        location: "Los Angeles, CA",
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
  }
}

async function main() {
  process.stdout.write("Ensuring UI audit users exist and can authenticate...\n");
  for (const userConfig of users) {
    const authUser = await ensureAuthUser(userConfig);
    if (!authUser?.id) {
      throw new Error(`Missing auth user id for ${userConfig.email}`);
    }

    await ensureProfile(authUser.id, userConfig);
    await ensureRoleRow(authUser.id, userConfig);
    process.stdout.write(`OK ${userConfig.email}\n`);
  }
  process.stdout.write("UI audit users ready.\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
