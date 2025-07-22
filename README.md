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

## 📚 Documentation

### **🔐 Authentication & User Management**
- **[Auth Strategy](./docs/AUTH_STRATEGY.md)** - Complete authentication flow, database triggers, and profile creation
- **[Developer Quick Reference](./docs/DEVELOPER_QUICK_REFERENCE.md)** - Critical requirements and troubleshooting
- **[Database Schema Audit](./database_schema_audit.md)** - Complete database structure with NOT NULL constraints

### **🏗️ Development Guides**
- **[Coding Standards](./docs/CODING_STANDARDS.md)** - Project conventions and best practices
- **[Database Guide](./docs/DATABASE_GUIDE.md)** - Database setup and management
- **[Onboarding Guide](./docs/ONBOARDING.md)** - New developer setup process

### **🔧 Technical Documentation**
- **[Email Service Setup](./docs/email-service.md)** - Email configuration and templates
- **[Supabase Email Setup](./docs/supabase-email-setup.md)** - Supabase email configuration
- **[Safe Supabase Queries](./docs/safe-supabase-queries.md)** - Secure database query patterns

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
