-- Add comparado column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS comparado BOOLEAN DEFAULT FALSE;

-- Update existing reports to have comparado = false
UPDATE reports SET comparado = FALSE WHERE comparado IS NULL;
