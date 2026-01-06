import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from uuid import UUID

from src.api.models.deal import Deal
# Google Sheets API client would be used here. For now, we implement the mapping logic.

logger = logging.getLogger(__name__)

class ShoudanaSyncService:
    @staticmethod
    async def sync_from_sheets(db: AsyncSession, tenant_id: UUID, sheet_data: List[Dict[str, Any]]):
        """
        ショウダナプリ（Google Sheets）の行データをDBに同期します。
        """
        sync_count = 0
        for row in sheet_data:
            row_id = row.get("shoudana_row_id") # ユニークの行ID
            if not row_id: continue

            # 既存の商談があるか確認
            stmt = select(Deal).where(Deal.shoudana_row_id == row_id, Deal.tenant_id == tenant_id)
            result = await db.execute(stmt)
            deal = result.scalar_one_or_none()

            if not deal:
                deal = Deal(
                    tenant_id=tenant_id,
                    shoudana_row_id=row_id,
                    status="lead", # 初期ステータス
                )
                db.add(deal)

            # フィールドのマッピング
            deal.client_name = row.get("派遣先事業所名")
            deal.client_name_kana = row.get("カナ")
            deal.client_address = row.get("所在地")
            deal.client_phone = row.get("電話番号")
            deal.deal_name = f"{deal.client_name} 案件"
            
            # 契約種類マッピング
            contract_map = {
                "労働者派遣": "labor_dispatch",
                "業務委託": "subcontracting",
                "有料職業紹介": "recruitment",
                "紹介予定派遣": "temp_to_perm"
            }
            deal.contract_category = contract_map.get(row.get("契約種類"), "labor_dispatch")
            
            deal.job_description = row.get("仕事内容")
            deal.required_headcount = int(row.get("募集人数", 1))
            deal.hourly_rate_no_license = int(row.get("免許なし単価", 0))
            deal.hourly_rate_with_license = int(row.get("免許持ち単価", 0))
            deal.sugukuru_manager_name = row.get("派遣元責任者")
            
            # JSONB データの構築
            deal.work_schedule = {
                "startTime": row.get("勤務開始"),
                "endTime": row.get("勤務終了"),
                "holidays": row.get("休日", "").split(",") if row.get("休日") else []
            }
            
            deal.accommodation = {
                "housing": "none",
                "transportation": "送迎" in (row.get("便宜供与") or ""),
                "benefits": (row.get("便宜供与") or "").split(",")
            }
            
            deal.shoudana_synced_at = datetime.now()
            deal.updated_at = datetime.now()
            sync_count += 1

        await db.commit()
        return sync_count
