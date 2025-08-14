# 🔧 Schema Verification Debugging Guide

**Last Updated:** August 14, 2025  
**Purpose:** Quick troubleshooting for schema verification issues

This guide provides step-by-step solutions for common schema verification problems based on real debugging experiences.

## 🚨 Common Issues & Quick Fixes

### **Issue 1: CI 404 Error**
```
Error: Unexpected HTTP response: 404
```

**Root Cause:** Supabase CLI version doesn't exist or is incorrect.

**Solution:**
```yaml
# In .github/workflows/schema-truth-check.yml
- uses: supabase/setup-cli@v1
  with:
    version: v2.33.4  # Use known working version
```

**Prevention:**
- Always use pinned versions, not "latest"
- Test CLI versions before updating
- Update all environments simultaneously

### **Issue 2: Pre-commit Hook Loop**
```
❌ types/database.ts is stale. Run: npm run types:regen
husky - pre-commit script failed (code 1)
```

**Root Cause:** `lint-staged` running schema verification during pre-commit.

**Solution:**
```json
// In package.json - REMOVE this section
"lint-staged": {
  "types/database.ts": [
    "npm run types:check"  // ❌ Remove this
  ]
}
```

**Prevention:**
- Keep pre-commit hooks fast and reliable
- Use manual verification when needed
- Separate schema verification from code quality checks

### **Issue 3: PowerShell Syntax Errors**
```
Unexpected token '}' in expression or statement.
The string is missing the terminator: ".
```

**Root Cause:** Emoji characters causing encoding issues.

**Solution:**
```powershell
# ✅ Good: Plain text
Write-Host "Scanning for issues..." -ForegroundColor Yellow

# ❌ Bad: Emoji characters
Write-Host "🔍 Scanning for issues..." -ForegroundColor Yellow
```

**Prevention:**
- Avoid emoji characters in PowerShell scripts
- Use plain text for cross-platform compatibility
- Test scripts on multiple platforms

### **Issue 4: Cross-Platform Script Failures**
```
/dev/null: No such file or directory
```

**Root Cause:** Unix-specific shell redirection on Windows.

**Solution:**
```javascript
// ✅ Good: Node.js built-ins
const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
writeFileSync(tmp, out, "utf8");

// ❌ Bad: Shell redirection
execSync(`cmd > /dev/null 2>&1`);  // Breaks on Windows
```

**Prevention:**
- Use Node.js built-ins instead of shell commands
- Test scripts on both Windows and Unix
- Avoid platform-specific file paths

### **Issue 5: Schema Out of Sync**
```
❌ types/database.ts is not up-to-date with remote schema.
```

**Root Cause:** Local types don't match remote schema.

**Solution:**
```bash
# Regenerate types
npm run types:regen

# Verify synchronization
npm run schema:verify-local
```

**Prevention:**
- Always regenerate types after schema changes
- Use consistent CLI versions
- Run verification before committing

## 🔍 Step-by-Step Debugging Process

### **Step 1: Identify the Issue**
```bash
# Check what's failing
npm run pre-commit
npm run schema:check
npm run schema:verify-local
```

### **Step 2: Check CLI Version Consistency**
```bash
# Verify all scripts use same version
grep -r "supabase@" package.json scripts/ .github/
```

### **Step 3: Test Manual Commands**
```bash
# Test CLI access
npx supabase@v2.33.4 gen types typescript --linked --schema public

# Test verification
npm run schema:verify-local
```

### **Step 4: Check File Permissions & Encoding**
```bash
# Check PowerShell execution policy
Get-ExecutionPolicy

# Check file encoding
Get-Content scripts/fix-async-cookies.ps1 -Encoding UTF8
```

### **Step 5: Verify Environment Variables**
```bash
# Check required environment variables
echo $SUPABASE_PROJECT_ID
echo $SUPABASE_ACCESS_TOKEN
```

## 🛠️ Quick Fix Commands

### **Reset Schema Verification**
```bash
# Clean up and regenerate
npm run types:regen
npm run schema:verify-local
```

### **Fix Pre-commit Hooks**
```bash
# Remove problematic lint-staged rules
# Edit package.json to remove schema verification from lint-staged
npm run pre-commit
```

### **Update CLI Version Everywhere**
```bash
# Update all scripts to use consistent version
# Search and replace: supabase@latest → supabase@v2.33.4
# Update CI workflow
# Update package.json scripts
# Update error messages
```

### **Fix PowerShell Scripts**
```bash
# Remove emoji characters
# Use plain text output
# Test on Windows and Unix
```

## 📋 Prevention Checklist

### **Before Making Changes**
- [ ] Check current CLI version in all scripts
- [ ] Verify environment variables are set
- [ ] Test scripts on target platforms
- [ ] Review recent changes for conflicts

### **When Updating CLI Version**
- [ ] Update CI workflow
- [ ] Update package.json scripts
- [ ] Update all verification scripts
- [ ] Update error messages
- [ ] Test on multiple platforms
- [ ] Update documentation

### **When Adding New Scripts**
- [ ] Use Node.js built-ins for file operations
- [ ] Avoid shell redirection
- [ ] Avoid emoji characters in PowerShell
- [ ] Test on Windows and Unix
- [ ] Use consistent CLI version
- [ ] Add proper error handling

## 🚨 Emergency Procedures

### **If CI is Completely Broken**
1. **Pin to known working version:**
   ```yaml
   version: v2.33.4
   ```

2. **Disable problematic checks temporarily:**
   ```yaml
   # Comment out failing steps
   # - name: Schema verification
   #   run: npm run schema:verify-local
   ```

3. **Use manual verification:**
   ```bash
   npm run schema:verify-local
   ```

### **If Pre-commit Hooks Are Stuck**
1. **Remove schema verification from lint-staged**
2. **Use manual verification only**
3. **Keep pre-commit hooks fast and reliable**

### **If Scripts Won't Run**
1. **Check PowerShell execution policy:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Check file encoding:**
   ```powershell
   Get-Content script.ps1 -Encoding UTF8
   ```

3. **Test with Node.js instead:**
   ```bash
   node scripts/script.mjs
   ```

## 📊 Success Metrics

### **Before Fixes**
- ❌ CI failing with 404 errors
- ❌ Pre-commit hooks stuck in loops
- ❌ Cross-platform script failures
- ❌ PowerShell encoding issues
- ❌ Inconsistent CLI versions

### **After Fixes**
- ✅ CI passing consistently
- ✅ Pre-commit hooks fast and reliable
- ✅ Cross-platform compatibility
- ✅ Proper error handling
- ✅ Consistent tooling across environments

## 🔄 Maintenance Schedule

### **Weekly**
- [ ] Check CI status
- [ ] Verify pre-commit hooks work
- [ ] Test schema verification scripts

### **Monthly**
- [ ] Review CLI version consistency
- [ ] Update documentation if needed
- [ ] Test on multiple platforms

### **Quarterly**
- [ ] Evaluate CLI version updates
- [ ] Review and update debugging procedures
- [ ] Update prevention strategies

---

**Remember:** Most schema verification issues stem from inconsistent tooling or cross-platform incompatibilities. Use consistent versions, avoid platform-specific code, and test thoroughly.
