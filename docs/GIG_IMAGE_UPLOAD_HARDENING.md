# Gig Image Upload - Hardening Improvements

## ✅ Hardening Tweaks Implemented

### 1. Stronger Random ID Generation ✅

**Before**:
```typescript
const randomId = Math.random().toString(36).substring(7);
```

**After**:
```typescript
import { randomUUID } from "crypto";
const randomId = randomUUID().replace(/-/g, "").substring(0, 8); // Short UUID without dashes
```

**Why**:
- `Math.random()` is not cryptographically secure
- `crypto.randomUUID()` uses Node.js crypto module (cryptographically secure)
- Shortened to 8 characters for cleaner filenames while maintaining uniqueness
- Matches pattern used elsewhere in codebase (`app/api/email/send-verification/route.ts`)

**Impact**:
- Better collision resistance
- More secure random generation
- Consistent with codebase patterns

---

### 2. Path Ownership Assertion in Delete ✅

**Before**:
```typescript
export async function deleteGigImage(
  imageUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  // ... extract path ...
  // No ownership check before delete attempt
  const { error } = await supabase.storage.from("gig-images").remove([path]);
}
```

**After**:
```typescript
export async function deleteGigImage(
  imageUrl: string | null,
  userId: string  // NEW: Required parameter
): Promise<{ success: boolean; error?: string }> {
  // ... extract path ...
  
  // Security hardening: Assert the extracted path starts with the current user's folder
  if (!path.startsWith(`${userId}/`)) {
    console.warn(`Delete attempt rejected: path '${path}' does not belong to user '${userId}'`);
    return {
      success: false,
      error: "Cannot delete image: path does not belong to current user",
    };
  }
  
  // ... proceed with delete ...
}
```

**Why**:
- **Fail fast**: Rejects invalid delete attempts before hitting storage API
- **Reduces log noise**: Prevents unnecessary RLS policy rejections in logs
- **Explicit intent**: Makes ownership validation clear in code
- **Defense in depth**: Even though RLS policy enforces this, this check adds an extra layer

**Security Note**:
- RLS policy still enforces ownership (this is defense in depth, not replacement)
- If path doesn't match user folder, delete fails fast with clear error
- Prevents accidental/malicious delete attempts from reaching storage layer

---

## 📋 Updated Function Signatures

### `deleteGigImage()`
```typescript
// Before
deleteGigImage(imageUrl: string | null): Promise<{ success: boolean; error?: string }>

// After
deleteGigImage(imageUrl: string | null, userId: string): Promise<{ success: boolean; error?: string }>
```

**Breaking Change**: ✅ **YES** - `userId` parameter is now required

**Call Sites Updated**:
- ✅ `app/post-gig/actions.ts` - Passes `user.id`
- ✅ `app/admin/gigs/create/actions.ts` - Passes `user.id`

---

## 🔒 Security Impact

### Before Hardening
- ✅ RLS policies enforced ownership (secure)
- ⚠️ Weak random ID generation (not security-critical but not ideal)
- ⚠️ No early validation in delete (relies solely on RLS)

### After Hardening
- ✅ RLS policies enforced ownership (secure)
- ✅ Strong random ID generation (cryptographically secure)
- ✅ Early ownership validation in delete (fail fast, reduces log noise)

**Verdict**: Defense in depth improved. No security holes existed before, but code is now more robust and explicit.

---

## 📁 Files Changed

### Modified Files
1. `lib/actions/gig-actions.ts`
   - Added `import { randomUUID } from "crypto"`
   - Replaced `Math.random()` with `randomUUID()`
   - Added `userId` parameter to `deleteGigImage()`
   - Added path ownership assertion before delete

2. `app/post-gig/actions.ts`
   - Updated `deleteGigImage()` call to pass `user.id`

3. `app/admin/gigs/create/actions.ts`
   - Updated `deleteGigImage()` call to pass `user.id`

---

## ✅ Testing Checklist

### Random ID Generation
- ✅ Verify IDs are unique (no collisions in test runs)
- ✅ Verify IDs are URL-safe (no special characters)
- ✅ Verify IDs are reasonably short (8 chars after UUID shortening)

### Path Ownership Assertion
- ✅ Try deleting own image → should succeed
- ✅ Try deleting another user's image URL → should fail fast with clear error
- ✅ Verify RLS policy still enforces (double-check security)

---

## 🎯 Summary

**Status**: ✅ **HARDENING COMPLETE**

Both hardening tweaks implemented:
1. ✅ Stronger random ID generation (`crypto.randomUUID()`)
2. ✅ Path ownership assertion in delete (fail fast validation)

**Breaking Changes**: 
- `deleteGigImage()` now requires `userId` parameter
- All call sites updated ✅

**Security**: 
- No new vulnerabilities introduced
- Defense in depth improved
- Code is more explicit and maintainable
