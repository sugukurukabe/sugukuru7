-- =============================================================================
-- 003_organizations.sql
-- テナント、組織、企業名正規化用エイリアステーブル
-- =============================================================================

-- テナント
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan_type tenant_plan DEFAULT 'trial',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 組織 (企業マスタ)
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    org_type org_type NOT NULL,
    business_division business_division NOT NULL DEFAULT 'dispatch',
    
    -- 基本情報
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    name_short VARCHAR(100),  -- 略称（表示用）
    corporate_number VARCHAR(13),
    
    -- 連絡先
    contact_info JSONB DEFAULT '{}',
    address JSONB DEFAULT '{}',
    
    -- 契約単価（売上計算用）
    billing_config JSONB DEFAULT '{}',
    
    -- 地域（日次稼働表示用）
    region VARCHAR(50),  -- '鹿児島市', '阿久根市', '枕崎市', etc.
    prefecture VARCHAR(20) DEFAULT '鹿児島県',
    
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_org_tenant ON organizations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_region ON organizations(region) WHERE deleted_at IS NULL;

-- 企業名正規化用エイリアステーブル
CREATE TABLE organization_aliases (
    alias_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(org_id),
    alias_name VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(50),  -- 'slack_hr', 'slack_visa', 'shoudana', 'smarthr'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_alias ON organization_aliases(alias_name);
