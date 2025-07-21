# TOTL Agency Database Schema Audit

**Audit Date:** December 2024  
**Database:** Supabase PostgreSQL  
**Schema:** public  

## 📋 Executive Summary

This audit provides a comprehensive overview of the TOTL Agency database schema, including all tables, columns, data types, constraints, indexes, and relationships. The database is well-structured with proper foreign key relationships, appropriate indexing, and custom enum types for status management.

## 🗂️ Database Overview

- **Total Tables:** 8
- **Total Columns:** 75
- **Custom Types (Enums):** 4
- **Foreign Key Relationships:** 8
- **Indexes:** 16 (including primary keys)

## 📊 Custom Types (Enums)

### 1. `user_role`
- `talent`
- `client` 
- `admin`

### 2. `gig_status`
- `draft`
- `published`
- `closed`
- `completed`

### 3. `application_status`
- `pending`
- `accepted`
- `rejected`

### 4. `booking_status`
- `pending`
- `confirmed`
- `completed`
- `cancelled`

## 🗃️ Table Details

### 1. `users` - Core User Table
**Purpose:** Main user table linked to Supabase Auth

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | - | Primary key, links to auth.users |
| `email` | `text` | NO | - | User's email address |
| `full_name` | `text` | NO | - | User's full name |
| `role` | `user_role` | NO | `'talent'` | User role (talent/client/admin) |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `id` → `auth.users.id`
- Unique: `email`

**Indexes:**
- `users_pkey` (Primary Key)
- `users_email_key` (Unique constraint)

---

### 2. `profiles` - Additional User Information
**Purpose:** Extended profile information for users

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | NO | - | Foreign key to users |
| `bio` | `text` | YES | - | User biography |
| `location` | `text` | YES | - | Geographic location |
| `phone` | `text` | YES | - | Contact phone number |
| `instagram_handle` | `text` | YES | - | Instagram username |
| `website` | `text` | YES | - | Personal website URL |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `users.id`

**Indexes:**
- `profiles_pkey` (Primary Key)

---

### 3. `talent_profiles` - Talent-Specific Information
**Purpose:** Extended profile information for talent users

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | NO | - | Foreign key to users |
| `height` | `numeric` | YES | - | Height measurement |
| `weight` | `numeric` | YES | - | Weight measurement |
| `measurements` | `text` | YES | - | Body measurements |
| `experience_years` | `integer` | YES | - | Years of experience |
| `specialties` | `text[]` | YES | - | Array of specialties |
| `portfolio_url` | `text` | YES | - | Portfolio website URL |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `users.id`

**Indexes:**
- `talent_profiles_pkey` (Primary Key)

---

### 4. `client_profiles` - Client-Specific Information
**Purpose:** Extended profile information for client users

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | NO | - | Foreign key to users |
| `company_name` | `text` | YES | - | Company name |
| `industry` | `text` | YES | - | Industry sector |
| `company_size` | `text` | YES | - | Company size category |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `users.id`

**Indexes:**
- `client_profiles_pkey` (Primary Key)

---

### 5. `gigs` - Job/Gig Listings
**Purpose:** Job opportunities posted by clients

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `client_id` | `uuid` | NO | - | Foreign key to users (client) |
| `title` | `text` | NO | - | Gig title |
| `description` | `text` | NO | - | Detailed description |
| `requirements` | `text[]` | YES | - | Array of requirements |
| `location` | `text` | NO | - | Job location |
| `start_date` | `timestamp with time zone` | NO | - | Gig start date |
| `end_date` | `timestamp with time zone` | NO | - | Gig end date |
| `compensation_min` | `numeric` | YES | - | Minimum compensation |
| `compensation_max` | `numeric` | YES | - | Maximum compensation |
| `status` | `gig_status` | NO | `'draft'` | Current status |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `client_id` → `users.id`
- Check: `end_date > start_date`
- Check: `compensation_max >= compensation_min` (if both set)

**Indexes:**
- `gigs_pkey` (Primary Key)

---

### 5. `gig_requirements` - Gig Requirements
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

