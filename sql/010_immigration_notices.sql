-- =============================================================================
-- 010_immigration_notices.sql
-- 入管法に基づく届出管理テーブル
-- =============================================================================

-- 入管届出 (Immigration Notices)
CREATE TABLE immigration_notices (
    notice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    person_id UUID NOT NULL REFERENCES people(person_id),
    notice_type immigration_notice_type NOT NULL,
    
    -- 検知・トリガー情報
    trigger_event_type VARCHAR(50), -- 'assignment_change', 'termination', etc.
    trigger_event_id UUID,          -- 関連するレコードのID
    
    -- 期限管理 (14日ルール)
    event_date DATE NOT NULL,
    deadline_date DATE GENERATED ALWAYS AS (event_date + INTERVAL '14 days') STORED,
    
    -- 進捗
    status notice_status DEFAULT 'detected',
    
    -- 提出情報
    submitted_at TIMESTAMPTZ,
    submission_method VARCHAR(50),  -- 'online', 'mail', 'in_person'
    receipt_number VARCHAR(100),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notices_deadline ON immigration_notices(deadline_date) WHERE status NOT IN ('submitted', 'completed');
CREATE INDEX idx_notices_person ON immigration_notices(person_id);
