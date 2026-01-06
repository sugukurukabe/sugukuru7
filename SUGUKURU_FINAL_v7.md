# SUGUKURU Platform v7.0 - GCP最終統合設計書

## 📋 Document Information
| 項目 | 内容 |
|------|------|
| **Version** | 7.0 Final (統合版) |
| **Date** | 2025年12月27日 |
| **Status** | Implementation Ready |
| **Platform** | Google Cloud Platform |
| **推奨AIモデル** | Claude Sonnet 4.5 |

---

## 1. Executive Summary

### 1.1 Vision
**「外国人人材管理の完全自動化」** - SmartHR・Slackリストからのデータ統合、営業管理、派遣シミュレーション、リアルタイム売上管理まで、ワンストップで完結するSaaSプラットフォーム

### 1.2 解決する課題

| 現状の問題 | SUGUKURUの解決策 |
|-----------|-----------------|
| SmartHR、Slackリスト、ショウダナプリがバラバラ | 統合データベースで一元管理 |
| 入管届出の期限管理が手動 | 14日自動追跡・アラート |
| 派遣配置が見えにくい | 週別ボード・シミュレーション |
| 日次売上が把握しづらい | リアルタイム売上ダッシュボード |
| 候補者検索に時間がかかる | 営業先で即座にマッチング |
| KPIが可視化されていない | 部署別・個人別ダッシュボード |

### 1.3 データソース統合

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Source Integration                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐           │
│   │   SmartHR     │   │  Slack Lists  │   │  ショウダナプリ │           │
│   │  (従業員CSV)   │   │  (2種類)      │   │  (商談シート)  │           │
│   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘           │
│           │                   │                   │                     │
│           │   ┌───────────────┴───────────────┐   │                     │
│           │   │                               │   │                     │
│           ▼   ▼                               ▼   ▼                     │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                    SUGUKURU Unified Database                 │      │
│   │                                                             │      │
│   │  people ←── SmartHR + 人材管理リスト                        │      │
│   │  visa_cases ←── ビザ申請依頼リスト                          │      │
│   │  organizations ←── 受入れ企業（正規化）                      │      │
│   │  deals ←── ショウダナプリ                                   │      │
│   │  assignments ←── 派遣配置情報                               │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 GCP Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUGUKURU Platform v7.0 on GCP                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Client Applications                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   Web App    │  │  Mobile PWA  │  │ Partner API  │               │   │
│  │  │  (Next.js)   │  │  (営業向け)   │  │   (REST)     │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Application Layer                           │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │  API Server  │  │   Document   │  │    Data      │               │   │
│  │  │  (FastAPI)   │  │  Generator   │  │   Importer   │               │   │
│  │  │              │  │  (Python)    │  │  (SmartHR/   │               │   │
│  │  │              │  │              │  │   Slack/GS)  │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │              Cloud Tasks / Pub/Sub / Cloud Scheduler          │  │   │
│  │  │         (日次集計, 期限チェック, データ同期)                    │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           Data Layer                                │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │  Cloud SQL   │  │   BigQuery   │  │ Cloud Storage│               │   │
│  │  │ (PostgreSQL) │  │  (Analytics) │  │ (Documents)  │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      External Integrations                          │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │   │
│  │  │  SmartHR   │ │   Slack    │ │  Google    │ │  Vision AI │        │   │
│  │  │   API      │ │   API      │ │  Sheets    │ │   (OCR)    │        │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Design

### 3.1 Slackリスト分析結果

#### 人材管理リスト鹿児島.csv（28カラム）
```yaml
人材基本情報:
  - 名前                    → people.names
  - 国籍                    → people.demographics.nationality
  - 性別                    → people.demographics.gender
  - メールアドレス          → people.contact_info.email

配置情報:
  - 受入れ企業              → assignments.client_org (要正規化)
  - ビザ種類                → employments.employment_type (派遣/請負/直接)

ビザ情報:
  - 現在の在留資格          → visa_records.visa_type
  - 期限日                  → visa_records.valid_until
  - 申請の在留資格          → visa_cases.target_visa_type
  - 現在の状況              → people.current_status
  - 在留カード              → documents (Slack File ID)

書類管理:
  - 顔写真                  → documents.photo (Slack File ID)
  - マイナンバー            → documents.my_number
  - 運転免許                → documents.driver_license
  - 銀行口座                → documents.bank_account
  - 健康診断                → documents.health_checkup
  - 納税課税証明書          → documents.tax_certificate
  - 源泉徴収票              → documents.withholding_slip

その他:
  - 随時届け（退職）        → immigration_notices (退職届提出済みフラグ)
  - 社保資格取得日          → employments.social_insurance_date
  - 担当者                  → people.assigned_to
```

