-- Drop existing objects if they exist
DO $$ 
BEGIN
    -- Drop triggers if they exist and their tables exist
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'talent_profiles') THEN
        DROP TRIGGER IF EXISTS update_talent_profiles_updated_at ON talent_profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_profiles') THEN
        DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON client_profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gigs') THEN
        DROP TRIGGER IF EXISTS update_gigs_updated_at ON gigs;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'applications') THEN
        DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bookings') THEN
        DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'portfolio_items') THEN
        DROP TRIGGER IF EXISTS update_portfolio_items_updated_at ON portfolio_items;
    END IF;

    -- Drop function if it exists
    DROP FUNCTION IF EXISTS update_updated_at_column();

    -- Drop tables if they exist (in correct order due to dependencies)
    DROP TABLE IF EXISTS portfolio_items;
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS applications;
    DROP TABLE IF EXISTS gigs;
    DROP TABLE IF EXISTS client_profiles;
    DROP TABLE IF EXISTS talent_profiles;
    DROP TABLE IF EXISTS profiles;
    DROP TABLE IF EXISTS users;

    -- Drop types if they exist
    DROP TYPE IF EXISTS booking_status;
    DROP TYPE IF EXISTS application_status;
    DROP TYPE IF EXISTS gig_status;
    DROP TYPE IF EXISTS user_role;
END $$;

-- Create enum types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'client', 'talent');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gig_status') THEN
        CREATE TYPE gig_status AS ENUM ('draft', 'published', 'closed', 'completed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
    END IF;
END $$;

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'talent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table for additional user information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    location TEXT,
    phone TEXT,
    instagram_handle TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create talent_profiles table for model-specific information
CREATE TABLE IF NOT EXISTS talent_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    height NUMERIC,
    weight NUMERIC,
    measurements TEXT,
    experience_years INTEGER,
    specialties TEXT[],
    portfolio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create client_profiles table for client-specific information
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT,
    industry TEXT,
    company_size TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create gigs table
CREATE TABLE IF NOT EXISTS gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[],
    location TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    compensation_min NUMERIC,
    compensation_max NUMERIC,
    status gig_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    talent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(gig_id, talent_id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    talent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status booking_status NOT NULL DEFAULT 'pending',
    compensation NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'talent_profiles') THEN
        ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_profiles') THEN
        ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gigs') THEN
        ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications') THEN
        ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings') THEN
        ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_items') THEN
        ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile"
            ON users FOR SELECT
            USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile"
            ON users FOR UPDATE
            USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view published gigs') THEN
        CREATE POLICY "Anyone can view published gigs"
            ON gigs FOR SELECT
            USING (status = 'published');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients can create gigs') THEN
        CREATE POLICY "Clients can create gigs"
            ON gigs FOR INSERT
            WITH CHECK (auth.uid() = client_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients can update their own gigs') THEN
        CREATE POLICY "Clients can update their own gigs"
            ON gigs FOR UPDATE
            USING (auth.uid() = client_id);
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_gigs_client_id') THEN
        CREATE INDEX idx_gigs_client_id ON gigs(client_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_gigs_status') THEN
        CREATE INDEX idx_gigs_status ON gigs(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_applications_gig_id') THEN
        CREATE INDEX idx_applications_gig_id ON applications(gig_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_applications_talent_id') THEN
        CREATE INDEX idx_applications_talent_id ON applications(talent_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_gig_id') THEN
        CREATE INDEX idx_bookings_gig_id ON bookings(gig_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_talent_id') THEN
        CREATE INDEX idx_bookings_talent_id ON bookings(talent_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_portfolio_items_talent_id') THEN
        CREATE INDEX idx_portfolio_items_talent_id ON portfolio_items(talent_id);
    END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_talent_profiles_updated_at') THEN
        CREATE TRIGGER update_talent_profiles_updated_at
            BEFORE UPDATE ON talent_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_profiles_updated_at') THEN
        CREATE TRIGGER update_client_profiles_updated_at
            BEFORE UPDATE ON client_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gigs_updated_at') THEN
        CREATE TRIGGER update_gigs_updated_at
            BEFORE UPDATE ON gigs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_applications_updated_at') THEN
        CREATE TRIGGER update_applications_updated_at
            BEFORE UPDATE ON applications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookings_updated_at') THEN
        CREATE TRIGGER update_bookings_updated_at
            BEFORE UPDATE ON bookings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_portfolio_items_updated_at') THEN
        CREATE TRIGGER update_portfolio_items_updated_at
            BEFORE UPDATE ON portfolio_items
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 