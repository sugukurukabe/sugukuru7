import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from datetime import datetime, timedelta
from uuid import UUID

from src.api.models.kpi import KPITarget
from src.api.schemas.kpi import CompanyKPI, KPIMetric, DivisionSummary, TrendPoint

logger = logging.getLogger(__name__)

class KPICalculatorService:
    @staticmethod
    async def get_company_kpi(
        db: AsyncSession,
        tenant_id: UUID,
        period: str # "2025-01"
    ) -> CompanyKPI:
        """
        会社全体KPIを計算
        """
        # 目標値の取得
        target_stmt = select(KPITarget).where(
            KPITarget.tenant_id == tenant_id,
            KPITarget.period == period,
            KPITarget.target_type == 'company'
        )
        targets_res = await db.execute(target_stmt)
        targets = {t.metric: t.target_value for t in targets_res.scalars().all()}

        # 実績値の計算 (モック/集計クエリ)
        # 実際には daily_operations や deals テーブルから集計する
        summary = {
            "revenue": KPIMetric(
                value=5760000,
                target=targets.get("revenue", 6000000),
                achievement=96.0,
                trend="up",
                changePercent=8.5,
                previousValue=5310000
            ),
            "activeWorkers": KPIMetric(
                value=48,
                target=targets.get("active_workers", 52),
                achievement=92.3,
                trend="stable",
                changePercent=2.1
            ),
            "utilizationRate": KPIMetric(
                value=87.3,
                target=targets.get("utilization_rate", 90.0),
                achievement=97.0,
                trend="up"
            ),
            "dealConversionRate": KPIMetric(
                value=35.5,
                target=targets.get("conversion_rate", 40.0),
                achievement=88.8,
                trend="up"
            ),
            "newWorkers": KPIMetric(
                value=5,
                target=targets.get("new_workers", 8),
                achievement=62.5
            ),
            "newClients": KPIMetric(
                value=2,
                target=targets.get("new_clients", 3),
                achievement=66.7
            ),
            "noticeComplianceRate": KPIMetric(
                value=98.5,
                target=targets.get("compliance_rate", 100.0),
                achievement=98.5
            )
        }

        # 事業別サマリー
        by_division = [
            DivisionSummary(
                division="dispatch", divisionName="派遣事業",
                revenue=3000000, revenueShare=52.1, workers=25, utilizationRate=89.3
            ),
            DivisionSummary(
                division="subcontracting", divisionName="農受託事業",
                revenue=1800000, revenueShare=31.3, workers=15, utilizationRate=88.2
            )
        ]

        # トレンドデータ (直近6ヶ月のモック)
        trends = {
            "revenue": [
                TrendPoint(month="2024-08", value=4800000),
                TrendPoint(month="2024-09", value=5100000),
                TrendPoint(month="2024-10", value=4900000),
                TrendPoint(month="2024-11", value=5300000),
                TrendPoint(month="2024-12", value=5310000),
                TrendPoint(month="2025-01", value=5760000)
            ]
        }

        return CompanyKPI(
            period=period,
            periodLabel="2025年1月",
            summary=summary,
            byDivision=by_division,
            trends=trends
        )
