import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from src.api.models.employment import Assignment
from src.api.models.dispatch import ImmigrationNotice

logger = logging.getLogger(__name__)

class EventDetectorService:
    @staticmethod
    async def detect_assignment_changes(db: AsyncSession, hours_back: int = 24):
        """
        指定時間内に発生した派遣先変更（新着Assignment）を検知します。
        実際には created_at または履歴テーブルで判断。
        """
        since = datetime.now() - timedelta(hours=hours_back)
        
        # 新しく作成された Assignment を検索
        stmt = select(Assignment).where(Assignment.created_at >= since)
        result = await db.execute(stmt)
        new_assignments = result.scalars().all()
        
        # TODO: 既存の Assignment と比較して「変更」かどうかを判定するロジック
        # ここでは簡略化のため、新規 Assignment すべてを検知対象とするプロトタイプ
        return new_assignments

    @staticmethod
    async def get_upcoming_deadlines(db: AsyncSession, days_limit: int = 14):
        """
        期限が近い届出を取得します。
        """
        # ImmigrationNotice.deadline が now + days_limit 以内のものを検索
        # TODO: Implement once schema is migrated
        return []
