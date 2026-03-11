# 🔇 Sentry Noise Filtering Guide

**Last Updated:** March 11, 2026  
**Status:** Active — used across client, server, and edge instrumentation

---

## 📋 Overview

TOTL uses shared noise filters in `lib/sentry/noise-filter.ts` to reduce Sentry noise from localhost, headless browsers, and known non-actionable errors. This keeps the Sentry dashboard focused on **real production issues**.

**Key principle:** Prefer adding filters to `lib/sentry/noise-filter.ts` over one-off patches in individual routes or configs. All three Sentry entry points (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) use these shared helpers in their `beforeSend` hooks.

---

## 🏗️ Architecture

```
lib/sentry/noise-filter.ts     ← Shared filter helpers
        │
        ├── instrumentation-client.ts   (client)
        ├── sentry.server.config.ts     (server)
        └── sentry.edge.config.ts       (edge)
```

---

## 📚 Filter Reference

### 1. `shouldFilterLocalWebpackNoise`

**When:** Localhost or headless browser + webpack bootstrap errors.

**Patterns matched:**
- `Cannot read properties of undefined (reading 'call')`
- `Cannot find module './\d+\.js'`
- Stack frames: webpack, bootstrap, `_next/static/chunks`, `.next/server`, webpack-runtime

**Why:** Webpack HMR and dev bootstrap can throw transient errors during hot reload. These are not actionable in production.

---

### 2. `shouldFilterLocalFailedFetchNoise`

**When:** Localhost or headless + `"failed to fetch"` in message/details.

**Why:** Network failures during local dev (e.g. server restarts, CORS) are common and not actionable.

---

### 3. `shouldFilterLocalResourceEventNoise`

**When:** Localhost or headless + either:
- `Event 'event'` + resource load `Error` on `head > link` (2N), or
- `Event 'Event' (type=error) captured as promise rejection` on dashboard routes

**Why:** Browser resource load events and unhandled promise rejections sometimes wrap generic `Event` objects. Benign, often from dev/Playwright/CI.

---

### 4. `shouldFilterLocalServerRenderNoise`

**When:** Localhost or headless + server-side render failures.

**Patterns matched:**
- `Cannot read properties of undefined (reading 'call')`
- `Cannot read properties of undefined (reading '/_app')`
- `Unexpected end of JSON input`
- `ENOENT` + `_document.js`
- `Could not find the module` + `segment-explorer-node` + `React Client Manifest`

**Stack frames:** webpack/bootstrap, app-page.runtime.prod, pages-handler, get-page-files, _document.js, .next/server, webpack-runtime

**Why:** Next.js dev server and webpack can throw transient errors during rebuilds. React Client Manifest and segment-explorer issues are internal Next.js tooling noise.

---

### 5. `shouldFilterHandledLoadFailedNoise`

**When:** Message includes `"load failed"` + `handled: yes` tag + no stack trace.

**Why:** Chunk load failures that are already handled (e.g. recovery UI) and have no useful stack. Logging at info in dev is sufficient.

---

### 6. `shouldFilterLocalWebStreamNoise`

**When:** Localhost or headless + `controller[kstate].transformAlgorithm is not a function`.

**Why:** Web stream API quirks in dev/headless environments. Not actionable.

---

### 7. `shouldFilterSupabaseLockAbortNoise`

**When:** `AbortError` + `signal is aborted without reason` + stack includes `auth-js` and `locks`.

**Why:** Supabase auth-js uses locks that abort during navigation or session changes. These are expected and not bugs.

---

## 🎯 Adding a New Filter

1. **Create a new function** in `lib/sentry/noise-filter.ts`:
   ```typescript
   export function shouldFilterXxxNoise(event: SentryEventLike, errorMessage: string): boolean {
     // 1. Optionally gate on localhost/headless
     const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
     if (!isLocalSignal) return false;

     // 2. Check message/stack
     const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
     // ... your logic
     return /* true if noise */;
   }
   ```

2. **Wire it into all three configs** in their `beforeSend`:
   ```typescript
   if (shouldFilterXxxNoise(event, errorMessage)) return null;
   ```

3. **Document it here** with the pattern, reason, and any Sentry issue IDs it addresses.

---

### 8. `shouldFilterLocalEmailDisabledNoise`

**When:** Localhost or headless + message contains `[totl][email] sending disabled` or `disable_email_sending`.

**Why:** Intentional no-op when `DISABLE_EMAIL_SENDING=1` during Playwright tests. Not actionable. **Sentry issue: 2E**

---

### 9. `shouldFilterLocalAuthCallbackInvalidTokenNoise`

**When:** Localhost or headless + message contains `invite link did not include a valid authentication token` + `handled: yes`.

**Why:** User hits `/auth/callback` without valid tokens (refresh after cleanup, or Playwright). Error is handled in UI. **Sentry issue: 2X**

---

## 🚫 What NOT to Filter

- **Production-only errors** — Don't filter by URL if the error can occur in production.
- **Real user-facing failures** — Chunk load errors that aren't handled, auth failures, API errors.
- **Sensitive data** — Use `lib/sentry/scrub.ts` for PII, not noise filters.

---

## 📂 Related Files

| File | Purpose |
|------|---------|
| `lib/sentry/noise-filter.ts` | Shared filter helpers |
| `lib/sentry/scrub.ts` | PII/sensitive data scrubbing |
| `instrumentation-client.ts` | Client-side Sentry init + beforeSend |
| `sentry.server.config.ts` | Server-side Sentry init + beforeSend |
| `sentry.edge.config.ts` | Edge runtime Sentry init + beforeSend |

---

## 📜 Issue Reference (March 2026)

Filters were added/refined to address these Sentry issues:

| Category | Issue IDs | Filter(s) |
|----------|-----------|-----------|
| Webpack/bootstrap | 2Y, 2P, 2A | `shouldFilterLocalWebpackNoise`, `shouldFilterLocalServerRenderNoise` |
| Resource load | 2N | `shouldFilterLocalResourceEventNoise` |
| Load failed | 24, 31 | `shouldFilterHandledLoadFailedNoise` |
| Web stream | 2W | `shouldFilterLocalWebStreamNoise` |
| Supabase lock | 1K | `shouldFilterSupabaseLockAbortNoise` |
| React Client Manifest | 28, 29 | `shouldFilterLocalServerRenderNoise` |
| Auth/callback/fetch | 2X, 2S, 2R, 2G, 2F | `shouldFilterLocalAuthCallbackInvalidTokenNoise` + route-level fixes |
| Email disabled | 2E | `shouldFilterLocalEmailDisabledNoise` |

When listing fixed issues for Sentry resolution, only include **newly** fixed ones so they can be marked resolved without re-listing older ones.
