# Claude Development Guidelines for TOTL Agency Project

This file contains project-specific guidelines and best practices for AI assistants working on this codebase.

## TypeScript & Supabase Development

### Always Use Generated Types
- **DO**: Use `npx supabase gen types typescript --project-id utvircuwknqzpnmvxidp` to generate actual types from the live database
- **DON'T**: Create manual type definitions or guess at database schema
- **WHY**: Ensures 100% accuracy with the real database structure and stays in sync with schema changes

### Supabase MCP Server
- **CHECK FIRST**: Always look for available Supabase MCP servers before manual implementations
- **USE**: The Supabase MCP server when available for direct database schema access
- **BENEFIT**: Real-time schema information and proper type generation

### Type System Best Practices
- **USE**: The generated `Tables<T>` helper type for cleaner syntax: `Tables<"profiles">` instead of `Database["public"]["Tables"]["profiles"]["Row"]`
- **LEVERAGE**: Generated `Insert<T>` and `Update<T>` types for form handling
- **REFERENCE**: Real enum values from `Database["public"]["Enums"]` instead of hardcoded strings

### Database Schema Information
**Project ID**: `utvircuwknqzpnmvxidp`
**Supabase URL**: `https://utvircuwknqzpnmvxidp.supabase.co`

**Main Tables**:
- `profiles` - User authentication and basic info
- `talent_profiles` - Talent-specific data (height, weight, experience, etc.)
- `client_profiles` - Client company information
- `applications` - Gig applications from talent
- `gigs` - Available modeling gigs
- `bookings` - Confirmed gig bookings
- `portfolio_items` - Talent portfolio images and descriptions

**Key Views**:
- `admin_talent_dashboard` - Dashboard view for talent applications
- `admin_bookings_dashboard` - Dashboard view for bookings management

**Enums**:
- `user_role`: "talent" | "client" | "admin"
- `application_status`: "new" | "under_review" | "shortlisted" | "rejected" | "accepted"
- `gig_status`: "draft" | "active" | "closed" | "featured" | "urgent"
- `booking_status`: "pending" | "confirmed" | "completed" | "cancelled"

## Code Quality Standards

### TypeScript
- **NO** explicit `any` types - use proper type definitions
- **NO** `@ts-expect-error` comments - fix the underlying type issues
- **YES** to strict type checking and proper error handling
- **USE** helper functions like `castUserId<T>()` for complex type constraints

### Supabase Queries
- **PREFER**: Explicit column selection over `select('*')`
- **USE**: Proper error handling with `{ data, error }` destructuring
- **AVOID**: Complex `.throwOnError()` chains that leak error types
- **IMPLEMENT**: RLS-friendly queries with proper user context

### Testing & Verification
- **ALWAYS** run `npm run typecheck` after type changes
- **ALWAYS** run `npm run build` to verify compilation
- **RUN** `npm run lint` and fix any issues before committing
- **TEST** in development environment before production deployment

## Project Structure Notes

### Authentication Flow
- Uses `@supabase/ssr` with Next.js App Router
- Server-side authentication in `/lib/supabase-server.ts`
- Role-based access control (talent/client/admin)

### Admin Dashboard Structure
- `/admin/dashboard` - Main admin overview
- `/admin/applications` - Application management  
- `/admin/talentdashboard` - Talent-specific dashboard
- `/admin/gigs/create` - Gig creation form

### Type Definitions Location
- **Generated Types**: `/types/database.ts` (auto-generated from Supabase)
- **Helper Types**: `/lib/db-types.ts` (convenience aliases and utilities)
- **Component Types**: Local to each component file

## Commands Reference

### Generate Fresh Types
```bash
npx supabase gen types typescript --project-id utvircuwknqzpnmvxidp > types/database.ts
```

### Type Checking & Building
```bash
npm run typecheck  # Check TypeScript without building
npm run build      # Full Next.js build
npm run lint       # ESLint checking
```

### Development
```bash
npm run dev        # Start development server
```

---

*This file should be referenced at the start of any TypeScript/Supabase development work to ensure consistent, high-quality implementations.*