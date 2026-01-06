-- =============================================================================
-- 006_visa.sql
-- 在留資格履歴およびビザ申請案件テーブル
-- =============================================================================

-- 在留資格履歴 (Visa Records)
CREATE TABLE visa_records (
    visa_record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    person_id UUID NOT NULL REFERENCES people(person_id),
    
    visa_type visa_type NOT NULL,
    resident_card_number VARCHAR(20),
    
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    
    -- Slackファイル参照
    resident_card_file_ids TEXT[],  -- Slack File IDs
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_visa_person ON visa_records(person_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visa_expiry ON visa_records(valid_until) WHERE deleted_at IS NULL;

-- ビザ申請案件 (Visa Cases - Slackビザ申請リスト対応)
CREATE TABLE visa_cases (
    case_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    case_number VARCHAR(50) UNIQUE,
    
    -- 対象者
    person_id UUID NOT NULL REFERENCES people(person_id),
    
    -- 申請先企業
    client_org_id UUID REFERENCES organizations(org_id),
    client_name_raw VARCHAR(255),  -- Slackの生データ
    
    -- 申請タイプ
    case_type visa_case_type NOT NULL,
    target_visa_type visa_type,  -- 申請先の在留資格
    contract_type VARCHAR(50),   -- 特定活動/スグクル派遣/etc
    
    -- 期間
    employment_start_date DATE,
    employment_end_date DATE,
    deadline DATE,
    
    -- 進捗（複数ステータス対応）
    status_tags TEXT[],  -- ['申請準備中', '署名返信待ち', '課・納税待ち']
    is_completed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 2,  -- 1:高, 2:中, 3:低
    
    -- 担当
    requested_by_email VARCHAR(255),
    assigned_to UUID REFERENCES users(user_id),
    
    -- 書類
    drive_folder_url TEXT,
    company_docs_file_id VARCHAR(100),  -- Slack File ID
    
    -- メモ
    notes TEXT,
    
    -- Slack連携
    slack_list_row_id VARCHAR(100),
    slack_synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_visa_case_person ON visa_cases(person_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visa_case_status ON visa_cases(is_completed) WHERE deleted_at IS NULL;
