-- Add recruiter_notes column to applications table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'recruiter_notes') THEN
        ALTER TABLE applications ADD COLUMN recruiter_notes TEXT;
    END IF;
END $$;
