-- Create candidate_certifications table
CREATE TABLE IF NOT EXISTS candidate_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_certifications_candidate_id ON candidate_certifications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_certifications_created_at ON candidate_certifications(created_at DESC);

-- Add RLS policies
ALTER TABLE candidate_certifications ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own certifications
CREATE POLICY "Candidates can view own certifications" ON candidate_certifications
  FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- Candidates can insert their own certifications
CREATE POLICY "Candidates can insert own certifications" ON candidate_certifications
  FOR INSERT
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- Candidates can update their own certifications
CREATE POLICY "Candidates can update own certifications" ON candidate_certifications
  FOR UPDATE
  USING (
    candidate_id IN (
      SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- Candidates can delete their own certifications
CREATE POLICY "Candidates can delete own certifications" ON candidate_certifications
  FOR DELETE
  USING (
    candidate_id IN (
      SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- Allow employers to view certifications of candidates they've reviewed
CREATE POLICY "Employers can view candidate certifications" ON candidate_certifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.candidate_id = candidate_certifications.candidate_id
      AND applications.job_id IN (
        SELECT id FROM jobs
        WHERE employer_id IN (
          SELECT id FROM employer_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );
