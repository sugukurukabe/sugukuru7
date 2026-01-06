import asyncio
import os
import sys
import glob
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.api.models.tenant import Tenant
from src.api.services.slack_list_importer import SlackListImporter
from src.api.services.smarthr_importer import SmartHRImporter

# Cloud SQL Connection config
DB_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://sugukuru_admin:temporary-password-123@35.187.223.4/sugukuru")

engine = create_async_engine(DB_URL)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def import_data():
    print("🚀 Starting local data import...")
    
    async with SessionLocal() as db:
        # Get the first tenant or use dummy
        stmt = select(Tenant).limit(1)
        result = await db.execute(stmt)
        tenant = result.scalar_one_or_none()
        
        if not tenant:
            print("❌ No tenant found in database. Please run migrations and seed data first.")
            return
            
        tenant_id = tenant.tenant_id
        print(f"📦 Using Tenant ID: {tenant_id} ({tenant.name})")
        
        # 1. 人材管理リスト鹿児島.csv
        file_staff = "人材管理リスト鹿児島.csv"
        if os.path.exists(file_staff):
            print(f"📖 Reading {file_staff}...")
            with open(file_staff, "r", encoding="utf-8-sig") as f:
                content = f.read()
                res = await SlackListImporter.import_staff_list(db, content, tenant_id)
                print(f"✅ Staff Import Result: {res['success_count']} success, {res['skip_count']} skipped")
                if res['errors']:
                    print(f"⚠️ Errors (first 3): {res['errors'][:3]}")
        else:
            print(f"ℹ️ {file_staff} not found, skipping.")
            
        # 2. ビザ申請依頼リスト.csv
        file_visa = "ビザ申請依頼リスト.csv"
        if os.path.exists(file_visa):
            print(f"📖 Reading {file_visa}...")
            with open(file_visa, "r", encoding="utf-8-sig") as f:
                content = f.read()
                res = await SlackListImporter.import_visa_list(db, content, tenant_id)
                print(f"✅ Visa Import Result: {res['success_count']} success, {res['skip_count']} skipped")
                if res['errors']:
                    print(f"⚠️ Errors (first 3): {res['errors'][:3]}")
        else:
            print(f"ℹ️ {file_visa} not found, skipping.")

        # 3. SmartHR CSV (Dynamic filename)
        smarthr_files = glob.glob("SmartHR_crews_*.csv")
        if smarthr_files:
            file_smarthr = smarthr_files[0]
            print(f"📖 Reading {file_smarthr}...")
            with open(file_smarthr, "r", encoding="utf-8-sig") as f:
                content = f.read()
                res = await SmartHRImporter.import_csv(db, content, tenant_id)
                print(f"✅ SmartHR Import Result: {res.get('success_count', 0)} success, {res.get('skip_count', 0)} skipped")
                if res.get('errors'):
                    print(f"⚠️ Errors (first 3): {res['errors'][:3]}")
        else:
            print("ℹ️ SmartHR CSV not found, skipping.")

    print("🏁 Import process finished.")

if __name__ == "__main__":
    # Ensure sys.path includes the project root
    sys.path.append(os.getcwd())
    asyncio.run(import_data())
