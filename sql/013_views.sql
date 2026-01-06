-- =============================================================================
-- 013_views.sql
-- 業務システムの主要ビュー定義
-- =============================================================================

-- 日次集計ビュー
CREATE OR REPLACE VIEW v_daily_operations_summary AS
SELECT 
    ops.operation_date,
    o.region,
    o.name as client_name,
    COUNT(ops.person_id) as worker_count,
    SUM(ops.worked_hours) as total_hours,
    SUM(ops.total_revenue) as total_revenue
FROM daily_operations ops
JOIN organizations o ON ops.client_org_id = o.org_id
GROUP BY ops.operation_date, o.region, o.name;

-- 候補者検索ビュー（詳細情報をフラット化、検索効率化）
CREATE OR REPLACE VIEW v_candidate_search AS
SELECT 
    p.person_id,
    p.tenant_id,
    p.names->>'full_name' as full_name,
    p.names->>'legal_last_kana' as last_kana,
    p.names->>'legal_first_kana' as first_kana,
    p.demographics->>'nationality' as nationality,
    p.current_status,
    vr.visa_type,
    vr.valid_until as visa_expiry,
    e.status as employment_status,
    p.contact_info->>'phone' as phone,
    -- JSONB内のタグ情報を簡単に検索できるようにするため、そのまま渡すかフラット化する
    p.skills as skills_json,
    p.preferred_regions as regions_json,
    p.expected_hourly_rate
FROM people p
LEFT JOIN visa_records vr ON p.person_id = vr.person_id
LEFT JOIN employments e ON p.person_id = e.person_id
WHERE p.deleted_at IS NULL;
