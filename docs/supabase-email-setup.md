# Supabase Email Confirmation Setup Guide

This guide will help you properly configure email confirmation in your Supabase project for the TOTL Agency application.

## 1. Configure SMTP Settings in Supabase

1. Log in to your Supabase dashboard
2. Navigate to Authentication > Email Templates
3. Click on "Enable SMTP" if you haven't already
4. Enter your SMTP credentials:
   - Host: (e.g., smtp.gmail.com, smtp.sendgrid.net)
   - Port: (typically 587 for TLS or 465 for SSL)
   - Username: Your SMTP username
   - Password: Your SMTP password
   - Sender Name: TOTL Agency
   - Sender Email: The email address you want to send from

## 2. Configure Email Templates

1. Still in the Email Templates section, customize the following templates:
   - Confirmation Email
   - Invite Email
   - Magic Link Email
   - Reset Password Email

2. For the Confirmation Email template:
   - Subject: Confirm your TOTL Agency account
   - Make sure the template includes the confirmation link: {{ .ConfirmationURL }}
   - Customize the design to match your brand

## 3. Configure Site URL

1. Go to Authentication > URL Configuration
2. Set the Site URL to your production URL (e.g., https://your-app-domain.com)
3. Add any additional redirect URLs if needed

## 4. Configure Auth Settings

1. Go to Authentication > Settings
2. Under "Email Auth":
   - Enable "Enable Email Signup"
   - Enable "Confirm Email"
   - Set "Confirm Email Template" to your confirmation template

## 5. Test the Email Flow

1. Create a test account using your application
2. Check if the confirmation email is received
3. Click the confirmation link and verify it works correctly

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
\`\`\`

## 4. Let's update the verification pending page to be more informative:
