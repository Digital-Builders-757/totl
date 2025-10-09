# 🔧 Environment Setup Guide

## Quick Start

### 1. **Automatic Setup** (Recommended)
```bash
npm run env:setup
```
This will create `.env.local` from the template and guide you through the setup.

### 2. **Manual Setup**
```bash
# Copy the template
cp .env.example .env.local

# Edit with your credentials
nano .env.local  # or use your preferred editor
```

### 3. **Verify Setup**
```bash
npm run env:check
```

## Required Credentials

### 🔑 **Supabase Configuration**
Get these from: https://supabase.com/dashboard/project/[your-project-id]/settings/api

1. **Project URL**: `https://your-project-ref.supabase.co`
2. **Anon Key**: Safe for client-side use
3. **Service Role Key**: Server-side only (keep secret!)

### 📧 **Resend API Key**
Get from: https://resend.com/api-keys

Used for sending:
- Email verification
- Password reset emails
- Welcome emails

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `RESEND_API_KEY` | ✅ | Resend API key for emails | `re_1234567890abcdef...` |
| `NEXT_PUBLIC_APP_URL` | ⚠️ | Base URL for your app | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | ⚠️ | App name for emails/UI | `TOTL Agency` |

## Troubleshooting

### ❌ **"Supabase not configured"**
- Check that `.env.local` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Restart your dev server: `npm run dev`

### ❌ **"Invalid API key"**
- Verify your Supabase keys are correct
- Check that the project is active
- Ensure you're using the right environment (dev vs prod)

### ❌ **"Email sending failed"**
- Verify `RESEND_API_KEY` is set
- Check Resend account status
- Ensure domain is verified in Resend

## Security Notes

- ✅ `.env.local` is git-ignored (safe to commit)
- ✅ `.env.example` is safe to commit (no secrets)
- ❌ Never commit `.env.local` to version control
- ❌ Never expose service role keys to client-side code

## Next Steps

1. **Set up Supabase project** (if not done)
2. **Configure Resend** (if not done)
3. **Run `npm run dev`** to start development
4. **Test signup flow** to verify everything works

---

**Need help?** Check the [main documentation](./README.md) or [troubleshooting guide](./docs/TROUBLESHOOTING_GUIDE.md)
