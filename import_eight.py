#!/usr/bin/env python3
"""
Eight名刺データインポートスクリプト

EightのCSVデータを「Organizations」（顧客企業）としてインポートします。
同一企業名のデータは1つのOrganizationに統合され、連絡先（担当者）情報は
contact_infoカラム内のcontactsリストに追加されます。
"""
import asyncio
import os
import sys
import csv
import json
from datetime import datetime
from uuid import UUID
from collections import defaultdict
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.api.models.tenant import Tenant
from src.api.models.organization import Organization

# データベース接続設定
DB_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql+asyncpg://sugukuru_admin:temporary-password-123@35.187.223.4/sugukuru"
)

engine = create_async_engine(DB_URL, echo=False)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

def get_prefecture(address):
    prefectures = [
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
        "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
        "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
        "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
        "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ]
    if not address:
        return "その他"
    for p in prefectures:
        if address.startswith(p):
            return p
    return "その他"

async def get_or_create_tenant(db: AsyncSession) -> UUID:
    """テナント取得または作成（デフォルト）"""
    stmt = select(Tenant).limit(1)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        tenant = Tenant(
            name="スグクル株式会社",
            plan="enterprise",
            settings={"default": True}
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
        print("📦 新規テナントを作成しました")
    
    return tenant.tenant_id

async def import_eight_csv(db: AsyncSession, file_path: str, tenant_id: UUID):
    if not os.path.exists(file_path):
        print(f"❌ ファイルが見つかりません: {file_path}")
        return

    print(f"📖 ファイルを読み込んでいます: {file_path}")
    
    # 会社名でグルーピング
    companies = defaultdict(list)
    
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader) # Skip header
        
        # Header mapping check (Visual check of provided CSV)
        # 0: 会社名, 1: 部署名, 2: 役職, 3: 姓, 4: 名, 5: e-mail
        # 6: 郵便番号, 7: 住所, 8: TEL会社, 12: 携帯電話, 13: URL, 14: 名刺交換日
        
        for row in reader:
            if not row or len(row) < 1:
                continue
            
            company_name = row[0].strip()
            if not company_name:
                # 会社名がない場合はスキップ、または「個人」として扱う？
                # 今回は会社名がない行（例: 行102, 105など）がある。
                # 会社名が空で氏名がある場合、「個人事業主」などの扱いにするか、氏名を会社名にするか。
                if row[3] or row[4]: # 姓または名がある
                    company_name = f"{row[3]} {row[4]} (個人)"
                else:
                    continue

            companies[company_name].append(row)

    print(f"📊 抽出された企業数: {len(companies)} 社")
    
    processed_count = 0
    new_count = 0
    updated_count = 0

    for company_name, rows in companies.items():
        # 代表的な情報を取得（最初の行を使用、ただし住所などは埋まっているものを優先したいが今回はシンプルに）
        # 住所等の情報はユニークなものを収集
        main_address = ""
        postal_code = ""
        url = ""
        
        pk_contacts = []
        
        for row in rows:
            # 住所等の統合
            if not main_address and row[7]: main_address = row[7]
            if not postal_code and row[6]: postal_code = row[6]
            if not url and row[13]: url = row[13]
            
            # 連絡先情報の構築
            contact = {
                "last_name": row[3],
                "first_name": row[4],
                "department": row[1],
                "position": row[2],
                "email": row[5],
                "phone_company": row[8],
                "phone_dept": row[9],
                "phone_direct": row[10],
                "mobile": row[12],
                "fax": row[11],
                "exchange_date": row[14],
                "source": "Eight"
            }
            pk_contacts.append(contact)

        # DBチェック (名前で検索)
        stmt = select(Organization).where(
            Organization.tenant_id == tenant_id,
            Organization.name == company_name
        )
        result = await db.execute(stmt)
        org = result.scalar_one_or_none()

        prefecture = get_prefecture(main_address)
        
        contact_info_data = {
            "source": "Eight",
            "imported_at": datetime.now().isoformat(),
            "contacts": pk_contacts,
            "url": url
        }
        
        address_data = {
            "postal_code": postal_code,
            "address_line1": main_address,
            "prefecture": prefecture
        }

        if org:
            # 更新（既存のコンタクトにマージするのは複雑なので、今回は上書きまたは追加）
            # ここではシンプルに情報をアップデートする戦略をとります
            org.contact_info = contact_info_data # JSON全体を更新
            org.address = address_data
            org.prefecture = prefecture
            if url: org.contact_info['url'] = url # Keep existing structure if any
            updated_count += 1
        else:
            # 新規作成
            org = Organization(
                tenant_id=tenant_id,
                name=company_name,
                org_type='client_company', # デフォルトはクライアント企業
                business_division='dispatch', # デフォルト
                contact_info=contact_info_data,
                address=address_data,
                prefecture=prefecture,
                region="未設定" # 必要に応じて
            )
            db.add(org)
            new_count += 1
        
        processed_count += 1

    await db.commit()
    print(f"✅ 処理完了")
    print(f"   新規作成: {new_count} 件")
    print(f"   更新: {updated_count} 件")

async def main():
    print("🚀 Eightデータインポートを開始します...")
    
    if not DB_URL:
        print("❌ DATABASE_URLが設定されていません")
        return

    async with SessionLocal() as db:
        # DB接続チェック
        try:
            await db.execute(text("SELECT 1"))
        except Exception as e:
            print(f"❌ DB接続エラー: {e}")
            return

        tenant_id = await get_or_create_tenant(db)
        
        file_path = "Eight20260108153943utf8.csv"
        await import_eight_csv(db, file_path, tenant_id)

if __name__ == "__main__":
    asyncio.run(main())
