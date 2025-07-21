# 🔐 Authentication Setup Guide

This document outlines the authentication system for the Totl Agency platform, leveraging Supabase Auth.

---

## 🚀 Overview

The system handles the full user lifecycle:

- User registration (signup)
- User authentication (signin)
- Password reset
- Email verification
- Session management (via `@supabase/auth-helpers-nextjs`)
- Role-based access control (RBAC) via middleware

---

## 🗃️ Database & Auth Integration

The authentication system is tightly integrated with our public tables, which extend the `auth.users` table.

1.  **`auth.users`**: The primary table managed by Supabase for credentials.
2.  **`public.users`**: Our custom table that mirrors `auth.users` and adds a `role` (`talent` or `client`). The `id` is a foreign key to `auth.users.id`.
3.  **`public.talent_profiles` / `public.client_profiles`**: Role-specific tables linked by `user_id`.

---

## 🌊 Authentication Flows

### User Registration (Onboarding)

Our registration process is a two-stage flow designed to reduce initial friction.

1.  **Initial Signup**:
    - A user provides minimal details (name, email, password) in a modal form.
    - An account is created in `auth.users` and a corresponding profile in `public.users` with the appropriate `role`.
    - A verification email is dispatched.
    - The user is redirected to a `/verification-pending` page.

2.  **Profile Completion**:
    - After verifying their email, the user is redirected to their role-specific dashboard (`/talent/dashboard` or `/client/dashboard`).
    - They are prompted to complete their profile, filling in the remaining details in their `talent_profiles` or `client_profiles` table.

For a detailed breakdown of this flow, see **`docs/ONBOARDING.md`**.

### Password Reset

1.  User clicks "Forgot password?" on the login page.
2.  User enters their email, and a reset email is sent via Supabase Auth.
3.  The link in the email directs them to the `/update-password` page.
4.  After setting a new password, the user is redirected to the login page.

---

## 🛡️ Security & Configuration

- **Password Requirements**: Enforced on the client-side (e.g., min 8 characters).
- **Email Verification**: Mandatory for all new accounts. A reminder is shown until the email is verified.
- **Session Management**: Handled by `@supabase/auth-helpers-nextjs`, which securely manages JWTs in cookies.
- **Supabase Auth Settings**:
  - "Confirm email" is enabled.
  - Custom email templates are configured for verification and password reset.
  - Redirect URLs are set in the Supabase dashboard (e.g., `/auth/callback`, `/update-password`).
- **Error Handling**: The system provides user-friendly error messages (e.g., "Invalid credentials") while logging detailed errors for debugging.

---

## ✅ Testing the Auth Flow

- **Registration**: Test with valid, invalid, and duplicate email addresses.
- **Login**: Test with correct, incorrect, and unverified credentials.
- **Password Reset**: Test with existing and non-existing email addresses and expired links.
- **Email Verification**: Test the verification link and attempts to access protected content before verification.

## Troubleshooting

Common issues and their solutions:

1. **User can't log in after registration**
   - Check if email is verified
   - Check for correct email/password combination
   - Check if user exists in auth.users table

2. **Password reset email not received**
   - Check spam folder
   - Verify email address is correct
   - Check Supabase logs for email sending errors

3. **Email verification not working**
   - Check if link has expired
   - Check if email has already been verified
   - Check Supabase configuration for redirect URLs

## Future Enhancements

1. Social authentication (Google, Facebook, etc.)
2. Two-factor authentication
3. Session management improvements (device tracking, etc.)
4. Enhanced security features (IP logging, suspicious activity detection)
