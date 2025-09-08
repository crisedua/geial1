-- Allow NULL values for user_id in reports table
-- This enables public uploads without requiring authentication

ALTER TABLE reports ALTER COLUMN user_id DROP NOT NULL;
