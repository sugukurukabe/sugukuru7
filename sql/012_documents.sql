-- =============================================================================
-- 012_documents.sql
-- 書類およびSlackファイル連携管理テーブル
-- =============================================================================

-- 書類 (Documents)
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    person_id UUID REFERENCES people(person_id),
    org_id UUID REFERENCES organizations(org_id),
    case_id UUID REFERENCES visa_cases(case_id),
    
    document_type VARCHAR(50) NOT NULL, -- 'resident_card', 'passport', 'contract', etc.
    file_name VARCHAR(255) NOT NULL,
    
    -- 外部ストレージ連携
    storage_provider VARCHAR(20) DEFAULT 'google_cloud_storage',
    file_path TEXT,
    mime_type VARCHAR(100),
    file_size BIGINT,
    
    -- Slack連携
    slack_file_id VARCHAR(100),
    slack_synced_at TIMESTAMPTZ,
    
    -- 有効期限管理
    expiry_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_docs_person ON documents(person_id);
CREATE INDEX idx_docs_type ON documents(document_type);
