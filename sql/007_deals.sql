-- =============================================================================
-- 007_deals.sql
-- 商談および営業活動管理テーブル
-- =============================================================================

-- 商談 (Deals - ショウダナプリ連携)
CREATE TABLE deals (
    deal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    deal_number VARCHAR(50) UNIQUE,
    deal_name VARCHAR(255) NOT NULL,
    
    -- 顧客情報
    client_org_id UUID REFERENCES organizations(org_id),
    client_name VARCHAR(255),
    client_name_kana VARCHAR(255),
    client_address TEXT,
    client_phone VARCHAR(50),
    
    -- 契約条件
    contract_category contract_category NOT NULL,
    job_description TEXT,
    
    -- 期間
    expected_start_date DATE,
    expected_end_date DATE,
    
    -- 勤務条件
    work_schedule JSONB DEFAULT '{}',
    overtime_config JSONB DEFAULT '{}',
    
    -- 募集条件
    required_headcount INTEGER DEFAULT 1,
    filled_headcount INTEGER DEFAULT 0,
    hourly_rate_no_license INTEGER,
    hourly_rate_with_license INTEGER,
    
    -- 責任者
    supervisor JSONB DEFAULT '{}',
    sugukuru_manager_name VARCHAR(100),
    
    -- 福利厚生
    accommodation JSONB DEFAULT '{}',
    
    -- ステータス
    status deal_status DEFAULT 'lead',
    probability INTEGER DEFAULT 0,
    
    -- 担当
    sales_rep_id UUID REFERENCES users(user_id),
    
    notes TEXT,
    
    -- ショウダナプリ連携
    shoudana_row_id INTEGER,
    shoudana_synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_status ON deals(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_client ON deals(client_org_id) WHERE deleted_at IS NULL;

-- 商談活動ログ (Deal Activities)
CREATE TABLE deal_activities (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(deal_id),
    
    activity_type VARCHAR(50) NOT NULL,
    activity_date TIMESTAMPTZ DEFAULT NOW(),
    description TEXT,
    outcome VARCHAR(255),
    next_action VARCHAR(255),
    next_action_date DATE,
    
    old_status deal_status,
    new_status deal_status,
    
    performed_by UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
