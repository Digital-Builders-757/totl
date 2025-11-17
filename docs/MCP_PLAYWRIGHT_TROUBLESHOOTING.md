# 🔧 Playwright MCP Server Troubleshooting

**Issue:** "No server info found" or "Cannot find module './console'" errors

---

## 🎯 Root Cause

**The Problem:** The Playwright MCP process crashes because the local `playwright-core` install in the **npx cache is broken/incomplete**. When `page.js` tries to `require('./console')`, the file is missing from the temp cache folder, causing Node to throw:

```
Error: Cannot find module './console'
Require stack:
  ...\node_modules\playwright-core\lib\server\page.js
  ...\node_modules\playwright-core\lib\server\frames.js
  ...
  ...\node_modules\@playwright\mcp\cli.js
```

**Why This Happens:** `npx @playwright/mcp@latest` downloads a fresh copy into a temp folder (`C:\Users\young\AppData\Local\npm-cache\_npx\...`) every time. If that download gets corrupted or partially completes, files like `console.js` are missing, and MCP dies before Cursor can list any tools.

---

## ✅ **RECOMMENDED FIX: Use Local Install with --no-install**

Since Playwright is already installed in `package.json`, we should **force Cursor to use the stable local copy** instead of the flaky temp cache.

### **Step 1: Verify Local Installation**

```powershell
# From project root
npm install --save-dev playwright @playwright/test @playwright/mcp
npx playwright install --with-deps chromium
```

✅ **Status:** Already installed in `package.json`:
- `@playwright/mcp@^0.0.47`
- `@playwright/test@^1.56.0`
- `playwright@^1.56.0`

### **Step 2: Update Cursor MCP Config**

**Location:** `c:\Users\young\.cursor\mcp.json`

**Recommended Configuration:**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "--no-install",
        "@playwright/mcp",
        "--browser=chromium",
        "--headless",
        "--allowed-hosts=localhost,totl-agency.vercel.app",
        "--test-id-attribute=data-testid"
      ]
    }
  }
}
```

**Key Change:** `--no-install` tells `npx` to **only use node_modules in this repo, don't download anything**. This dodges the temp-cache corruption entirely.

**Alternative (if above doesn't work):**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "--no-install",
        "@playwright/mcp@0.0.47",
        "--browser=chromium",
        "--headless",
        "--allowed-hosts=localhost,totl-agency.vercel.app",
        "--test-id-attribute=data-testid"
      ]
    }
  }
}
```

**Note:** Pinning to a specific version (`@0.0.47`) ensures stability if newer versions have packaging bugs.

---

## 🔄 Next Steps

### **1. Restart Cursor**
**CRITICAL:** After changing `mcp.json`, you MUST restart Cursor completely:
1. Close all Cursor windows
2. Wait a few seconds
3. Reopen Cursor
4. The MCP server should now connect

### **2. Verify Connection**
After restarting, check if Playwright MCP is working:
- Try using Playwright tools in chat
- Check Cursor's MCP status (usually in settings or status bar)

---

## 🧪 Alternative Configurations

If the recommended `--no-install` approach doesn't work, try these:

### **Option 1: Direct Node Execution (Bypass npx Entirely)**
Since we installed `@playwright/mcp` locally, you can use:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "./node_modules/@playwright/mcp/cli.js",
        "--browser=chromium",
        "--headless",
        "--allowed-hosts=localhost,totl-agency.vercel.app",
        "--test-id-attribute=data-testid"
      ]
    }
  }
}
```

**Note:** This requires using absolute paths or running from project root.

### **Option 2: Pin Known-Good Version**
If newer MCP versions have packaging bugs, pin to a stable version:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "--no-install",
        "@playwright/mcp@0.0.45",
        "--browser=chromium",
        "--headless"
      ]
    }
  }
}
```

### **Option 3: Use Full Path to npx (Windows)**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": [
        "--no-install",
        "@playwright/mcp",
        "--browser=chromium",
        "--headless"
      ]
    }
  }
}
```

---

## 🐛 Common Issues & Fixes

### **Issue: "Cannot find module './console'"**

**Root Cause:** Broken/incomplete `playwright-core` install in npx temp cache.

**Fix 1: Clear npx Cache (Quick Fix)**

```powershell
# Close Cursor first!
# 1. Clear npm cache
npm cache clean --force

