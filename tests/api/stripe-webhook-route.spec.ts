import { expect, test } from "@playwright/test";

test.describe("Stripe webhook route failure-path contract", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  const baseURL =
    process.env.NEXT_PUBLIC_SITE_URL && /(localhost|127\.0\.0\.1)/i.test(process.env.NEXT_PUBLIC_SITE_URL)
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "http://localhost:3000";

  test("rejects missing signature with stable 400 contract", async ({ request }) => {
    const response = await request.post(`${baseURL}/api/stripe/webhook`, {
      data: { event: "test" },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "No signature" });
  });

  test("rejects invalid signature without reflecting sensitive values", async ({ request }) => {
    const rawSignature = "t=123,v1=deadbeef";
    const response = await request.post(`${baseURL}/api/stripe/webhook`, {
      data: {
        id: "evt_invalid_sig_integration",
        object: "event",
        type: "customer.subscription.updated",
      },
      headers: {
        "stripe-signature": rawSignature,
      },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Invalid signature" });

    const responseText = JSON.stringify(body);
    expect(responseText).not.toContain(rawSignature);
    expect(responseText).not.toContain("whsec_");
    expect(responseText).not.toContain("signatureTimestamp");
    expect(responseText).not.toContain("signatureHeaderLength");
  });
});