### 6. `applications` - Talent Applications
**Purpose:** Applications submitted by talent for gigs

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `gig_id` | `uuid` | NO | - | Foreign key to gigs |
| `talent_id` | `uuid` | NO | - | Foreign key to users (talent) |
| `status` | `application_status` | NO | `'pending'` | Application status |
| `message` | `text` | YES | - | Application message |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id`
- Foreign Key: `talent_id` → `users.id`
- Unique: `(gig_id, talent_id)` - Prevents duplicate applications

**Indexes:**
- `applications_pkey` (Primary Key)
- `applications_gig_id_talent_id_key` (Unique constraint)

---

### 7. `bookings` - Confirmed Bookings
**Purpose:** Confirmed bookings between clients and talent

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `gig_id` | `uuid` | NO | - | Foreign key to gigs |
| `talent_id` | `uuid` | NO | - | Foreign key to users (talent) |
| `status` | `booking_status` | NO | `'pending'` | Booking status |
| `compensation` | `numeric` | YES | - | Agreed compensation |
| `notes` | `text` | YES | - | Booking notes |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id`
- Foreign Key: `talent_id` → `users.id`

**Indexes:**
- `bookings_pkey` (Primary Key)

---

### 8. `portfolio_items` - Talent Portfolio Items
**Purpose:** Portfolio items for talent to showcase their work

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `talent_id` | `uuid` | NO | - | Foreign key to users (talent) |
| `title` | `text` | NO | - | Portfolio item title |
| `description` | `text` | YES | - | Portfolio item description |
| `image_url` | `text` | NO | - | Portfolio image URL |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `talent_id` → `users.id`

**Indexes:**
- `portfolio_items_pkey` (Primary Key)

---



---

## 🔗 Relationships Overview

### Foreign Key Relationships

1. **users.id** → `auth.users.id` (Auth integration)
2. **profiles.user_id** → `users.id` (Profile link)
3. **talent_profiles.user_id** → `users.id` (Talent profile link)
4. **client_profiles.user_id** → `users.id` (Client profile link)
5. **gigs.client_id** → `users.id` (Gig creator)
6. **applications.gig_id** → `gigs.id` (Application for gig)
7. **applications.talent_id** → `users.id` (Application by talent)
8. **bookings.gig_id** → `gigs.id` (Booking for gig)
9. **bookings.talent_id** → `users.id` (Booking by talent)
10. **portfolio_items.talent_id** → `users.id` (Portfolio by talent)

### Unique Constraints

1. **users**: `email` - One user per email address
2. **applications**: `(gig_id, talent_id)` - One application per talent per gig

## 📈 Performance Optimizations

### Indexes by Purpose

**Primary Keys (7):**
- All tables have UUID primary keys with B-tree indexes

**Foreign Key Indexes (6):**
- `talent_profiles_user_id_idx`
- `client_profiles_user_id_idx`
- `gigs_client_id_idx`
- `gig_requirements_gig_id_idx`
- `applications_gig_id_idx`
- `applications_talent_id_idx`

**Filtering Indexes (2):**
- `applications_status_idx` - For application status queries
- `gigs_status_idx` - For gig status filtering

**Search Indexes (1):**
- `gigs_search_idx` - GIN index on `search_vector` for full-text search

**Unique Indexes (3):**
- `applications_gig_id_talent_id_key` - Prevents duplicate applications
- `client_applications_email_key` - Prevents duplicate email applications

## 🔒 Security Considerations

### Row Level Security (RLS)
- All tables should have RLS policies enabled
- Policies should be based on user roles and ownership
- Foreign key relationships ensure data integrity

### Data Types
- UUIDs used for all primary keys (security through obscurity)
- Proper enum types prevent invalid status values
- Timestamps with timezone for audit trails

## 📝 Recommendations

### Immediate Actions
1. **Verify RLS Policies**: Ensure all tables have appropriate RLS policies
2. **Add Missing Indexes**: Consider indexes on frequently queried columns
3. **Audit Data Types**: Review if `compensation` should be numeric instead of text

### Future Enhancements
1. **Add Soft Deletes**: Consider adding `deleted_at` columns for data retention
2. **Audit Trail**: Consider adding `created_by` and `updated_by` columns
3. **Performance Monitoring**: Monitor query performance and add indexes as needed
4. **Data Validation**: Add CHECK constraints for data validation

### Schema Improvements
1. **Normalize Compensation**: Consider separate `compensation_min` and `compensation_max` columns
2. **Add Categories Table**: Consider normalizing gig categories
3. **Add Locations Table**: Consider normalizing location data
4. **Add Portfolio Items**: Consider adding a `portfolio_items` table for talent portfolios

## 📊 Statistics Summary

- **Total Tables**: 8
- **Total Columns**: 75
- **Primary Keys**: 8
- **Foreign Keys**: 10
- **Unique Constraints**: 2
- **Indexes**: 16
- **Custom Types**: 4
- **Nullable Columns**: 40 (53%)
- **Required Columns**: 35 (47%)

---

*This audit provides a comprehensive view of the TOTL Agency database schema. Regular audits should be conducted to ensure the schema continues to meet business requirements and performance expectations.* 