#### ビザ申請依頼リスト.csv（16カラム）
```yaml
申請基本:
  - 名前                    → visa_cases.person_id (people紐付け)
  - 会社名                  → visa_cases.client_org_id
  - 申請種類                → visa_cases.case_type
  - 契約種類                → visa_cases.contract_type

期間:
  - 雇用開始日              → visa_cases.employment_start_date
  - 雇用終了日              → visa_cases.employment_end_date
  - 期限日                  → visa_cases.deadline

進捗:
  - 完了済み                → visa_cases.is_completed
  - 作成状況                → visa_cases.status (複数ステータス対応)
  - 優先度                  → visa_cases.priority

担当:
  - 申請依頼担当者          → visa_cases.requested_by
  - 担当者                  → visa_cases.assigned_to

書類:
  - フォームリンク          → visa_cases.drive_folder_url
  - 企業_申請書類一式       → documents (Slack File ID)
  - 備考欄                  → visa_cases.notes
```

### 3.2 企業名正規化マスタ

```sql
-- 企業名の表記ゆれを正規化
CREATE TABLE organization_aliases (
    alias_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(org_id),
    alias_name VARCHAR(255) NOT NULL UNIQUE,  -- Slackでの表記
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データ例
INSERT INTO organization_aliases (org_id, alias_name) VALUES
-- スグクル本体
('uuid-sugukuru', 'スグクル(株)'),
('uuid-sugukuru', 'スグクル(株)-委託'),
('uuid-sugukuru', 'スグクル(株)-請負'),
('uuid-sugukuru', '派遣-スグクル(株)'),
-- 派遣先
('uuid-katahira', '片平-派遣'),
('uuid-katahira', '(有)片平農産'),
('uuid-shinbo', '新保農園-派遣'),
('uuid-shinbo', '(株)新保農園'),
('uuid-sungreen', 'サングリーン-派遣'),
('uuid-ja-logistics', 'JA物流かごしま-派遣'),
('uuid-hinata', 'ひなたライン-派遣'),
('uuid-arakuchi', '新口農園-派遣'),
-- 直接雇用先
('uuid-sbf', '(株)SBF'),
('uuid-aoyama', '(有)青山養鶏場'),
('uuid-uematsu', '植松裕補'),
('uuid-kawabe', '(有)川辺フーズ');
```

### 3.3 Complete DDL

