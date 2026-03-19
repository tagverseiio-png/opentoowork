-- Create site_content table for dynamic content management
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on section_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Allow public to read all content
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow public read access' AND tablename='site_content') THEN
        CREATE POLICY "Allow public read access" ON site_content FOR SELECT USING (true);
    END IF;
END $$;

-- Allow admin to update all content
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow admin full access' AND tablename='site_content') THEN
        CREATE POLICY "Allow admin full access" ON site_content
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
            )
          );
    END IF;
END $$;

-- Insert default content for all sections
INSERT INTO site_content (section_key, content) VALUES
  ('homepage_hero_section', '{
    "title": "Unlock Your Next Great Opportunity",
    "subtitle": "Search. Apply. Grow. Your journey starts now.",
    "description": "A platform designed to help skilled talent build a successful career in the United States"
  }'),
  ('homepage_why_choose_us', '{
    "title": "Why Choose OPENTOOWORK?",
    "subtitle": "A platform designed to help skilled talent build a successful career in the United States",
    "items": [
      {"title": "Secure & Trusted", "description": "All employers are verified. Your data and applications are protected with strong security."},
      {"title": "Quick Apply", "description": "Apply to multiple job openings with a single click — fast and smart hiring process."},
      {"title": "Skill-Based Matching", "description": "We match candidates to roles based on skills and experience — no complex eligibility guesswork."},
      {"title": "Career Growth", "description": "Work with top U.S. companies and start building your professional journey with confidence."}
    ]
  }'),
  ('homepage_how_it_works', '{
    "title": "How It Works",
    "subtitle": "Your path to amazing opportunities starts here",
    "steps": [
      {"number": 1, "title": "Create Your Profile", "description": "Sign up in minutes and showcase your skills & experience to employers."},
      {"number": 2, "title": "Find Jobs", "description": "Search roles that match your skills, location, and career goals."},
      {"number": 3, "title": "Apply Easily", "description": "Submit applications quickly using your saved professional profile."},
      {"number": 4, "title": "Get Hired", "description": "Get discovered by recruiters, track progress, and land the right job."}
    ]
  }'),
  ('about_hero_section', '{
    "hero_title": "About Open Too Work",
    "hero_description": "Open Too Work connects talented professionals with meaningful career opportunities across the United States."
  }'),
  ('about_why_choose_us', '{
    "title": "Why Choose OPENTOOWORK?",
    "subtitle": "A platform designed to help skilled talent build a successful career in the United States",
    "items": [
      {"title": "Secure & Trusted", "description": "All employers are verified. Your data and applications are protected with strong security."},
      {"title": "Quick Apply", "description": "Apply to multiple job openings with a single click — fast and smart hiring process."},
      {"title": "Skill-Based Matching", "description": "We match candidates to roles based on skills and experience — no complex eligibility guesswork."},
      {"title": "Career Growth", "description": "Work with top U.S. companies and start building your professional journey with confidence."}
    ]
  }'),
  ('about_mission_section', '{
    "mission_title": "Our Mission",
    "mission_body": "We believe every skilled candidate deserves access to opportunities that match their ambitions."
  }'),
  ('about_how_it_works', '{
    "title": "How It Works",
    "subtitle": "Your path to amazing opportunities starts here",
    "steps": [
      {"number": 1, "title": "Create Your Profile", "description": "Sign up in minutes and showcase your skills & experience to employers."},
      {"number": 2, "title": "Find Jobs", "description": "Search roles that match your skills, location, and career goals."},
      {"number": 3, "title": "Apply Easily", "description": "Submit applications quickly using your saved professional profile."},
      {"number": 4, "title": "Get Hired", "description": "Get discovered by recruiters, track progress, and land the right job."}
    ]
  }'),
  ('about_contact_section', '{
    "contact_email": "",
    "contact_phone": "",
    "contact_address": ""
  }')
ON CONFLICT (section_key) DO NOTHING;
