# Supabase MCP Quick Start

**Quick setup guide for Supabase MCP server**

---

## ⚡ Quick Setup (2 Steps)

### **Step 1: Get Your Access Token**

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate New Token"**
3. Name it: `TOTL MCP Server`
4. Copy the token (starts with `sbp_`)

### **Step 2: Run Update Script**

```powershell
.\scripts\update-mcp-simple.ps1
```

Enter your access token when prompted.

**That's it!** Restart Cursor and test with:
```
"List all tables in my Supabase database"
```

---

## 📋 Manual Configuration

If you prefer to update manually:

**File:** `c:\Users\young\.cursor\mcp.json`

**Replace the `supabase` section with:**

```json
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
    "SUPABASE_ACCESS_TOKEN": "sbp_YOUR_TOKEN_HERE"
  }
}
```

**Replace `sbp_YOUR_TOKEN_HERE` with your actual token.**

---

## ✅ Verify It Works

After restarting Cursor, try:

```
"List all tables in my Supabase database"
"Show me the schema for the profiles table"
"Query the first 5 records from the profiles table"
```

---

## 🔗 Full Documentation

See [`SUPABASE_MCP_SETUP_GUIDE.md`](./SUPABASE_MCP_SETUP_GUIDE.md) for complete details.

---

**Last Updated:** November 17, 2025