```sql
-- =============================================================================
-- SUGUKURU Platform v7.0 - Complete Database Schema
-- PostgreSQL 15+ with Extensions
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUM Types
-- =============================================================================

-- Tenant & Organization
CREATE TYPE tenant_plan AS ENUM ('trial', 'starter', 'professional', 'enterprise');
CREATE TYPE org_type AS ENUM ('dispatch_agency', 'client_company', 'support_org', 'rso', 'government');

-- Employment
CREATE TYPE employment_type AS ENUM ('staff', 'dispatch', 'contract', 'trainee', 'ssw1', 'ssw2', 'intern');
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'pending', 'terminated');
CREATE TYPE assignment_status AS ENUM ('planned', 'active', 'completed', 'cancelled');

-- Contract Category (ショウダナプリ対応)
CREATE TYPE contract_category AS ENUM (
    'labor_dispatch',       -- 労働者派遣
    'subcontracting',       -- 業務委託（請負）
    'recruitment',          -- 有料職業紹介
    'temp_to_perm'          -- 紹介予定派遣
);

-- Visa Types
CREATE TYPE visa_type AS ENUM (
    'tokutei_gino_1', 'tokutei_gino_2', 
    'tokkatsu',                          -- 特定活動
    'gino_jisshu_1', 'gino_jisshu_2', 'gino_jisshu_3',
    'engineer_specialist', 'skilled_labor', 'designated_activities',
    'student', 'dependent', 'permanent_resident', 
    'overseas_waiting',                  -- 海外待機
    'other'
);

-- Visa Case Types (Slackリスト対応)
CREATE TYPE visa_case_type AS ENUM (
    'new_dispatch',          -- 新規-派遣
    'new_direct',            -- 新規-直接雇用
    'change_a',              -- 変更申請A（派遣先変更等）
    'change_b',              -- 変更申請B（在留資格変更）
    'renewal_dispatch',      -- 更新-派遣
    'renewal_direct',        -- 更新-直接雇用
    'renewal_subcontract',   -- 更新-請負
    'zuitoji_dispatch',      -- 随時届（派遣先変更）
    'zuitoji_termination',   -- 随時届（退職）
    'notification'           -- その他届出
);

-- Person Status (Slackリスト対応)
CREATE TYPE person_status AS ENUM (
    'monitoring',            -- 監理・管理中
    'applying',              -- 申請中
    'preparing',             -- 申請準備中
    'received',              -- 受領登録完了
    'lost',                  -- 失注
    'resigned',              -- 退職
    'resigned_planned',      -- 退職予定
    'overseas_waiting'       -- 海外待機
);

-- Deal Status
CREATE TYPE deal_status AS ENUM (
    'lead', 'qualification', 'proposal', 'negotiation', 
    'won', 'lost', 'on_hold'
);

-- Immigration Notice Types
CREATE TYPE immigration_notice_type AS ENUM (
    'contract_change', 'contract_termination', 'new_contract', 
    'acceptance_difficulty', 'dispatch_site_change', 'dispatch_conditions_change',
    'business_location_change', 'other'
);

CREATE TYPE notice_status AS ENUM (
    'detected', 'draft', 'pending_review', 'ready_to_submit',
    'submitted', 'acknowledged', 'rejected', 'completed'
);

-- =============================================================================
-- Core Tables
-- =============================================================================

-- Tenants
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan_type tenant_plan DEFAULT 'trial',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Organizations (企業マスタ)
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    org_type org_type NOT NULL,
    
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
    -- {
    --   "hourly_rate": 1500,
    --   "hourly_rate_with_license": 1700,
    --   "standard_hours_per_day": 8,
    --   "overtime_rate_multiplier": 1.25
    -- }
    
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

-- Organization Aliases (企業名正規化)
CREATE TABLE organization_aliases (
    alias_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(org_id),
    alias_name VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(50),  -- 'slack_hr', 'slack_visa', 'shoudana', 'smarthr'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_alias ON organization_aliases(alias_name);

-- Users
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

-- Departments (部署)
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    parent_department_id UUID REFERENCES departments(department_id),
    manager_id UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- People (人材マスタ - SmartHR + Slackリスト統合)
CREATE TABLE people (
    person_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    -- 名前
    names JSONB NOT NULL,
    -- {
    --   "full_name": "VIRGA ELFRADO TARIGAN",
    --   "legal_last": "TARIGAN",
    --   "legal_first": "VIRGA ELFRADO",
    --   "legal_last_kana": "タリガン",
    --   "legal_first_kana": "ビルガ エルフラド"
    -- }
    
    -- 基本情報
    demographics JSONB DEFAULT '{}',
    -- {
    --   "birth_date": "1995-03-15",
    --   "gender": "male",
    --   "nationality": "ID"
    -- }
    
    -- 連絡先
    contact_info JSONB DEFAULT '{}',
    -- {
    --   "email": "virga@example.com",
    --   "phone": "+81-90-1234-5678",
    --   "address": "..."
    -- }
    
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

-- Employments (雇用)
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

-- Assignments (派遣配置)
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

-- Visa Records (在留資格履歴)
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

-- Visa Cases (ビザ申請案件 - Slackビザ申請リスト対応)
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

-- =============================================================================
-- 商談・営業管理
-- =============================================================================

-- Deals (商談 - ショウダナプリ連携)
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

-- Deal Activities (商談活動ログ)
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

-- =============================================================================
-- 日次稼働・売上管理
-- =============================================================================

-- Daily Operations (日次稼働記録)
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
    
    -- 売上計算
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

-- Daily Revenue Summary (日次売上サマリー - 自動集計用)
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
    -- {
    --   "workers": [
    --     {"person_id": "...", "name": "VIRGA", "hours": 8, "revenue": 12000},
    --     ...
    --   ]
    -- }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, summary_date, region, client_org_id)
);

CREATE INDEX idx_revenue_date ON daily_revenue_summary(summary_date);
CREATE INDEX idx_revenue_region ON daily_revenue_summary(region);

-- =============================================================================
-- 派遣シミュレーション
-- =============================================================================

-- Dispatch Slots (週別配置スロット)
CREATE TABLE dispatch_slots (
    slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    
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

-- Simulation Sessions
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
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMPTZ
);

-- =============================================================================
-- 入管届出
-- =============================================================================

-- Immigration Notices
CREATE TABLE immigration_notices (
    notice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    notice_number VARCHAR(50) UNIQUE,
    
    notice_type immigration_notice_type NOT NULL,
    person_id UUID NOT NULL REFERENCES people(person_id),
    
    -- 期限管理
    event_date DATE NOT NULL,
    deadline DATE NOT NULL,
    days_remaining INTEGER GENERATED ALWAYS AS (deadline - CURRENT_DATE) STORED,
    is_overdue BOOLEAN GENERATED ALWAYS AS (CURRENT_DATE > deadline) STORED,
    
    -- 添付書類
    required_attachments JSONB DEFAULT '[]',
    
    -- 提出
    status notice_status DEFAULT 'detected',
    submitted_at TIMESTAMPTZ,
    receipt_number VARCHAR(100),
    
    assigned_to UUID REFERENCES users(user_id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notice_deadline ON immigration_notices(deadline) 
    WHERE status NOT IN ('completed', 'rejected');

-- =============================================================================
-- KPI
-- =============================================================================

-- KPI Daily Metrics
CREATE TABLE kpi_daily_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    metric_date DATE NOT NULL,
    
    department_id UUID REFERENCES departments(department_id),
    user_id UUID REFERENCES users(user_id),
    
    -- 営業KPI
    deals_created INTEGER DEFAULT 0,
    deals_won INTEGER DEFAULT 0,
    deals_lost INTEGER DEFAULT 0,
    deal_value_won BIGINT DEFAULT 0,
    activities_count INTEGER DEFAULT 0,
    
    -- 派遣KPI
    active_workers INTEGER DEFAULT 0,
    new_placements INTEGER DEFAULT 0,
    utilization_rate DECIMAL(5,2),
    
    -- 売上KPI
    daily_revenue BIGINT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, metric_date, department_id, user_id)
);

-- KPI Targets
CREATE TABLE kpi_targets (
    target_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    target_period VARCHAR(20) NOT NULL,
    period_type VARCHAR(10) NOT NULL,
    
    department_id UUID REFERENCES departments(department_id),
    user_id UUID REFERENCES users(user_id),
    
    target_deals_won INTEGER,
    target_deal_value BIGINT,
    target_revenue BIGINT,
    target_placements INTEGER,
    target_utilization_rate DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Documents
-- =============================================================================

-- Documents (書類管理 - Slackファイル連携)
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    
    doc_type VARCHAR(100) NOT NULL,
    -- 'photo', 'resident_card', 'my_number', 'driver_license',
    -- 'bank_account', 'health_checkup', 'tax_certificate', 'withholding_slip',
    -- 'application_pdf', 'company_docs'
    
    -- ストレージ
    storage_type VARCHAR(20) DEFAULT 'gcs',  -- 'gcs', 'slack', 'drive'
    storage_path TEXT,
    slack_file_ids TEXT[],  -- Slack File IDs (複数対応)
    drive_url TEXT,
    
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    
    -- メタデータ
    collected_at DATE,  -- 書類取得日
    expiry_date DATE,   -- 有効期限
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_docs_entity ON documents(entity_type, entity_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- Event Logs (監査)
-- =============================================================================

CREATE TABLE event_logs (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    
    actor_id UUID REFERENCES users(user_id),
    actor_type VARCHAR(50),
    
    old_values JSONB,
    new_values JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_entity ON event_logs(entity_type, entity_id);

-- =============================================================================
-- Views
-- =============================================================================

-- 日次稼働状況ビュー（地域別・企業別）
CREATE VIEW v_daily_operations_summary AS
SELECT
    do.operation_date,
    do.tenant_id,
    o.region,
    o.org_id AS client_org_id,
    o.name AS client_name,
    o.name_short AS client_short_name,
    COUNT(DISTINCT do.person_id) AS worker_count,
    SUM(do.worked_hours) AS total_hours,
    SUM(do.total_revenue) AS total_revenue,
    JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'person_id', do.person_id,
            'name', p.names->>'full_name',
            'hours', do.worked_hours,
            'overtime', do.overtime_hours,
            'revenue', do.total_revenue
        )
    ) AS workers
FROM daily_operations do
JOIN organizations o ON do.client_org_id = o.org_id
JOIN people p ON do.person_id = p.person_id
WHERE do.status != 'cancelled'
GROUP BY do.operation_date, do.tenant_id, o.region, o.org_id, o.name, o.name_short;

-- 候補者検索ビュー
CREATE VIEW v_candidate_search AS
SELECT
    p.person_id,
    p.tenant_id,
    p.names->>'full_name' AS full_name,
    p.names->>'legal_last_kana' AS last_name_kana,
    p.demographics->>'nationality' AS nationality,
    p.demographics->>'gender' AS gender,
    DATE_PART('year', AGE(CURRENT_DATE, (p.demographics->>'birth_date')::DATE)) AS age,
    p.current_status,
    
    -- 現在の配置
    a.assignment_id,
    co.name AS current_client_name,
    co.region AS current_region,
    a.end_date AS assignment_end_date,
    
    -- ビザ情報
    vr.visa_type,
    vr.valid_until AS visa_expiry,
    (vr.valid_until - CURRENT_DATE) AS days_until_visa_expiry,
    
    -- 空き状況
    CASE 
        WHEN a.assignment_id IS NULL THEN 'available'
        WHEN a.end_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'ending_soon'
        ELSE 'assigned'
    END AS availability_status
    
FROM people p
LEFT JOIN employments e ON p.person_id = e.person_id 
    AND e.status = 'active' AND e.deleted_at IS NULL
LEFT JOIN assignments a ON e.employment_id = a.employment_id 
    AND a.status = 'active' AND a.deleted_at IS NULL
LEFT JOIN organizations co ON a.client_org_id = co.org_id
LEFT JOIN visa_records vr ON p.person_id = vr.person_id 
    AND vr.valid_until >= CURRENT_DATE AND vr.deleted_at IS NULL
WHERE p.deleted_at IS NULL;

-- KPIダッシュボードビュー
CREATE VIEW v_kpi_dashboard AS
SELECT
    m.tenant_id,
    m.department_id,
    d.name AS department_name,
    DATE_TRUNC('month', m.metric_date) AS month,
    
    SUM(m.deals_won) AS total_deals_won,
    SUM(m.deal_value_won) AS total_deal_value,
    AVG(m.active_workers) AS avg_active_workers,
    AVG(m.utilization_rate) AS avg_utilization_rate,
    SUM(m.daily_revenue) AS total_revenue
    
FROM kpi_daily_metrics m
LEFT JOIN departments d ON m.department_id = d.department_id
GROUP BY m.tenant_id, m.department_id, d.name, DATE_TRUNC('month', m.metric_date);

-- =============================================================================
-- Triggers
-- =============================================================================

-- 派遣先変更検知
CREATE OR REPLACE FUNCTION detect_dispatch_site_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.client_org_id IS DISTINCT FROM NEW.client_org_id THEN
        INSERT INTO immigration_notices (
            tenant_id, notice_type, person_id,
            event_date, deadline, status
        )
        SELECT
            NEW.tenant_id,
            'dispatch_site_change',
            e.person_id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '14 days',
            'detected'
        FROM employments e
        WHERE e.employment_id = NEW.employment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detect_dispatch_site_change
    AFTER UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION detect_dispatch_site_change();

-- 日次売上自動集計
CREATE OR REPLACE FUNCTION aggregate_daily_revenue()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_revenue_summary (
        tenant_id, summary_date, region, client_org_id,
        worker_count, total_hours, total_revenue
    )
    SELECT
        NEW.tenant_id,
        NEW.operation_date,
        o.region,
        NEW.client_org_id,
        COUNT(*),
        SUM(do.worked_hours),
        SUM(do.total_revenue)
    FROM daily_operations do
    JOIN organizations o ON do.client_org_id = o.org_id
    WHERE do.operation_date = NEW.operation_date
      AND do.tenant_id = NEW.tenant_id
      AND do.client_org_id = NEW.client_org_id
    GROUP BY o.region
    ON CONFLICT (tenant_id, summary_date, region, client_org_id)
    DO UPDATE SET
        worker_count = EXCLUDED.worker_count,
        total_hours = EXCLUDED.total_hours,
        total_revenue = EXCLUDED.total_revenue;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aggregate_daily_revenue
    AFTER INSERT OR UPDATE ON daily_operations
    FOR EACH ROW
    EXECUTE FUNCTION aggregate_daily_revenue();
```

