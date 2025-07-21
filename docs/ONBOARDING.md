# 🚀 Totl Agency - User Onboarding Guide

This document outlines the complete user onboarding flow for both **Talent** and **Clients**. The process is designed to be streamlined, reducing initial friction while gathering necessary details post-registration.

---

## 📝 Core Philosophy

Our onboarding process follows a two-stage approach:

1.  **Initial, Minimal Signup**: Collect only the essential information needed to create an account (name, email, password). This is typically done via a modal to keep the user in context.
2.  **Progressive Profile Completion**: After email verification, the user is guided to complete their full profile inside their respective dashboard. This includes role-specific details (e.g., measurements for talent, company info for clients).

---

## 🕺 Talent Onboarding Flow

### Step 1: Initial Signup

1.  **Trigger**: The user clicks an "Apply as Talent" or similar call-to-action button.
2.  **Interface**: A modal dialog (`TalentSignupForm`) appears, containing a simple form.
3.  **Fields Collected**:
    - First & Last Name
    - Email Address
    - Password
    - Agreement to Terms of Service
4.  **Action**:
    - A new user is created in `auth.users`.
    - A corresponding record is created in our public `users` table with the `role` set to `'talent'`.
    - A new, mostly empty `talent_profiles` record is created, linked to the user's ID.
    - A verification email is sent via Supabase Auth.
5.  **Redirect**: The user is sent to a `/verification-pending` page, which instructs them to check their email.

### Step 2: Email Verification & Profile Completion

1.  **Verification**: The user clicks the link in their email, which routes them through the `/auth/callback` endpoint. Supabase verifies the token and authenticates the user.
2.  **Redirect to Dashboard**: Upon successful verification, the user is redirected to the `/talent/dashboard`.
3.  **Profile Completion Prompt**:
    - The dashboard detects that the user's `talent_profiles` record is incomplete.
    - A prominent alert or banner prompts the user to complete their profile.
4.  **Onboarding Form**: The user is directed to an onboarding or profile settings page where they fill in the remaining details:
    - **Personal Information**: Phone, age, location, measurements, etc.
    - **Professional Information**: Experience, specialties, portfolio links, etc.
5.  **Action**: The `talent_profiles` table is updated with the new information. The user's profile is now considered complete.

---

## 🏢 Client Onboarding Flow

The client onboarding flow mirrors the talent flow, but is tailored to their needs.

### Step 1: Initial Signup

1.  **Trigger**: The user clicks a "Hire Talent" or "Join as Client" button.
2.  **Interface**: A modal dialog appears for client signup.
3.  **Fields Collected**:
    - Full Name
    - Company Name
    - Email Address
    - Password
4.  **Action**:
    - A new user is created in `auth.users`.
    - A `users` record is created with the `role` set to `'client'`.
    - A new, mostly empty `client_profiles` record is created.
    - A verification email is sent.
5.  **Redirect**: The user is sent to the `/verification-pending` page.

### Step 2: Email Verification & Profile Completion

1.  **Verification**: The user verifies their email via the link and the `/auth/callback` route.
2.  **Redirect to Dashboard**: The user is redirected to the `/client/dashboard`.
3.  **Profile Completion**: The user is prompted to complete their `client_profiles` record with details such as:
    - Company Industry
    - Company Size
    - Website
4.  **Action**: The `client_profiles` table is updated. The client can now post gigs.

---

## 🛡️ Security & Technical Notes

- **RLS Policies**: All profile tables (`profiles`, `talent_profiles`, `client_profiles`) have RLS policies ensuring users can only edit their own data.
- **Protected Routes**: The `/talent/*` and `/client/*` routes are protected by middleware, redirecting unauthenticated users to `/login`.
- **Component-Based**: The signup forms are reusable React components that can be placed in modals or on dedicated pages.

---

## 🛠 Plan

1. **Review your current talent signup form/component** (likely `components/talent-signup-form.tsx` or `app/talent/signup/page.tsx`).
2. **Update the `signUp` call** to ensure it always passes the required metadata: `role`, `first_name`, and `last_name`.
3. **Add or improve error handling** and optionally add frontend validation to block signups without a role.
4. **Provide a summary of the changes** and instructions for testing.

---

## Step 1: Review the Signup Form

From previous code search, your `TalentSignupForm` already calls `signUp` with a `data` object:
```ts
<code_block_to_apply_changes_from>
```
**However:**  
- If the `signUp` function in your `auth-provider` or wherever it’s defined does not forward this `data` to Supabase as `options.data`, the metadata will not reach the backend trigger.

---

## Step 2: Fix the `signUp` Implementation

Let’s ensure your `signUp` function in `auth-provider.tsx` (or wherever it’s defined) looks like this:
```ts
const signUp = async (
  email: string,
  password: string,
  options?: { data?: any; emailRedirectTo?: string }
) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options, // <-- This must include the data object!
  });
  return { error };
};
```
**If you see something like this, you’re good. If not, I’ll update it.**

---

## Step 3: Add/Improve Validation (Optional)

- Ensure the form requires first name, last name, and role before allowing submission.
- Add error messages if any are missing.

---

## Step 4: Test and Document

- After the fix, sign up as a talent.
- Check Supabase:  
  - `profiles` should have `role = talent`
  - `talent_profiles` should have the user’s name

---

## Would you like me to:

- **Review and fix your existing signup form file?**
- **Generate a new, standalone `sign-up.ts` module with the correct logic?**
- **Or both?**

Let me know your preference, and I’ll implement the fix right away!
