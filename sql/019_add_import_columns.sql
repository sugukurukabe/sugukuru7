-- Add missing columns to people table for better data import
ALTER TABLE people ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE people ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE people ADD COLUMN IF NOT EXISTS current_visa_type visa_type;
ALTER TABLE people ADD COLUMN IF NOT EXISTS visa_expiry_date DATE;

-- Add unique index for name-based upsert within a tenant
-- Note: names is JSONB, so we index the full_name field
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_names_unique ON people (tenant_id, (names->>'full_name'));