---

## 4. Data Import System

### 4.1 Import Sources

```yaml
SmartHR:
  type: CSV Upload / API
  frequency: Daily sync or manual
  mapping: smarthr_crews → people + employments

Slack人材管理リスト:
  type: CSV Export from Slack List
  frequency: Manual or scheduled
  mapping: 人材管理リスト → people + visa_records + documents

Slackビザ申請依頼リスト:
  type: CSV Export from Slack List
  frequency: Manual or scheduled
  mapping: ビザ申請依頼リスト → visa_cases

ショウダナプリ:
  type: Google Sheets API
  frequency: Real-time webhook or scheduled
  mapping: 商談シート → deals + organizations
```

### 4.2 Import API

```python
# POST /api/v1/imports/smarthr
# POST /api/v1/imports/slack-hr-list
# POST /api/v1/imports/slack-visa-list
# POST /api/v1/imports/shoudana

@router.post("/imports/slack-hr-list")
async def import_slack_hr_list(
    file: UploadFile,
    options: ImportOptions
) -> ImportResult:
    """
    人材管理リスト鹿児島.csv をインポート
    
    処理:
    1. CSV解析
    2. 企業名を organization_aliases で正規化
    3. people テーブルに UPSERT (名前でマッチング)
    4. visa_records を更新
    5. documents にSlack File IDを保存
    """
    pass

@router.post("/imports/slack-visa-list")
async def import_slack_visa_list(
    file: UploadFile,
    options: ImportOptions
) -> ImportResult:
    """
    ビザ申請依頼リスト.csv をインポート
    
    処理:
    1. CSV解析
    2. 名前で people とマッチング
    3. visa_cases テーブルに UPSERT
    4. status_tags を配列で保存（複数ステータス対応）
    """
    pass
```

