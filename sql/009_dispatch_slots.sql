-- =============================================================================
-- 009_dispatch_slots.sql
-- 派遣ボード（週別配置）およびシミュレーション用テーブル
-- =============================================================================

-- 派遣スロット (Dispatch Slots)
CREATE TABLE dispatch_slots (
    slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    slot_date DATE NOT NULL,
    
    assignment_id UUID REFERENCES assignments(assignment_id),
    client_org_id UUID REFERENCES organizations(org_id),
    person_id UUID REFERENCES people(person_id),
    
    slot_status VARCHAR(20) DEFAULT 'planned',
    
    -- シミュレーション用
    is_simulation BOOLEAN DEFAULT FALSE,
    simulation_session_id UUID,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slots_week ON dispatch_slots(week_start, week_end);

-- シミュレーションセッション (Simulation Sessions)
CREATE TABLE simulation_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    session_name VARCHAR(255),
    base_date DATE NOT NULL,
    start_week DATE NOT NULL,
    end_week DATE NOT NULL,
    
    status VARCHAR(20) DEFAULT 'draft',
    changes_summary JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
