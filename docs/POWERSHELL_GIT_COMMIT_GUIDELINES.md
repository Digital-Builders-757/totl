# 🔧 PowerShell Git Commit Guidelines

**Last Updated:** October 22, 2025

## 🚨 Critical PowerShell Limitations

### **Special Characters That Break PowerShell Commits:**

**❌ FORBIDDEN Characters in Commit Messages:**
- `&` (ampersand) - Reserved operator in PowerShell
- `|` (pipe) - Command separator
- `;` (semicolon) - Command separator
- `()` (parentheses) - Command grouping
- `{}` (braces) - Script blocks
- `$` (dollar sign) - Variable prefix
- `` ` `` (backtick) - Escape character
- `"` (double quotes) - String delimiter
- `'` (single quotes) - String delimiter

### **Common Error Examples:**

**❌ This WILL FAIL:**
```bash
git commit -m "feat: File Upload & Validation - Fixed 1MB limit"
# Error: The ampersand (&) character is not allowed
```

**❌ This WILL FAIL:**
```bash
git commit -m "feat: Navigation & User Flow improvements"
# Error: The ampersand (&) character is not allowed
```

**❌ This WILL FAIL:**
```bash
git commit -m "fix: Sign out (comprehensive cleanup)"
# Error: Unexpected token in expression
```

**✅ This WORKS:**
```bash
git commit -m "feat: File Upload and Validation - Fixed 1MB limit"
```

**✅ This WORKS:**
```bash
git commit -m "feat: Navigation and User Flow improvements"
```

---

## 📝 PowerShell-Safe Commit Message Format

### **Recommended Structure:**
```
type: Brief description without special characters

Detailed description:
- Use hyphens for bullet points
- Use "and" instead of "&"
- Use "for" instead of "()"
- Use "with" instead of "()"
- Avoid all special characters

Technical details:
- List technical changes
- Use simple punctuation
- Keep it readable
```

### **Safe Alternatives:**

| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| `&` | `and` |
| `()` | `for` or `with` |
| `{}` | `including` or `with` |
| `|` | `or` |
| `;` | `.` (period) |
| `$` | `dollar` or `cost` |
| `` ` `` | `'` (single quote) |

---

## 🛠️ PowerShell-Specific Git Commands

### **Safe Commit Examples:**

**✅ Simple Feature:**
```bash
git commit -m "feat: Add user authentication system"
```

**✅ Complex Feature:**
```bash
git commit -m "feat: Comprehensive UX improvements

Major changes:
- Fixed file upload validation with user-friendly errors
- Enhanced navigation with proper Settings links
- Improved sign out functionality with cleanup
- Styled login pages to match brand aesthetic

Technical enhancements:
- Updated Next.js config for Server Actions
- Enhanced error handling across flows
- Added loading states and visual feedback
- Maintained brand consistency throughout"
```

**✅ Bug Fix:**
```bash
git commit -m "fix: Resolve sign out data cleanup issue

Changes:
- Clear localStorage and sessionStorage on sign out
- Force page refresh to clear cached data
- Add error handling for sign out failures
- Prevent multiple sign out clicks"
```

**✅ Documentation:**
```bash
git commit -m "docs: Add PowerShell git commit guidelines

Added comprehensive guide for:
- PowerShell-safe commit message format
- Common character restrictions
- Safe alternatives for special characters
- Examples of working commit messages"
```

---

## 🔍 Testing Commit Messages

### **Quick Test Method:**
```bash
# Test your message first (dry run)
git commit -m "your message here" --dry-run

# If it works, commit for real
git commit -m "your message here"
```

### **PowerShell String Escaping:**
```bash
# If you MUST use special characters, escape them
git commit -m "feat: File Upload `& Validation"

# Or use single quotes (but still avoid special chars)
git commit -m 'feat: File Upload & Validation'
```

---

## 📋 Pre-Commit Checklist

Before committing in PowerShell:

- [ ] **No ampersands (&)** - Use "and" instead
- [ ] **No pipes (|)** - Use "or" instead  
- [ ] **No parentheses ()** - Use "for" or "with" instead
- [ ] **No braces {}** - Use "including" instead
- [ ] **No semicolons (;)** - Use periods instead
- [ ] **No dollar signs ($)** - Use "dollar" or "cost" instead
- [ ] **No backticks (`)** - Use single quotes instead
- [ ] **Test with --dry-run** - Verify message works

---

## 🚨 Common Error Messages

### **"The ampersand (&) character is not allowed"**
**Solution:** Replace `&` with `and`

### **"Missing expression after unary operator"**
**Solution:** Check for `-` at start of lines, use proper bullet format

### **"Unexpected token in expression"**
**Solution:** Remove parentheses, braces, or other special characters

### **"ParserError: AmpersandNotAllowed"**
**Solution:** Replace all `&` characters with `and`

---

## 💡 Pro Tips

### **1. Use Simple Language:**
```bash
# Instead of: "File Upload & Validation (1MB limit)"
# Use: "File Upload and Validation with 1MB limit"
```

### **2. Break Long Messages:**
```bash
git commit -m "feat: Major UX improvements

- Fixed file upload validation
- Enhanced navigation flow  
- Improved sign out process
- Styled login pages

Technical changes:
- Updated Next.js config
- Enhanced error handling
- Added loading states"
```

### **3. Use Conventional Commits:**
```bash
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

### **4. Keep It Simple:**
```bash
# Good
git commit -m "fix: resolve login page styling issues"

# Better
git commit -m "fix: resolve login page styling issues

- Transform white pages to dark theme
- Add gradient backgrounds
- Improve form contrast
- Maintain brand consistency"
```

---

## 🔧 Environment Notes

### **PowerShell Version:**
- **Windows PowerShell 5.1** - More restrictive
- **PowerShell Core 7+** - Slightly more lenient
- **Git Bash** - More forgiving (use if available)

### **Alternative Solutions:**
1. **Use Git Bash** instead of PowerShell for commits
2. **Use VS Code Git integration** (handles escaping)
3. **Use GitHub Desktop** (GUI handles escaping)
4. **Use simple commit messages** (avoid special chars)

---

## 📚 References

- [PowerShell Special Characters](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_special_characters)
- [Git Commit Message Guidelines](https://www.conventionalcommits.org/)
- [PowerShell String Handling](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules)

---

## 🎯 Summary

**Remember:** PowerShell is strict about special characters in command arguments. Keep commit messages simple, use "and" instead of "&", and test with `--dry-run` before committing. When in doubt, use simple language and avoid all special characters except basic punctuation like periods and hyphens.

**Golden Rule:** If it looks like it might be a special character, it probably is. Use a simple alternative instead! 🚀
