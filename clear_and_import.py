#!/usr/bin/env python3
"""
データクリア＆インポートスクリプト（修正版）
"""
import asyncio
import os
import sys
import glob
import argparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.api.models.tenant import Tenant
from src.api.services.slack_list_importer import SlackListImporter
from src.api.services.smarthr_importer import SmartHRImporter

DB_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql+asyncpg://sugukuru_admin:temporary-password-123@35.187.223.4/sugukuru"
)

engine = create_async_engine(DB_URL, echo=False)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def clear_data():
    """既存データをクリア"""
    print("\n🗑️  データクリアを開始...")
    
    async with SessionLocal() as db:
        result = await db.execute(text("SELECT tenant_id FROM tenants LIMIT 1"))
        row = result.fetchone()
        if not row:
            print("❌ テナントが見つかりません")
            return
        tenant_id = row[0]
        
        # 順番に削除（外部キー制約を考慮）
        tables_to_clear = [
            ("visa_cases", "ビザ案件"),
            ("visa_records", "ビザ記録"),
            ("assignments", "配置"),
            ("employments", "雇用"),
            ("people", "人材"),
        ]
        
        for table, label in tables_to_clear:
            try:
                result = await db.execute(text(f"DELETE FROM {table} WHERE tenant_id = :tid"), {"tid": tenant_id})
                count = result.rowcount
                print(f"   ✅ {label}: {count}件 削除")
                await db.commit()
            except Exception as e:
                await db.rollback()
                print(f"   ⚠️ {label}: スキップ")
        
        # 自動生成された企業のみ削除（別トランザクション）
        try:
            result = await db.execute(text("""
                DELETE FROM organizations 
                WHERE tenant_id = :tid 
                AND (settings->>'imported')::boolean = true
            """), {"tid": tenant_id})
            print(f"   ✅ 自動生成企業: {result.rowcount}件 削除")
            await db.commit()
        except Exception as e:
            await db.rollback()
            print(f"   ⚠️ 自動生成企業: スキップ")
        
        print("\n✅ データクリア完了！")

async def import_data():
    """CSVからデータをインポート"""
    print("\n📥 データインポートを開始...")
    
    async with SessionLocal() as db:
        result = await db.execute(text("SELECT tenant_id, name FROM tenants LIMIT 1"))
        row = result.fetchone()
        if not row:
            print("❌ テナントが見つかりません")
            return
        tenant_id, tenant_name = row
        print(f"📦 テナント: {tenant_name}")
        
        # 1. 人材管理リスト
        csv_files = glob.glob("人材管理リスト*.csv")
        if csv_files:
            file_path = csv_files[0]
            print(f"\n📖 {file_path} を読み込み中...")
            with open(file_path, "r", encoding="utf-8-sig") as f:
                content = f.read()
            line_count = len(content.strip().split("\n")) - 1
            print(f"   📊 データ行数: {line_count}件")
            result = await SlackListImporter.import_staff_list(db, content, tenant_id)
            print(f"   ✅ 新規: {result['success_count']}件, 更新: {result.get('update_count', 0)}件")
            if result['errors']:
                print(f"   ⚠️ エラー: {len(result['errors'])}件")
        else:
            print("⚠️ 人材管理リスト*.csv が見つかりません")
        
        # 2. ビザ申請依頼リスト
        if os.path.exists("ビザ申請依頼リスト.csv"):
            print(f"\n📖 ビザ申請依頼リスト.csv を読み込み中...")
            with open("ビザ申請依頼リスト.csv", "r", encoding="utf-8-sig") as f:
                content = f.read()
            line_count = len(content.strip().split("\n")) - 1
            print(f"   📊 データ行数: {line_count}件")
            result = await SlackListImporter.import_visa_list(db, content, tenant_id)
            print(f"   ✅ 新規: {result['success_count']}件, スキップ: {result['skip_count']}件")
        else:
            print("⚠️ ビザ申請依頼リスト.csv が見つかりません")
        
        # 3. SmartHR
        smarthr_files = glob.glob("SmartHR_crews_*.csv")
        if smarthr_files:
            file_path = smarthr_files[0]
            print(f"\n📖 {file_path} を読み込み中...")
            with open(file_path, "r", encoding="utf-8-sig") as f:
                content = f.read()
            line_count = len(content.strip().split("\n")) - 1
            print(f"   📊 データ行数: {line_count}件")
            result = await SmartHRImporter.import_csv(db, content, tenant_id)
            print(f"   ✅ 新規: {result['success_count']}件, 更新: {result.get('update_count', 0)}件")
        else:
            print("⚠️ SmartHR_crews_*.csv が見つかりません")
        
        # サマリー表示
        result = await db.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE current_status = 'monitoring') as active,
                COUNT(*) FILTER (WHERE current_status = 'applying') as applying,
                COUNT(*) FILTER (WHERE current_status = 'resigned') as resigned
            FROM people WHERE tenant_id = :tid AND deleted_at IS NULL
        """), {"tid": tenant_id})
        row = result.fetchone()
        
        result2 = await db.execute(text("""
            SELECT COUNT(*) FROM organizations WHERE tenant_id = :tid AND deleted_at IS NULL
        """), {"tid": tenant_id})
        org_count = result2.scalar()
        
        print(f"""
╔═══════════════════════════════════════════════╗
║            📊 インポート結果                   ║
╠═══════════════════════════════════════════════╣
║  人材総数:       {row.total:>6} 名                    ║
║  ├ 管理中:       {row.active:>6} 名                    ║
║  ├ 申請中:       {row.applying:>6} 名                    ║
║  └ 退職済み:     {row.resigned:>6} 名                    ║
║  企業数:         {org_count:>6} 社                    ║
╚═══════════════════════════════════════════════╝
        """)

async def main():
    parser = argparse.ArgumentParser(description='データクリア＆インポート')
    parser.add_argument('--clear', action='store_true', help='データをクリア')
    parser.add_argument('--import', dest='do_import', action='store_true', help='データをインポート')
    parser.add_argument('--all', action='store_true', help='クリア後インポート')
    args = parser.parse_args()
    
    if args.all:
        await clear_data()
        await import_data()
    elif args.clear:
        await clear_data()
    elif args.do_import:
        await import_data()
    else:
        print("使用方法:")
        print("  python3 clear_and_import.py --clear    # データクリアのみ")
        print("  python3 clear_and_import.py --import   # インポートのみ")
        print("  python3 clear_and_import.py --all      # クリア後インポート")

if __name__ == "__main__":
    asyncio.run(main())