### 4.3 Field Mapping

```yaml
# 人材管理リスト → SUGUKURU
名前: people.names.full_name
受入れ企業: → organization_aliases → assignments.client_org_id
国籍: people.demographics.nationality
現在の在留資格: visa_records.visa_type
期限日: visa_records.valid_until
現在の状況: people.current_status (ENUM変換)
申請の在留資格: visa_cases.target_visa_type
ビザ種類: employments.contract_category
在留カード: documents (doc_type='resident_card', slack_file_ids)
性別: people.demographics.gender
顔写真: documents (doc_type='photo')
メールアドレス: people.contact_info.email
随時届け（退職）: → immigration_notices (退職届)
マイナンバー: documents (doc_type='my_number')
運転免許: documents (doc_type='driver_license')
健康診断受診日: documents.collected_at
健康診断: documents (doc_type='health_checkup')
担当者: people.assigned_to (users紐付け)
社保資格取得日: employments.social_insurance_date

# ビザ申請依頼リスト → SUGUKURU
名前: → people (マッチング)
完了済み: visa_cases.is_completed
フォームリンク: visa_cases.drive_folder_url
会社名: → organization_aliases → visa_cases.client_org_id
申請種類: visa_cases.case_type (ENUM変換)
契約種類: visa_cases.contract_type
雇用開始日: visa_cases.employment_start_date
雇用終了日: visa_cases.employment_end_date
企業_申請書類一式: documents (doc_type='company_docs')
備考欄: visa_cases.notes
申請依頼担当者: visa_cases.requested_by_email
優先度: visa_cases.priority
作成状況: visa_cases.status_tags (配列)
担当者: visa_cases.assigned_to
期限日: visa_cases.deadline
```

