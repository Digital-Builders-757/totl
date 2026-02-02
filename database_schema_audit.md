# TOTL Agency Database Schema Audit

**Audit Date:** December 20, 2025  
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
- ✅ **13 tables** with proper relationships (8 core business tables + 5 supporting tables)
- ✅ **RLS enabled** on all tables for security
- ✅ **Custom enums** for status management
- ✅ **Automatic triggers** for profile creation
- ✅ **Production ready** with clean data
- ✅ **Performance optimized** with comprehensive indexing
- ✅ **Cascading deletes enforced** across auth.users → profiles → dependent tables to keep data consistent during account removal

## 🗂️ Database Overview

- **Total Tables:** 13 (8 core business tables + 5 supporting tables) — see `docs/DATABASE_TABLE_COUNT_RECONCILIATION.md` for verification
- **Total Columns:** 85+
- **Custom Types (Enums):** 5
- **Foreign Key Relationships:** 10
- **Indexes:** 50+ (including primary keys and performance indexes)
- **RLS Policies:** 25+ active policies
- **Views:** 4 (including admin dashboards and performance monitoring)
- **Functions:** 15+ (including triggers and utilities)

## 🧩 Extensions

| Extension | Schema | Purpose | Added Via |
|-----------|--------|---------|-----------|
| `pg_trgm` | `extensions` | Enables trigram similarity searches for indexed text columns and satisfies security migrations that comment on the extension | `20251016160000_create_pg_trgm_extension.sql` |

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

### 5. `subscription_status`
```sql
CREATE TYPE public.subscription_status AS ENUM ('none', 'active', 'past_due', 'canceled');
```
- **Purpose:** Tracks talent subscription status for premium features
- **Default:** `'none'`
- **Usage:** `profiles.subscription_status` column

### 6. `flag_resource_type`
```sql
CREATE TYPE public.flag_resource_type AS ENUM ('gig', 'talent_profile', 'client_profile', 'application', 'booking');
```
- **Purpose:** Identifies which entity was reported to moderation
- **Usage:** `content_flags.resource_type`

### 7. `flag_status`
```sql
CREATE TYPE public.flag_status AS ENUM ('open', 'in_review', 'resolved', 'dismissed');
```
- **Purpose:** Tracks lifecycle of a moderation flag
- **Default:** `'open'`
- **Usage:** `content_flags.status`

## 🗃️ Table Details

