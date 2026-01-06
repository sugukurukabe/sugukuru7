-- =============================================================================
-- 016_deal_proposals.sql
-- 商談への候補者提案管理テーブル
-- =============================================================================

CREATE TABLE deal_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    deal_id UUID NOT NULL REFERENCES deals(deal_id),
    person_id UUID NOT NULL REFERENCES people(person_id),
    proposed_by UUID REFERENCES users(user_id),
    proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'proposed',  -- proposed, accepted, rejected
    notes TEXT,
    
    UNIQUE(deal_id, person_id)
);

CREATE INDEX idx_deal_proposals_deal ON deal_proposals(deal_id);
CREATE INDEX idx_deal_proposals_person ON deal_proposals(person_id);
