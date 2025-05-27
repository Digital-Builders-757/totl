# Talent Account Creation Flow Documentation

This document outlines the complete talent account creation flow for the TOTL Agency platform, including the integration of the "Join as Talent" and "Get Discovered (Talent)" buttons.

## Overview

The talent account creation flow consists of the following steps:

1. User clicks on a talent signup button (either "Join as Talent" or "Get Discovered (Talent)")
2. User completes the talent application form
3. User receives a verification email
4. User verifies their email address
5. User can log in and access the talent dashboard

## Button Integration

The following buttons have been integrated to direct users to the talent signup flow:

1. **Homepage Hero Section**:
   - "Create a Free Account" button
   - "Get Discovered (Talent)" button in the role selection section

2. **Choose Role Page**:
   - "Join as Talent" button

All these buttons link to `/talent/signup`, with an optional `returnUrl` parameter for redirecting after signup.

## Technical Implementation

### 1. Signup Process

When a user submits the talent signup form, the following happens:

1. Client-side validation is performed to ensure all required fields are filled correctly
2. The `signUp` function from the AuthProvider is called with the user's email, password, and role ("talent")
3. Supabase Auth creates a new user account
4. A profile record is created in the `profiles` table with the user's role
5. A talent profile record is created in the `talent_profiles` table with the user's details
6. Supabase sends a verification email to the user
7. The user is redirected to the verification pending page

### 2. Email Verification

The email verification process works as follows:

1. User receives an email with a verification link
2. The link redirects to `/auth/callback` with a verification code
3. The auth callback page exchanges the code for a session
4. The user's `email_verified` status is updated in the profiles table
5. The user is redirected to the login page with a success message

### 3. Resend Verification Email

Users can resend the verification email in two places:

1. On the verification pending page after signup
2. On the talent dashboard if they haven't verified their email yet

The resend functionality uses Supabase Auth's `resend` method with the type set to "signup".

## Supabase Configuration

To enable email verification, the following Supabase configuration is required:

1. **Authentication Settings**:
   - Email auth provider enabled
   - "Confirm email" option enabled
   - Custom email templates for verification (optional)

2. **URL Configuration**:
   - Site URL: The base URL of your application
   - Redirect URLs: Must include `/auth/callback` and `/update-password`

## API Keys and Environment Variables

The following environment variables are required:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

These should be set in your `.env.local` file for local development and in your hosting platform's environment variables for production.

## Testing the Flow

To test the talent account creation flow:

1. Click on any "Join as Talent" or "Get Discovered (Talent)" button
2. Fill out the talent application form with valid information
3. Submit the form
4. Check the email inbox for the verification email
5. If needed, test the resend verification email functionality
6. Click the verification link in the email
7. Log in with the created credentials
8. Verify that you can access the talent dashboard
9. Check that your profile information is correctly displayed

## Troubleshooting

Common issues and their solutions:

1. **Verification email not received**:
   - Check spam/junk folder
   - Verify the email address is correct
   - Use the resend verification email functionality
   - Check Supabase logs for email sending errors

2. **Error during signup**:
   - Check if the email is already registered
   - Ensure all required fields are filled correctly
   - Check browser console for any JavaScript errors
   - Verify Supabase connection and credentials

3. **Verification link not working**:
   - Check if the link has expired (valid for 24 hours by default)
   - Ensure the redirect URL is properly configured in Supabase
   - Check for any URL encoding issues

## Security Considerations

1. **Password Requirements**:
   - Minimum 8 characters
   - Client-side validation with clear error messages

2. **Email Verification**:
   - Required for all new accounts
   - Reminder shown until verification is complete

3. **Protected Routes**:
   - Middleware ensures only authenticated users can access protected routes
   - Role-based access control for different user types
