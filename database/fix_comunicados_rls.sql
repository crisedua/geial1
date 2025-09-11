-- Fix RLS policies for comunicados to allow public access
-- This allows the public form to save generated comunicados

-- Drop existing restrictive policies for comunicados
DROP POLICY IF EXISTS "Users can view own comunicados" ON comunicados;
DROP POLICY IF EXISTS "Users can insert own comunicados" ON comunicados;
DROP POLICY IF EXISTS "Users can update own comunicados" ON comunicados;
DROP POLICY IF EXISTS "Users can delete own comunicados" ON comunicados;

-- Allow NULL values for user_id in comunicados table
-- This enables public comunicado generation without requiring authentication
ALTER TABLE comunicados ALTER COLUMN user_id DROP NOT NULL;

-- Create new policies that allow public access for comunicados
CREATE POLICY "Allow public comunicado inserts" ON comunicados
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public comunicado viewing" ON comunicados
    FOR SELECT USING (true);

CREATE POLICY "Allow public comunicado updates" ON comunicados
    FOR UPDATE USING (true);

CREATE POLICY "Allow public comunicado deletes" ON comunicados
    FOR DELETE USING (true);
