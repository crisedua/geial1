-- Add testimonial column to public_requests table
ALTER TABLE public_requests ADD COLUMN IF NOT EXISTS testimonial TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public_requests.testimonial IS 'Optional testimonial or statement to include in the comunicado';
