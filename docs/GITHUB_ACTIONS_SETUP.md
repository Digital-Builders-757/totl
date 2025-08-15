# GitHub Actions Setup

## Required Secrets

The schema verification workflow requires two GitHub secrets to be configured:

### 1. SUPABASE_ACCESS_TOKEN
- **Type**: Personal Access Token
- **Format**: `sbp_...` (starts with `sbp_`)
- **How to get it**:
  1. Go to [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
  2. Click "Generate new token"
  3. Give it a name (e.g., "GitHub Actions")
  4. Copy the token (starts with `sbp_`)

### 2. SUPABASE_PROJECT_ID
- **Type**: Project Reference ID
- **Format**: 20-character lowercase string (e.g., `utvircuwknqzpnmvxidp`)
- **How to get it**:
  1. Go to your Supabase project dashboard
  2. Click on "Settings" → "General"
  3. Copy the "Reference ID" (20 characters, lowercase)

## Setting up Secrets

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add both secrets:
   - Name: `SUPABASE_ACCESS_TOKEN`, Value: `sbp_your_token_here`
   - Name: `SUPABASE_PROJECT_ID`, Value: `your_project_id_here`

## Workflow Behavior

The schema verification workflow will:
1. Generate TypeScript types from your **remote** Supabase schema
2. Compare them with your committed `types/database.ts`
3. Fail if they don't match (ensuring schema truth)
4. Run the PowerShell verification script

This approach avoids Docker dependencies in CI and provides reliable schema verification.
