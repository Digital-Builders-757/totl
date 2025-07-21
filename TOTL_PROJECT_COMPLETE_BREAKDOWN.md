# 🎯 TOTL AGENCY - COMPLETE PROJECT BREAKDOWN

## 📋 **PROJECT OVERVIEW**

**TOTL Agency** is a talent booking platform connecting models/actors with casting directors/brands. Built with Next.js 15.2.4, Supabase, TypeScript, and shadcn/ui.

**Current Status**: ✅ Production-ready with comprehensive schema management and build fixes completed.

---

## 🏗️ **TECH STACK & ARCHITECTURE**

### **Frontend Stack:**
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: React hooks + Supabase real-time
- **Authentication**: Supabase Auth with role-based access

### **Backend Stack:**
- **Database**: PostgreSQL via Supabase
- **API**: Supabase REST API + Edge Functions (Deno)
- **Email Service**: Resend API
- **File Storage**: Supabase Storage
- **Real-time**: Supabase real-time subscriptions

### **Development Tools:**
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **Type Safety**: Strict TypeScript enforcement
- **Build Tool**: Next.js built-in bundler

---

## 📁 **PROJECT STRUCTURE**

```
totl/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── admin/                    # Admin dashboard routes
│   │   ├── dashboard/
│   │   ├── applications/
│   │   ├── gigs/
│   │   ├── users/
│   │   └── talentdashboard/
│   ├── client/                   # Client-specific routes
│   │   ├── signup/
│   │   └── apply/
│   ├── talent/                   # Talent-specific routes
│   │   ├── signup/
│   │   └── [id]/
│   ├── gigs/                     # Gig listing and details
│   │   ├── page.tsx
│   │   └── [id]/
│   ├── api/                      # API routes
│   │   ├── admin/
│   │   └── email/
│   ├── dashboard/                # User dashboard
│   ├── onboarding/               # User onboarding
│   ├── choose-role/              # Role selection
│   └── globals.css
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── auth-provider.tsx         # Authentication context
│   ├── talent-card.tsx           # Talent profile cards
│   ├── gig-list.tsx              # Gig listing component
│   └── [other components]
├── lib/                          # Utility libraries
│   ├── supabase-client.ts        # Client-side Supabase
│   ├── supabase-admin-client.ts  # Server-side admin client
│   ├── email-service.ts          # Email functionality
│   ├── safe-query.ts             # Safe database queries
│   └── actions/                  # Server actions
├── types/                        # TypeScript type definitions
│   └── database.ts               # Generated Supabase types
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge functions
│   └── config.toml
├── public/                       # Static assets
├── scripts/                      # Utility scripts
├── docs/                         # Documentation
└── [configuration files]
```

---

## 🗄️ **DATABASE SCHEMA**

### **Core Tables (8 total):**

#### **1. users (auth schema)**
- **Purpose**: Supabase Auth users with extended profile data
- **Key Fields**: id, email, full_name, role, created_at
- **Relationships**: One-to-one with profiles, talent_profiles, client_profiles

#### **2. profiles**
- **Purpose**: Base profile information for all users
- **Key Fields**: id, user_id, avatar_url, bio, website, created_at
- **Relationships**: Belongs to users, has one talent_profile or client_profile

#### **3. talent_profiles**
- **Purpose**: Talent-specific profile information
- **Key Fields**: id, profile_id, height, weight, experience_years, specialties
- **Relationships**: Belongs to profiles, has many applications, bookings, portfolio_items

#### **4. client_profiles**
- **Purpose**: Client-specific profile information
- **Key Fields**: id, profile_id, company_name, company_size, industry
- **Relationships**: Belongs to profiles, has many gigs

#### **5. gigs**
- **Purpose**: Job postings by clients
- **Key Fields**: id, client_id, title, description, location, compensation_min/max, start_date, status
- **Relationships**: Belongs to client_profiles, has many applications

#### **6. applications**
- **Purpose**: Talent applications to gigs
- **Key Fields**: id, talent_id, gig_id, status, created_at
- **Relationships**: Belongs to talent_profiles and gigs

#### **7. bookings**
- **Purpose**: Confirmed bookings between talent and clients
- **Key Fields**: id, talent_id, gig_id, status, booking_date, created_at
- **Relationships**: Belongs to talent_profiles and gigs

#### **8. portfolio_items**
- **Purpose**: Talent portfolio images and media
- **Key Fields**: id, talent_id, title, description, image_url, created_at
- **Relationships**: Belongs to talent_profiles

### **Custom Types (Enums):**
- **UserRole**: 'talent', 'client', 'admin'
- **GigStatus**: 'draft', 'published', 'completed', 'cancelled'
- **ApplicationStatus**: 'pending', 'accepted', 'rejected', 'withdrawn'
- **BookingStatus**: 'confirmed', 'completed', 'cancelled'

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **Authentication Flow:**
1. **Signup**: User creates account → role selection → profile creation
2. **Login**: Email/password → role-based redirect
3. **Session Management**: Supabase Auth with Next.js helpers
4. **Email Verification**: Required for all accounts

