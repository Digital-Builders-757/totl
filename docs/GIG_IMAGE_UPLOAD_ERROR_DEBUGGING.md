# Gig Image Upload Error Debugging Guide

**Date:** January 25, 2026  
**Status:** ✅ Enhanced Error Handling Implemented

---

## 🎯 Implementation Summary

Enhanced `uploadGigImage()` function to surface real Supabase Storage errors with structured logging and user-friendly error messages.

### Changes Made

1. **Enhanced Error Logging** (`lib/actions/gig-actions.ts`):
   - Added structured logging using `logger` utility
   - Logs full error context: status code, Supabase error object, bucket, path, userId, file info
   - Generates `debug_id` (16-char UUID) for each upload attempt
   - Maps HTTP status codes to user-friendly messages

2. **Structured Error Response**:
   - Old format: `{ error: string }`
   - New format: `{ ok: false, message: string, code?: string, debug_id: string }`
   - Success format unchanged: `{ url: string, path: string }`

3. **Updated Callers**:
   - `app/post-gig/actions.ts` - Propagates debug_id in error message
   - `app/admin/gigs/create/actions.ts` - Propagates debug_id in error message

---

## 🔍 Root Cause Analysis Template

**After reproducing the error, fill in this template:**

### Error Details
- **HTTP Status Code:** `__________` (from server logs)
- **Supabase Error Code:** `__________` (from server logs)
- **Error Message:** `__________` (from server logs)
- **Debug ID:** `__________` (shown to user in error toast)

### Server Log Context
Check server logs (local terminal or Vercel logs) for entry with matching `debug_id`:

```json
{
  "debug_id": "__________",
  "bucket": "gig-images",
  "path": "__________",
  "userId": "__________",
  "fileName": "__________",
  "fileSize": __________,
  "fileType": "__________",
  "statusCode": __________,
  "errorCode": "__________",
  "errorName": "__________",
  "errorMessage": "__________"
}
```

### Root Cause Hypothesis

**Most Likely Cause:** `__________`

**Evidence:**
- Status code: `__________`
- Error message pattern: `__________`
- Path structure: `__________`

### Fix Required

**If 401/403 (Auth/RLS):**
- [ ] Check user session is valid (`supabase.auth.getUser()` succeeds)
- [ ] Verify path matches RLS policy: `{user_id}/gig-{timestamp}-{random}.{ext}`
- [ ] Check storage RLS policies in Supabase dashboard
- [ ] Verify `storage.foldername(name)[1] = auth.uid()::text` policy is active
- [ ] **Note:** 403 can still occur even with correct userId if:
  - RLS policy not deployed to production
  - Wrong bucket_id in policy
  - Policy uses wrong role (`authenticated` vs `public`)
  - Policy condition doesn't match actual path structure
- [ ] **Fix:** Update RLS policy or fix path generation

**If 404 (Bucket Missing):**
- [ ] Verify `gig-images` bucket exists in Supabase Storage
- [ ] Check environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Verify project matches between local/production
- [ ] **Fix:** Create bucket or fix env vars

**If 409 (File Exists):**
- [ ] Check if same file uploaded twice (path collision)
- [ ] Verify `randomUUID()` is generating unique IDs
- [ ] **Fix:** Use `upsert: true` or improve uniqueness in path generation

**If 413/400 (Size/Type):**
- [ ] Check file size exceeds 4MB limit
- [ ] Check file MIME type is valid (JPEG, PNG, GIF, WebP)
- [ ] Verify client-side validation matches server-side
- [ ] **CRITICAL:** Check Next.js `bodySizeLimit` in `next.config.mjs` (must be >= 4MB)
  - Current setting: `experimental.serverActions.bodySizeLimit: '4mb'`
  - If uploads fail before logs appear, this is likely the cause
- [ ] **Fix:** Enforce validation before upload or increase limits

**If 500 (Server Error):**
- [ ] Check Supabase Storage service status
- [ ] Review server logs for stack traces
- [ ] Check file/blob conversion issues
- [ ] **Fix:** Address underlying server issue

---

## ✅ Verification Checklist

### Local Development

**Pre-Deployment:**
- [ ] Code compiles without TypeScript errors
- [ ] No linting errors
- [ ] Logger utility imports correctly
- [ ] Error format matches expected structure

