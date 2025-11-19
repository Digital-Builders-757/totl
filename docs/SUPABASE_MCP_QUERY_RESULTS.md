# Supabase Database Query Results

**Date:** November 17, 2025  
**Source:** Database Schema Audit & TypeScript Types

---

## 📋 1. All Tables in Supabase Database

Based on `database_schema_audit.md`, your database contains **11 tables**:

1. **`profiles`** - Core user accounts (linked to Supabase Auth)
2. **`talent_profiles`** - Talent-specific extended data
3. **`client_profiles`** - Client-specific extended data
4. **`gigs`** - Job postings by clients
5. **`applications`** - Talent applications for gigs
6. **`bookings`** - Confirmed bookings
7. **`portfolio_items`** - Talent portfolio images
8. **`gig_notifications`** - Notification tracking
9. **`client_applications`** - Client signup applications (admin)
10. **`performance_metrics`** - Performance monitoring view
11. **`query_stats`** - Query statistics view

**Total:** 11 tables (9 base tables + 2 views)

---

## 📊 2. Schema for `profiles` Table

### **Table: `profiles`**
**Purpose:** Main user table linked to Supabase Auth

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | - | Primary key, links to `auth.users.id` |
| `role` | `user_role` | NO | `'talent'` | User role enum: `'talent'`, `'client'`, `'admin'` |
| `display_name` | `text` | YES | - | User's display name |
| `avatar_url` | `text` | YES | - | Profile picture URL (legacy) |
| `avatar_path` | `text` | YES | - | Storage path for avatar |
| `email_verified` | `boolean` | NO | `false` | Email verification status |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

### **Constraints:**
- **Primary Key:** `id`
- **Foreign Key:** `id` → `auth.users.id`
- **Check Constraint:** `role IN ('talent', 'client', 'admin')`

### **Indexes:**
- `profiles_pkey` (Primary Key)
- `profiles_role_idx` (Role for filtering)

### **RLS Policies:**
- Users can read their own profile
- Users can update their own profile
- Admins can read all profiles

---

## 🔍 3. First 5 Records from `profiles` Table

**Note:** To query actual data, you would need to:
1. Use Supabase MCP tools (if connected)
2. Use Supabase CLI: `npx supabase db remote query "SELECT * FROM profiles LIMIT 5"`
3. Use the project's API endpoint: `/api/admin/test-connection`

**Example Query:**
```sql
SELECT 
  id,
  role,
  display_name,
  email_verified,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Columns:**
- `id` (UUID)
- `role` (user_role enum)
- `display_name` (text or null)
- `email_verified` (boolean)
- `created_at` (timestamp)

---

## 🏗️ 4. Structure of `gigs` Table

### **Table: `gigs`**
**Purpose:** Job postings by clients

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `client_id` | `uuid` | NO | - | Foreign key to `profiles.id` (client) |
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

### **Constraints:**
- **Primary Key:** `id`
- **Foreign Key:** `client_id` → `profiles.id`
- **Check Constraint:** `status IN ('draft', 'active', 'closed', 'featured', 'urgent')`

### **Indexes:**
- `gigs_pkey` (Primary Key)
- `gigs_client_id_idx` (Foreign Key - for client's gigs)
- `gigs_status_idx` (Status for filtering active gigs)

### **RLS Policies:**
- Clients can read their own gigs
- Clients can create/update/delete their own gigs
- Talent can read active gigs
- Admins can read all gigs

### **Relationships:**
- **One-to-Many:** `gigs.client_id` → `profiles.id` (one client has many gigs)
- **One-to-Many:** `applications.gig_id` → `gigs.id` (one gig has many applications)

---

## 📝 Summary

### **Database Statistics:**
- **Total Tables:** 11 (9 base + 2 views)
- **Total Columns:** 85+
- **Custom Enums:** 4 (`user_role`, `gig_status`, `application_status`, `booking_status`)
- **Foreign Keys:** 10 relationships
- **Indexes:** 50+ (including primary keys and performance indexes)
- **RLS Policies:** 25+ active policies

### **Key Relationships:**
1. `profiles` ← `talent_profiles` (1:1)
2. `profiles` ← `client_profiles` (1:1)
3. `profiles` → `gigs` (1:many, client creates gigs)
4. `gigs` → `applications` (1:many, talent applies to gigs)
5. `applications` → `bookings` (1:1, accepted applications become bookings)

---

## 🔗 Next Steps

To query actual data:
1. **Use Supabase CLI:**
   ```bash
   npx supabase db remote query "SELECT * FROM profiles LIMIT 5"
   ```

2. **Use Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Use SQL Editor

3. **Use Supabase MCP (if connected):**
   - Ask Cursor: "Query the first 5 profiles"
   - The MCP server should handle this automatically

---

**Last Updated:** November 17, 2025  
**Source:** `database_schema_audit.md` (Single Source of Truth)

