-- =============================================================================
-- 015_seed_data.sql
-- 初期マスターデータおよびテストデータ
-- =============================================================================

-- 1. デモ用テナント作成
INSERT INTO tenants (name, plan_type) VALUES ('スグクル・デモ', 'professional') 
RETURNING tenant_id \gset demo_

-- 2. メイン組織（スグクル）
INSERT INTO organizations (tenant_id, org_type, name, name_short, region)
VALUES (:'demo_tenant_id', 'dispatch_agency', 'スグクル株式会社', 'スグクル', '鹿児島市')
RETURNING org_id \gset agency_

-- 3. 企業名正規化エイリアス（設計書より）
INSERT INTO organization_aliases (org_id, alias_name, source) VALUES
(:'agency_org_id', 'スグクル(株)', 'slack_hr'),
(:'agency_org_id', 'スグクル(株)-委託', 'slack_hr'),
(:'agency_org_id', 'スグクル(株)-請負', 'slack_hr'),
(:'agency_org_id', '派遣-スグクル(株)', 'slack_hr');

-- ※ その他のエイリアスやテスト用ユーザーなどは、システム稼働後に適宜追加

-- 4. 事業区分設定 (Phase 5)
-- 派遣事業
UPDATE organizations SET business_division = 'dispatch' 
WHERE name IN ('片平農産', '新保農園', 'サングリーン', 'JA物流かごしま');

-- 農受託事業
UPDATE organizations SET business_division = 'subcontracting' 
WHERE name LIKE '%委託%' OR name LIKE '%請負%';

-- 登録支援事業
UPDATE organizations SET business_division = 'support' 
WHERE name IN ('川辺フーズ', '青山養鶏場', '東馬場農場');

-- IT事業
UPDATE organizations SET business_division = 'it' 
WHERE name LIKE '%IT%' OR name LIKE '%システム%';
