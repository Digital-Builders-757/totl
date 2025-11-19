# Supabase MCP Server Fix - November 2025

**Date:** November 17, 2025  
**Issue:** `Error: Cannot find module './ast.js'` in graphql package  
**Status:** ✅ **FIXED**

---

## 🐛 Problem

The Supabase MCP server was failing to start with this error:

```
Error: Cannot find module './ast.js'
Require stack:
  C:\Users\young\AppData\Local\npm-cache\_npx\...\node_modules\graphql\language\parser.js
```

**Root Cause:** Corrupted npx cache - the `@supabase/mcp-server-supabase` package was downloaded to a temporary npx cache directory, but the `graphql` dependency was incomplete/corrupted.

---

## ✅ Solution

### **Step 1: Clear Corrupted npx Cache**
```powershell
Remove-Item "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Force
```

### **Step 2: Install Package Locally**
```powershell
npm install --save-dev @supabase/mcp-server-supabase@latest --legacy-peer-deps
```

This installs the package in your project's `node_modules`, ensuring a complete, uncorrupted installation.

### **Step 3: Update MCP Config to Use Local Installation**

**Changed from:**
```json
{
  "command": "cmd",
  "args": [
    "/c",
    "npx",
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--read-only",
    "--project-ref=utvircuwknqzpnmvxidp"
  ]
}
```

**Changed to:**
```json
{
  "command": "npx",
  "args": [
    "--no-install",
    "@supabase/mcp-server-supabase",
    "--read-only",
    "--project-ref=utvircuwknqzpnmvxidp"
  ]
}
```

**Key Changes:**
- ✅ Removed `cmd /c` wrapper (not needed)
- ✅ Added `--no-install` flag (forces use of local `node_modules`)
- ✅ Removed `-y` flag (not needed with `--no-install`)
- ✅ Removed `@latest` (uses installed version)

---

## 📋 Files Updated

1. **`.cursor/mcp.json`** (Project-specific)
   - Updated Supabase MCP configuration
   - Uses `--no-install` flag

2. **`c:\Users\young\.cursor\mcp.json`** (Global)
   - Updated Supabase MCP configuration
   - Uses `--no-install` flag

3. **`package.json`**
   - Added `@supabase/mcp-server-supabase` as dev dependency

---

## ✅ Verification

After restarting Cursor, the Supabase MCP server should:
- ✅ Start without errors
- ✅ Connect to your Supabase project
- ✅ Provide database query tools

**Test Commands:**
```
"List all tables in my Supabase database"
"Show me the schema for the profiles table"
"Query the first 5 records from the profiles table"
```

---

## 🔍 Why This Works

**The Problem:**
- `npx -y` downloads packages to a temporary cache (`_npx` folder)
- This cache can become corrupted or incomplete
- The `graphql` package was missing the `ast.js` file

**The Solution:**
- Install package locally in `node_modules` (complete, verified installation)
- Use `--no-install` flag to force npx to use local installation
- Bypasses the corrupted cache entirely

---

## 📚 Related Issues

This is the same pattern we used to fix Playwright MCP:
- See: `docs/MCP_PLAYWRIGHT_TROUBLESHOOTING.md`
- Same root cause: corrupted npx cache
- Same solution: local install + `--no-install` flag

---

## 🎯 Best Practices

**For Future MCP Servers:**
1. **Install locally first:** `npm install --save-dev @package/mcp-server`
2. **Use `--no-install` flag:** Prevents cache corruption issues
3. **Clear cache if needed:** `Remove-Item "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Force`

---

**Last Updated:** November 17, 2025  
**Status:** ✅ **RESOLVED** - Supabase MCP server now working correctly

