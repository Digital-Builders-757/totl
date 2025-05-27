# Authentication Setup Documentation

This document outlines the authentication system implemented for the TOTL Agency platform, focusing on the talent user authentication flow.

## Overview

The authentication system uses Supabase Auth for user management, with custom UI components and logic to handle the following processes:

- User registration (sign-up)
- User authentication (sign-in)
- Password reset
- Email verification
- Session management
- Role-based access control

## Database Structure

The authentication system relies on the following database tables:

1. **auth.users** (managed by Supabase)
   - Stores user credentials and authentication data

2. **profiles**
   - Stores user profile information and role
   - Connected to auth.users via the id field

3. **talent_profiles**
   - Stores talent-specific information
   - Connected to profiles via the user_id field

## Authentication Flow

### Talent Registration Flow

1. User clicks "Join as Talent" on the choose-role page
2. User completes the talent application form with personal details
3. Form validation occurs on the client side
4. On submission, the following happens:
   - User account is created in Supabase Auth
   - Profile record is created with role="talent"
   - Talent profile record is created with user details
   - Verification email is sent to the user
   - User is redirected to the talent dashboard with a verification reminder

### Email Verification

1. User receives verification email with a link
2. User clicks the link and is redirected to the auth/callback page
3. The callback page processes the verification and redirects to the login page
4. A verification reminder is shown on the talent dashboard until the email is verified

### Password Reset Flow

1. User clicks "Forgot password?" on the login page
2. User enters their email address
3. Reset password email is sent
4. User clicks the link in the email
5. User is redirected to the update-password page
6. User sets a new password
7. User is redirected to the login page

## Security Considerations

1. **Password Requirements**
   - Minimum 8 characters
   - Client-side validation with clear error messages

2. **Email Verification**
   - Required for all new accounts
   - Reminder shown until verification is complete

3. **Session Management**
   - Sessions are managed by Supabase Auth
   - Session expiration is set to 1 week

4. **Error Handling**
   - Detailed error messages for users
   - Error logging for debugging
   - Generic error messages for security-sensitive operations

## Supabase Configuration

### Auth Settings

1. **Email Auth**
   - Enabled with "Confirm email" option
   - Custom email templates for verification and password reset

2. **Redirect URLs**
   - Site URL: https://totl-agency.com (production)
   - Redirect URLs:
     - /auth/callback
     - /update-password

3. **JWT Settings**
   - Default expiry: 3600 (1 hour)
   - Default refresh expiry: 604800 (1 week)

## Testing the Authentication Flow

1. **Registration Testing**
   - Test with valid and invalid email formats
   - Test password requirements
   - Test duplicate email handling

2. **Login Testing**
   - Test with correct and incorrect credentials
   - Test with unverified email accounts

3. **Password Reset Testing**
   - Test with existing and non-existing email addresses
   - Test password reset link expiration
   - Test new password requirements

4. **Email Verification Testing**
   - Test verification link functionality
   - Test resending verification emails
   - Test accessing restricted features before verification

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