### 1. `profiles` - Core User Accounts
**Purpose:** Main user table linked to Supabase Auth

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | - | Primary key, links to auth.users |
| `role` | `user_role` | NO | `'talent'` | User role (talent/client/admin) |
| `account_type` | `account_type_enum` | NO | `'talent'` | Routing/account terminal (talent/client/unassigned) |
| `display_name` | `text` | YES | - | User's display name |
| `avatar_url` | `text` | YES | - | Profile picture URL (legacy) |
| `avatar_path` | `text` | YES | - | Storage path for avatar |
| `email_verified` | `boolean` | NO | `false` | Email verification status |
| `subscription_status` | `subscription_status` | NO | `'none'` | Talent subscription status |
| `stripe_customer_id` | `text` | YES | - | Stripe customer ID for billing |
| `stripe_subscription_id` | `text` | YES | - | Stripe subscription ID |
| `subscription_plan` | `text` | YES | - | Subscription plan (monthly/annual) |
| `subscription_current_period_end` | `timestamp with time zone` | YES | - | Current subscription period end date |
| `is_suspended` | `boolean` | NO | `false` | Whether the account is suspended/banned |
| `suspension_reason` | `text` | YES | - | Admin-provided reason for suspension |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `id` → `auth.users.id` **ON DELETE CASCADE**
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
| `experience_years` | `integer` | YES | - | Years of experience |
| `specialties` | `text[]` | YES | - | Specialties/skills |
| `weight` | `integer` | YES | - | Weight |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `profiles.id` **ON DELETE CASCADE**
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
- Foreign Key: `user_id` → `profiles.id` **ON DELETE CASCADE**
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
| `date` | `date` | NO | - | Job date |
| `application_deadline` | `timestamp with time zone` | YES | - | Application deadline |
| `requirements` | `text[]` | YES | - | Array of requirements |
| `status` | `text` | NO | `'draft'` | Current status |
| `image_url` | `text` | YES | - | Gig image URL |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `client_id` → `profiles.id` **ON DELETE CASCADE**
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
- Foreign Key: `talent_id` → `profiles.id` **ON DELETE CASCADE**
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
| `date` | `timestamp with time zone` | NO | - | Booking date |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id`
- Foreign Key: `talent_id` → `profiles.id` **ON DELETE CASCADE**

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
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `talent_id` → `profiles.id` **ON DELETE CASCADE**

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

---

### 9. `gig_notifications` - Email Notification Preferences
**Purpose:** Store user preferences for gig notification emails

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | YES | - | Optional foreign key to profiles |
| `email` | `text` | NO | - | Email address for notifications |
| `categories` | `text[]` | YES | - | Array of gig categories to notify about |
| `locations` | `text[]` | YES | - | Array of locations to notify about |
| `frequency` | `text` | YES | - | Notification frequency (immediate/daily/weekly) |
| `is_active` | `boolean` | YES | `true` | Whether notifications are enabled |
| `created_at` | `timestamp with time zone` | YES | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | YES | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Unique: `email` (one subscription per email)
- Foreign Key: `user_id` → `auth.users.id` **ON DELETE CASCADE** (optional linkage for authenticated subscribers)

**Indexes:**
- `gig_notifications_pkey` (Primary Key)
- `gig_notifications_email_idx` (Email lookup)
- `gig_notifications_user_id_idx` (User lookup)

**RLS Policies (Optimized for Performance):**
- Users can view their own notifications (uses `(SELECT auth.uid())` for caching)
- Users can insert their own notifications (allows authenticated and anonymous)
- Users can update their own notifications (authenticated only)
- Users can delete their own notifications (authenticated only)
- All policies use `(SELECT auth.uid())` instead of `auth.uid()` for ~95% performance gain

---

### 10. `client_applications` - Client Signup Applications
**Purpose:** Store client applications from the website before account creation

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | YES | - | Optional linkage to `profiles.id` for authenticated submissions / admin promotion |
| `first_name` | `text` | NO | - | First name |
| `last_name` | `text` | NO | - | Last name |
| `email` | `text` | NO | - | Email address (unique) |
| `phone` | `text` | YES | - | Phone number |
| `company_name` | `text` | NO | - | Company name |
| `industry` | `text` | YES | - | Industry |
| `website` | `text` | YES | - | Company website |
| `business_description` | `text` | NO | - | Business description |
| `needs_description` | `text` | NO | - | Needs description |
| `status` | `text` | NO | `'pending'` | Application status |
| `admin_notes` | `text` | YES | - | Admin notes |
| `follow_up_sent_at` | `timestamp with time zone` | YES | - | Timestamp when reminder email was sent |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Unique: `email` (one application per email)
- Foreign Key: `user_id` → `profiles.id` **ON DELETE CASCADE** (optional linkage)

**Indexes:**
- `client_applications_pkey` (Primary Key)
- `client_applications_email_key` (Unique email)

---

### 11. `gig_notifications` - Email Notification Preferences
**Purpose:** Store user preferences for gig notification emails

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `email` | `varchar(255)` | NO | - | Email address for notifications |
| `user_id` | `uuid` | YES | - | Optional foreign key to auth.users |
| `categories` | `text[]` | YES | `'{}'` | Array of gig categories to notify about |
| `locations` | `text[]` | YES | `'{}'` | Array of locations to notify about |
| `frequency` | `varchar(20)` | YES | `'immediate'` | Notification frequency |
| `is_active` | `boolean` | YES | `true` | Whether notifications are enabled |
| `created_at` | `timestamp with time zone` | YES | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | YES | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `auth.users.id` (CASCADE DELETE)
- Check: `frequency IN ('immediate', 'daily', 'weekly')`

**Indexes:**
- `gig_notifications_pkey` (Primary Key)
- `idx_gig_notifications_email` (Email lookup)
- `idx_gig_notifications_user_id` (User lookup)
- `idx_gig_notifications_active` (Active notifications)

---

### 12. `content_flags` - Moderation Reports
**Purpose:** Stores user-reported content issues for the moderation team

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `resource_type` | `flag_resource_type` | NO | - | Type of entity that was flagged (`gig`, `talent_profile`, etc.) |
| `resource_id` | `uuid` | NO | - | Identifier of the flagged resource |
| `gig_id` | `uuid` | YES | - | Optional FK for gig reports |
| `reporter_id` | `uuid` | NO | - | User who submitted the flag |
| `reason` | `text` | NO | - | Short description of the issue |
| `details` | `text` | YES | - | Additional context supplied by reporter |
| `status` | `flag_status` | NO | `'open'` | Moderation workflow status |
| `admin_notes` | `text` | YES | - | Internal notes from moderators |
| `assigned_admin_id` | `uuid` | YES | - | Admin currently handling the flag |
| `resolution_action` | `text` | YES | - | Summary of action taken (e.g., `close_gig`, `ban_user`) |
| `resolved_at` | `timestamp with time zone` | YES | - | Timestamp when the flag was resolved/dismissed |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id` **ON DELETE SET NULL**
- Foreign Key: `reporter_id` → `profiles.id` **ON DELETE CASCADE**
- Foreign Key: `assigned_admin_id` → `profiles.id` **ON DELETE SET NULL**

