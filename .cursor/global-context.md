# Cursor Global Context - TOTL Agency Standards

## 🎯 General Development Standards

### TypeScript Best Practices
- Use strict TypeScript configuration
- Avoid `any` types - use proper interfaces
- Leverage type inference when possible
- Use generated types for external APIs

### React/Next.js Patterns
- Use React Server Components for data fetching
- Keep client components presentational
- Follow Next.js App Router conventions
- Implement proper error boundaries

### Database & Security
- Always use parameterized queries
- Implement proper authentication
- Follow least privilege principle
- Use environment variables for secrets

### Code Quality
- Follow ESLint and Prettier rules
- Write meaningful commit messages
- Add proper error handling
- Include TypeScript types

## 🖥️ Environment Standards

### **PowerShell Environment (Windows)**
- **OS:** Windows 10/11
- **Shell:** PowerShell
- **Commands:** Use PowerShell-compatible commands only
  - `Get-ChildItem` instead of `ls`
  - `Get-Content` instead of `cat`
  - `Select-String` instead of `grep`
  - `Where-Object` for filtering
  - `ForEach-Object` for iteration
  - `New-Item` for creating files/directories
  - `Remove-Item` for deleting files/directories
  - `Copy-Item` for copying files
  - `Move-Item` for moving files
  - `Test-Path` for checking file existence

### **Common PowerShell Patterns**
```powershell
# File operations
Get-ChildItem -Recurse -Filter "*.ts" | Where-Object { $_.Name -like "*component*" }
Get-Content file.txt | Select-String "pattern"
Get-ChildItem -Directory | ForEach-Object { Write-Host $_.Name }

# File existence checks
if (Test-Path "file.txt") { Write-Host "File exists" }

# Creating/deleting files
New-Item -ItemType File -Name "newfile.txt"
Remove-Item "file.txt" -Force
```

## 📚 Documentation Standards

### **Documentation-First Approach**
**CRITICAL:** Always check relevant documentation before making any changes:
1. Read project documentation overview files
2. Check developer quick reference guides
3. Review coding standards documentation
4. Consult database schema documentation
5. Reference project context files

### **Documentation Maintenance**
- Update documentation after significant changes
- Remove outdated information
- Ensure cross-references remain accurate
- Test documentation instructions
- Update timestamps in modified files

### Code Documentation
- Add JSDoc comments for complex functions
- Document API endpoints
- Include usage examples
- Maintain README files

### Project Documentation
- Keep context files updated
- Document architectural decisions
- Maintain changelog
- Include setup instructions

## 🏗️ Architecture Principles

### Separation of Concerns
- Separate data logic from UI logic
- Use dedicated API routes for complex operations
- Keep components focused and reusable
- Implement proper state management

### Security First
- Never expose sensitive data to client
- Validate all user inputs
- Implement proper authorization
- Use secure authentication methods

### Performance
- Optimize database queries
- Use proper caching strategies
- Implement lazy loading
- Monitor and optimize bundle size

## 🔄 Development Workflow

### Before Writing Code
1. Understand the requirements
2. Check existing codebase
3. Reference project context
4. **Check relevant documentation**
5. Plan the implementation
6. Consider edge cases

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] Error handling is implemented
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] Documentation updated
- [ ] PowerShell commands used (if applicable)

### Testing Strategy
- Write unit tests for utilities
- Test API endpoints
- Validate user flows
- Check accessibility
- Test error scenarios

## 🚫 Common Anti-Patterns

### Avoid These Patterns
- Using `any` types
- Direct database calls in components
- Exposing sensitive data
- Ignoring error handling
- Hardcoding values
- Mixing concerns
- **Using Unix commands in PowerShell**
- **Making changes without checking documentation**

### Security Anti-Patterns
- Storing secrets in code
- Bypassing authentication
- Not validating inputs
- Exposing internal APIs
- Ignoring CORS policies

## ✅ Quality Checklist

### Code Quality
- [ ] TypeScript compilation passes
- [ ] ESLint rules followed
- [ ] Prettier formatting applied
- [ ] No console.log in production
- [ ] Proper error handling

### Security
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] Authentication required
- [ ] Authorization checked
- [ ] HTTPS used in production

### Performance
- [ ] Database queries optimized
- [ ] Images properly sized
- [ ] Bundle size reasonable
- [ ] Loading states implemented
- [ ] Caching strategy used

### Documentation
- [ ] Documentation checked before changes
- [ ] Documentation updated after changes
- [ ] Cross-references accurate
- [ ] Instructions tested
- [ ] Timestamps updated

### Environment
- [ ] PowerShell commands used (Windows)
- [ ] Unix commands avoided (Windows)
- [ ] Environment variables properly configured
- [ ] Dependencies up to date

---

**This global context applies to all projects. For project-specific details, refer to the project's context files.** 