**Manual Testing:**
- [ ] **Happy Path:** Upload valid image (< 4MB, JPEG/PNG/GIF/WebP)
  - [ ] Upload succeeds
  - [ ] Server logs show success with debug_id
  - [ ] Gig created with `image_url`

- [ ] **File Too Large:** Upload image > 4MB
  - [ ] Error message: "File too large. Maximum size is 4MB"
  - [ ] Server logs show validation error with debug_id
  - [ ] No file uploaded to storage

- [ ] **Invalid File Type:** Upload non-image file (e.g., PDF)
  - [ ] Error message: "Invalid file type. Please use JPEG, PNG, GIF, or WebP"
  - [ ] Server logs show validation error with debug_id

- [ ] **Check Server Logs:** Reproduce error and verify:
  - [ ] Full error context logged (status code, Supabase error object, path, userId)
  - [ ] Debug ID generated and logged
  - [ ] Error sent to Sentry (if in production mode)

**Error Scenarios (Simulate if possible):**
- [ ] **401/403:** Expire session or modify path to wrong user folder
  - [ ] Error message indicates auth/permission issue
  - [ ] Server logs show HTTP 401/403 with full context

- [ ] **404:** Temporarily rename bucket in Supabase dashboard
  - [ ] Error message: "Storage bucket not found. Please contact support."
  - [ ] Server logs show HTTP 404

- [ ] **409:** Upload same file twice rapidly
  - [ ] Error message: "File already exists. Please try again."
  - [ ] Server logs show HTTP 409

### Vercel Production

**Deployment:**
- [ ] Code deployed to Vercel successfully
- [ ] Environment variables configured (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Logger configured for Sentry integration

**Production Testing:**
- [ ] **Happy Path:** Upload valid image
  - [ ] Upload succeeds
  - [ ] Check Vercel function logs for success entry
  - [ ] Check Sentry for any unexpected errors

- [ ] **Error Reproduction:** Reproduce original error
  - [ ] Check Vercel function logs for error entry with debug_id
  - [ ] Verify full error context logged
  - [ ] Check Sentry for error report
  - [ ] User sees error message with debug_id

**Monitoring:**
- [ ] Set up Sentry alerts for gig image upload errors
- [ ] Monitor Vercel function logs for error patterns
- [ ] Track debug_id usage for error correlation

---

## 📋 Next Steps After Error Reproduction

1. **Reproduce Error:** Attempt gig image upload that fails
2. **Capture Debug ID:** Note the debug_id shown in error toast
3. **Check Logs:** Search server logs (local/Vercel) for matching debug_id
4. **Analyze:** Use Root Cause Analysis template above
5. **Fix:** Apply minimal fix based on status code
6. **Verify:** Re-test upload after fix
7. **Document:** Update this doc with actual root cause and fix

---

## 🔗 Related Files

- `lib/actions/gig-actions.ts` - Upload function with enhanced error handling
- `app/post-gig/actions.ts` - Client-facing create gig action
- `app/admin/gigs/create/actions.ts` - Admin create gig action
- `lib/utils/logger.ts` - Logger utility with Sentry integration
- `supabase/migrations/20260122000000_create_gig_images_storage_bucket.sql` - Storage bucket and RLS policies

---

## 📝 Notes

- Debug IDs are 16-character UUIDs (no dashes) for easy copy/paste
- Error messages are user-friendly but include debug_id for tracing
- Full error details are logged server-side (never exposed to client)
- Logger automatically redacts sensitive data before sending to Sentry

## ⚠️ Critical Configuration

### Runtime Configuration
- **Node.js runtime** is enforced at route segment level:
  - `app/post-gig/page.tsx` - `export const runtime = "nodejs"`
  - `app/admin/gigs/create/page.tsx` - `export const runtime = "nodejs"`
- This ensures `crypto.randomUUID()` and `Buffer.from()` work correctly
- Runtime configs in lib modules may not be honored by Next.js

### Body Size Limits
- **Next.js Server Actions body limit:** `4mb` (configured in `next.config.mjs`)
  - Must be >= max file size (4MB) + form data overhead
  - If uploads fail before logs appear, check this limit first
- **Supabase Storage limit:** 4MB per file (enforced by validation)

### 403 Errors - Still Possible
Even with correct `userId` derived from session, **403 can still occur** if:
- RLS policy not deployed to production environment
- Wrong `bucket_id` in storage policy
- Policy uses incorrect role (`authenticated` vs `public`)
- Policy condition doesn't match actual path structure
- Session cookie not present in server action execution context
