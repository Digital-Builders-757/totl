# 🚀 Playwright MCP Quick Fix Guide

**Problem:** "Cannot find module './console'" or "No server info found"

**Solution:** Update Cursor MCP config to use local install with `--no-install`

---

## ⚡ **Quick Fix (2 Steps)**

### **Step 1: Update Cursor MCP Config**

**File:** `c:\Users\young\.cursor\mcp.json`

**Replace your current Playwright config with:**

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

**Key:** The `--no-install` flag forces npx to use your local `node_modules` instead of downloading to a temp cache.

### **Step 2: Restart Cursor**

1. **Close ALL Cursor windows** (completely exit)
2. Wait 5 seconds
3. Reopen Cursor
4. Playwright MCP should now connect!

---

## ✅ **Verify It Works**

After restarting, try using Playwright tools in Cursor chat. You should see:
- `browser_navigate`
- `browser_snapshot`
- `browser_click`
- etc.

If tools appear, you're good! 🎉

---

## 🔧 **If It Still Doesn't Work**

See the full troubleshooting guide: `docs/MCP_PLAYWRIGHT_TROUBLESHOOTING.md`

**Quick alternatives:**
1. Clear npx cache: `npm cache clean --force`
2. Delete temp cache: `Remove-Item "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Force`
3. Pin version: Use `@playwright/mcp@0.0.47` instead of `@playwright/mcp`

---

**Last Updated:** November 16, 2025  
**Status:** ✅ **RESOLVED** - Issue successfully fixed using this method

