-- =============================================================================
-- 008_daily_operations.sql
-- 日次稼働記録および売上集計テーブル
-- =============================================================================

-- 日次稼働記録 (Daily Operations)
CREATE TABLE daily_operations (
    operation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    operation_date DATE NOT NULL,
    
    -- 配置
    assignment_id UUID NOT NULL REFERENCES assignments(assignment_id),
    person_id UUID NOT NULL REFERENCES people(person_id),
    client_org_id UUID NOT NULL REFERENCES organizations(org_id),
    
    -- 勤務実績
    worked_hours DECIMAL(4,2) DEFAULT 8.0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    is_holiday_work BOOLEAN DEFAULT FALSE,
    
    -- 単価（その日の適用単価）
    hourly_rate INTEGER NOT NULL,
    
    -- 売上計算 (GENERATED ALWAYS)
    base_revenue INTEGER GENERATED ALWAYS AS (
        (worked_hours * hourly_rate)::INTEGER
    ) STORED,
    overtime_revenue INTEGER GENERATED ALWAYS AS (
        (overtime_hours * hourly_rate * 1.25)::INTEGER
    ) STORED,
    total_revenue INTEGER GENERATED ALWAYS AS (
        (worked_hours * hourly_rate + overtime_hours * hourly_rate * 1.25)::INTEGER
    ) STORED,
    
    -- ステータス
    status VARCHAR(20) DEFAULT 'planned',  -- 'planned', 'confirmed', 'absent', 'cancelled'
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(assignment_id, operation_date)
);

CREATE INDEX idx_daily_ops_date ON daily_operations(operation_date);
CREATE INDEX idx_daily_ops_client ON daily_operations(client_org_id);
CREATE INDEX idx_daily_ops_person ON daily_operations(person_id);

-- 日次売上サマリー (Daily Revenue Summary - 自動集計用)
CREATE TABLE daily_revenue_summary (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    summary_date DATE NOT NULL,
    
    -- 地域別
    region VARCHAR(50),
    
    -- 企業別
    client_org_id UUID REFERENCES organizations(org_id),
    
    -- 集計値
    worker_count INTEGER DEFAULT 0,
    total_hours DECIMAL(8,2) DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    
    -- 詳細（JSONB）
    breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, summary_date, region, client_org_id)
);

CREATE INDEX idx_revenue_date ON daily_revenue_summary(summary_date);
CREATE INDEX idx_revenue_region ON daily_revenue_summary(region);
