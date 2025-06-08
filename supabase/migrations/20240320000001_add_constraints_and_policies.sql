-- Add additional constraints, policies, and indexes
DO $$ 
BEGIN
    -- Add unique constraints for profiles if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'one_profile_per_user'
        ) THEN
            ALTER TABLE profiles ADD CONSTRAINT one_profile_per_user UNIQUE (user_id);
        END IF;
    END IF;

    -- Add unique constraints for talent_profiles if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'talent_profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'one_talent_profile_per_user'
        ) THEN
            ALTER TABLE talent_profiles ADD CONSTRAINT one_talent_profile_per_user UNIQUE (user_id);
        END IF;
    END IF;

    -- Add unique constraints for client_profiles if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'one_client_profile_per_user'
        ) THEN
            ALTER TABLE client_profiles ADD CONSTRAINT one_client_profile_per_user UNIQUE (user_id);
        END IF;
    END IF;

    -- Add date and compensation constraints for gigs if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gigs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'valid_gig_dates'
        ) THEN
            ALTER TABLE gigs ADD CONSTRAINT valid_gig_dates CHECK (end_date > start_date);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'valid_compensation_range'
        ) THEN
            ALTER TABLE gigs ADD CONSTRAINT valid_compensation_range 
                CHECK (compensation_max IS NULL OR compensation_min IS NULL OR compensation_max >= compensation_min);
        END IF;
    END IF;

    -- Add data validation constraints if tables exist
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'valid_email'
        ) THEN
            ALTER TABLE users ADD CONSTRAINT valid_email 
                CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'valid_phone'
        ) THEN
            ALTER TABLE profiles ADD CONSTRAINT valid_phone 
                CHECK (phone IS NULL OR phone ~* '^\+?[0-9]{10,15}$');
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'valid_instagram'
        ) THEN
            ALTER TABLE profiles ADD CONSTRAINT valid_instagram 
                CHECK (instagram_handle IS NULL OR instagram_handle ~* '^@?[A-Za-z0-9._]{1,30}$');
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'valid_website'
        ) THEN
            ALTER TABLE profiles ADD CONSTRAINT valid_website 
                CHECK (website IS NULL OR website ~* '^https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/.*)?$');
        END IF;
    END IF;
END $$;

-- Add additional RLS policies
DO $$ 
BEGIN
    -- Profile policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile data') THEN
            CREATE POLICY "Users can view their own profile data"
                ON profiles FOR SELECT
                USING (auth.uid() = user_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile data') THEN
            CREATE POLICY "Users can update their own profile data"
                ON profiles FOR UPDATE
                USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Talent profile policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'talent_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Talent can manage their own profile') THEN
            CREATE POLICY "Talent can manage their own profile"
                ON talent_profiles FOR ALL
                USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Client profile policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients can manage their own profile') THEN
            CREATE POLICY "Clients can manage their own profile"
                ON client_profiles FOR ALL
                USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Application policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'applications') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Talent can manage their applications') THEN
            CREATE POLICY "Talent can manage their applications"
                ON applications FOR ALL
                USING (auth.uid() = talent_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients can view applications for their gigs') THEN
            CREATE POLICY "Clients can view applications for their gigs"
                ON applications FOR SELECT
                USING (EXISTS (
                    SELECT 1 FROM gigs 
                    WHERE gigs.id = applications.gig_id 
                    AND gigs.client_id = auth.uid()
                ));
        END IF;
    END IF;

    -- Booking policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bookings') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Talent can view their bookings') THEN
            CREATE POLICY "Talent can view their bookings"
                ON bookings FOR SELECT
                USING (auth.uid() = talent_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients can manage their bookings') THEN
            CREATE POLICY "Clients can manage their bookings"
                ON bookings FOR ALL
                USING (EXISTS (
                    SELECT 1 FROM gigs 
                    WHERE gigs.id = bookings.gig_id 
                    AND gigs.client_id = auth.uid()
                ));
        END IF;
    END IF;

    -- Portfolio item policies
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'portfolio_items') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Talent can manage their portfolio') THEN
            CREATE POLICY "Talent can manage their portfolio"
                ON portfolio_items FOR ALL
                USING (auth.uid() = talent_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view portfolio items') THEN
            CREATE POLICY "Anyone can view portfolio items"
                ON portfolio_items FOR SELECT
                USING (true);
        END IF;
    END IF;
END $$;

-- Add additional indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_user_id') THEN
            CREATE INDEX idx_profiles_user_id ON profiles(user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'talent_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_talent_profiles_user_id') THEN
            CREATE INDEX idx_talent_profiles_user_id ON talent_profiles(user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_profiles_user_id') THEN
            CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gigs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_gigs_dates') THEN
            CREATE INDEX idx_gigs_dates ON gigs(start_date, end_date);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'applications') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_applications_status') THEN
            CREATE INDEX idx_applications_status ON applications(status);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bookings') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_status') THEN
            CREATE INDEX idx_bookings_status ON bookings(status);
        END IF;
    END IF;
END $$; 