### **Role-Based Access:**
- **Talent**: Can apply to gigs, manage profile, view bookings
- **Client**: Can post gigs, review applications, manage bookings
- **Admin**: Full system access, user management, analytics

### **Route Protection:**
- **Middleware**: Role-based route protection
- **Components**: Protected route components
- **API Routes**: Role verification in handlers

---

## 🎨 **UI/UX ARCHITECTURE**

### **Component System:**
- **shadcn/ui**: Base component library
- **Custom Components**: Domain-specific components
- **Layout Components**: Consistent page layouts
- **Form Components**: Reusable form elements

### **Design System:**
- **Colors**: TailwindCSS color palette
- **Typography**: Consistent font hierarchy
- **Spacing**: TailwindCSS spacing scale
- **Components**: Atomic design principles

### **Responsive Design:**
- **Mobile-first**: Responsive breakpoints
- **Touch-friendly**: Mobile-optimized interactions
- **Accessibility**: WCAG compliance

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **Schema Management:**
- **Single Source of Truth**: `database_schema_audit.md`
- **Type Safety**: Generated TypeScript types
- **Migration Workflow**: Supabase migrations
- **Verification**: Automated schema truth checks

### **Code Quality:**
- **Linting**: ESLint + Prettier
- **Type Checking**: Strict TypeScript
- **Git Hooks**: Pre-commit validation
- **Build Verification**: Automated testing

### **Deployment:**
- **Environment Variables**: Proper configuration
- **Build Process**: Next.js optimization
- **Error Handling**: Graceful fallbacks
- **Performance**: Optimized loading

---

## 🚀 **KEY FEATURES**

### **For Talent:**
- Profile creation and management
- Gig discovery and application
- Portfolio management
- Booking management
- Application tracking

### **For Clients:**
- Company profile setup
- Gig posting and management
- Application review
- Talent discovery
- Booking management

### **For Admins:**
- User management
- System analytics
- Content moderation
- Support tools

---

## 🔍 **CURRENT STATE & RECENT FIXES**

### **✅ Completed Fixes:**
1. **Schema Synchronization**: Database types match actual schema
2. **Build Issues**: Resolved environment variable and API key issues
3. **TypeScript Errors**: Fixed all type mismatches
4. **Component Updates**: Aligned with correct schema
5. **One Source of Truth**: Implemented schema truth rules

### **✅ Working Features:**
- User authentication and role management
- Profile creation and editing
- Gig posting and discovery
- Application system
- Admin dashboard
- Email notifications

### **⚠️ Known Issues:**
- 3 TypeScript errors in auto-generated `.next/types/` files (non-critical)
- These don't affect build or functionality

---

## 🛠️ **CRITICAL FILES & CONFIGURATIONS**

### **Essential Files:**
- `database_schema_audit.md` - **SINGLE SOURCE OF TRUTH** for database
- `types/database.ts` - Generated TypeScript types
- `.cursorrules` - Cursor AI development rules
- `SCHEMA_TRUTH_RULES.md` - Schema management workflow
- `scripts/verify-schema-truth.sh` - Automated verification

### **Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (Resend)
RESEND_API_KEY=

# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### **Key Dependencies:**
```json
{
  "next": "15.2.4",
  "@supabase/supabase-js": "latest",
  "@supabase/auth-helpers-nextjs": "latest",
  "typescript": "5.x",
  "tailwindcss": "latest",
  "resend": "latest"
}
```

---

## 🎯 **DEVELOPMENT RULES & CONVENTIONS**

### **Schema Management:**
1. **ALWAYS** update `database_schema_audit.md` first
2. **NEVER** make database changes without updating audit
3. **SYNC** TypeScript types with audit file
4. **VERIFY** with automated script before commits

### **Code Standards:**
1. **NO** `any` types in database code
2. **USE** proper TypeScript interfaces
3. **FOLLOW** RLS-compatible query patterns
4. **SEPARATE** database logic from React components

### **Component Architecture:**
1. **Server Components** for data fetching
2. **Client Components** for interactivity
3. **Presentational** components only
4. **Props** for data passing

---

## 🔮 **FUTURE ROADMAP**

### **Planned Features:**
- Advanced search and filtering
- Real-time messaging
- Payment integration
- Advanced analytics
- Mobile app

### **Technical Improvements:**
- Performance optimization
- Advanced caching
- Enhanced security
- Better error handling

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues:**
1. **Build Failures**: Check environment variables
2. **Type Errors**: Verify schema synchronization
3. **Auth Issues**: Check Supabase configuration
4. **Email Issues**: Verify Resend API key

### **Debugging Tools:**
- `npm run verify-schema` - Schema truth verification
- `npx tsc --noEmit` - TypeScript compilation check
- `npm run build` - Build verification
- Supabase dashboard - Database inspection

---

**This breakdown provides complete context for another LLM to understand the TOTL Agency project structure, architecture, current state, and development workflow. The project is production-ready with comprehensive schema management and build fixes completed.** 