**Indexes:**
- `content_flags_status_idx` (status filters)
- `content_flags_resource_type_idx` (resource filters)
- `content_flags_gig_idx` (gig lookups)

**RLS Policies:**
- Reporters can insert/select their own flags (`auth.uid() = reporter_id`)
- Admins (profiles.role = 'admin') can select/update/delete all flags

---

### 13. `stripe_webhook_events` - Stripe Webhook Event Ledger
**Purpose:** Proof layer for Stripe webhook handling (idempotency + debugging + operations).

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `event_id` | `text` | NO | - | Stripe `event.id` (**unique**) |
| `type` | `text` | NO | - | Stripe `event.type` |
| `stripe_created` | `bigint` | NO | - | Stripe `event.created` (unix seconds) |
| `livemode` | `boolean` | YES | - | Stripe `event.livemode` |
| `received_at` | `timestamp with time zone` | NO | `now()` | When we received the webhook |
| `processed_at` | `timestamp with time zone` | YES | - | When we finished processing |
| `status` | `text` | NO | `'processing'` | `processing | processed | failed | ignored` |
| `error` | `text` | YES | - | Error message when failed/ignored |
| `customer_id` | `text` | YES | - | Stripe customer ID (if available) |
| `subscription_id` | `text` | YES | - | Stripe subscription ID (if available) |
| `checkout_session_id` | `text` | YES | - | Stripe checkout session ID (if available) |

**Constraints:**
- Primary Key: `id`
- Unique: `event_id` (provable idempotency)
- Check: `status IN ('processing','processed','failed','ignored')`

**Indexes:**
- `stripe_webhook_events_event_id_key` (Unique event lookup)
- `stripe_webhook_events_customer_created_idx` (customer_id + stripe_created for monotonic checks)
- `stripe_webhook_events_customer_processed_created_idx` (customer_id + stripe_created for latest processed lookup)

**RLS:**
- RLS enabled; no user-facing policies (service role / DB admin only).

---

### 14. `email_send_ledger` - Email Send Ledger (Durable Throttle)
**Purpose:** Provable idempotency + cooldown throttling for public-callable email routes (verification + password reset).

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `created_at` | `timestamp with time zone` | NO | `now()` | Ledger row creation timestamp |
| `purpose` | `text` | NO | - | `verify_email` or `password_reset` |
| `recipient_email` | `text` | NO | - | Normalized recipient email |
| `user_id` | `uuid` | YES | - | Optional linkage to auth user/profile id |
| `idempotency_key` | `text` | NO | - | Unique claim key (`purpose:email:cooldown_bucket_iso`) |
| `cooldown_bucket` | `timestamp with time zone` | NO | - | Rounded cooldown window marker |
| `status` | `text` | NO | `'claimed'` | `claimed | sent | failed` (P0 uses claim gate) |
| `provider_message_id` | `text` | YES | - | Resend message id (optional) |
| `meta` | `jsonb` | YES | - | Small metadata blob (optional) |

**Constraints:**
- Primary Key: `id`
- Unique: `(idempotency_key)` (one click → one send per cooldown bucket)
- Check: `purpose IN ('verify_email','password_reset')`
- Check: `status IN ('claimed','sent','failed')`

**Indexes:**
- `email_send_ledger_idempotency_key_key` (Unique claim lookup)
- `email_send_ledger_lookup_idx` (purpose + recipient_email + cooldown_bucket desc)

**RLS:**
- RLS enabled; no user-facing policies (service role / DB admin only).

---

## 📊 Views & Materialized Views

### 1. `admin_bookings_dashboard` - Admin Booking Overview
**Purpose:** Comprehensive view of all bookings with related data

