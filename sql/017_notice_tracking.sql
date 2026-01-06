-- =============================================================================
-- 017_notice_tracking.sql
-- 入管届出追跡および生成書類管理
-- =============================================================================

-- 届出追跡テーブル（既存のimmigration_noticesを拡張）
ALTER TABLE immigration_notices 
    ADD COLUMN IF NOT EXISTS generated_file_path TEXT,
    ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS submission_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 生成書類テーブル
CREATE TABLE generated_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- 関連エンティティ
    person_id UUID REFERENCES people(person_id),
    employment_id UUID REFERENCES employments(employment_id),
    assignment_id UUID REFERENCES assignments(assignment_id),
    notice_id UUID REFERENCES immigration_notices(notice_id),
    deal_id UUID REFERENCES deals(deal_id),
    
    -- 書類情報
    document_type VARCHAR(50) NOT NULL,
    -- 'zuitoji_dispatch_change', 'zuitoji_termination', 'quarterly_report',
    -- 'employment_contract', 'dispatch_contract', 'working_conditions', etc.
    
    template_used VARCHAR(100),
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100) DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    -- ステータス
    status VARCHAR(20) DEFAULT 'generated',
    -- 'generating', 'generated', 'downloaded', 'submitted', 'error'
    
    generated_by UUID REFERENCES users(user_id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    downloaded_at TIMESTAMPTZ,
    
    -- メタデータ
    generation_params JSONB,  -- 生成時のパラメータ
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_documents_person ON generated_documents(person_id);
CREATE INDEX idx_generated_documents_type ON generated_documents(document_type);
CREATE INDEX idx_generated_documents_notice ON generated_documents(notice_id);
