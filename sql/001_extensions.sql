-- =============================================================================
-- 001_extensions.sql
-- 必要な拡張機能の有効化
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID生成用
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- 暗号化・ハッシュ用
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- あいまい検索（GINインデックス）用
