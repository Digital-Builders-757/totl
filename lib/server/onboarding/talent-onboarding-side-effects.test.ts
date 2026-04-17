import type { User } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase-admin-client", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/email-service", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  logEmailSent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/get-site-url", () => ({
  absoluteUrl: (path: string) => `https://example.test${path}`,
}));

vi.mock("@/lib/services/email-templates", () => ({
  generateWelcomeEmail: vi.fn().mockReturnValue({ subject: "Welcome", html: "<p>Hi</p>" }),
  generateAdminNewMemberAlertEmail: vi.fn().mockReturnValue({
    subject: "New member",
    html: "<p>Admin</p>",
  }),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { sendEmail } from "@/lib/email-service";
import { processTalentOnboardingSideEffects } from "@/lib/server/onboarding/talent-onboarding-side-effects";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

const USER_ID = "00000000-0000-4000-8000-000000000001";

function baseUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "talent@example.test",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    ...overrides,
  } as User;
}

function createClaimingAdminClient() {
  let welcomeAt: string | null = null;
  let adminAt: string | null = null;

  const chain = (kind: "welcome" | "admin") => {
    return {
      eq: (_col: string, id: string) => ({
        is: () => ({
          select: async () => {
            if (id !== USER_ID) {
              return { data: null, error: null };
            }
            if (kind === "welcome") {
              if (welcomeAt !== null) {
                return { data: [], error: null };
              }
              welcomeAt = new Date().toISOString();
              return { data: [{ id: USER_ID }], error: null };
            }
            if (adminAt !== null) {
              return { data: [], error: null };
            }
            adminAt = new Date().toISOString();
            return { data: [{ id: USER_ID }], error: null };
          },
        }),
      }),
    };
  };

  return {
    from: (table: string) => ({
      update: (payload: Record<string, unknown>) => {
        if (table !== "profiles") {
          return chain("welcome");
        }
        if ("welcome_email_sent_at" in payload) {
          return chain("welcome");
        }
        if ("admin_new_member_email_sent_at" in payload) {
          return chain("admin");
        }
        return chain("welcome");
      },
    }),
  };
}

describe("processTalentOnboardingSideEffects", () => {
  afterEach(() => {
    vi.mocked(sendEmail).mockClear();
    vi.mocked(createSupabaseAdminClient).mockReset();
  });

  it("sends welcome and admin emails once when claim succeeds", async () => {
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      createClaimingAdminClient() as unknown as ReturnType<typeof createSupabaseAdminClient>
    );

    await processTalentOnboardingSideEffects(baseUser(), {
      role: "talent",
      display_name: "Test Talent",
      email_verified: true,
      welcome_email_sent_at: null,
      admin_new_member_email_sent_at: null,
    });

    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("sends at most one welcome and one admin email under concurrent claims", async () => {
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      createClaimingAdminClient() as unknown as ReturnType<typeof createSupabaseAdminClient>
    );

    const profile = {
      role: "talent" as const,
      display_name: "Test Talent",
      email_verified: true,
      welcome_email_sent_at: null,
      admin_new_member_email_sent_at: null,
    };

    await Promise.all([
      processTalentOnboardingSideEffects(baseUser(), profile),
      processTalentOnboardingSideEffects(baseUser(), profile),
    ]);

    const welcomeSends = vi.mocked(sendEmail).mock.calls.filter(
      (c) => c[0].to === "talent@example.test"
    );
    const adminSends = vi.mocked(sendEmail).mock.calls.filter(
      (c) => c[0].to === "admin@thetotlagency.com"
    );
    expect(welcomeSends.length).toBe(1);
    expect(adminSends.length).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("skips welcome when profile snapshot already has welcome_email_sent_at", async () => {
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      createClaimingAdminClient() as unknown as ReturnType<typeof createSupabaseAdminClient>
    );

    await processTalentOnboardingSideEffects(baseUser(), {
      role: "talent",
      display_name: "Test",
      email_verified: true,
      welcome_email_sent_at: "2020-01-01T00:00:00.000Z",
      admin_new_member_email_sent_at: null,
    });

    const welcomeSends = vi.mocked(sendEmail).mock.calls.filter(
      (c) => c[0].to === "talent@example.test"
    );
    expect(welcomeSends.length).toBe(0);
  });
});
