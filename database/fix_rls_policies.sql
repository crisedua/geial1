-- Fix RLS policies to allow public uploads for admin dashboard
-- This allows anyone to insert reports (for public upload functionality)

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;

-- Create new policy that allows public inserts
CREATE POLICY "Allow public report uploads" ON reports
    FOR INSERT WITH CHECK (true);

-- Also allow public viewing of reports (for admin dashboard)
DROP POLICY IF EXISTS "Users can view own reports" ON reports;

CREATE POLICY "Allow public report viewing" ON reports
    FOR SELECT USING (true);

-- Allow public updates (for processing status updates)
DROP POLICY IF EXISTS "Users can update own reports" ON reports;

CREATE POLICY "Allow public report updates" ON reports
    FOR UPDATE USING (true);

-- Allow public deletes (for admin functionality)
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

CREATE POLICY "Allow public report deletes" ON reports
    FOR DELETE USING (true);
