# Cursor AI Assistant Rule for TOTL Agency Project

## 🎯 Rule to Add to Cursor Settings

Add this rule to your Cursor settings to ensure the AI always references your project context before writing code:

---

### **Rule Name:** `TOTL Agency Context Reference`

### **Rule Description:**
Before writing any code for the TOTL Agency project, the AI assistant must:

1. **ALWAYS reference the `TOTL_PROJECT_CONTEXT_PROMPT.md` file first**
2. **Check existing database schema** before making any database changes
3. **Verify RLS policies** for any data access patterns
4. **Use generated TypeScript types** from `types/database.ts`
5. **Follow the established project structure** and naming conventions

### **Implementation:**
When working on the TOTL Agency project, the AI should:

```markdown
## 🔍 CONTEXT CHECK REQUIRED

Before proceeding with any code changes, I must:

1. **Read the project context file:** `TOTL_PROJECT_CONTEXT_PROMPT.md`
2. **Verify database schema:** Check `supabase/migrations/` for current schema
3. **Review existing types:** Reference `types/database.ts` for type definitions
4. **Check RLS policies:** Ensure any data access complies with security policies
5. **Follow architecture:** Use proper Supabase clients and component patterns

## 📋 PROJECT CONTEXT SUMMARY

**Tech Stack:** Next.js 15.2.4 + Supabase + TypeScript + shadcn/ui
**Database:** PostgreSQL with RLS policies on all tables
**Auth:** Supabase Auth with role-based access (talent/client/admin)
**Key Tables:** profiles, talent_profiles, client_profiles, gigs, applications, bookings, portfolio_items
**Security:** Row-level security enforced, no service keys in client code
**Architecture:** Server components for data fetching, presentational components only

## ✅ COMPLIANCE CHECKLIST

- [ ] Referenced context file before coding
- [ ] Used proper TypeScript types (no `any`)
- [ ] Followed RLS-compatible query patterns
- [ ] Separated database logic from React components
- [ ] Used centralized Supabase clients
- [ ] Implemented proper error handling
- [ ] Followed project naming conventions
```

### **When to Apply:**
- **All code generation** for the TOTL Agency project
- **Database schema changes** or migrations
- **New feature development**
- **Bug fixes** or refactoring
- **API route creation** or modification

### **Files to Always Check:**
- `TOTL_PROJECT_CONTEXT_PROMPT.md` - Complete project context
- `types/database.ts` - Generated Supabase types
- `supabase/migrations/` - Database schema history
- `lib/supabase-client.ts` - Client configuration
- `middleware.ts` - Route protection logic

---

## 🚀 How to Add This Rule to Cursor

### **Option 1: Cursor Settings (Recommended)**

1. Open Cursor Settings (`Ctrl/Cmd + ,`)
2. Go to "AI" or "Assistant" section
3. Look for "Custom Rules" or "Context Rules"
4. Add the rule above as a custom rule
5. Set it to apply to your TOTL project directory

### **Option 2: Project-Specific Rule**

1. Create a `.cursorrules` file in your project root
2. Add the rule content above
3. Cursor will automatically apply it to this project

### **Option 3: Chat Context**

1. Copy the rule content
2. Paste it at the beginning of any new chat session
3. Ask the AI to follow these guidelines

---

## 📚 Additional Context Files

You can also add these files to your project for even better context:

### **1. Database Schema Reference**
Create `DATABASE_SCHEMA.md` with:
- Complete table definitions
- RLS policy explanations
- Common query patterns
- Migration guidelines

### **2. API Documentation**
Create `API_DOCUMENTATION.md` with:
- All API route specifications
- Request/response formats
- Authentication requirements
- Error handling patterns

### **3. Component Library**
Create `COMPONENT_GUIDELINES.md` with:
- shadcn/ui usage patterns
- Custom component standards
- Styling guidelines
- Accessibility requirements

---

## 🎯 Benefits of This Rule

1. **Consistency:** All AI-generated code follows the same patterns
2. **Security:** RLS policies and security best practices are always enforced
3. **Type Safety:** Generated TypeScript types are always used
4. **Architecture Compliance:** Database logic stays in the right places
5. **Maintainability:** Code follows established project structure
6. **Efficiency:** AI doesn't need to rediscover project patterns

---

## 🔄 Rule Maintenance

**Update this rule when:**
- Database schema changes
- New architectural patterns are introduced
- Security policies are modified
- New libraries or tools are added
- Project structure evolves

**Review frequency:** Monthly or after major changes

---

*This rule ensures that every AI interaction with your TOTL Agency project is informed, consistent, and follows your established best practices.* 