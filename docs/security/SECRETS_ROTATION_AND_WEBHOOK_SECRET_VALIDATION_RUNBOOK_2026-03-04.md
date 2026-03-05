# Secrets Rotation + Stripe Webhook Secret Validation Runbook

**Date:** March 4, 2026  
**Status:** 📋 READY FOR EXECUTION  
**Purpose:** Execute production security follow-up tasks: rotate leaked Supabase keys and verify Stripe webhook endpoint secret pairing in deployed environments.

---

## Scope

- Rotate leaked Supabase project keys and propagate updated environment variables.
- Validate Stripe webhook endpoint secret pairing for deployed environments.

This runbook does not require middleware/auth architecture changes.

---

## Preconditions

- Access to Supabase project dashboard(s) and environment variable management in deployment platform.
- Access to Stripe dashboard webhook endpoint settings for each deployed environment.
- Coordinated maintenance window to avoid drift between rotated secrets and deployed runtime.

---

## A) Supabase key rotation checklist

1. Inventory affected environments:
   - production
   - staging/preview (if applicable)
2. In Supabase dashboard, rotate exposed project keys.
3. Update deployment environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never exposed client-side)
4. Redeploy affected environments.
5. Verify post-rotation app health:
   - auth login works
   - protected route access works
   - server actions requiring admin client still work
6. Revoke/retire old keys if not automatically invalidated.

---

## B) Stripe webhook secret pairing checklist

1. For each deployed environment endpoint, confirm:
   - endpoint URL matches environment URL
   - endpoint mode matches (`test` vs `live`)
2. Compare environment runtime secret:
   - `STRIPE_WEBHOOK_SECRET`
3. In Stripe dashboard, validate the endpoint secret exactly matches deployed env secret for that endpoint.
4. Trigger a safe verification event (for the correct mode) and confirm:
   - delivery succeeds (2xx)
   - no signature verification failures
5. If failures occur, investigate with:
   - `docs/troubleshooting/STRIPE_WEBHOOKS_RUNBOOK.md`

---

## Safety rules

- Never paste raw secret values into repo docs, logs, or screenshots.
- Record only masked fingerprints (for example, first 4 + last 4 chars) when proof is needed.
- Perform updates sequentially per environment to avoid mixed-key deployment states.

---

## Evidence + completion log

Record each completed environment with:
- environment name
- rotation timestamp
- deployed commit/reference
- verification result (`PASS` / `FAIL`)
- incident notes (if any)

Recommended log template:
- `docs/security/SECRETS_ROTATION_EXECUTION_LOG_TEMPLATE_2026-03-04.md`

Update completion status in:
- `MVP_STATUS_NOTION.md`
- `docs/qa/PLAYWRIGHT_TRIAGE_LOG_2026-03-04.md` (if validation reveals app/auth impacts)

