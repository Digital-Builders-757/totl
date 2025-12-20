import Stripe from "stripe";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

vi.mock("@/lib/supabase-admin-client", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

type SupabaseError = { code?: string; message: string };

type InsertArgs = {
  event_id: string;
  type: string;
  stripe_created: number;
  livemode: boolean;
  status: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  checkout_session_id?: string | null;
};

function createSupabaseMock(opts: {
  ledgerInsertError?: SupabaseError | null;
  ledgerDuplicate?: boolean;
  ledgerExistingStatusOnDuplicate?: "processing" | "processed" | "failed" | "ignored";
  ledgerLatestProcessedStripeCreated?: number | null;
  profilesFindError?: SupabaseError | null;
  profilesUpdateError?: SupabaseError | null;
}) {
  const calls = {
    ledgerInserts: [] as InsertArgs[],
    ledgerUpdates: [] as Array<{ status: string; error: string | null; processed_at: string | null }>,
    profilesUpdates: [] as Array<Record<string, unknown>>,
  };

  type Operation = "insert" | "update" | "select" | null;

  const state = {
    table: "" as string,
    operation: null as Operation,
    payload: null as unknown,
    columns: null as null | string,
    eq: new Map<string, unknown>(),
    order: null as null | { column: string; ascending: boolean },
    limit: null as null | number,
  };

  const resetChainState = () => {
    state.operation = null;
    state.payload = null;
    state.columns = null;
    state.eq.clear();
    state.order = null;
    state.limit = null;
  };

  const execute = async () => {
    // INSERT
    if (state.operation === "insert" && state.table === "stripe_webhook_events") {
      const row = state.payload as InsertArgs;
      calls.ledgerInserts.push(row);
      const error = opts.ledgerDuplicate
        ? { code: "23505", message: "duplicate key value violates unique constraint" }
        : (opts.ledgerInsertError ?? null);
      resetChainState();
      return { error };
    }

    // UPDATE
    if (state.operation === "update" && state.table === "stripe_webhook_events") {
      const row = state.payload as { status: string; error: string | null; processed_at: string | null };
      calls.ledgerUpdates.push(row);
      resetChainState();
      return { error: null };
    }

    if (state.operation === "update" && state.table === "profiles") {
      const row = state.payload as Record<string, unknown>;
      calls.profilesUpdates.push(row);
      const error = opts.profilesUpdateError ?? null;
      resetChainState();
      return { error };
    }

    resetChainState();
    return { error: null };
  };

  const queryBuilder = {
    insert: (row: InsertArgs) => {
      state.operation = "insert";
      state.payload = row;
      return queryBuilder;
    },

    update: (row: unknown) => {
      state.operation = "update";
      state.payload = row;
      return queryBuilder;
    },

    select: (columns: string) => {
      state.operation = "select";
      state.columns = columns;
      return queryBuilder;
    },

    eq: (column: string, value: unknown) => {
      state.eq.set(column, value);
      return queryBuilder;
    },

    order: (column: string, args: { ascending: boolean }) => {
      state.order = { column, ascending: args.ascending };
      return queryBuilder;
    },

    limit: (n: number) => {
      state.limit = n;
      return queryBuilder;
    },

    maybeSingle: async () => {
      // Ledger monotonic check
      if (state.table === "stripe_webhook_events") {
        const status = state.eq.get("status");
        const customerId = state.eq.get("customer_id");

        // Read existing row status (duplicate insert path)
        const eventId = state.eq.get("event_id");
        if (state.columns === "status" && typeof eventId === "string") {
          resetChainState();
          return {
            data: { status: opts.ledgerExistingStatusOnDuplicate ?? "processed" },
            error: null,
          };
        }

        resetChainState();
        if (status === "processed" && typeof customerId === "string") {
          return {
            data:
              typeof opts.ledgerLatestProcessedStripeCreated === "number"
                ? { stripe_created: opts.ledgerLatestProcessedStripeCreated }
                : null,
            error: null,
          };
        }
      }

      // Profile lookup by customer id
      if (state.table === "profiles") {
        resetChainState();
        if (opts.profilesFindError) {
          return { data: null, error: opts.profilesFindError };
        }
        return { data: { id: "user_123", subscription_plan: null }, error: null };
      }

      resetChainState();
      return { data: null, error: null };
    },

    // Allow `await supabase.from(...).update(...).eq(...)` and `await ...insert(...)`
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => {
      return execute().then(onFulfilled, onRejected);
    },
  } as const;

  const supabase = {
    from: (table: string) => {
      state.table = table;
      return queryBuilder;
    },
  } as const;

  return { supabase, calls };
}

const stripeForTests = new Stripe("sk_test_unit_tests", {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

function signPayload(payload: string, secret: string): string {
  // Stripe test helper exists in stripe-node.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeWebhooks = stripeForTests.webhooks as any;
  if (typeof maybeWebhooks.generateTestHeaderString !== "function") {
    throw new Error("stripe.webhooks.generateTestHeaderString is not available; update stripe-node or implement manual signature generation.");
  }
  return maybeWebhooks.generateTestHeaderString({ payload, secret });
}

function buildSubscriptionUpdatedEventPayload(args: {
  eventId: string;
  created: number;
  customerId: string;
  subscriptionId: string;
}) {
  return JSON.stringify({
    id: args.eventId,
    object: "event",
    api_version: "2025-11-17.clover",
    created: args.created,
    livemode: false,
    pending_webhooks: 1,
    type: "customer.subscription.updated",
    data: {
      object: {
        id: args.subscriptionId,
        object: "subscription",
        customer: args.customerId,
        status: "active",
        metadata: { plan: "monthly" },
        items: { object: "list", data: [] },
        current_period_end: args.created + 60 * 60 * 24 * 30,
      },
    },
    request: { id: null, idempotency_key: null },
  });
}

let route: typeof import("@/app/api/stripe/webhook/route");

beforeAll(async () => {
  // Ensure app Stripe module can import (it validates these at import time).
  process.env.STRIPE_SECRET_KEY = "sk_test_unit_tests";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_tests";
  process.env.STRIPE_PRICE_TALENT_MONTHLY = "price_unit_monthly";
  process.env.STRIPE_PRICE_TALENT_ANNUAL = "price_unit_annual";

  route = await import("@/app/api/stripe/webhook/route");
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/api/stripe/webhook route handler", () => {
  it("returns 400 when signature is missing", async () => {
    const { supabase } = createSupabaseMock({});
    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const res = await route.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when signature is invalid", async () => {
    const { supabase } = createSupabaseMock({});
    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const payload = buildSubscriptionUpdatedEventPayload({
      eventId: "evt_invalid_sig",
      created: 1000,
      customerId: "cus_123",
      subscriptionId: "sub_123",
    });

    const res = await route.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "t=123,v1=deadbeef",
        },
        body: payload,
      })
    );

    expect(res.status).toBe(400);
  });

  it("is idempotent by event.id: duplicate event short-circuits without double side effects", async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const payload = buildSubscriptionUpdatedEventPayload({
      eventId: "evt_dupe_1",
      created: 1000,
      customerId: "cus_123",
      subscriptionId: "sub_123",
    });
    const signature = signPayload(payload, secret);

    // First call: ledger insert ok, profile update ok
    const first = createSupabaseMock({ ledgerDuplicate: false });
    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(first.supabase);
    const firstRes = await route.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      })
    );
    expect(firstRes.status).toBe(200);
    expect(first.calls.ledgerInserts).toHaveLength(1);
    expect(first.calls.profilesUpdates.length).toBeGreaterThanOrEqual(1);

    // Second call: ledger insert hits unique constraint → early 200, no profile update
    const second = createSupabaseMock({ ledgerDuplicate: true, ledgerExistingStatusOnDuplicate: "processed" });
    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(second.supabase);
    const secondRes = await route.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      })
    );
    expect(secondRes.status).toBe(200);
    expect(second.calls.ledgerInserts).toHaveLength(1);
    expect(second.calls.profilesUpdates).toHaveLength(0);
  });

  it("short-circuits in-flight duplicates (existing ledger status = processing) to avoid double side effects", async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const payload = buildSubscriptionUpdatedEventPayload({
      eventId: "evt_in_flight_dupe_1",
      created: 1000,
      customerId: "cus_123",
      subscriptionId: "sub_123",
    });
    const signature = signPayload(payload, secret);

    const { supabase, calls } = createSupabaseMock({
      ledgerDuplicate: true,
      ledgerExistingStatusOnDuplicate: "processing",
    });
    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const res = await route.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ duplicate: true, in_flight: true });
    expect(calls.profilesUpdates).toHaveLength(0);
  });

  it("returns 500 when downstream DB update fails (truthful ACK)", async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const payload = buildSubscriptionUpdatedEventPayload({
      eventId: "evt_db_fail_1",
      created: 1000,
      customerId: "cus_123",
      subscriptionId: "sub_123",
    });
    const signature = signPayload(payload, secret);

    const { supabase, calls } = createSupabaseMock({
      profilesUpdateError: { message: "update failed" },
    });
    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const res = await route.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      })
    );

    expect(res.status).toBe(500);
    // Ledger should be updated to failed.
    expect(calls.ledgerUpdates.some((u) => u.status === "failed")).toBe(true);
  });

  it("ignores out-of-order events (monotonic by latest processed stripe_created per customer)", async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET!;
    const payload = buildSubscriptionUpdatedEventPayload({
      eventId: "evt_out_of_order_1",
      created: 1000,
      customerId: "cus_123",
      subscriptionId: "sub_123",
    });
    const signature = signPayload(payload, secret);

    const { supabase, calls } = createSupabaseMock({
      ledgerLatestProcessedStripeCreated: 2000,
    });
    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const res = await route.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      })
    );

    expect(res.status).toBe(200);
    expect(calls.profilesUpdates).toHaveLength(0);
    expect(calls.ledgerUpdates.some((u) => u.status === "ignored")).toBe(true);
  });
});