**Columns:**
- `booking_id`, `booking_date`, `booking_compensation`
- `gig_id`, `gig_title`, `gig_status`, `gig_location`
- `talent_display_name`, `talent_avatar_url`
- `client_company_name`

### 2. `admin_talent_dashboard` - Admin Talent Management
**Purpose:** View of all applications with talent and gig information

**Columns:**
- `application_id`, `talent_id`, `application_status`, `application_created_at`
- `gig_id`, `gig_title`, `gig_status`, `gig_location`
- `talent_display_name`, `talent_avatar_url`
- `client_company_name`

### 3. `admin_dashboard_cache` - Performance Statistics
**Purpose:** Materialized view for admin dashboard statistics

**Columns:**
- `total_users`, `total_talent`, `total_clients`
- `total_gigs`, `active_gigs`
- `total_applications`, `total_bookings`
- `last_updated`

### 4. `performance_metrics` - Database Statistics
**Purpose:** Performance monitoring view for database statistics

**Columns:**
- `schemaname`, `tablename`, `attname`
- `n_distinct`, `correlation`

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
11. `gig_notifications.user_id` → `auth.users.id` (CASCADE DELETE)
12. `content_flags.reporter_id` → `profiles.id` (CASCADE DELETE)
13. `content_flags.assigned_admin_id` → `profiles.id` (SET NULL - preserves flags when admin deleted)
14. `content_flags.gig_id` → `gigs.id` (SET NULL - preserves flags when gig deleted)

## 🔒 Row-Level Security (RLS)

### **Active RLS Policies**

#### **profiles Table**
```sql
-- Public can view basic profile info (application-level controls restrict sensitive data)
CREATE POLICY "Public profiles view" ON profiles FOR SELECT TO anon, authenticated USING (true);

-- Users can update their own profile
CREATE POLICY "Update own profile" ON profiles FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Insert profile by user or service" ON profiles FOR INSERT TO public 
WITH CHECK (id = auth.uid());

-- NOTE: A recursive admin-read policy on profiles was removed because it caused:
--   SQLSTATE 42P17: infinite recursion detected in policy for relation "profiles"
-- Migration: supabase/migrations/20251220131212_drop_recursive_profiles_admin_policy.sql
```

#### **talent_profiles Table**
```sql
-- Public can view talent profiles (application-level controls restrict sensitive data)
CREATE POLICY "Public talent profiles view" ON talent_profiles FOR SELECT TO anon, authenticated USING (true);

-- Talent can update their own profile
CREATE POLICY "Update own talent profile" ON talent_profiles FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- Talent can insert their own profile
CREATE POLICY "Insert own talent profile" ON talent_profiles FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());
```

#### **client_profiles Table**
```sql
-- Only authenticated users can view client profiles (NO public access)
CREATE POLICY "Client profiles view" ON client_profiles FOR SELECT TO authenticated USING (true);

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
  talent_id = (SELECT auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM gigs 
    WHERE gigs.id = applications.gig_id 
    AND gigs.client_id = (SELECT auth.uid())
  )
);

-- Talent can apply to gigs
CREATE POLICY "Talent can apply to gigs" ON applications FOR INSERT TO authenticated 
WITH CHECK (talent_id = (SELECT auth.uid()));

-- Update application status
CREATE POLICY "Update application status" ON applications FOR UPDATE TO authenticated 
USING (
  talent_id = (SELECT auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM gigs 
    WHERE gigs.id = applications.gig_id 
    AND gigs.client_id = (SELECT auth.uid())
  )
);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON applications FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Admins can manage all applications (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all applications" ON applications FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);
```

#### **bookings Table**
```sql
-- Public can view bookings
CREATE POLICY "Bookings view policy" ON bookings FOR SELECT USING (true);

-- Talent can insert their own bookings
CREATE POLICY "Insert own bookings" ON bookings FOR INSERT TO authenticated 
WITH CHECK (talent_id = auth.uid());

-- Users can update their own bookings
CREATE POLICY "Update own bookings" ON bookings FOR UPDATE TO authenticated 
USING ((talent_id = auth.uid()) OR (gig_id IN (SELECT gigs.id FROM gigs WHERE gigs.client_id = auth.uid())));
```

#### **portfolio_items Table**
```sql
-- Public can view portfolio items
CREATE POLICY "Portfolio items view policy" ON portfolio_items FOR SELECT USING (true);

-- Talent can insert their own portfolio items
CREATE POLICY "Insert own portfolio items" ON portfolio_items FOR INSERT TO authenticated 
WITH CHECK (talent_id = auth.uid());

-- Talent can update their own portfolio items
CREATE POLICY "Update own portfolio items" ON portfolio_items FOR UPDATE TO authenticated 
USING (talent_id = auth.uid());
```

