-- =============================================================================
-- 011_kpi.sql
-- KPI（稼働率、売上目標、充足率）管理テーブル
-- =============================================================================

-- 日次KPIメトリクス (KPI Daily Metrics)
CREATE TABLE kpi_daily_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    target_date DATE NOT NULL,
    
    -- 稼働
    active_worker_count INTEGER DEFAULT 0,
    total_capacity INTEGER DEFAULT 0,
    utilization_rate DECIMAL(5,2),
    
    -- 売上
    daily_revenue INTEGER DEFAULT 0,
    
    -- 営業
    new_leads_count INTEGER DEFAULT 0,
    won_deals_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, target_date)
);

-- KPI目標 (KPI Targets)
CREATE TABLE kpi_targets (
    target_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    target_type VARCHAR(50) NOT NULL, -- 'revenue', 'workers', 'deals'
    period_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    target_value BIGINT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
