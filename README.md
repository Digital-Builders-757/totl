... This file was left out for brevity. Assume it is correct and does not need any modifications. ...
\`\`\`

## Supabase Schema Migration
Database Schema Overview
1. Users Table
Table Name: users
Description: Extends Supabase's auth.users table to store user information.
Columns:
id (UUID, Primary Key): References auth.users(id).
email (TEXT, Unique, Not Null): User's email address.
full_name (TEXT, Not Null): User's full name.
role (user_role, Not Null, Default: 'talent'): User's role (admin, client, talent).
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
2. Profiles Table
Table Name: profiles
Description: Stores additional user information.
Columns:
id (UUID, Primary Key, Default: uuid_generate_v4()): Unique identifier.
user_id (UUID, Foreign Key): References users(id).
bio (TEXT): User biography.
location (TEXT): User's location.
phone (TEXT): User's phone number.
instagram_handle (TEXT): User's Instagram handle.
website (TEXT): User's website.
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
3. Talent Profiles Table
Table Name: talent_profiles
Description: Stores model-specific information for talent users.
Columns:
id (UUID, Primary Key, Default: uuid_generate_v4()): Unique identifier.
user_id (UUID, Foreign Key): References users(id).
height (NUMERIC): Talent's height.
weight (NUMERIC): Talent's weight.
measurements (TEXT): Talent's measurements.
experience_years (INTEGER): Years of experience.
specialties (TEXT[]): Talent's specialties.
portfolio_url (TEXT): URL to the talent's portfolio.
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
4. Client Profiles Table
Table Name: client_profiles
Description: Stores client-specific information.
Columns:
id (UUID, Primary Key, Default: uuid_generate_v4()): Unique identifier.
user_id (UUID, Foreign Key): References users(id).
company_name (TEXT): Client's company name.
industry (TEXT): Industry of the client.
company_size (TEXT): Size of the company.
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
5. Gigs Table
Table Name: gigs
Description: Stores information about gigs posted by clients.
Columns:
id (UUID, Primary Key, Default: uuid_generate_v4()): Unique identifier.
client_id (UUID, Foreign Key): References users(id).
title (TEXT, Not Null): Title of the gig.
description (TEXT, Not Null): Description of the gig.
requirements (TEXT[]): Requirements for the gig.
location (TEXT, Not Null): Location of the gig.
start_date (TIMESTAMPTZ, Not Null): Start date of the gig.
end_date (TIMESTAMPTZ, Not Null): End date of the gig.
compensation_min (NUMERIC): Minimum compensation for the gig.
compensation_max (NUMERIC): Maximum compensation for the gig.
status (gig_status, Not Null, Default: 'draft'): Status of the gig.
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
6. Applications Table
Table Name: applications
Description: Stores applications made by talents for gigs.
Columns:
id (UUID, Primary Key, Default: uuid_generate_v4()): Unique identifier.
gig_id (UUID, Foreign Key): References gigs(id).
talent_id (UUID, Foreign Key): References users(id).
status (application_status, Not Null, Default: 'pending'): Status of the application.
message (TEXT): Message from the talent.
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
UNIQUE(gig_id, talent_id): Ensures a talent can apply to a gig only once.
7. Bookings Table
Table Name: bookings
Description: Stores bookings made by talents for gigs.
Columns:
id (UUID, Primary Key, Default: uuid_generate_v4()): Unique identifier.
gig_id (UUID, Foreign Key): References gigs(id).
talent_id (UUID, Foreign Key): References users(id).
status (booking_status, Not Null, Default: 'pending'): Status of the booking.
compensation (NUMERIC): Compensation for the booking.
notes (TEXT): Additional notes for the booking.
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
8. Portfolio Items Table
Table Name: portfolio_items
Description: Stores portfolio items for talents.
Columns:
id (UUID, Primary Key, Default: uuid_generate_v4()): Unique identifier.
talent_id (UUID, Foreign Key): References users(id).
title (TEXT, Not Null): Title of the portfolio item.
description (TEXT): Description of the portfolio item.
image_url (TEXT, Not Null): URL of the portfolio item image.
created_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of creation.
updated_at (TIMESTAMPTZ, Not Null, Default: NOW()): Timestamp of last update.
Relationships
Users Table:
Profiles: Each user can have one profile in the profiles table.
Talent Profiles: Each user can have one talent profile in the talent_profiles table.
Client Profiles: Each user can have one client profile in the client_profiles table.
Applications: Each user (talent) can submit multiple applications in the applications table for different gigs.
Bookings: Each user (talent) can have multiple bookings in the bookings table for different gigs.
Portfolio Items: Each user (talent) can have multiple portfolio items in the portfolio_items table.
Profiles Table:
User ID: Each profile is linked to a user in the users table via the user_id foreign key.
Talent Profiles Table:
User ID: Each talent profile is linked to a user in the users table via the user_id foreign key.
Client Profiles Table:
User ID: Each client profile is linked to a user in the users table via the user_id foreign key.
Gigs Table:
Client ID: Each gig is linked to a client in the users table via the client_id foreign key.
Applications: Each gig can have multiple applications from talents in the applications table.
Applications Table:
Gig ID: Each application is linked to a gig in the gigs table via the gig_id foreign key.
Talent ID: Each application is linked to a talent in the users table via the talent_id foreign key.
Bookings Table:
Gig ID: Each booking is linked to a gig in the gigs table via the gig_id foreign key.
Talent ID: Each booking is linked to a talent in the users table via the talent_id foreign key.
Portfolio Items Table:
Talent ID: Each portfolio item is linked to a talent in the users table via the talent_id foreign key.
Summary of Key Attributes
Primary Keys: Each table has a unique identifier (UUID) as the primary key.
Foreign Keys: Relationships between tables are established using foreign keys, ensuring referential integrity.
Timestamps: Each table includes created_at and updated_at columns to track record creation and modification times.
Enums: The use of enum types (e.g., user_role, gig_status, application_status, booking_status) helps maintain data integrity for specific fields.
Additional Notes
Row Level Security (RLS): RLS is enabled on all tables to control access based on user roles and permissions.
Indexes: Indexes are created on foreign key columns and other frequently queried fields to improve query performance.
This guide provides a comprehensive overview of your database schema, including relationships and key attributes, which can be useful for another LLM or any developer working with your database.

