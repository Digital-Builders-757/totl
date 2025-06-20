# ⚙️ Supabase Email Setup Guide

This guide details how to configure the email service within your Supabase project, which is critical for user verification and password resets.

---

## 1. Enable and Configure a Custom SMTP Provider

For reliable email delivery in production, you must configure a custom SMTP provider. Supabase's built-in email service is not designed for production workloads.

1.  Navigate to your Supabase Project: **Project Settings > Auth > SMTP Provider**.
2.  Enter the SMTP credentials for your chosen provider (e.g., SendGrid, Resend, Postmark). You will need:
    - **Host & Port**
    - **Username & Password**
    - **Sender Email**: The "from" address (e.g., `noreply@totl.agency`).
3.  Save the settings. Supabase will now route all authentication emails through this service.

---

## 2. Configure Auth Notification Templates

You can customize the content of the emails Supabase sends.

1.  Navigate to **Auth > Email Templates**.
2.  Customize the following core templates:
    - **Confirmation Signup**: For verifying a new user's email.
    - **Reset Password**: For the "forgot password" flow.
    - **Magic Link**: If you choose to enable passwordless sign-in.
3.  Ensure each template includes the necessary template variable (e.g., `{{ .ConfirmationURL }}`).

---

## 3. Configure Site & Redirect URLs

This step is crucial for ensuring the links in your emails work correctly.

1.  Navigate to **Auth > URL Configuration**.
2.  Set the **Site URL** to your application's production domain (e.g., `https://www.totl.agency`).
3.  Under **Redirect URLs**, ensure you have added the necessary callback paths for your application. By default, this is typically:
    - `http://localhost:3000/auth/callback` (for local development)

---

## 4. Enable "Confirm Email" in Supabase Auth

1.  Navigate to **Auth > Providers > Email**.
2.  Ensure the **"Confirm email"** toggle is enabled. This makes email verification mandatory for all new signups.

---

## 📦 Application Integration

This Supabase setup is consumed by services within our application, primarily for sending custom, non-auth emails (like welcome messages or notifications).

- See `lib/email-service.ts` for how we use the Resend service to send custom emails.
- See `lib/email-templates.tsx` for the React-based templates used for these custom emails.

This separation allows Supabase to handle secure auth emails, while we maintain control over transactional and marketing emails.

## Troubleshooting

If emails are not being sent:

1. Check SMTP credentials
2. Verify your sender email is not being blocked or marked as spam
3. Check Supabase logs for any errors
4. Ensure your application is correctly calling the Supabase auth.signUp method with the proper options

If confirmation links are not working:

1. Ensure the Site URL is correctly set
2. Check that the redirect URL in your application matches what's configured in Supabase
3. Verify the auth.exchangeCodeForSession method is being called correctly in your callback page

## 4. Let's update the verification pending page to be more informative:
