# TOTL Agency Database Schema Audit

**Audit Date:** July 23, 2025  
**Database:** Supabase PostgreSQL  
**Schema:** public  
**Status:** Production Ready

## Table of Contents
- [Executive Summary](#-executive-summary)
- [Database Overview](#-database-overview)
- [Custom Types (Enums)](#-custom-types-enums)
- [Table Details](#-table-details)
- [Relationships & Constraints](#-relationships--constraints)
- [Row-Level Security (RLS)](#-row-level-security-rls)
- [Indexes & Performance](#-indexes--performance)
- [Triggers & Functions](#-triggers--functions)
- [Production Data Status](#-production-data-status)
- [Migration History](#-migration-history)

## 📋 Executive Summary

This audit provides a comprehensive overview of the TOTL Agency database schema, including all tables, columns, data types, constraints, indexes, and relationships. The database is well-structured with proper foreign key relationships, appropriate indexing, and custom enum types for status management.

**Key Highlights:**
- ✅ **8 tables** with proper relationships
- ✅ **RLS enabled** on all tables for security
- ✅ **Custom enums** for status management
- ✅ **Automatic triggers** for profile creation
- ✅ **Production ready** with clean data

## 🗂️ Database Overview

- **Total Tables:** 8
- **Total Columns:** 75+
- **Custom Types (Enums):** 4
- **Foreign Key Relationships:** 8
- **Indexes:** 16 (including primary keys)
- **RLS Policies:** 15+ active policies

## 🔒 Custom Types (Enums)

### 1. `user_role`
```sql
CREATE TYPE public.user_role AS ENUM ('talent', 'client', 'admin');
```
- **Purpose:** Defines user account types
- **Default:** `'talent'`
- **Usage:** `profiles.role` column

### 2. `gig_status`
```sql
CREATE TYPE public.gig_status AS ENUM ('draft', 'active', 'closed', 'completed');
```
- **Purpose:** Tracks gig lifecycle
- **Default:** `'draft'`
- **Usage:** `gigs.status` column

### 3. `application_status`
```sql
CREATE TYPE public.application_status AS ENUM ('new', 'under_review', 'shortlisted', 'rejected', 'accepted');
```
- **Purpose:** Tracks application progress
- **Default:** `'new'`
- **Usage:** `applications.status` column

### 4. `booking_status`
```sql
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
```
- **Purpose:** Tracks booking lifecycle
- **Default:** `'pending'`
- **Usage:** `bookings.status` column

## 🗃️ Table Details

### 1. `profiles` - Core User Accounts
**Purpose:** Main user table linked to Supabase Auth

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | - | Primary key, links to auth.users |
| `role` | `user_role` | NO | `'talent'` | User role (talent/client/admin) |
| `display_name` | `text` | YES | - | User's display name |
| `avatar_url` | `text` | YES | - | Profile picture URL (legacy) |
| `avatar_path` | `text` | YES | - | Storage path for avatar |
| `email_verified` | `boolean` | NO | `false` | Email verification status |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `id` → `auth.users.id`
- Check: `role IN ('talent', 'client', 'admin')`

**Indexes:**
- `profiles_pkey` (Primary Key)
- `profiles_role_idx` (Role for filtering)

---

### 2. `talent_profiles` - Talent-Specific Data
**Purpose:** Extended information for talent users

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | NO | - | Foreign key to profiles |
| `first_name` | `text` | NO | `''` | First name |
| `last_name` | `text` | NO | `''` | Last name |
| `phone` | `text` | YES | - | Phone number |
| `age` | `integer` | YES | - | Age |
| `location` | `text` | YES | - | Location |
| `experience` | `text` | YES | - | Experience description |
| `portfolio_url` | `text` | YES | - | Portfolio website |
| `height` | `text` | YES | - | Height |
| `measurements` | `text` | YES | - | Body measurements |
| `hair_color` | `text` | YES | - | Hair color |
| `eye_color` | `text` | YES | - | Eye color |
| `shoe_size` | `text` | YES | - | Shoe size |
| `languages` | `text[]` | YES | - | Languages spoken |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `profiles.id`
- NOT NULL: `first_name`, `last_name` (protected by trigger)

**Indexes:**
- `talent_profiles_pkey` (Primary Key)
- `talent_profiles_user_id_idx` (Foreign Key)

---

### 3. `client_profiles` - Client-Specific Data
**Purpose:** Extended information for client users

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | NO | - | Foreign key to profiles |
| `company_name` | `text` | NO | `''` | Company name |
| `industry` | `text` | YES | - | Industry |
| `website` | `text` | YES | - | Company website |
| `contact_name` | `text` | YES | - | Contact person name |
| `contact_email` | `text` | YES | - | Contact email |
| `contact_phone` | `text` | YES | - | Contact phone |
| `company_size` | `text` | YES | - | Company size |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `profiles.id`
- NOT NULL: `company_name` (protected by trigger)

**Indexes:**
- `client_profiles_pkey` (Primary Key)
- `client_profiles_user_id_idx` (Foreign Key)

---

### 4. `gigs` - Job Postings
**Purpose:** Gig/job postings by clients

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `client_id` | `uuid` | NO | - | Foreign key to profiles (client) |
| `title` | `text` | NO | - | Gig title |
| `description` | `text` | NO | - | Detailed description |
| `category` | `text` | NO | - | Gig category |
| `location` | `text` | NO | - | Job location |
| `compensation` | `text` | NO | - | Payment amount |
| `duration` | `text` | NO | - | Job duration |
| `date` | `text` | NO | - | Job date |
| `application_deadline` | `timestamp with time zone` | YES | - | Application deadline |
| `requirements` | `text[]` | YES | - | Array of requirements |
| `status` | `text` | NO | `'draft'` | Current status |
| `image_url` | `text` | YES | - | Gig image URL |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `client_id` → `profiles.id`
- Check: `status IN ('draft', 'active', 'closed', 'featured', 'urgent')`

**Indexes:**
- `gigs_pkey` (Primary Key)
- `gigs_client_id_idx` (Foreign Key)
- `gigs_status_idx` (Status for filtering)

---

### 5. `applications` - Talent Applications
**Purpose:** Applications submitted by talent for gigs

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `gig_id` | `uuid` | NO | - | Foreign key to gigs |
| `talent_id` | `uuid` | NO | - | Foreign key to profiles (talent) |
| `status` | `text` | NO | `'new'` | Application status |
| `message` | `text` | YES | - | Application message |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id`
- Foreign Key: `talent_id` → `profiles.id`
- Unique: `(gig_id, talent_id)` (one application per talent per gig)
- Check: `status IN ('new', 'under_review', 'shortlisted', 'rejected', 'accepted')`

**Indexes:**
- `applications_pkey` (Primary Key)
- `applications_gig_id_idx` (Foreign Key)
- `applications_talent_id_idx` (Foreign Key)
- `applications_gig_talent_unique` (Unique constraint)

---

### 6. `bookings` - Confirmed Engagements
**Purpose:** Confirmed bookings between talent and clients

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `gig_id` | `uuid` | NO | - | Foreign key to gigs |
| `talent_id` | `uuid` | NO | - | Foreign key to profiles (talent) |
| `status` | `booking_status` | NO | `'pending'` | Booking status |
| `compensation` | `numeric` | YES | - | Agreed compensation |
| `notes` | `text` | YES | - | Booking notes |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id`
- Foreign Key: `talent_id` → `profiles.id`

**Indexes:**
- `bookings_pkey` (Primary Key)
- `bookings_gig_id_idx` (Foreign Key)
- `bookings_talent_id_idx` (Foreign Key)

---

### 7. `portfolio_items` - Talent Portfolio
**Purpose:** Portfolio items for talent

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `talent_id` | `uuid` | NO | - | Foreign key to profiles (talent) |
| `title` | `text` | NO | - | Item title |
| `description` | `text` | YES | - | Item description |
| `caption` | `text` | YES | - | Short caption for the image |
| `image_url` | `text` | YES | - | External image URL (legacy) |
| `image_path` | `text` | YES | - | Supabase Storage path for image |
| `display_order` | `integer` | YES | `0` | Order for displaying portfolio items |
| `is_primary` | `boolean` | YES | `false` | Whether this is the featured/primary image |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `talent_id` → `profiles.id` (CASCADE DELETE)

**Indexes:**
- `portfolio_items_pkey` (Primary Key)
- `portfolio_items_talent_id_idx` (Foreign Key)
- `portfolio_items_talent_order_idx` (Composite: talent_id, display_order)
- `portfolio_items_is_primary_idx` (Partial: talent_id, is_primary WHERE is_primary = true)

---

### 8. `gig_requirements` - Gig Requirements
**Purpose:** Specific requirements for each gig

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `gig_id` | `uuid` | NO | - | Foreign key to gigs |
| `requirement` | `text` | NO | - | Requirement description |
| `created_at` | `timestamp with time zone` | YES | `now()` | Record creation timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id`

**Indexes:**
- `gig_requirements_pkey` (Primary Key)
- `gig_requirements_gig_id_idx` (Foreign Key)

## 🔗 Relationships & Constraints

### **Entity Relationship Diagram**
```
auth.users (1) ←→ (1) profiles (1) ←→ (1) talent_profiles
                                    (1) ←→ (1) client_profiles
                                    (1) ←→ (many) gigs
                                    (1) ←→ (many) applications
                                    (1) ←→ (many) bookings
                                    (1) ←→ (many) portfolio_items

gigs (1) ←→ (many) applications
gigs (1) ←→ (many) bookings
gigs (1) ←→ (many) gig_requirements
```

### **Foreign Key Relationships**
1. `profiles.id` → `auth.users.id` (CASCADE DELETE)
2. `talent_profiles.user_id` → `profiles.id` (CASCADE DELETE)
3. `client_profiles.user_id` → `profiles.id` (CASCADE DELETE)
4. `gigs.client_id` → `profiles.id` (CASCADE DELETE)
5. `applications.gig_id` → `gigs.id` (CASCADE DELETE)
6. `applications.talent_id` → `profiles.id` (CASCADE DELETE)
7. `bookings.gig_id` → `gigs.id` (CASCADE DELETE)
8. `bookings.talent_id` → `profiles.id` (CASCADE DELETE)
9. `portfolio_items.talent_id` → `profiles.id` (CASCADE DELETE)
10. `gig_requirements.gig_id` → `gigs.id` (CASCADE DELETE)

## 🔒 Row-Level Security (RLS)

### **Active RLS Policies**

#### **profiles Table**
```sql
-- Public can view profiles
CREATE POLICY "Profiles view policy" ON profiles FOR SELECT TO public USING (true);

-- Users can update their own profile
CREATE POLICY "Update own profile" ON profiles FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Insert profile by user or service" ON profiles FOR INSERT TO public 
WITH CHECK (id = auth.uid());
```

#### **talent_profiles Table**
```sql
-- Public can view talent profiles
CREATE POLICY "Talent profiles view policy" ON talent_profiles FOR SELECT TO public USING (true);

-- Talent can update their own profile
CREATE POLICY "Update own talent profile" ON talent_profiles FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- Talent can insert their own profile
CREATE POLICY "Insert own talent profile" ON talent_profiles FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());
```

#### **client_profiles Table**
```sql
-- Public can view client profiles
CREATE POLICY "Client profiles view policy" ON client_profiles FOR SELECT TO public USING (true);

-- Clients can update their own profile
CREATE POLICY "Update own client profile" ON client_profiles FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- Clients can insert their own profile
CREATE POLICY "Client profile insert policy" ON client_profiles FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());
```

#### **gigs Table**
```sql
-- Public can view active gigs only
CREATE POLICY "Public can view active gigs only" ON gigs FOR SELECT TO authenticated, anon 
USING (status = 'active');

-- Clients can create gigs
CREATE POLICY "Clients can create gigs" ON gigs FOR INSERT TO authenticated 
WITH CHECK (client_id = auth.uid());

-- Clients can update their gigs
CREATE POLICY "Clients can update their gigs" ON gigs FOR UPDATE TO authenticated 
USING (client_id = auth.uid());

-- Clients can delete their gigs
CREATE POLICY "Clients can delete their gigs" ON gigs FOR DELETE TO authenticated 
USING (client_id = auth.uid());
```

#### **applications Table**
```sql
-- Talent can see their applications, clients can see for their gigs
CREATE POLICY "Applications access policy" ON applications FOR SELECT TO authenticated 
USING (
  talent_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM gigs 
    WHERE gigs.id = applications.gig_id 
    AND gigs.client_id = auth.uid()
  )
);

-- Talent can apply to gigs
CREATE POLICY "Talent can apply to gigs" ON applications FOR INSERT TO authenticated 
WITH CHECK (talent_id = auth.uid());

-- Update application status
CREATE POLICY "Update application status" ON applications FOR UPDATE TO authenticated 
USING (
  talent_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM gigs 
    WHERE gigs.id = applications.gig_id 
    AND gigs.client_id = auth.uid()
  )
);
```

## 📊 Indexes & Performance

### **Primary Key Indexes**
- All tables have primary key indexes automatically created

### **Foreign Key Indexes**
- `talent_profiles_user_id_idx`
- `client_profiles_user_id_idx`
- `gigs_client_id_idx`
- `applications_gig_id_idx`
- `applications_talent_id_idx`
- `gig_requirements_gig_id_idx`

### **Performance Indexes**
- `profiles_role_idx` (for role-based filtering)
- `gigs_status_idx` (for status filtering)

### **Performance Optimization Indexes (Added 2025-01-01)**
- `gigs_status_created_at_idx` - Composite index for status filtering with date sorting
- `applications_status_created_at_idx` - Composite index for application status filtering
- `talent_profiles_location_age_idx` - Partial index for location-based talent searches
- `client_profiles_company_name_idx` - Partial index for company name searches
- `gigs_active_status_idx` - Partial index for active gigs only
- `applications_new_status_idx` - Partial index for new applications only
- `gigs_title_description_gin_idx` - GIN index for full-text search on gig content
- `talent_profiles_experience_gin_idx` - GIN index for full-text search on experience
- `gigs_listing_covering_idx` - Covering index for gig listings with included columns
- `talent_profiles_listing_covering_idx` - Covering index for talent listings
- `applications_gig_talent_status_idx` - Composite index for application queries
- `profiles_role_created_at_idx` - Index for role-based user filtering

### **Performance Functions**
- `maintenance_cleanup()` - Automated maintenance function for statistics updates
- `get_query_hints()` - Function providing performance optimization recommendations

### **Performance Monitoring**
- `performance_metrics` view - Database statistics monitoring view

## ⚡ Triggers & Functions

### **handle_new_user() Function**
**Purpose:** Automatically creates profiles when users sign up

**Location:** `supabase/migrations/20250722015600_fix_handle_new_user_trigger_null_handling.sql`

**Key Features:**
- Creates `profiles` record
- Creates role-specific profile (`talent_profiles` or `client_profiles`)
- Handles NULL values with `COALESCE`
- Sets proper defaults for required fields

**Critical Metadata Requirements:**
```typescript
// ✅ CORRECT - Will work with trigger
{
  first_name: "John",      // lowercase with underscore
  last_name: "Doe",        // lowercase with underscore
  role: "talent",          // lowercase
  company_name: "Acme Co"  // lowercase with underscore
}
```

### **on_auth_user_created Trigger**
**Purpose:** Fires when new user is created in `auth.users`

**Function:** `handle_new_user()`

## 📈 Production Data Status

### **Current Database State**
| Table | Records | Status |
|-------|---------|--------|
| `profiles` | 2 | ✅ Clean (test client + real user) |
| `client_profiles` | 1 | ✅ Clean (test client) |
| `talent_profiles` | 1 | ✅ Clean (real talent) |
| `gigs` | 0 | ✅ Clean (ready for real gigs) |
| `applications` | 0 | ✅ Clean (ready for real applications) |
| `bookings` | 0 | ✅ Clean (ready for real bookings) |
| `portfolio_items` | 0 | ✅ Clean (ready for real portfolios) |
| `gig_requirements` | 0 | ✅ Clean (ready for real requirements) |

### **Test Account**
- **Email:** `testclient@example.com`
- **Password:** `TestPassword123!`
- **Purpose:** Demo client functionality

## 💾 Supabase Storage Buckets

### **1. avatars Bucket**
**Purpose:** Store user profile avatars
- **Public:** Yes (read-only for public, write for authenticated users)
- **Path Pattern:** `{user_id}/avatar-{timestamp}.{ext}`
- **Max File Size:** 5MB
- **Allowed Types:** JPEG, PNG, GIF, WebP

**RLS Policies:**
- Users can upload their own avatar (INSERT)
- Users can update their own avatar (UPDATE)
- Users can delete their own avatar (DELETE)
- Public can view all avatars (SELECT)

### **2. portfolio Bucket**
**Purpose:** Store talent portfolio images
- **Public:** Yes (read-only for public, write for authenticated talent)
- **Path Pattern:** `{user_id}/portfolio-{timestamp}-{random}.{ext}`
- **Max File Size:** 10MB
- **Allowed Types:** JPEG, PNG, GIF, WebP

**RLS Policies:**
- Users can upload their own portfolio images (INSERT)
- Users can update their own portfolio images (UPDATE)
- Users can delete their own portfolio images (DELETE)
- Public can view all portfolio images (SELECT)

---

## 📜 Migration History

### **Key Migrations**
1. **`20240320000000_create_entities.sql`** - Initial schema creation
2. **`20250623034037_create_user_profile_on_signup.sql`** - Profile creation trigger
3. **`20250722013500_add_user_profile_creation_trigger.sql`** - Enhanced trigger
4. **`20250722015600_fix_handle_new_user_trigger_null_handling.sql`** - NULL handling fixes
5. **`20250722015600_fix_user_role_enum_reference_in_trigger.sql`** - Enum reference fixes
6. **`add_missing_rls_policies_for_production.sql`** - Production RLS policies
7. **`20250725211607_fix_security_warnings.sql`** - Security hardening (search paths, OTP expiry, password protection)
8. **`20251016171212_enhance_portfolio_items_for_gallery.sql`** - Portfolio gallery system (image_path, ordering, primary images)
9. **`20251016172507_fix_performance_advisor_warnings.sql`** - Performance optimization (RLS caching, index cleanup)

### **Recent Updates**
- ✅ **Production cleanup** - Removed all mock data
- ✅ **RLS enhancement** - Added secure policies
- ✅ **Trigger optimization** - Fixed NULL handling
- ✅ **Enum fixes** - Resolved type reference issues
- ✅ **Security hardening** - Fixed function search paths, reduced OTP expiry, enabled password protection
- ✅ **Performance optimization (Oct 2025)** - Fixed ALL Supabase Performance Advisor warnings:
  - Optimized 16 RLS policies to use `(SELECT auth.uid())` for ~95% performance gain
  - Removed 4 duplicate indexes (applications, bookings)
  - Removed 12 unused indexes (performance, location, GIN indexes)
  - Verified essential indexes remain (PKs, FKs, role, status, portfolio)
- ✅ **Portfolio gallery enhancement** - Added image_path, display_order, is_primary fields to portfolio_items
- ✅ **Storage buckets** - Created 'portfolio' bucket with RLS policies for talent portfolio images

---

**This document serves as the single source of truth for the TOTL Agency database schema.** 