---

## 5. UI Design

### 5.1 Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  スグクル  🔍 ⌘K    [ホーム][人材][顧客][商談][派遣][稼働][KPI][届出]   │
└─────────────────────────────────────────────────────────────────────────┘

メニュー構成:
├── ホーム (/)
│   └── ダッシュボード（今日の稼働、期限アラート、KPIサマリー）
│
├── 人材 (/people)
│   ├── 人材一覧
│   ├── 人材詳細
│   ├── 候補者検索（営業向け）
│   └── インポート（SmartHR/Slack）
│
├── 顧客 (/customers)
│   ├── 顧客一覧
│   ├── 顧客詳細
│   └── 単価設定
│
├── 商談 (/deals)
│   ├── 商談ボード（カンバン）
│   ├── 商談一覧
│   └── 新規作成（ショウダナプリ連携）
│
├── 派遣 (/dispatch)
│   ├── 週別配置ボード
│   ├── シミュレーション
│   └── 月間カレンダー
│
├── 稼働・売上 (/operations) ★新規
│   ├── 日次稼働（今日）
│   ├── 地域別ビュー
│   ├── 企業別ビュー
│   └── 売上レポート
│
├── KPI (/kpi)
│   ├── 全社ダッシュボード
│   ├── 部署別
│   └── 個人別
│
└── 届出 (/notices)
    ├── 届出一覧
    ├── 期限管理
    └── ビザ申請進捗
```

### 5.2 日次稼働ダッシュボード（新規）

```
┌─────────────────────────────────────────────────────────────────────────┐
│  日次稼働状況                              2025年1月27日（月）          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 本日サマリー                                                        │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐              │
│  │  👥 稼働人数    │ │  💰 予想売上   │ │  ⏱️ 総稼働時間  │              │
│  │     48名       │ │   ¥576,000    │ │    384時間     │              │
│  │  (計画: 52名)  │ │ (単価平均¥1,500)│ │  (8h × 48名)   │              │
│  └────────────────┘ └────────────────┘ └────────────────┘              │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  🗺️ 地域別稼働                                      [地域別] [企業別]   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 地域        │ 企業数 │ 稼働人数 │ 売上      │ 詳細              │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 📍 鹿児島市  │   3社  │   18名   │ ¥216,000  │ [▼ 展開]          │   │
│  │   └ 片平農産                8名    ¥96,000   → 詳細             │   │
│  │   └ JA物流かごしま          6名    ¥72,000   → 詳細             │   │
│  │   └ 川辺フーズ              4名    ¥48,000   → 詳細             │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 📍 阿久根市  │   2社  │   12名   │ ¥144,000  │ [▼ 展開]          │   │
│  │   └ 新保農園                7名    ¥84,000   → 詳細             │   │
│  │   └ サングリーン            5名    ¥60,000   → 詳細             │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 📍 枕崎市   │   1社  │    8名   │ ¥96,000   │ [▼ 展開]          │   │
│  │ 📍 指宿市   │   2社  │   10名   │ ¥120,000  │ [▼ 展開]          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

[企業詳細展開時]
┌─────────────────────────────────────────────────────────────────────────┐
│  📍 片平農産（鹿児島市）                              本日: 8名稼働     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  💰 売上計算                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 時間単価: ¥1,500 × 基本時間: 8h × 人数: 8名 = ¥96,000           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  👥 稼働者一覧                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 名前                    │ 時間  │ 残業 │ 単価   │ 売上     │ 状況 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ VIRGA ELFRADO TARIGAN   │  8h   │  0h  │ ¥1,500 │ ¥12,000  │ ✅   │   │
│  │ NGUYEN VAN ANH          │  8h   │  1h  │ ¥1,500 │ ¥13,875  │ ✅   │   │
│  │ ALDI PRATAMA            │  8h   │  0h  │ ¥1,700 │ ¥13,600  │ 🚗   │   │
│  │ ...                     │       │      │        │          │      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  凡例: ✅ 通常 🚗 免許持ち 🏥 欠勤 ⚠️ 遅刻                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 派遣状況ボード（週別・シミュレーション付き）

