-- Complete Database Setup for GEIAL
-- This script fixes all known database issues for public uploads and RAG functionality

-- ==============================================
-- 1. FIX USER_ID CONSTRAINT
-- ==============================================
-- Allow NULL values for user_id in reports table
-- This enables public uploads without requiring authentication
ALTER TABLE reports ALTER COLUMN user_id DROP NOT NULL;

-- ==============================================
-- 2. ADD COMPARADO COLUMN
-- ==============================================
-- Add comparado column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS comparado BOOLEAN DEFAULT FALSE;

-- Update existing reports to have comparado = false
UPDATE reports SET comparado = FALSE WHERE comparado IS NULL;

-- ==============================================
-- 3. FIX RLS POLICIES
-- ==============================================
-- Fix RLS policies to allow public uploads for admin dashboard
-- This allows anyone to insert reports (for public upload functionality)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Create new policies that allow public access
CREATE POLICY "Allow public report uploads" ON reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public report viewing" ON reports
    FOR SELECT USING (true);

CREATE POLICY "Allow public report updates" ON reports
    FOR UPDATE USING (true);

CREATE POLICY "Allow public report deletes" ON reports
    FOR DELETE USING (true);

-- ==============================================
-- 4. ENSURE REQUIRED TABLES EXIST
-- ==============================================

-- Create processing_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS processing_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create public_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ecosystem TEXT NOT NULL,
    focus TEXT,
    date TEXT,
    milestone TEXT,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reports_used UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Index for ecosystem searches
CREATE INDEX IF NOT EXISTS idx_reports_ecosystem ON reports(ecosystem);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Index for chunks
CREATE INDEX IF NOT EXISTS idx_chunks_report_id ON chunks(report_id);
CREATE INDEX IF NOT EXISTS idx_chunks_section_type ON chunks(section_type);

-- ==============================================
-- 6. VERIFY SETUP
-- ==============================================

-- Check if the setup was successful
DO $$
BEGIN
    -- Check if user_id can be NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE '✅ user_id constraint fixed - can now be NULL';
    ELSE
        RAISE NOTICE '❌ user_id constraint still NOT NULL';
    END IF;

    -- Check if comparado column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' 
        AND column_name = 'comparado'
    ) THEN
        RAISE NOTICE '✅ comparado column exists';
    ELSE
        RAISE NOTICE '❌ comparado column missing';
    END IF;

    -- Check RLS policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Allow public report uploads'
    ) THEN
        RAISE NOTICE '✅ RLS policies updated for public access';
    ELSE
        RAISE NOTICE '❌ RLS policies not updated';
    END IF;

    RAISE NOTICE '🎉 Database setup completed!';
END $$;
