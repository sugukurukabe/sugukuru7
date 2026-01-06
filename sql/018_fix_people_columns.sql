-- =============================================================================
-- 018_fix_people_columns.sql
-- Missing columns for people table required by v_candidate_search
-- =============================================================================

ALTER TABLE people 
    ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS preferred_regions JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS expected_hourly_rate INTEGER;
