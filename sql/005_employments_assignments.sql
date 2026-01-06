-- =============================================================================
-- 005_employments_assignments.sql
-- 雇用関係および派遣配置テーブル
-- =============================================================================

-- 雇用 (Employments)
CREATE TABLE employments (
    employment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    person_id UUID NOT NULL REFERENCES people(person_id),
    employer_org_id UUID NOT NULL REFERENCES organizations(org_id),
    
    -- 雇用タイプ
    employment_type employment_type NOT NULL,
    contract_category contract_category,  -- 派遣/請負/直接雇用
    
    -- 期間
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- 報酬
    salary_type VARCHAR(20),  -- 'hourly', 'daily', 'monthly'
    salary_amount INTEGER,
    
    -- 社会保険
    social_insurance_date DATE,  -- 社保資格取得日
    
    -- ステータス
    status employment_status DEFAULT 'active',
    acceptance_difficulty_flag BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_emp_person ON employments(person_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_emp_status ON employments(status) WHERE deleted_at IS NULL;

-- 派遣配置 (Assignments)
CREATE TABLE assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employment_id UUID NOT NULL REFERENCES employments(employment_id),
    client_org_id UUID NOT NULL REFERENCES organizations(org_id),
    
    -- 配置先詳細
    site_name VARCHAR(255),
    site_address JSONB,
    
    -- 期間
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- 単価設定（企業設定を上書き可能）
    hourly_rate INTEGER,
    hourly_rate_with_license INTEGER,
    standard_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
    
    -- ステータス
    status assignment_status DEFAULT 'planned',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_assign_client ON assignments(client_org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assign_dates ON assignments(start_date, end_date) WHERE deleted_at IS NULL;
