# CRON_SECRET Setup – Fix TOTLMODELAGENCY-3D

**Sentry issue:** `[cron/booking-reminders] Unauthorized cron request`  
**Cause:** `CRON_SECRET` is missing or not available in the Vercel Production environment.

---

## What’s happening

The booking-reminders cron job runs daily at 8:00 AM UTC. Vercel Cron sends an `Authorization: Bearer <CRON_SECRET>` header when invoking the endpoint. If `CRON_SECRET` is not set in Vercel, no header is sent and the route returns 401 Unauthorized.

---

## Fix (Vercel configuration)

1. **Generate a secret** (at least 16 characters):
   ```bash
   openssl rand -hex 32
   ```
   Or use a password generator (e.g. 1Password).

2. **Add to Vercel:**
   - Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add:
     - **Name:** `CRON_SECRET`
     - **Value:** your generated secret (no spaces or newlines)
     - **Environments:** ✅ **Production** (required for cron)
   - Save.

3. **Redeploy** (or wait for the next deployment) so the new env var is available.

4. **Verify:** After deploy, the next cron run (8:00 AM UTC) should succeed. Check Sentry – TOTLMODELAGENCY-3D should stop if no new 401s occur.

---

## Environment scope

- **Production:** Required for the booking-reminders cron.
- **Preview:** Optional; only needed if you test cron on preview deployments.
- **Development:** Not used by Vercel Cron; local testing can use `x-cron-secret` in the request header.

---

## Local testing

```bash
# With CRON_SECRET in .env.local:
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/booking-reminders

# Or with x-cron-secret:
curl -H "x-cron-secret: YOUR_CRON_SECRET" http://localhost:3000/api/cron/booking-reminders
```

---

## Reference

- [Vercel: Securing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs)
- `docs/guides/ENV_VARIABLES_COMPLETE_LIST.md` – full env var list
- `app/api/cron/booking-reminders/route.ts` – endpoint implementation