```
┌─────────────────────────────────────────────────────────────────────────┐
│  派遣状況ボード                    [← 前週] 2025年1月 第4週 [次週 →]    │
│                                              [📊 シミュレーション開始]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  配置先 ＼ 日付    │ 月(27) │ 火(28) │ 水(29) │ 木(30) │ 金(31) │ 土(1) │
│  ─────────────────┼────────┼────────┼────────┼────────┼────────┼───────│
│                   │        │        │        │        │        │       │
│  🌾 片平農産       │████████│████████│████████│████████│████████│  休   │
│    鹿児島市       │  8名   │  8名   │  8名   │  8名   │  8名   │       │
│    必要: 8名 ✅   │¥96,000 │¥96,000 │¥96,000 │¥96,000 │¥96,000 │       │
│                   │        │        │        │        │        │       │
│  ─────────────────┼────────┼────────┼────────┼────────┼────────┼───────│
│                   │        │        │        │        │        │       │
│  🐄 新保農園       │████████│████████│████████│████████│████████│███████│
│    阿久根市       │  7名   │  7名   │  7名   │  7名   │  7名   │  4名  │
│    必要: 7名 ✅   │¥84,000 │¥84,000 │¥84,000 │¥84,000 │¥84,000 │¥48,000│
│                   │        │        │        │        │        │       │
│  ─────────────────┼────────┼────────┼────────┼────────┼────────┼───────│
│                   │        │        │        │        │        │       │
│  🆕 C製造（新規）  │▒▒▒▒▒▒▒▒│▒▒▒▒▒▒▒▒│████    │████    │████    │  休   │
│    鹿児島市       │ 準備中 │ 準備中 │  3名   │  3名   │  3名   │       │
│    必要: 5名 ⚠️   │   -    │   -    │¥36,000 │¥36,000 │¥36,000 │       │
│                   │        │        │        │        │        │       │
├─────────────────────────────────────────────────────────────────────────┤
│  📊 週サマリー                                                          │
│  稼働人数: 平均 18名 / 必要 20名 / 充足率 90%                           │
│  週間売上: ¥1,296,000（見込み）                                         │
│                                                                         │
│  👥 空き人員: PARK (1/29〜), SANTOS (2/1〜), GARCIA (即日)              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 候補者検索（営業向けモバイル対応）

```
┌─────────────────────────────────────────────────────────────────────────┐
│  候補者検索                                     📱 モバイル対応         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 検索条件                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 空き状況: [即日可能 ▼]   ビザ種類: [全て ▼]   地域: [全て ▼]    │   │
│  │                                                                 │   │
│  │ 🔎 キーワード: [フォークリフト                              ]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  検索結果: 5名                                                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 NGUYEN VAN ANH                              [詳細] [提案へ]  │   │
│  │ ベトナム │ 25歳 │ 特定活動（残り2ヶ月）                        │   │
│  │ 📍 現在: 待機中（即日可能）                                     │   │
│  │ 🎫 資格: フォークリフト、大型免許                               │   │
│  │ 💰 希望: ¥1,500〜                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🟡 ALDI PRATAMA                                [詳細] [提案へ]  │   │
│  │ インドネシア │ 28歳 │ 特定技能1号（残り3年）                   │   │
│  │ 📍 現在: 片平農産 → 2/15 終了予定                               │   │
│  │ 🎫 資格: フォークリフト                                         │   │
│  │ 💰 希望: ¥1,400〜                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Design

### 6.1 Endpoints

```yaml
# Core
GET/POST   /api/v1/people
GET/PUT    /api/v1/people/{id}
GET        /api/v1/people/{id}/timeline

# Visa Cases
GET/POST   /api/v1/visa-cases
GET/PUT    /api/v1/visa-cases/{id}

# Deals
GET/POST   /api/v1/deals
GET/PUT    /api/v1/deals/{id}
POST       /api/v1/deals/{id}/activities

# Daily Operations (売上・稼働)
GET        /api/v1/operations/daily?date=2025-01-27
GET        /api/v1/operations/daily/by-region?date=2025-01-27
GET        /api/v1/operations/daily/by-client?date=2025-01-27&client_id=xxx
GET        /api/v1/operations/revenue/summary?start=2025-01-01&end=2025-01-31

# Dispatch
GET        /api/v1/dispatch/slots?week_start=2025-01-27
POST       /api/v1/dispatch/slots
PUT        /api/v1/dispatch/slots/{id}
POST       /api/v1/dispatch/simulations
POST       /api/v1/dispatch/simulations/{id}/apply

# Candidates
GET        /api/v1/candidates/search?available=true&skills=forklift

# KPI
GET        /api/v1/kpi/dashboard
GET        /api/v1/kpi/departments/{id}

# Immigration Notices
GET        /api/v1/notices?status=pending
POST       /api/v1/notices/{id}/submit

# Import
POST       /api/v1/imports/smarthr
POST       /api/v1/imports/slack-hr-list
POST       /api/v1/imports/slack-visa-list
POST       /api/v1/imports/shoudana
```

### 6.2 Daily Revenue Calculation