#### **gig_requirements Table**
```sql
-- Clients can manage requirements for their gigs
CREATE POLICY "Clients can manage requirements for their gigs" ON gig_requirements 
USING ((EXISTS (SELECT 1 FROM gigs WHERE (gigs.id = gig_requirements.gig_id) AND (gigs.client_id = (SELECT auth.uid())))));
```

#### **gig_notifications Table**
```sql
-- Users can view their own notifications (optimized with cached auth check)
CREATE POLICY "Users can view their own notifications" ON gig_notifications FOR SELECT 
USING (((SELECT auth.uid()) = user_id) OR ((SELECT auth.uid()) IS NULL));

-- Users can insert their own notifications (allows authenticated and anonymous)
CREATE POLICY "Users can insert their own notifications" ON gig_notifications FOR INSERT 
WITH CHECK (((SELECT auth.uid()) = user_id) OR ((SELECT auth.uid()) IS NULL));

-- Users can update their own notifications (authenticated only)
CREATE POLICY "Users can update their own notifications" ON gig_notifications FOR UPDATE TO authenticated 
USING (((SELECT auth.uid()) = user_id));

-- Users can delete their own notifications (authenticated only)
CREATE POLICY "Users can delete their own notifications" ON gig_notifications FOR DELETE TO authenticated 
USING (((SELECT auth.uid()) = user_id));
```

