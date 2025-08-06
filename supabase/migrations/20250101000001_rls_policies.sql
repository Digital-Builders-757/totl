-- =====================================================
-- TOTL Agency - RLS Policies Migration
-- =====================================================
-- Date: 2025-01-01
-- Purpose: Row Level Security policies for all tables

BEGIN;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- TALENT_PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own talent profile
CREATE POLICY "Users can view own talent profile" ON talent_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own talent profile
CREATE POLICY "Users can update own talent profile" ON talent_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own talent profile
CREATE POLICY "Users can insert own talent profile" ON talent_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clients can view talent profiles for gig applications
CREATE POLICY "Clients can view talent profiles" ON talent_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'client'
        )
    );

-- Admins can view all talent profiles
CREATE POLICY "Admins can view all talent profiles" ON talent_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- CLIENT_PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own client profile
CREATE POLICY "Users can view own client profile" ON client_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own client profile
CREATE POLICY "Users can update own client profile" ON client_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own client profile
CREATE POLICY "Users can insert own client profile" ON client_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all client profiles
CREATE POLICY "Admins can view all client profiles" ON client_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- GIGS TABLE POLICIES
-- =====================================================

-- Users can view all active gigs
CREATE POLICY "Users can view active gigs" ON gigs
    FOR SELECT USING (status IN ('active', 'featured', 'urgent'));

-- Clients can view their own gigs
CREATE POLICY "Clients can view own gigs" ON gigs
    FOR SELECT USING (auth.uid() = client_id);

-- Clients can insert their own gigs
CREATE POLICY "Clients can insert own gigs" ON gigs
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can update their own gigs
CREATE POLICY "Clients can update own gigs" ON gigs
    FOR UPDATE USING (auth.uid() = client_id);

-- Clients can delete their own gigs
CREATE POLICY "Clients can delete own gigs" ON gigs
    FOR DELETE USING (auth.uid() = client_id);

-- Admins can view all gigs
CREATE POLICY "Admins can view all gigs" ON gigs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage all gigs
CREATE POLICY "Admins can manage all gigs" ON gigs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- APPLICATIONS TABLE POLICIES
-- =====================================================

-- Talents can view their own applications
CREATE POLICY "Talents can view own applications" ON applications
    FOR SELECT USING (auth.uid() = talent_id);

-- Talents can insert their own applications
CREATE POLICY "Talents can insert own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = talent_id);

-- Talents can update their own applications
CREATE POLICY "Talents can update own applications" ON applications
    FOR UPDATE USING (auth.uid() = talent_id);

-- Clients can view applications for their gigs
CREATE POLICY "Clients can view gig applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM gigs 
            WHERE gigs.id = applications.gig_id 
            AND gigs.client_id = auth.uid()
        )
    );

-- Clients can update applications for their gigs
CREATE POLICY "Clients can update gig applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM gigs 
            WHERE gigs.id = applications.gig_id 
            AND gigs.client_id = auth.uid()
        )
    );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications" ON applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- GIG_REQUIREMENTS TABLE POLICIES
-- =====================================================

-- Users can view requirements for active gigs
CREATE POLICY "Users can view gig requirements" ON gig_requirements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM gigs 
            WHERE gigs.id = gig_requirements.gig_id 
            AND gigs.status IN ('active', 'featured', 'urgent')
        )
    );

-- Clients can manage requirements for their gigs
CREATE POLICY "Clients can manage gig requirements" ON gig_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gigs 
            WHERE gigs.id = gig_requirements.gig_id 
            AND gigs.client_id = auth.uid()
        )
    );

-- Admins can manage all gig requirements
CREATE POLICY "Admins can manage all gig requirements" ON gig_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- CLIENT_APPLICATIONS TABLE POLICIES
-- =====================================================

-- Only admins can view client applications
CREATE POLICY "Admins can view client applications" ON client_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can manage client applications
CREATE POLICY "Admins can manage client applications" ON client_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow public insert for client applications (non-authenticated signups)
CREATE POLICY "Public can insert client applications" ON client_applications
    FOR INSERT WITH CHECK (true);

COMMIT; 