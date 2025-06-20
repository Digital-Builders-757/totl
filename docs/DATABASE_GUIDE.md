# 🗃️ Totl Agency - Database Guide

This document provides a comprehensive overview of the Totl Agency database schema, managed by Supabase. It details the tables, columns, relationships, and Row Level Security (RLS) policies.

---

## E-R Diagram (Mermaid)

```mermaid
erDiagram
    users {
        UUID id PK "FK to auth.users"
        text email
        text full_name
        user_role role
    }
    profiles {
        UUID id PK
        UUID user_id FK
        text bio
        text location
        text phone
        text instagram_handle
        text website
    }
    talent_profiles {
        UUID id PK
        UUID user_id FK
        numeric height
        numeric weight
        text measurements
        integer experience_years
        text[] specialties
        text portfolio_url
    }
    client_profiles {
        UUID id PK
        UUID user_id FK
        text company_name
        text industry
        text company_size
    }
    gigs {
        UUID id PK
        UUID client_id FK
        text title
        text description
        text[] requirements
        text location
        timestamptz start_date
        timestamptz end_date
        numeric compensation_min
        numeric compensation_max
        gig_status status
    }
    applications {
        UUID id PK
        UUID gig_id FK
        UUID talent_id FK
        application_status status
        text message
    }
    bookings {
        UUID id PK
        UUID gig_id FK
        UUID talent_id FK
        booking_status status
        numeric compensation
        text notes
    }
    portfolio_items {
        UUID id PK
        UUID talent_id FK
        text title
        text description
        text image_url
    }

    users ||--o{ profiles : "has one"
    users ||--o{ talent_profiles : "has one"
    users ||--o{ client_profiles : "has one"
    users ||--o{ applications : "applies to"
    users ||--o{ bookings : "is booked for"
    users ||--o{ portfolio_items : "owns"
    users ||--o{ gigs : "posts"

    gigs ||--|{ applications : "has many"
    gigs ||--|{ bookings : "has many"
}
```

---

## 📜 Tables & Schemas

### `users`
Extends the `auth.users` table from Supabase to store core user information and assign a role.

- **`id` (UUID, Primary Key)**: Foreign key to `auth.users.id`.
- **`email` (text)**: User's email address.
- **`full_name` (text)**: User's full name.
- **`role` (user_role)**: Enum type (`admin`, `client`, `talent`). Determines user permissions.

### `profiles`
Stores general profile information applicable to all user roles.

- **`id` (UUID, Primary Key)**: Unique identifier for the profile.
- **`user_id` (UUID, Foreign Key)**: Links to the `users` table.
- **`bio` (text)**: A short biography.
- **`location` (text)**: User's city or general location.
- **`phone` (text)**: Contact phone number.
- **`instagram_handle` (text)**: Link to an Instagram profile.
- **`website` (text)**: Link to a personal or company website.

### `talent_profiles`
Stores specific information for users with the `talent` role.

- **`id` (UUID, Primary Key)**: Unique identifier for the talent profile.
- **`user_id` (UUID, Foreign Key)**: Links to the `users` table.
- **`height` (numeric)**: Talent's height.
- **`weight` (numeric)**: Talent's weight.
- **`measurements` (text)**: Physical measurements (e.g., "34-26-36").
- **`experience_years` (integer)**: Years of professional experience.
- **`specialties` (text[])**: Array of specializations (e.g., `{"runway", "editorial"}`).
- **`portfolio_url` (text)**: Link to an external portfolio.

### `client_profiles`
Stores specific information for users with the `client` role.

- **`id` (UUID, Primary Key)**: Unique identifier for the client profile.
- **`user_id` (UUID, Foreign Key)**: Links to the `users` table.
- **`company_name` (text)**: Name of the client's company.
- **`industry` (text)**: Industry the company operates in.
- **`company_size` (text)**: Size of the company.

### `gigs`
Contains information about modeling jobs posted by clients.

- **`id` (UUID, Primary Key)**: Unique identifier for the gig.
- **`client_id` (UUID, Foreign Key)**: The `user.id` of the client who posted the gig.
- **`title` (text)**: Title of the gig.
- **`description` (text)**: Detailed description of the job.
- **`requirements` (text[])**: Array of requirements for applicants.
- **`location` (text)**: Location where the gig will take place.
- **`start_date` / `end_date` (timestamptz)**: The duration of the gig.
- **`compensation_min` / `compensation_max` (numeric)**: The pay range for the gig.
- **`status` (gig_status)**: Enum (`draft`, `published`, `closed`, `completed`).

### `applications`
Tracks applications submitted by talent for gigs.

- **`id` (UUID, Primary Key)**: Unique identifier for the application.
- **`gig_id` (UUID, Foreign Key)**: The gig being applied for.
- **`talent_id` (UUID, Foreign Key)**: The talent who is applying.
- **`status` (application_status)**: Enum (`pending`, `accepted`, `rejected`).
- **`message` (text)**: A message from the talent to the client.

### `bookings`
Represents a confirmed booking of a talent for a gig.

- **`id` (UUID, Primary Key)**: Unique identifier for the booking.
- **`gig_id` (UUID, Foreign Key)**: The gig associated with the booking.
- **`talent_id` (UUID, Foreign Key)**: The talent who has been booked.
- **`status` (booking_status)**: Enum (`pending`, `confirmed`, `completed`, `cancelled`).
- **`compensation` (numeric)**: The final agreed-upon compensation.
- **`notes` (text)**: Any additional notes about the booking.

### `portfolio_items`
Stores individual items for a talent's portfolio, such as images or videos.

- **`id` (UUID, Primary Key)**: Unique identifier for the portfolio item.
- **`talent_id` (UUID, Foreign Key)**: The talent who owns this item.
- **`title` (text)**: Title of the work.
- **`description` (text)**: A brief description.
- **`image_url` (text)**: URL to the image or media file.

---

## 🛡️ Row Level Security (RLS) Summary

RLS is enabled on all tables to ensure data privacy and security. The general principles are:

- **Users**: Can only view and update their own `users` and `profiles` data.
- **Talent**: Have full control (CRUD) over their own `talent_profiles`, `applications`, and `portfolio_items`. They can view their own `bookings`.
- **Clients**: Have full control (CRUD) over their `gigs` and `client_profiles`. They can view applications for their gigs and manage bookings for their gigs.
- **Public Access**: Published gigs (`gigs.status = 'published'`) and all portfolio items are publicly viewable.
