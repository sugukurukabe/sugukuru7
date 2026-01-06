-- Drop and recreate v_candidate_search to change column types
DROP VIEW IF EXISTS v_candidate_search;

CREATE VIEW v_candidate_search AS
SELECT 
    p.person_id,
    p.tenant_id,
    p.names->>'full_name' as full_name,
    p.names->>'full_name_kana' as last_kana,
    '' as first_kana,
    p.nationality,
    p.current_status,
    p.current_visa_type as visa_type,
    p.visa_expiry_date as visa_expiry,
    e.status as employment_status,
    p.names->>'email' as email,
    p.contact_info->>'phone' as phone,
    p.skills as skills_json,
    p.preferred_regions as regions_json,
    p.expected_hourly_rate
FROM people p
LEFT JOIN employments e ON p.person_id = e.person_id
WHERE p.deleted_at IS NULL;