#### **client_applications Table**
```sql
-- AUTH REQUIRED (Career Builder application)
-- Authenticated users can insert their own applications (ownership by user_id)
CREATE POLICY "Authenticated users can insert own client applications" ON client_applications
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Authenticated users can view their own applications (ownership by user_id)
CREATE POLICY "Authenticated users can view own client applications" ON client_applications
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Admins can view all applications
CREATE POLICY "Allow admins to view applications" ON client_applications FOR SELECT 
USING ((EXISTS (SELECT 1 FROM profiles WHERE (profiles.id = (SELECT auth.uid())) AND (profiles.role = 'admin'))));

-- Admins can update applications
CREATE POLICY "Allow admins to update applications" ON client_applications FOR UPDATE 
USING ((EXISTS (SELECT 1 FROM profiles WHERE (profiles.id = (SELECT auth.uid())) AND (profiles.role = 'admin'))));
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

### **on_auth_user_email_confirmed Trigger**
**Purpose:** Keeps `profiles.email_verified` in sync when `auth.users.email_confirmed_at` changes (email verification)

**Function:** `sync_profiles_email_verified_from_auth_users()`
**Location:** `supabase/migrations/20251216013000_sync_profiles_email_verified_on_auth_confirm.sql`

### **profiles_stripe_fields_lock Trigger**
**Purpose:** Prevent authenticated users from mutating Stripe/subscription entitlement fields directly via PostgREST.

**Function:** `prevent_profile_stripe_fields_user_update()`
**Location:** `supabase/migrations/20251220033929_add_stripe_webhook_events_ledger.sql`

### **Career Builder decision + promotion RPCs (client applications)**
**Purpose:** Atomic, idempotent admin decision primitives for Career Builder applications (approve → promote role to `client`).

**Function:** `approve_client_application_and_promote()` (SECURITY DEFINER, admin-only)
**Location:** `supabase/migrations/20251220130000_client_application_promotion_rpc.sql` (with follow-up fixes in later migrations)

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
| `client_applications` | 0 | ✅ Clean (ready for client signups) |
| `gig_notifications` | 0 | ✅ Clean (ready for email subscriptions) |

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
8. **`20251016160000_create_pg_trgm_extension.sql`** - Installs `pg_trgm` inside the extensions schema so later migrations that comment on the extension succeed
9. **`20251016171212_enhance_portfolio_items_for_gallery.sql`** - Portfolio gallery system (image_path, ordering, primary images)
10. **`20251016172507_fix_performance_advisor_warnings.sql`** - Performance optimization (RLS caching, index cleanup)
11. **`20251021164837_fix_gig_notifications_rls_and_duplicate_indexes.sql`** - Final performance optimization (gig_notifications RLS, duplicate index cleanup)
12. **`20251127162000_fix_admin_dashboard_comments.sql`** - Rewrites admin dashboard view/function comments without concatenation so migrations run in clean environments
13. **`20251127173000_fix_query_stats_view.sql`** - Recreates `query_stats` using `relname`/`indexrelname` so it works against modern PostgreSQL catalog columns
14. **`20251204150904_add_cascade_delete_constraints.sql`** - **🚨 CRITICAL** - Enforces ON DELETE CASCADE on all user-related foreign keys to ensure complete data cleanup when users are deleted
15. **`20251217200615_drop_query_stats_view.sql`** - Drops `public.query_stats` (not needed) to eliminate security advisor warnings and reduce exposed monitoring surface
16. **`20260202204142_recreate_content_flags.sql`** - Recreates moderation tooling (content flags table + policies) when drift is detected

### **Recent Updates**
- ✅ **Extension alignment (Nov 27, 2025)** — Added migration `20251016160000_create_pg_trgm_extension.sql` so `pg_trgm` is always installed in the `extensions` schema before later security migrations run (prevents local resets from failing)
- ✅ **Admin dashboard comment fix (Nov 27, 2025)** — Added migration `20251127162000_fix_admin_dashboard_comments.sql` to remove `'||'` concatenation from COMMENT statements that caused local resets to fail
- ✅ **Query stats view fix (Nov 27, 2025)** — Added migration `20251127173000_fix_query_stats_view.sql` so the view aliases `relname`/`indexrelname` (Postgres 15 catalogs) and no longer references nonexistent `tablename` columns
- ✅ **Query stats view removal (Dec 17, 2025)** — Added migration `20251217200615_drop_query_stats_view.sql` to remove `public.query_stats` entirely since it is not needed and was generating security advisor warnings
- ✅ **Moderation tooling repair (Feb 2, 2026)** — Added migration `20260202204142_recreate_content_flags.sql` to recreate `public.content_flags` and its RLS policies when missing in production
- ✅ **Cascading delete alignment (Nov 23, 2025)** — All user-centric foreign keys now use `ON DELETE CASCADE` with supporting indexes:
  - `profiles.id` → `auth.users.id`
  - `talent_profiles.user_id`, `client_profiles.user_id`, `gigs.client_id`, `applications.talent_id`, `bookings.talent_id`, `portfolio_items.talent_id` → `profiles.id`
  - `gig_notifications.user_id` → `auth.users.id`
- ✅ **Cascade delete enforcement (Dec 4, 2025)** — Migration `20251204150904_add_cascade_delete_constraints.sql` explicitly enforces ON DELETE CASCADE on all foreign keys:
  - **Public schema:** All constraints verified and updated to ensure cascading deletes
  - **Content flags:** `reporter_id` → CASCADE, `assigned_admin_id` → SET NULL (preserves flags when admin deleted)
  - **Auth schema:** Not modified (Supabase-managed tables - handled internally by Supabase)
  - **Result:** Deleting a user from `auth.users` will cascade delete all related data (profiles, applications, bookings, portfolio items, etc.)
- ✅ **Production cleanup** - Removed all mock data
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
- ✅ **Performance optimization - Final (Oct 21, 2025)** - Fixed remaining linter warnings:
  - Optimized 4 gig_notifications RLS policies to use `(SELECT auth.uid())`
  - Removed final duplicate indexes (applications_gig_idx, applications_talent_idx, bookings_gig_idx)
  - All RLS policies now use cached auth checks for optimal performance
- ✅ **CRITICAL SECURITY FIX (Oct 24, 2025)** - Fixed overly permissive RLS policies:
  - Restricted client_profiles to authenticated users only (no public access)
  - Updated talent_profiles and profiles policies with better security comments
  - Application-level controls now provide the actual data protection
  - Migration: `20251024170927_fix_overly_permissive_rls_policies.sql`
- ✅ **Portfolio gallery enhancement** - Added image_path, display_order, is_primary fields to portfolio_items
- ✅ **Storage buckets** - Created 'portfolio' bucket with RLS policies for talent portfolio images
- ✅ **Schema audit update (Oct 23, 2025)** - Comprehensive documentation sync:
  - Added missing tables: `client_applications`, `gig_notifications`
  - Updated column types: `gigs.date` (date), `bookings.date` (timestamp)
  - Added missing columns: `talent_profiles.experience_years`, `specialties`, `weight`
  - Added missing views: `performance_metrics`
  - Updated RLS policies for all tables
  - Verified 50+ indexes and 25+ RLS policies

---

**This document serves as the single source of truth for the TOTL Agency database schema.** 