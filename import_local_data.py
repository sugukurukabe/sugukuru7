#!/usr/bin/env python3
"""
ローカルCSVデータインポートスクリプト

以下のファイルをSUGUKURUデータベースにインポートします:
1. 人材管理リスト鹿児島.csv - 人材情報（Slackリスト）
2. ビザ申請依頼リスト.csv - ビザ案件情報
3. SmartHR_crews_*.csv - SmartHR従業員データ

使用方法:
  python import_local_data.py

環境変数:
  DATABASE_URL - PostgreSQL接続文字列（省略時はローカル開発DB）
"""
import asyncio
import os
import sys
import glob
from datetime import datetime
from uuid import UUID
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.api.models.tenant import Tenant
from src.api.services.slack_list_importer import SlackListImporter
from src.api.services.smarthr_importer import SmartHRImporter

# データベース接続設定
DB_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql+asyncpg://sugukuru_admin:temporary-password-123@35.187.223.4/sugukuru"
)

engine = create_async_engine(DB_URL, echo=False)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

def print_banner():
    """バナー表示"""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║          🚀 SUGUKURU データインポートツール v2.0              ║
║          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          ║
║          人材管理・ビザ・SmartHRデータを統合インポート        ║
╚═══════════════════════════════════════════════════════════════╝
    """)

def print_section(title: str):
    """セクション見出し"""
    print(f"\n{'─' * 60}")
    print(f"📂 {title}")
    print(f"{'─' * 60}")

def print_result(result: dict, file_name: str):
    """結果の詳細表示"""
    success = result.get('success_count', 0)
    update = result.get('update_count', 0)
    skip = result.get('skip_count', 0)
    total = result.get('total_processed', success + update + skip)
    errors = result.get('errors', [])
    
    print(f"""
    ┌─────────────────────────────────────┐
    │ ファイル: {file_name[:25]:<25} │
    ├─────────────────────────────────────┤
    │ ✅ 新規作成:    {success:>6} 件           │
    │ 🔄 更新:        {update:>6} 件           │
    │ ⏭️  スキップ:    {skip:>6} 件           │
    │ ─────────────────────────────────── │
    │ 📊 合計処理:    {total:>6} 件           │
    └─────────────────────────────────────┘""")
    
    if errors:
        print(f"\n    ⚠️ エラー一覧 (先頭5件):")
        for err in errors[:5]:
            print(f"       • {err[:70]}...")
        if len(errors) > 5:
            print(f"       ... 他 {len(errors) - 5} 件")

async def check_database_connection():
    """データベース接続確認"""
    try:
        async with SessionLocal() as db:
            await db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"❌ データベース接続エラー: {e}")
        return False

async def get_or_create_tenant(db: AsyncSession) -> UUID:
    """テナント取得または作成"""
    stmt = select(Tenant).limit(1)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        # デフォルトテナント作成
        tenant = Tenant(
            name="スグクル株式会社",
            plan="enterprise",
            settings={"default": True}
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        print("📦 新規テナントを作成しました")
    
    return tenant.tenant_id, tenant.name

async def import_staff_list(db: AsyncSession, tenant_id: UUID):
    """人材管理リストのインポート"""
    file_path = "人材管理リスト鹿児島.csv"
    
    if not os.path.exists(file_path):
        print(f"    ⚠️ {file_path} が見つかりません。スキップします。")
        return None
    
    print(f"    📖 読み込み中: {file_path}")
    with open(file_path, "r", encoding="utf-8-sig") as f:
        content = f.read()
    
    line_count = len(content.strip().split("\n")) - 1  # ヘッダー除く
    print(f"    📊 データ行数: {line_count} 件")
    
    result = await SlackListImporter.import_staff_list(db, content, tenant_id)
    return result

async def import_visa_list(db: AsyncSession, tenant_id: UUID):
    """ビザ申請依頼リストのインポート"""
    file_path = "ビザ申請依頼リスト.csv"
    
    if not os.path.exists(file_path):
        print(f"    ⚠️ {file_path} が見つかりません。スキップします。")
        return None
    
    print(f"    📖 読み込み中: {file_path}")
    with open(file_path, "r", encoding="utf-8-sig") as f:
        content = f.read()
    
    line_count = len(content.strip().split("\n")) - 1
    print(f"    📊 データ行数: {line_count} 件")
    
    result = await SlackListImporter.import_visa_list(db, content, tenant_id)
    return result

async def import_smarthr(db: AsyncSession, tenant_id: UUID):
    """SmartHRデータのインポート"""
    smarthr_files = glob.glob("SmartHR_crews_*.csv")
    
    if not smarthr_files:
        print("    ⚠️ SmartHR CSV が見つかりません。スキップします。")
        return None
    
    file_path = smarthr_files[0]  # 最初のファイルを使用
    print(f"    📖 読み込み中: {file_path}")
    
    with open(file_path, "r", encoding="utf-8-sig") as f:
        content = f.read()
    
    line_count = len(content.strip().split("\n")) - 1
    print(f"    📊 データ行数: {line_count} 件")
    
    result = await SmartHRImporter.import_csv(db, content, tenant_id)
    return result

async def show_summary(db: AsyncSession, tenant_id: UUID):
    """インポート後のサマリー表示"""
    print_section("インポート後のデータサマリー")
    
    # 人材数
    result = await db.execute(text("""
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE current_status = 'monitoring') as monitoring,
            COUNT(*) FILTER (WHERE current_status = 'applying') as applying,
            COUNT(*) FILTER (WHERE current_status = 'resigned') as resigned,
            COUNT(*) FILTER (WHERE smarthr_crew_id IS NOT NULL) as smarthr_linked
        FROM people 
        WHERE tenant_id = :tenant_id AND deleted_at IS NULL
    """), {"tenant_id": tenant_id})
    row = result.fetchone()
    
    if row:
        print(f"""
    👥 人材データ:
       ├─ 合計登録数:     {row.total:>6} 名
       ├─ 管理中:         {row.monitoring:>6} 名
       ├─ 申請中:         {row.applying:>6} 名
       ├─ 退職済み:       {row.resigned:>6} 名
       └─ SmartHR連携:    {row.smarthr_linked:>6} 名
        """)
    
    # 企業数
    result = await db.execute(text("""
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE settings->>'needs_review' = 'true') as needs_review
        FROM organizations 
        WHERE tenant_id = :tenant_id AND deleted_at IS NULL
    """), {"tenant_id": tenant_id})
    row = result.fetchone()
    
    if row:
        print(f"""
    🏢 企業データ:
       ├─ 合計登録数:     {row.total:>6} 社
       └─ 要確認:         {row.needs_review:>6} 社
        """)

async def main():
    """メイン処理"""
    print_banner()
    
    start_time = datetime.now()
    print(f"⏰ 開始時刻: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # データベース接続確認
    print("\n🔌 データベース接続を確認中...")
    if not await check_database_connection():
        print("❌ データベースに接続できません。終了します。")
        return
    print("✅ データベース接続OK")
    
    async with SessionLocal() as db:
        # テナント取得
        tenant_id, tenant_name = await get_or_create_tenant(db)
        print(f"📦 テナント: {tenant_name} ({tenant_id})")
        
        # 1. 人材管理リスト
        print_section("人材管理リスト (Slackリスト)")
        result = await import_staff_list(db, tenant_id)
        if result:
            print_result(result, "人材管理リスト鹿児島.csv")
        
        # 2. ビザ申請依頼リスト
        print_section("ビザ申請依頼リスト")
        result = await import_visa_list(db, tenant_id)
        if result:
            print_result(result, "ビザ申請依頼リスト.csv")
        
        # 3. SmartHR
        print_section("SmartHR 従業員データ")
        result = await import_smarthr(db, tenant_id)
        if result:
            print_result(result, "SmartHR_crews_*.csv")
        
        # サマリー表示
        await show_summary(db, tenant_id)
    
    # 完了
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║                    ✅ インポート完了                          ║
║                                                               ║
║   終了時刻: {end_time.strftime('%Y-%m-%d %H:%M:%S')}                               ║
║   処理時間: {duration:.1f} 秒                                          ║
╚═══════════════════════════════════════════════════════════════╝
    """)

if __name__ == "__main__":
    asyncio.run(main())
