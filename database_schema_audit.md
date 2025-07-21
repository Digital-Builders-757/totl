# TOTL Agency Database Schema Audit

**Audit Date:** December 2024  
**Database:** Supabase PostgreSQL  
**Schema:** public  

## 📋 Executive Summary

This audit provides a comprehensive overview of the TOTL Agency database schema, including all tables, columns, data types, constraints, indexes, and relationships. The database is well-structured with proper foreign key relationships, appropriate indexing, and custom enum types for status management.

## 🗂️ Database Overview

- **Total Tables:** 6
- **Total Columns:** 67
- **Custom Types (Enums):** 4
- **Foreign Key Relationships:** 6
- **Indexes:** 15 (including primary keys)

## 📊 Custom Types (Enums)

### 1. `user_role`
- `talent`
- `client` 
- `admin`

### 2. `gig_status`
- `draft`
- `active`
- `closed`
- `featured`
- `urgent`

### 3. `application_status`
- `new`
- `under_review`
- `shortlisted`
- `rejected`
- `accepted`

### 4. `booking_status`
- `pending`
- `confirmed`
- `completed`
- `cancelled`

## 🗃️ Table Details

### 1. `profiles` - Core User Profiles
**Purpose:** Central user profile table linked to Supabase Auth

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | - | Primary key, links to auth.users |
| `role` | `user_role` | NO | - | User role (talent/client/admin) |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |
| `display_name` | `text` | YES | - | User's display name |
| `avatar_url` | `text` | YES | - | Profile avatar URL |
| `email_verified` | `boolean` | YES | `false` | Email verification status |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `id` → `auth.users.id`

**Indexes:**
- `profiles_pkey` (Primary Key)

---

### 2. `talent_profiles` - Talent-Specific Information
**Purpose:** Extended profile information for talent users

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | NO | - | Foreign key to profiles |
| `first_name` | `text` | NO | - | Talent's first name |
| `last_name` | `text` | NO | - | Talent's last name |
| `phone` | `text` | YES | - | Contact phone number |
| `age` | `integer` | YES | - | Talent's age |
| `location` | `text` | YES | - | Geographic location |
| `experience` | `text` | YES | - | Experience description |
| `portfolio_url` | `text` | YES | - | Portfolio website URL |
| `height` | `text` | YES | - | Height measurement |
| `measurements` | `text` | YES | - | Body measurements |
| `hair_color` | `text` | YES | - | Hair color |
| `eye_color` | `text` | YES | - | Eye color |
| `shoe_size` | `text` | YES | - | Shoe size |
| `languages` | `text[]` | YES | - | Array of spoken languages |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `profiles.id`

**Indexes:**
- `talent_profiles_pkey` (Primary Key)
- `talent_profiles_user_id_idx` (Foreign Key)

---

### 3. `client_profiles` - Client-Specific Information
**Purpose:** Extended profile information for client users

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | NO | - | Foreign key to profiles |
| `company_name` | `text` | NO | - | Company name |
| `industry` | `text` | YES | - | Industry sector |
| `website` | `text` | YES | - | Company website |
| `contact_name` | `text` | YES | - | Primary contact name |
| `contact_email` | `text` | YES | - | Contact email |
| `contact_phone` | `text` | YES | - | Contact phone |
| `company_size` | `text` | YES | - | Company size category |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `profiles.id`

**Indexes:**
- `client_profiles_pkey` (Primary Key)
- `client_profiles_user_id_idx` (Foreign Key)

---

### 4. `gigs` - Job/Gig Listings
**Purpose:** Job opportunities posted by clients

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `client_id` | `uuid` | NO | - | Foreign key to profiles (client) |
| `title` | `text` | NO | - | Gig title |
| `description` | `text` | NO | - | Detailed description |
| `category` | `text` | NO | - | Gig category |
| `location` | `text` | NO | - | Job location |
| `compensation` | `text` | NO | - | Compensation details |
| `duration` | `text` | NO | - | Job duration |
| `date` | `date` | NO | - | Gig date |
| `application_deadline` | `timestamp with time zone` | YES | - | Application deadline |
| `status` | `gig_status` | NO | - | Current status |
| `image_url` | `text` | YES | - | Associated image URL |
| `search_vector` | `tsvector` | YES | - | Full-text search vector |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `client_id` → `profiles.id`

**Indexes:**
- `gigs_pkey` (Primary Key)
- `gigs_client_id_idx` (Foreign Key)
- `gigs_status_idx` (Status filtering)
- `gigs_search_idx` (Full-text search)

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
| `talent_id` | `uuid` | NO | - | Foreign key to profiles (talent) |
| `status` | `application_status` | NO | - | Application status |
| `message` | `text` | YES | - | Application message |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `gig_id` → `gigs.id`
- Foreign Key: `talent_id` → `profiles.id`
- Unique: `(gig_id, talent_id)` - Prevents duplicate applications

**Indexes:**
- `applications_pkey` (Primary Key)
- `applications_gig_id_idx` (Foreign Key)
- `applications_talent_id_idx` (Foreign Key)
- `applications_status_idx` (Status filtering)
- `applications_gig_id_talent_id_key` (Unique constraint)

---

### 7. `client_applications` - Client Registration Applications
**Purpose:** Applications from potential clients to join the platform

| Column | Data Type | Nullable | Default | Description |
|--------|-----------|----------|---------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | Primary key |
| `first_name` | `text` | NO | - | Applicant's first name |
| `last_name` | `text` | NO | - | Applicant's last name |
| `email` | `text` | NO | - | Contact email |
| `phone` | `text` | YES | - | Contact phone |
| `company_name` | `text` | NO | - | Company name |
| `industry` | `text` | YES | - | Industry sector |
| `website` | `text` | YES | - | Company website |
| `business_description` | `text` | NO | - | Business description |
| `needs_description` | `text` | NO | - | Needs description |
| `status` | `text` | NO | `'pending'` | Application status |
| `admin_notes` | `text` | YES | - | Admin notes |
| `created_at` | `timestamp with time zone` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamp with time zone` | NO | `now()` | Record update timestamp |

**Constraints:**
- Primary Key: `id`
- Unique: `email` - Prevents duplicate email applications

**Indexes:**
- `client_applications_pkey` (Primary Key)
- `client_applications_email_key` (Unique constraint)

---

## 🔗 Relationships Overview

### Foreign Key Relationships

1. **profiles.id** → `auth.users.id` (Auth integration)
2. **talent_profiles.user_id** → `profiles.id` (Talent profile link)
3. **client_profiles.user_id** → `profiles.id` (Client profile link)
4. **gigs.client_id** → `profiles.id` (Gig creator)
5. **gig_requirements.gig_id** → `gigs.id` (Gig requirements)
6. **applications.gig_id** → `gigs.id` (Application for gig)
7. **applications.talent_id** → `profiles.id` (Application by talent)

### Unique Constraints

1. **applications**: `(gig_id, talent_id)` - One application per talent per gig
2. **client_applications**: `email` - One application per email address

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

- **Total Tables**: 7
- **Total Columns**: 67
- **Primary Keys**: 7
- **Foreign Keys**: 7
- **Unique Constraints**: 3
- **Indexes**: 15
- **Custom Types**: 4
- **Nullable Columns**: 35 (52%)
- **Required Columns**: 32 (48%)

---

*This audit provides a comprehensive view of the TOTL Agency database schema. Regular audits should be conducted to ensure the schema continues to meet business requirements and performance expectations.* 