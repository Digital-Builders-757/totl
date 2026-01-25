# Supabase MCP Server Setup Guide

**Date:** November 17, 2025  
**Status:** ✅ Updated Configuration

---

## 🎯 Overview

This guide explains how to set up the Supabase MCP server using the command-based configuration (recommended over URL-based).

---

## 📋 Prerequisites

1. **Supabase Project Reference**
   - Your project reference: `utvircuwknqzpnmvxidp`
   - Found in: Supabase Dashboard → Project Settings → General

2. **Supabase Personal Access Token**
   - Get from: https://supabase.com/dashboard/account/tokens
   - Starts with: `sbp_`
   - Required for MCP server authentication

---

## 🔧 Configuration Method

### **Option 1: Automated Script (Recommended)**

Run the PowerShell script:

```powershell
.\scripts\update-supabase-mcp.ps1
```

The script will:
- ✅ Read your current MCP configuration
- ✅ Prompt for your Supabase Access Token
- ✅ Update the Supabase MCP configuration
- ✅ Create a backup of your original config
- ✅ Use project reference: `utvircuwknqzpnmvxidp`

### **Option 2: Manual Configuration**

**File Location:** `c:\Users\young\.cursor\mcp.json`

**Update the `supabase` section:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=utvircuwknqzpnmvxidp"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_YOUR_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

**Replace:**
- `utvircuwknqzpnmvxidp` with your actual project reference (already correct)
- `sbp_YOUR_ACCESS_TOKEN_HERE` with your personal access token

---

## 🔑 Getting Your Supabase Access Token

### **Step 1: Navigate to Access Tokens**
1. Go to: https://supabase.com/dashboard/account/tokens
2. Login to your Supabase account

### **Step 2: Create New Token**
1. Click **"Generate New Token"**
2. Name it: `TOTL MCP Server`
3. Set expiration (optional, or leave as "Never expires")
4. Click **"Generate Token"**

### **Step 3: Copy Token**
1. **⚠️ IMPORTANT:** Copy the token immediately
2. Token format: `sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. You won't be able to see it again!

### **Step 4: Store Securely**
- Add to your `.env.local` file:
  ```env
  SUPABASE_ACCESS_TOKEN=sbp_your-token-here
  ```
- Or use the script which will prompt for it

---

## ✅ Verification Steps

### **1. Restart Cursor**
- Close ALL Cursor windows completely
- Wait 5 seconds
- Reopen Cursor

### **2. Test Connection**
Try these commands in Cursor chat:

```
"List all tables in my Supabase database"
"Show me the schema for the profiles table"
"Query the first 5 records from the profiles table"
"What's the structure of my gigs table?"
```

### **3. Check MCP Status**
- Look for Supabase tools in Cursor
- No errors in Cursor's MCP connection logs

---

## 🔍 Configuration Details

### **Current Setup:**
- **Project Reference:** `utvircuwknqzpnmvxidp`
- **Mode:** Read-only (safe for queries)
- **Package:** `@supabase/mcp-server-supabase@latest`
- **Command:** Uses `npx` to run the latest version

### **Why Command-Based?**
- ✅ More reliable than URL-based
- ✅ Supports authentication
- ✅ Can use read-only mode for safety
- ✅ Automatically updates to latest version

### **Read-Only Mode:**
The `--read-only` flag ensures:
- ✅ Safe for queries and schema inspection
- ✅ Prevents accidental data modifications
- ✅ Perfect for development and debugging

---

## 🐛 Troubleshooting

### **Issue: MCP Server Not Connecting**

**Symptoms:**
- No Supabase tools available
- Errors in Cursor logs

**Solutions:**
1. **Verify Access Token:**
   - Check token starts with `sbp_`
   - Ensure token hasn't expired
   - Regenerate if needed

2. **Check Project Reference:**
   - Verify `utvircuwknqzpnmvxidp` matches your project
   - Find in: Supabase Dashboard → Settings → General

3. **Restart Cursor:**
   - Close all windows
   - Wait 5 seconds
   - Reopen

4. **Check Network:**
   - Ensure you can access `https://supabase.com`
   - Check firewall/proxy settings

### **Issue: "Access Denied" Errors**

**Cause:** Invalid or expired access token

**Solution:**
1. Go to: https://supabase.com/dashboard/account/tokens
2. Generate a new token
3. Update `mcp.json` with new token
4. Restart Cursor

### **Issue: Tools Not Available**

**Possible Causes:**
- MCP server not started
- Configuration syntax error
- Package installation failed

**Solutions:**
1. Check `mcp.json` syntax (valid JSON)
2. Try running manually:
   ```powershell
   npx -y @supabase/mcp-server-supabase@latest --project-ref=utvircuwknqzpnmvxidp
   ```
3. Check Cursor logs for errors

---

## 📚 Related Documentation

- [`docs/SUPABASE_MCP_CONNECTION_TEST.md`](./SUPABASE_MCP_CONNECTION_TEST.md) - Connection testing guide
- [`docs/SUPABASE_MCP_QUERY_RESULTS.md`](./SUPABASE_MCP_QUERY_RESULTS.md) - Database schema reference
- [Supabase MCP Documentation](https://supabase.com/docs/guides/mcp)

---

## 🔄 Migration from URL-Based Config

**Old Configuration (URL-based):**
```json
{
  "supabase": {
    "url": "https://mcp.supabase.com/mcp?project_ref=utvircuwknqzpnmvxidp"
  }
}
```

**New Configuration (Command-based):**
```json
{
  "supabase": {
    "command": "cmd",
    "args": [
      "/c",
      "npx",
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=utvircuwknqzpnmvxidp"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "sbp_your-token-here"
    }
  }
}
```

**Benefits:**
- ✅ Better authentication support
- ✅ Read-only mode for safety
- ✅ More reliable connection
- ✅ Automatic package updates

---

**Last Updated:** November 17, 2025  
**Status:** ✅ Configuration Updated

