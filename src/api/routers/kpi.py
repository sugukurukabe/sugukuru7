from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from uuid import UUID

from src.api.database import get_db
from src.api.models.kpi import KPITarget
from src.api.schemas.kpi import (
    CompanyKPI, DivisionKPI, UserKPI, KPITargetRead, KPITargetCreate
)
from src.api.services.kpi_calculator import KPICalculatorService

router = APIRouter()

@router.get("/company", response_model=CompanyKPI)
async def get_company_kpi(
    period: str = Query("2025-01"),
    db: AsyncSession = Depends(get_db)
):
    """会社全体のKPIを取得"""
    tenant_id = UUID("00000000-0000-0000-0000-000000000001") # Dummy
    return await KPICalculatorService.get_company_kpi(db, tenant_id, period)

@router.get("/by-division", response_model=List[DivisionKPI])
async def get_division_kpi(
    period: str = Query("2025-01"),
    db: AsyncSession = Depends(get_db)
):
    """事業別のKPIを取得"""
    # 実際には CalculatorService で計算
    return []

@router.get("/by-user/{user_id}", response_model=UserKPI)
async def get_user_kpi(
    user_id: UUID,
    period: str = Query("2025-01"),
    db: AsyncSession = Depends(get_db)
):
    """担当者別のKPIを取得"""
    return UserKPI(
        userId=user_id,
        userName="壁",
        role="sales",
        period=period,
        metrics={}
    )

@router.post("/targets", response_model=KPITargetRead)
async def create_target(
    target_in: KPITargetCreate,
    db: AsyncSession = Depends(get_db)
):
    """目標を設定または更新"""
    tenant_id = UUID("00000000-0000-0000-0000-000000000001") # Dummy
    
    target = KPITarget(
        tenant_id=tenant_id,
        **target_in.dict()
    )
    db.add(target)
    await db.commit()
    await db.refresh(target)
    return target