```python
# 日次売上計算ロジック

def calculate_daily_revenue(
    client_org_id: UUID,
    operation_date: date
) -> DailyRevenueResult:
    """
    日次売上 = Σ (時間単価 × 稼働時間 × 人数) + 残業売上
    
    計算式:
    - 基本売上 = hourly_rate × standard_hours × worker_count
    - 残業売上 = hourly_rate × overtime_hours × 1.25
    - 合計 = 基本売上 + 残業売上
    """
    
    # 企業の単価設定を取得
    org = get_organization(client_org_id)
    hourly_rate = org.billing_config.get('hourly_rate', 1500)
    hourly_rate_license = org.billing_config.get('hourly_rate_with_license', 1700)
    standard_hours = org.billing_config.get('standard_hours_per_day', 8)
    
    # その日の稼働者を取得
    operations = get_daily_operations(client_org_id, operation_date)
    
    total_revenue = 0
    workers = []
    
    for op in operations:
        rate = hourly_rate_license if op.has_license else hourly_rate
        base = rate * op.worked_hours
        overtime = rate * op.overtime_hours * 1.25
        revenue = base + overtime
        
        total_revenue += revenue
        workers.append({
            'person_id': op.person_id,
            'name': op.person_name,
            'hours': op.worked_hours,
            'overtime': op.overtime_hours,
            'rate': rate,
            'revenue': revenue
        })
    
    return DailyRevenueResult(
        client_org_id=client_org_id,
        date=operation_date,
        worker_count=len(workers),
        total_hours=sum(w['hours'] for w in workers),
        total_revenue=total_revenue,
        workers=workers
    )
```

---

## 7. Implementation Roadmap

### Phase 1: 基盤（Week 1-2）
- GCP環境構築
- Core Tables マイグレーション
- 基本API（People, Organizations）

### Phase 2: データ統合（Week 3-4）
- SmartHRインポート
- Slackリストインポート（2種類）
- 企業名正規化
- ショウダナプリ連携

### Phase 3: 営業機能（Week 5-6）
- 商談管理（カンバン）
- 候補者検索
- 顧客管理

### Phase 4: 派遣管理（Week 7-8）
- 週別配置ボード
- シミュレーション機能
- 日次稼働入力

### Phase 5: 売上・KPI（Week 9-10）
- 日次稼働ダッシュボード
- 地域別・企業別ビュー
- 売上自動計算
- KPIダッシュボード

### Phase 6: 入管・書類（Week 11-12）
- 入管届出自動生成
- 14日期限管理
- 書類生成システム

---

## 8. Cursor Handoff

### 8.1 Initial Prompt

```
@SUGUKURU_FINAL_v7.md を参照して、以下の順序で実装してください：

1. sql/ に全テーブルのマイグレーションを作成
   - organization_aliases（企業名正規化）を忘れずに
   
2. データインポート機能を実装
   - POST /api/v1/imports/slack-hr-list
   - POST /api/v1/imports/slack-visa-list
   - 企業名の正規化ロジックを含める

3. 日次稼働ダッシュボードを実装
   - GET /api/v1/operations/daily/by-region
   - 売上計算ロジック（時間単価 × 時間 × 人数）

4. 派遣週別ボードを実装
   - シミュレーション機能付き

Claude Sonnet 4.5を使用してください。
日本語でコメントを書いてください。
```

---

## 9. File Deliverables

```
sugukuru-platform/
├── docs/
│   ├── SUGUKURU_FINAL_v7.md              # この文書
│   └── API_SPECIFICATION.yaml
├── sql/
│   ├── 001_extensions.sql
│   ├── 002_enums.sql
│   ├── 003_organizations.sql
│   ├── 004_people.sql
│   ├── 005_employments_assignments.sql
│   ├── 006_visa.sql
│   ├── 007_deals.sql
│   ├── 008_daily_operations.sql
│   ├── 009_dispatch_slots.sql
│   ├── 010_immigration_notices.sql
│   ├── 011_kpi.sql
│   ├── 012_documents.sql
│   ├── 013_views.sql
│   ├── 014_triggers.sql
│   └── 015_seed_data.sql
├── src/
│   ├── api/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── people.py
│   │   │   ├── deals.py
│   │   │   ├── operations.py
│   │   │   ├── dispatch.py
│   │   │   ├── candidates.py
│   │   │   ├── kpi.py
│   │   │   ├── notices.py
│   │   │   └── imports.py
│   │   └── services/
│   │       ├── smarthr_importer.py
│   │       ├── slack_list_importer.py
│   │       ├── shoudana_sync.py
│   │       ├── revenue_calculator.py
│   │       └── document_generator.py
│   └── web/
│       ├── app/
│       │   ├── page.tsx (Dashboard)
│       │   ├── people/
│       │   ├── deals/
│       │   ├── dispatch/
│       │   ├── operations/
│       │   ├── kpi/
│       │   └── notices/
│       └── components/
│           ├── DailyOperationsBoard.tsx
│           ├── DispatchWeekBoard.tsx
│           ├── CandidateSearch.tsx
│           ├── DealKanban.tsx
│           └── KPIDashboard.tsx
├── .cursorrules
├── docker-compose.yml
└── README.md
```

---

**Document Version**: 7.0 Final
**Last Updated**: 2025-12-27
**Status**: Implementation Ready
