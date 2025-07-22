# TOTL Agency

A talent booking platform connecting models/actors with casting directors/brands.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 📚 Project Documentation & Developer Onboarding

Welcome to the TOTL Agency codebase! Start here to get productive in minutes.

### 🚦 Quick Start

- **Auth System Quick Reference:**  
  [docs/DEVELOPER_QUICK_REFERENCE.md](docs/DEVELOPER_QUICK_REFERENCE.md)

- **Full Auth Architecture & Triggers:**  
  [docs/AUTH_STRATEGY.md](docs/AUTH_STRATEGY.md)

- **Database Schema & Constraints:**  
  [database_schema_audit.md](database_schema_audit.md)

- **Testing the Signup Flow:**  
  [scripts/test-signup-flow.ts](scripts/test-signup-flow.ts)

### 🧰 Debugging & Troubleshooting

- See the "Common Errors & Fixes" section in the Quick Reference.
- Run included debug queries for live data validation.
- Use the health checks and validation queries for monitoring.

### 💡 Developer Best Practices

- Use snake_case for all user metadata keys (e.g., `first_name`, not `firstName`)
- All database triggers use graceful fallbacks—no more signup failures
- See commit history for migrations, rollbacks, and docs updates

> **Tip:** New to the project? Read the Quick Reference first, then dive into `AUTH_STRATEGY.md` for full architecture understanding!

---

**This project is fully self-service. You are never more than one click away from answers. Happy building! 🚀**

## 🎯 Key Features

- **Role-based Authentication** - Talent, Client, and Admin roles
- **Automatic Profile Creation** - Database triggers handle user onboarding
- **Email Verification** - Secure email confirmation flow
- **Role-based Dashboards** - Tailored experiences for each user type
- **Gig Management** - Post, apply, and manage casting opportunities
- **Portfolio Management** - Talent portfolio and showcase features

## 🛠️ Tech Stack

- **Frontend:** Next.js 15.2.4 + TypeScript + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **UI Components:** shadcn/ui
- **Email:** Resend API
- **Deployment:** Vercel

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **NOT NULL Constraints** - Data integrity with graceful fallbacks
- **Metadata Validation** - Secure user metadata handling
- **Role-based Access** - Granular permission system

## 🧪 Testing

```bash
# Type checking
npx tsc --noEmit

# Build verification
npm run build

# Production health checks
# See docs/DEVELOPER_QUICK_REFERENCE.md for database queries
```

## 📋 Production Checklist

- [ ] All NOT NULL constraints protected by triggers
- [ ] Metadata key naming follows snake_case convention
- [ ] Email verification flow tested
- [ ] Role-based redirects verified
- [ ] Database health checks passed
- [ ] Documentation updated

## 🤝 Contributing

1. Read the [Auth Strategy](./docs/AUTH_STRATEGY.md) for critical requirements
2. Follow [Coding Standards](./docs/CODING_STANDARDS.md)
3. Test with the scenarios in [Developer Quick Reference](./docs/DEVELOPER_QUICK_REFERENCE.md)
4. Update documentation as needed

## 📞 Support

For technical questions:
- Check [Developer Quick Reference](./docs/DEVELOPER_QUICK_REFERENCE.md) first
- Review [Auth Strategy](./docs/AUTH_STRATEGY.md) for architecture details
- Consult [Database Schema Audit](./database_schema_audit.md) for schema questions

---

**Built with ❤️ by TOTL Agency Team**
