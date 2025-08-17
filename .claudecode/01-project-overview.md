# 01 - TOTL Agency Project Overview

## 🎯 Executive Summary

TOTL Agency is a premium talent booking platform connecting brands with modeling and creative professionals. Built with Next.js 15 and Supabase, it features enterprise-grade security, role-based access control, and real-time collaboration capabilities.

**Technical Foundation**: Modern React architecture with Server Components, comprehensive Row Level Security, and type-safe database operations.

## 🏗️ System Architecture

### **Technology Stack**
```
Frontend:     Next.js 15 (App Router) + TypeScript + Tailwind CSS
Backend:      Supabase (PostgreSQL + Auth + Storage + Edge Functions)
UI Library:   shadcn/ui + Radix UI primitives
State:        Server Components + Server Actions (no client state management)
Deployment:   Vercel (Frontend) + Supabase Cloud (Backend)
```

### **Core Architecture Principles**
1. **Server-First**: Data fetching in Server Components, interactivity in Client Components
2. **Type Safety**: Generated TypeScript types from database schema
3. **Security by Design**: Row Level Security (RLS) on all database operations
4. **Performance**: Static generation where possible, dynamic only when needed
5. **Accessibility**: WCAG AA compliance with semantic HTML and ARIA labels

## 🔐 Security Architecture

### **Authentication & Authorization**
- **Supabase Auth**: Email/password with email verification
- **Role-Based Access**: Admin, Client, Talent with granular permissions
- **Row Level Security**: Database-level access control for all tables
- **Middleware Protection**: Route-based authentication checks

### **Security Scores**
- **Overall Security**: 9/10 ✅
- **RLS Implementation**: Complete coverage across all tables
- **Function Security**: All functions use `SECURITY DEFINER` with `SET search_path`
- **Client/Server Separation**: No sensitive operations in client code

## 📊 Database Design

### **Core Entities**
```sql
profiles              -- Base user profiles with role management
├── talent_profiles   -- Extended talent information and portfolios  
├── client_profiles   -- Company and contact information
gigs                  -- Job postings with requirements and status
├── gig_requirements  -- Detailed job requirements and specifications
applications          -- Talent applications to gigs with status tracking
bookings              -- Confirmed talent bookings and contracts
portfolio_items       -- Talent portfolio images and descriptions
```

### **Key Relationships**
- Users → Profiles (1:1, role-based profile creation)
- Clients → Gigs (1:many, full CRUD operations)
- Talent → Applications (1:many, status tracking)
- Gigs → Applications (1:many, client review process)

## 🚀 Performance Metrics

### **Current Performance**
- **Bundle Size**: 101kB base, 164-207kB per page
- **Build Time**: ~30 seconds for 36 pages
- **Static Pages**: 60% statically generated
- **Performance Score**: 6/10 (optimization needed)

### **Optimization Opportunities**
1. **Image Optimization**: Currently disabled, needs enabling
2. **Dynamic Imports**: Heavy components loaded synchronously
3. **React Optimization**: Missing memoization in key components
4. **Bundle Analysis**: Some unnecessary client-side dependencies

## 🎨 User Experience Design

### **Role-Based Interfaces**
- **Admin Dashboard**: User management, gig oversight, analytics
- **Client Portal**: Gig creation, application review, talent communication
- **Talent Dashboard**: Profile management, gig discovery, application tracking
- **Public Pages**: Talent browsing, company information, marketing

### **Responsive Design**
- Mobile-first approach with Tailwind CSS
- Consistent design system using shadcn/ui components
- Dark mode support with theme switching
- Progressive enhancement for all features

## 🔄 Data Flow Patterns

### **Read Operations**
```typescript
// Server Component (recommended)
async function GigList() {
  const supabase = await createSupabaseServerClient();
  const { data: gigs } = await supabase
    .from('gigs')
    .select('id,title,location,status,client_id')
    .eq('status', 'active');
  
  return <GigListClient gigs={gigs} />;
}
```

### **Write Operations**
```typescript
// Server Action (required for mutations)
'use server';
export async function createGig(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  const result = await supabase
    .from('gigs')
    .insert([gigData])
    .select('id,title,status');
  
  revalidatePath('/admin/gigs');
  return result;
}
```

## 📈 Business Logic

### **User Workflows**
1. **Client Onboarding**: Registration → Profile completion → First gig posting
2. **Talent Discovery**: Profile creation → Portfolio upload → Gig applications
3. **Booking Process**: Application → Client review → Booking confirmation
4. **Project Delivery**: Communication → File sharing → Payment processing

### **Key Business Rules**
- Only verified clients can post gigs
- Talent must complete profiles before applying
- Applications require status tracking and communication
- All financial transactions logged and auditable

## 🎯 Success Metrics

### **Technical KPIs**
- **Uptime**: 99.9% availability target
- **Performance**: <2s page load times
- **Security**: Zero data breaches
- **Code Quality**: >90% test coverage (future goal)

### **Business KPIs**
- User registration and retention rates
- Gig posting and application volumes
- Successful booking conversion rates
- Platform revenue and transaction tracking

## 🔮 Future Architecture Considerations

### **Scalability Enhancements**
- **Caching Strategy**: Redis for session management and data caching
- **CDN Integration**: Global content delivery for images and static assets
- **Database Optimization**: Read replicas and connection pooling
- **Microservices**: Extract payment processing and notifications

### **Feature Roadmap**
- **Real-time Messaging**: WebSocket integration for client-talent communication
- **Advanced Search**: Full-text search with filters and recommendations
- **Mobile Apps**: React Native or native mobile applications
- **Analytics Dashboard**: Business intelligence and reporting tools

---

**Architecture Health**: 8.5/10
**Last Reviewed**: 2025-01-17
**Next Review**: Quarterly

*This overview provides the foundation for all development decisions and should be consulted before major architectural changes.*