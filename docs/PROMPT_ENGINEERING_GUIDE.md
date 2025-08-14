# 🎯 Prompt Engineering Guide for TOTL Agency

**Last Updated:** August 14, 2025  
**Purpose:** Effective communication with LLMs to prevent issues and ensure quality code

This guide provides best practices for prompt engineering based on our debugging experiences and successful LLM interactions.

## 🎯 Core Principles

### **1. Context First**
Always provide complete context before asking for changes:
```
Before you change anything:
1. Read the entire rules file and follow it strictly
2. Check the current state of the codebase
3. Understand the existing patterns and conventions
4. Verify the requirements are clear and specific
```

### **2. Specificity Over Generality**
❌ **Bad:** "Fix the schema verification"
✅ **Good:** "The CI is failing with 404 errors on supabase/setup-cli@v1. Update the workflow to use v2.33.4 and ensure all scripts use consistent CLI versions."

### **3. Step-by-Step Instructions**
Break complex tasks into clear, sequential steps:
```
1. Update the CI workflow to use v2.33.4
2. Update all package.json scripts to use the same version
3. Update all verification scripts to use Node.js built-ins
4. Test the changes locally
5. Verify the fix resolves the issue
```

### **4. Error Prevention**
Include specific prevention mechanisms:
```
- Use consistent CLI versions across all environments
- Avoid shell redirection in cross-platform scripts
- Don't include schema verification in pre-commit hooks
- Test on multiple platforms before committing
```

## 📋 Effective Prompt Templates

### **Template 1: Bug Fix Request**
```
I'm experiencing [specific error] in [specific context].

**Error Details:**
- Error message: [exact error]
- Location: [file/line/context]
- Steps to reproduce: [clear steps]

**Expected Behavior:**
[What should happen]

**Current Behavior:**
[What's actually happening]

**Environment:**
- OS: [Windows/macOS/Linux]
- Node version: [version]
- CLI version: [version]

Please:
1. Identify the root cause
2. Provide a specific fix
3. Include prevention measures
4. Test the solution before suggesting
```

### **Template 2: Feature Implementation**
```
I need to implement [specific feature] for [specific use case].

**Requirements:**
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

**Constraints:**
- Must follow existing patterns in [file]
- Must use types from [types/database.ts]
- Must be compatible with [specific environment]

**Existing Code:**
[Relevant code snippets]

Please:
1. Follow the schema-first workflow
2. Use generated types only
3. Implement proper error handling
4. Include tests if applicable
```

### **Template 3: Code Review Request**
```
Please review this code for [specific concerns]:

**File:** [file path]
**Changes:** [brief description]

**Specific Areas to Check:**
- [ ] Type safety
- [ ] Schema compliance
- [ ] Cross-platform compatibility
- [ ] Error handling
- [ ] Performance implications

**Context:**
[Why this change is needed]

Please identify:
1. Any issues or potential problems
2. Suggestions for improvement
3. Compliance with project standards
4. Security considerations
```

### **Template 4: Debugging Request**
```
I'm debugging [specific issue] and need help.

**Problem:**
[Clear description of the issue]

**What I've Tried:**
1. [Attempt 1] - Result: [outcome]
2. [Attempt 2] - Result: [outcome]
3. [Attempt 3] - Result: [outcome]

**Current State:**
[What's currently happening]

**Relevant Files:**
- [file1] - [purpose]
- [file2] - [purpose]

**Environment:**
[OS, versions, etc.]

Please help me:
1. Identify the root cause
2. Suggest a systematic debugging approach
3. Provide specific commands to run
4. Explain what to look for in the output
```

## 🚨 Common Pitfalls to Avoid

### **1. Vague Requests**
❌ **Bad:** "Fix the bugs"
✅ **Good:** "The schema verification script is failing with PowerShell syntax errors. Please fix the emoji characters in scripts/fix-async-cookies.ps1"

### **2. Missing Context**
❌ **Bad:** "Update the types"
✅ **Good:** "After adding the new 'archived' status to the gig_status enum, regenerate the types and update all components that use this enum"

### **3. Unrealistic Expectations**
❌ **Bad:** "Make it perfect"
✅ **Good:** "Implement the basic functionality first, then we can iterate on improvements"

### **4. Ignoring Existing Patterns**
❌ **Bad:** "Create a new approach"
✅ **Good:** "Follow the existing patterns in lib/supabase-client.ts for database access"