# 2. Delete any old npx temp installs
Remove-Item "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Force -ErrorAction SilentlyContinue
```

Then test manually:
```powershell
npx @playwright/mcp@latest --help
```

If that prints CLI help instead of the console error, you're good. Re-open Cursor.

**Fix 2: Use Local Install (RECOMMENDED - Permanent Fix)**

Update Cursor MCP config to use `--no-install` (see Step 2 above). This prevents npx from ever touching the temp cache.

**Fix 3: Verify Missing File**

To confirm the root cause, check if `console.js` is missing:

1. Navigate in Explorer to:
   ```
   C:\Users\young\AppData\Local\npm-cache\_npx\[hash]\node_modules\playwright-core\lib\server\
   ```
2. Look for `console.js`
3. If it's missing, that's exactly why Node can't `require('./console')`

### **Issue: "No server info found"**
**Causes:**
1. MCP config format is wrong (should be fixed now)
2. Cursor hasn't been restarted after config change
3. Node.js version incompatibility (you're on v20.14.0, which should work)

**Solution:**
1. Restart Cursor completely
2. Check Cursor logs for MCP errors
3. Verify the command works: `npx @playwright/mcp@latest --version`

### **Issue: Server starts but tools don't work**
**Solution:**
- Make sure Playwright browsers are installed:
```bash
npx playwright install
```

---

## 📋 Verification Checklist

- [x] Package installed: `@playwright/mcp` (v0.0.47) in `package.json`
- [x] Playwright browsers installed locally
- [x] **MCP config updated with `--no-install` flag** ✅ RESOLVED (Nov 16, 2025)
- [x] **Cursor restarted completely** ✅ RESOLVED (Nov 16, 2025)
- [x] MCP server connects after restart ✅ RESOLVED (Nov 16, 2025)
- [x] Playwright tools appear in Cursor chat ✅ RESOLVED (Nov 16, 2025)

## ✅ **RESOLUTION STATUS**

**Date Resolved:** November 16, 2025  
**Status:** ✅ **FULLY RESOLVED**

The issue has been successfully fixed using the recommended `--no-install` approach:

1. ✅ Installed `@playwright/mcp` locally in `node_modules`
2. ✅ Updated MCP config to use `--no-install` flag
3. ✅ Changed server name to lowercase `"playwright"` for consistency
4. ✅ Verified command works: `npx --no-install @playwright/mcp --help`
5. ✅ Playwright MCP server now connects successfully in Cursor

**Final Working Config:**
```json
"playwright": {
  "command": "npx",
  "args": [
    "--no-install",
    "@playwright/mcp",
    "--browser=chromium",
    "--headless",
    "--allowed-hosts=localhost,totl-agency.vercel.app",
    "--test-id-attribute=data-testid"
  ],
  "env": {}
}
```

**Key Learnings:**
- Always install MCP packages locally (`npm install --save-dev @playwright/mcp`)
- Use `--no-install` flag to bypass corrupted npx cache
- Verify installation with manual command before restarting Cursor
- Server name should be lowercase for consistency

---

## 🔍 Debug Steps

1. **Test the command manually:**
   ```bash
   npx @playwright/mcp@latest --version
   ```
   Should output: `Version 0.0.47`

2. **Check Cursor logs:**
   - Look for MCP-related errors in Cursor's output
   - Usually in: Help → Toggle Developer Tools → Console

3. **Verify Node.js:**
   ```bash
   node --version
   ```
   Should be v20.14.0 or higher

4. **Check npx works:**
   ```bash
   npx --version
   ```

---

## 🎯 **Summary: What You're Actually Fixing**

There is **no bug in your Cursor config or test code**. The issue is:

1. **Broken npx cache** - Temp installs get corrupted/incomplete
2. **Missing files** - `console.js` and other files missing from `playwright-core`
3. **Solution** - Use `--no-install` to force stable local install

**Current Status:** ✅ Packages installed locally. **Update MCP config with `--no-install` and restart Cursor.**

---

## 📚 Resources

- [Playwright MCP Documentation](https://github.com/playwright-community/playwright-mcp)
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [Cursor MCP Setup](https://docs.cursor.com/mcp)
- [GitHub Issue: playwright mcp package installation](https://github.com/microsoft/playwright/issues/35264)


