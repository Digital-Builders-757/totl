# Quick Fix: Clear Next.js Cache

## When to Use This

Clear caches when you experience:
- ✅ Errors about old components that no longer exist
- ✅ Changes not appearing after editing files
- ✅ Stale props or types being used
- ✅ Build errors that don't match your current code
- ✅ Hot reload not working properly

## Quick Commands

### PowerShell (Windows)
```powershell
# Stop all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove build caches
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue

# Start dev server
npm run dev
```

### Bash (Mac/Linux)
```bash
# Stop all Node processes
pkill -f node

# Remove build caches
rm -rf .next
rm -rf node_modules/.cache

# Start dev server
npm run dev
```

## Full Reset (Nuclear Option)

If the quick commands don't work:

```powershell
# Stop Node
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove everything
Remove-Item -Recurse -Force ".next"
Remove-Item -Recurse -Force "node_modules"
Remove-Item -Force "package-lock.json"

# Reinstall
npm install

# Start fresh
npm run dev
```

## Browser Cache

Don't forget to clear browser cache too:

- **Chrome/Edge:** `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox:** `Ctrl + Shift + R`
- **Safari:** `Cmd + Option + R`

Or use Incognito/Private mode to test.

## Pro Tips

1. **Clear cache before committing** if you removed components
2. **Use npm run dev** to restart with clean cache
3. **Check both server and browser console** for errors
4. **Test in incognito mode** to rule out browser cache issues

