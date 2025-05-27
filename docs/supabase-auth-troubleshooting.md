# Supabase Authentication Troubleshooting Guide

## Common Error Codes

### "unexpected_failure" (500 Error)

This error indicates a server-side issue with Supabase. Possible causes:

1. **Email Provider Issues**: 
   - SMTP configuration is incorrect
   - Email provider is blocking automated emails
   - Rate limits have been exceeded

2. **Database Issues**:
   - The `auth` schema tables have permission issues
   - Database connection problems
   - Triggers or functions failing

3. **Configuration Issues**:
   - Site URL mismatch
   - Redirect URL not properly configured
   - JWT settings misconfigured

## Immediate Solutions

### 1. Temporarily Disable Email Confirmation

If you need users to sign up immediately:

1. Go to Supabase Dashboard → Authentication → Email
2. Disable "Confirm Email" temporarily
3. This will allow users to sign up without email verification
4. Re-enable once the issue is resolved

### 2. Check SMTP Configuration

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Verify SMTP settings:
   - Host and port are correct
   - Username and password are valid
   - Sender email is properly configured
3. Test the email configuration using the "Send test email" feature

### 3. Check Site URL Configuration

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Ensure the Site URL matches your production URL
3. Add all possible redirect URLs to "Additional Redirect URLs"

## Long-term Solutions

### 1. Use a Reliable Email Provider

Consider using a dedicated transactional email service like:
- SendGrid
- Mailgun
- Amazon SES

These services have better deliverability rates and provide detailed logs.

### 2. Implement Alternative Authentication Methods

Add additional authentication methods:
- Social logins (Google, GitHub, etc.)
- Magic link authentication
- Phone authentication

### 3. Monitor Authentication Logs

Regularly check Supabase logs for authentication issues to catch problems early.

## Debugging Steps

1. Check browser console for detailed error messages
2. Review Supabase logs in the dashboard
3. Test authentication in a local development environment
4. Use the Supabase CLI to check database health

## Contact Supabase Support

If issues persist:
1. Gather error logs and reproduction steps
2. Contact Supabase support at support@supabase.io
3. Include your project reference ID
\`\`\`

## 3. Let's create a temporary workaround for email verification:
