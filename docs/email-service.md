# 📤 Custom Email Service Guide

This document covers the implementation of our custom transactional email service, which uses **Resend** to send non-authentication-related emails.

---

## Separation of Concerns: Auth vs. Transactional Emails

It is critical to understand the separation of email services in this application:

- **Supabase Auth Emails**: Supabase's built-in email service (configured with a custom SMTP provider) handles all security-critical emails:
  - Email Verification / Confirmation
  - Password Reset Links
  - Magic Links

  This is configured in the Supabase dashboard. See `docs/supabase-email-setup.md`.

- **Custom Transactional Emails**: This service, using Resend, handles all other application-specific emails that are not part of the core authentication flow:
  - Welcome emails
  - Application status notifications
  - New gig alerts, etc.

This separation ensures that secure tokens are handled by Supabase's trusted infrastructure, while we maintain full control over the design and content of our application's transactional emails.

---

## 🛠️ Configuration

### Environment Variables

The following environment variables must be set in `.env.local`:

```env
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SITE_URL=https://www.totl.agency
```

### Resend Setup

1. Create a [Resend](https://resend.com) account.
2. Verify your sending domain (e.g., `totl.agency`).
3. Configure DNS records (SPF, DKIM) to ensure high deliverability.
4. Generate an API key and add it to your environment variables.

---

## 🎨 Email Templates

All custom email templates are built as React components in `lib/email-templates.tsx`. They are rendered to static HTML before being sent. This allows for type-safe, maintainable, and consistently branded emails.

### Available Templates

- **Welcome Email**: Sent to a user after they sign up.

---

## Endpoints & Usage

### API Route: `/api/email/send-welcome`

This route is responsible for sending the welcome email.

**Request Body:**

```json
{
  "email": "user@example.com",
  "firstName": "Jane"
}
```

### Frontend Hook: `useEmailService`

The `hooks/use-email-service.ts` hook provides a simple interface for triggering emails from the frontend.

**Example:**

```tsx
const { sendWelcomeEmail, isLoading, error } = useEmailService();

const handleSuccessfulSignup = async (email, firstName) => {
  // ... after user is created ...
  await sendWelcomeEmail({ email, firstName });
};
```

---

## 🧰 Maintenance

To add a new transactional email:

1.  Create a new React component in `lib/email-templates.tsx`.
2.  Create a new API route under `app/api/email/` to handle sending it.
3.  (Optional) Add a corresponding method to the `useEmailService` hook.
4.  Document the new email type here.

## Error Handling and Logging

All email sending attempts are logged for monitoring purposes. Logs include:

- Recipient email
- Template used
- Success/failure status
- Error message (if applicable)

## Security Considerations

1. All API endpoints validate input data
2. Email templates are sanitized to prevent XSS attacks
3. Rate limiting is applied to prevent abuse
4. Sensitive operations require authentication

## Troubleshooting

Common issues and solutions:

1. **Emails not sending**: Check Resend API key and domain verification
2. **Emails going to spam**: Ensure domain is properly configured with SPF, DKIM, and DMARC
3. **Template rendering issues**: Verify HTML compatibility with email clients