## 🔧 Advanced Prompting Techniques

### **1. Chain of Thought**
```
Let's solve this step by step:

1. First, what's the current state?
2. What's the desired state?
3. What's blocking us from getting there?
4. What's the most direct path forward?
5. How do we verify the solution works?
```

### **2. Constraint Specification**
```
Please ensure the solution:
- Works on Windows PowerShell
- Uses consistent CLI versions
- Follows existing naming conventions
- Includes proper error handling
- Is compatible with our CI/CD pipeline
```

### **3. Verification Requirements**
```
After implementing the solution, please:
1. Show me the commands to test it
2. Explain what output I should expect
3. List potential failure modes
4. Provide rollback instructions if needed
```

### **4. Prevention Focus**
```
To prevent this issue in the future:
1. What should we add to our documentation?
2. What automated checks could catch this?
3. What training or guidelines are needed?
4. How can we make this pattern more obvious?
```

## 📊 Success Metrics

### **Good Prompts Result In:**
- ✅ **Clear, actionable responses**
- ✅ **Code that compiles and works**
- ✅ **Solutions that follow project standards**
- ✅ **Prevention of similar issues**
- ✅ **Reduced debugging time**

### **Poor Prompts Lead To:**
- ❌ **Vague or incorrect solutions**
- ❌ **Code that breaks existing patterns**
- ❌ **More debugging required**
- ❌ **Inconsistent implementations**
- ❌ **Security or performance issues**

## 🎯 Prompt Engineering Checklist

### **Before Writing a Prompt**
- [ ] **Understand the problem completely**
- [ ] **Gather all relevant context**
- [ ] **Identify specific requirements**
- [ ] **Consider existing patterns**
- [ ] **Think about potential issues**

### **When Writing the Prompt**
- [ ] **Start with context and background**
- [ ] **Be specific about requirements**
- [ ] **Include constraints and limitations**
- [ ] **Provide relevant code examples**
- [ ] **Specify the expected outcome**

### **After Receiving a Response**
- [ ] **Verify the solution works**
- [ ] **Check compliance with standards**
- [ ] **Test edge cases**
- [ ] **Document the solution**
- [ ] **Update guidelines if needed**

## 🔄 Continuous Improvement

### **Learning from Experience**
- **Track successful prompts** - what worked well?
- **Analyze failed attempts** - what went wrong?
- **Update templates** - incorporate lessons learned
- **Share best practices** - help team members improve

### **Regular Review**
- **Monthly prompt review** - identify patterns
- **Quarterly template updates** - incorporate new learnings
- **Annual guideline refresh** - update based on project evolution

## 📚 Example Prompts

### **Successful Schema Fix Prompt**
```
I'm debugging a schema verification loop issue:

**Problem:** Pre-commit hooks are failing because lint-staged is running schema verification, which detects differences and fails the commit.

**Root Cause:** The lint-staged configuration in package.json includes schema verification for types/database.ts files.

**Current State:** Commits are blocked by schema verification failures.

**Environment:** Windows PowerShell, Supabase CLI v2.33.4

Please:
1. Remove schema verification from lint-staged
2. Keep manual verification available
3. Ensure pre-commit hooks are fast and reliable
4. Update documentation to reflect the change

Expected outcome: Commits work without schema verification loops, but manual verification is still available when needed.
```

### **Successful Feature Implementation Prompt**
```
I need to implement a new gig status "archived" for the gigs table.

**Requirements:**
- Add "archived" to the gig_status enum
- Update the database schema
- Regenerate TypeScript types
- Update any UI components that display gig status

**Constraints:**
- Must follow the schema-first workflow
- Must use generated types only
- Must be compatible with existing RLS policies
- Must work with the current UI components

**Existing Code:**
- Current enum values: ["draft", "active", "closed", "featured", "urgent"]
- UI components in app/gigs/ and app/admin/gigs/
- Database schema in database_schema_audit.md

Please:
1. Update the audit file first
2. Create a migration for the enum change
3. Regenerate types
4. Update UI components to handle the new status
5. Test the implementation

Expected outcome: Gigs can be marked as "archived" and the UI properly displays this status.
```

---

**Remember:** Good prompt engineering is about clear communication, specific requirements, and systematic problem-solving. The better your prompt, the better the solution you'll receive.
