-- =============================================================================
-- 002_enums.sql
-- 全てのカスタムENUM型の定義
-- =============================================================================

-- テナントプラン
CREATE TYPE tenant_plan AS ENUM ('trial', 'starter', 'professional', 'enterprise');

-- 組織タイプ
CREATE TYPE org_type AS ENUM ('dispatch_agency', 'client_company', 'support_org', 'rso', 'government');

-- 事業区分
CREATE TYPE business_division AS ENUM (
    'dispatch',        -- 派遣事業
    'subcontracting',  -- 農受託事業
    'support',         -- 登録支援事業
    'it'               -- IT事業
);

-- 雇用タイプ
CREATE TYPE employment_type AS ENUM ('staff', 'dispatch', 'contract', 'trainee', 'ssw1', 'ssw2', 'intern');

-- 雇用ステータス
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'pending', 'terminated');

-- 配置ステータス
CREATE TYPE assignment_status AS ENUM ('planned', 'active', 'completed', 'cancelled');

-- 契約カテゴリ (ショウダナプリ対応)
CREATE TYPE contract_category AS ENUM (
    'labor_dispatch',       -- 労働者派遣
    'subcontracting',       -- 業務委託（請負）
    'recruitment',          -- 有料職業紹介
    'temp_to_perm'          -- 紹介予定派遣
);

-- 在留資格（在留資格一覧）
CREATE TYPE visa_type AS ENUM (
    'tokutei_gino_1', 'tokutei_gino_2', 
    'tokkatsu',                          -- 特定活動
    'gino_jisshu_1', 'gino_jisshu_2', 'gino_jisshu_3',
    'engineer_specialist', 'skilled_labor', 'designated_activities',
    'student', 'dependent', 'permanent_resident', 
    'overseas_waiting',                  -- 海外待機
    'other'
);

-- ビザ申請タイプ (Slackリスト対応)
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

-- 人材ステータス (Slackリスト対応)
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

-- 商談ステータス
CREATE TYPE deal_status AS ENUM (
    'lead', 'qualification', 'proposal', 'negotiation', 
    'won', 'lost', 'on_hold'
);

-- 入管届出タイプ
CREATE TYPE immigration_notice_type AS ENUM (
    'contract_change', 'contract_termination', 'new_contract', 
    'acceptance_difficulty', 'dispatch_site_change', 'dispatch_conditions_change',
    'business_location_change', 'other'
);

-- 届出ステータス
CREATE TYPE notice_status AS ENUM (
    'detected', 'draft', 'pending_review', 'ready_to_submit',
    'submitted', 'acknowledged', 'rejected', 'completed'
);
