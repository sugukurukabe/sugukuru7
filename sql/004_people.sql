-- =============================================================================
-- 004_people.sql
-- ユーザー、部署、人材（SmartHR・Slack統合）テーブル
-- =============================================================================

-- 内部ユーザー
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    org_id UUID REFERENCES organizations(org_id),
    
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    name_kana VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    department_id UUID,
    
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(tenant_id, email)
);

-- 部署
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    parent_department_id UUID REFERENCES departments(department_id),
    manager_id UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 人材 (People - SmartHR + Slackリスト統合)
CREATE TABLE people (
    person_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- 名前
    names JSONB NOT NULL,
    
    -- 基本情報
    demographics JSONB DEFAULT '{}',
    
    -- 連絡先
    contact_info JSONB DEFAULT '{}',
    
    -- 現在の状況（Slackリスト対応）
    current_status person_status DEFAULT 'monitoring',
    current_status_notes TEXT,  -- 申請状況(メモ)
    
    -- 担当者
    assigned_to UUID REFERENCES users(user_id),
    
    -- 外部システムID
    smarthr_crew_id VARCHAR(100),
    smarthr_sync_at TIMESTAMPTZ,
    slack_hr_list_id VARCHAR(100),  -- Slack人材管理リストの行ID
    slack_visa_list_id VARCHAR(100), -- Slackビザ申請リストの行ID
    
    -- 追加要件 (ビュー v_candidate_search 用)
    skills JSONB DEFAULT '[]',
    preferred_regions JSONB DEFAULT '[]',
    expected_hourly_rate INTEGER,
    
    -- 監査
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_people_tenant ON people(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_status ON people(current_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_smarthr ON people(smarthr_crew_id) WHERE smarthr_crew_id IS NOT NULL;
CREATE INDEX idx_people_names ON people USING gin(names jsonb_path_ops);
