# TOTL Agency - Documentation Overview

**Last Updated:** July 25, 2025  
**Status:** Production Ready

## 📚 Documentation Structure

This document provides an overview of all TOTL Agency documentation and how to navigate it effectively.

## 🎯 Quick Start

### **For New Developers**
1. **Start with:** [README.md](../README.md) - Project overview and quick start
2. **Then read:** [ONBOARDING.md](./ONBOARDING.md) - Complete setup guide
3. **Reference:** [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) - Daily patterns
4. **Check:** [POWERSHELL_COMMANDS.md](./POWERSHELL_COMMANDS.md) - PowerShell environment

### **For Experienced Developers**
1. **Reference:** [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) - Common patterns
2. **Check:** [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Development guidelines
3. **Review:** [database_schema_audit.md](../database_schema_audit.md) - Database structure
4. **Study:** [SCHEMA_TRUTH_RULES.md](./SCHEMA_TRUTH_RULES.md) - Type safety rules

### **For Database/Schema Work**
1. **Start with:** [SCHEMA_TRUTH_RULES.md](./SCHEMA_TRUTH_RULES.md) - Schema management rules
2. **Reference:** [database_schema_audit.md](../database_schema_audit.md) - Current schema
3. **Check:** [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) - Database patterns

## 📋 Documentation Files

### **Core Documentation**

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| [README.md](../README.md) | Project overview and quick start | All | ⭐⭐⭐⭐⭐ |
| [TOTL_PROJECT_CONTEXT_PROMPT.md](../TOTL_PROJECT_CONTEXT_PROMPT.md) | Complete project context | AI Assistants | ⭐⭐⭐⭐⭐ |
| [database_schema_audit.md](../database_schema_audit.md) | Database schema (single source of truth) | All | ⭐⭐⭐⭐⭐ |

### **Development Documentation**

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| [ONBOARDING.md](./ONBOARDING.md) | Complete setup guide | New developers | ⭐⭐⭐⭐⭐ |
| [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) | Daily development patterns | All developers | ⭐⭐⭐⭐⭐ |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Code quality guidelines | All developers | ⭐⭐⭐⭐ |
| [AUTH_STRATEGY.md](./AUTH_STRATEGY.md) | Authentication implementation | Backend developers | ⭐⭐⭐⭐ |
| [email-service.md](./email-service.md) | Email integration | Full-stack developers | ⭐⭐⭐ |

### **Schema & Type Safety Documentation**

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| [SCHEMA_TRUTH_RULES.md](./SCHEMA_TRUTH_RULES.md) | Schema management and type safety rules | All developers | ⭐⭐⭐⭐⭐ |
| [POWERSHELL_COMMANDS.md](./POWERSHELL_COMMANDS.md) | PowerShell environment reference | All developers | ⭐⭐⭐⭐ |

### **Operational Documentation**

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| [DEPLOYMENT.md](../DEPLOYMENT.md) | Deployment guide | DevOps/Deployers | ⭐⭐⭐⭐ |
| [SECURITY_FIXES_SUMMARY.md](../SECURITY_FIXES_SUMMARY.md) | Security improvements | Security team | ⭐⭐⭐⭐ |

### **Cursor AI Context**

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| [.cursor/project-context.md](../.cursor/project-context.md) | AI assistant context | AI tools | ⭐⭐⭐⭐ |
| [.cursor/global-context.md](../.cursor/global-context.md) | Global development standards | AI tools | ⭐⭐⭐ |

## 🚨 Critical Information

### **Must-Know Facts**
1. **Database schema** is the single source of truth in `database_schema_audit.md`
2. **Metadata keys** must use lowercase with underscores (snake_case)
3. **RLS policies** are enabled on all tables
4. **No service keys** should be exposed to client code
5. **Generated types** from `types/database.ts` should always be used
6. **PowerShell environment** - use PowerShell commands, not Unix commands
7. **Schema-first workflow** - always update audit file before schema changes
8. **Type safety** - never use `any` types for database entities

### **Common Pitfalls**
- ❌ Using `any` types in TypeScript
- ❌ Using camelCase for metadata keys
- ❌ Direct database calls in React components
- ❌ Bypassing RLS policies
- ❌ Exposing service keys to client
- ❌ Using Unix commands in PowerShell environment
- ❌ Manually editing generated types
- ❌ Creating duplicate interface definitions

## 🔍 Finding Information by Topic

### **Database & Schema**
- **Schema Management:** [SCHEMA_TRUTH_RULES.md](./SCHEMA_TRUTH_RULES.md)
- **Current Schema:** [database_schema_audit.md](../database_schema_audit.md)
- **Database Patterns:** [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md)
- **Migrations:** [ONBOARDING.md](./ONBOARDING.md)

### **Authentication & Security**
- **Auth Strategy:** [AUTH_STRATEGY.md](./AUTH_STRATEGY.md)
- **Security Fixes:** [SECURITY_FIXES_SUMMARY.md](../SECURITY_FIXES_SUMMARY.md)
- **RLS Policies:** [database_schema_audit.md](../database_schema_audit.md)

### **Development Environment**
- **Setup:** [ONBOARDING.md](./ONBOARDING.md)
- **PowerShell Commands:** [POWERSHELL_COMMANDS.md](./POWERSHELL_COMMANDS.md)
- **Coding Standards:** [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- **Quick Reference:** [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md)

### **Deployment & Operations**
- **Deployment:** [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Email Service:** [email-service.md](./email-service.md)
- **Project Context:** [TOTL_PROJECT_CONTEXT_PROMPT.md](../TOTL_PROJECT_CONTEXT_PROMPT.md)

## 🔧 Finding Information by Role

### **Frontend Developers**
1. [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) - Database patterns
2. [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Code guidelines
3. [SCHEMA_TRUTH_RULES.md](./SCHEMA_TRUTH_RULES.md) - Type safety rules

### **Backend Developers**
1. [SCHEMA_TRUTH_RULES.md](./SCHEMA_TRUTH_RULES.md) - Schema management
2. [AUTH_STRATEGY.md](./AUTH_STRATEGY.md) - Authentication
3. [database_schema_audit.md](../database_schema_audit.md) - Database structure

### **DevOps Engineers**
1. [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment guide
2. [ONBOARDING.md](./ONBOARDING.md) - Environment setup
3. [SECURITY_FIXES_SUMMARY.md](../SECURITY_FIXES_SUMMARY.md) - Security

### **New Team Members**
1. [README.md](../README.md) - Project overview
2. [ONBOARDING.md](./ONBOARDING.md) - Complete setup
3. [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) - Daily patterns

## 📝 Documentation Maintenance

### **Quality Checklist**
- [ ] **Accuracy** - Information is current and correct
- [ ] **Completeness** - All necessary details are included
- [ ] **Clarity** - Easy to understand and follow
- [ ] **Consistency** - Formatting and style are uniform
- [ ] **Relevance** - Information is useful for the target audience
- [ ] **Links** - All references and links work correctly

### **Update Guidelines**
- **Last Updated** dates should reflect actual changes
- **Version numbers** should increment with significant changes
- **Cross-references** should be updated when files change
- **Examples** should be tested and verified
- **Screenshots** should be current and clear

### **Review Schedule**
- **Monthly** - Review all documentation for accuracy
- **Quarterly** - Update examples and screenshots
- **As needed** - Update when features or processes change

## 🆘 Getting Help

### **When You're Stuck**
1. **Check this overview** - Find the right documentation
2. **Search the codebase** - Look for similar patterns
3. **Review error logs** - Check for specific error messages
4. **Ask the team** - Provide context and error details

### **Reporting Issues**
When reporting documentation issues, include:
- **File name** and section
- **What you were trying to do**
- **What you expected to find**
- **What you actually found**
- **Your role/experience level**

### **Suggesting Improvements**
We welcome documentation improvements! When suggesting changes:
- **Be specific** about what needs to change
- **Provide examples** of better approaches
- **Consider the audience** - who will use this information
- **Test your suggestions** before proposing them

---

**Remember: Good documentation saves time and prevents errors. Keep it updated and accurate!** 