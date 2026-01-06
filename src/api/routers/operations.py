from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List
from uuid import UUID

from src.api.database import get_db
from src.api.models.operation import DailyOperation
from src.api.models.organization import Organization
from src.api.models.person import Person
from src.api.schemas.operation import (
    DailyOperationRead, DailyRevenueResult, RevenueWorkerDetail,
    DailyOperationsByDivisionResponse, DailySummary, DivisionSummary, RegionSummary, ClientSummary
)

router = APIRouter()

DIVISION_LABELS = {
    "dispatch": "派遣事業",
    "subcontracting": "農受託事業",
    "support": "登録支援事業",
    "it": "IT事業"
}

@router.get("/daily/by-division", response_model=DailyOperationsByDivisionResponse)
async def get_daily_revenue_by_division(
    operation_date: date,
    db: AsyncSession = Depends(get_db)
):
    """
    事業区分別の日次売上サマリーを取得します。
    """
    # 全ての稼働データと組織情報を取得
    stmt = (
        select(DailyOperation, Organization)
        .join(Organization, DailyOperation.client_org_id == Organization.org_id)
        .where(DailyOperation.operation_date == operation_date)
    )
    result = await db.execute(stmt)
    rows = result.all()

    summary = DailySummary(totalWorkers=0, totalRevenue=0, totalHours=0.0)
    division_data = {} # division -> { workers: set, revenue, hours, regions: { region -> { revenue, clients: { org_id -> { name, workers: set, revenue } } } } }

    for op, org in rows:
        div = org.business_division
        reg = org.region or "不明"
        rev = int(op.total_revenue) if op.total_revenue else 0
        hrs = float(op.worked_hours)
        
        # 全体合計
        summary.totalRevenue += rev
        summary.totalHours += hrs
        # workerCount は後で len(set) で計算するため、ここでは個別の ID を集める必要あり
        # (簡単のため、ここでは行数を worker 数とするか、後の処理で集計)

        if div not in division_data:
            division_data[div] = {
                "workers": set(),
                "revenue": 0,
                "hours": 0.0,
                "regions": {}
            }
        
        d = division_data[div]
        d["workers"].add(op.person_id)
        d["revenue"] += rev
        d["hours"] += hrs
        
        if reg not in d["regions"]:
            d["regions"][reg] = {"revenue": 0, "clients": {}}
        
        r = d["regions"][reg]
        r["revenue"] += rev
        
        if org.org_id not in r["clients"]:
            r["clients"][org.org_id] = {"name": org.name, "workers": set(), "revenue": 0}
        
        c = r["clients"][org.org_id]
        c["workers"].add(op.person_id)
        c["revenue"] += rev

    # Pydantic モデルへの変換
    all_workers = set()
    divisions = []
    for div_id, d in division_data.items():
        all_workers.update(d["workers"])
        
        regions = []
        for reg_name, r in d["regions"].items():
            clients = [
                ClientSummary(
                    org_id=oid,
                    name=c["name"],
                    workerCount=len(c["workers"]),
                    totalRevenue=c["revenue"]
                )
                for oid, c in r["clients"].items()
            ]
            regions.append(RegionSummary(
                region=reg_name,
                totalRevenue=r["revenue"],
                clients=clients
            ))
            
        divisions.append(DivisionSummary(
            division=div_id,
            divisionName=DIVISION_LABELS.get(div_id, div_id),
            workerCount=len(d["workers"]),
            totalRevenue=d["revenue"],
            totalHours=d["hours"],
            regions=regions
        ))

    summary.totalWorkers = len(all_workers)

    return DailyOperationsByDivisionResponse(
        date=operation_date,
        summary=summary,
        divisions=divisions
    )

@router.get("/daily", response_model=DailyRevenueResult)
async def get_daily_revenue(
    client_org_id: UUID,
    operation_date: date,
    db: AsyncSession = Depends(get_db)
):
    """
    指定された企業・日付の日次売上を計算して返します。
    
    計算ロジック:
    - 基本売上 = 時間単価 × 稼働時間
    - 残業売上 = 時間単価 × 残業時間 × 1.25
    """
    # 企業の単価設定を取得
    org_result = await db.execute(select(Organization).where(Organization.org_id == client_org_id))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # その日の稼働データを取得
    # 注意: 本来は関係テーブルをjoinして名前などを取得する
    ops_result = await db.execute(
        select(DailyOperation, Person)
        .join(Person, DailyOperation.person_id == Person.person_id)
        .where(
            DailyOperation.client_org_id == client_org_id,
            DailyOperation.operation_date == operation_date
        )
    )
    
    workers = []
    total_revenue = 0
    total_hours = 0
    
    for op, person in ops_result:
        # op.total_revenue は DB の GENERATED ALWAYS AS で計算されるが
        # ここではビジネスロジックとして再確認（またはDBの値を信頼して使用）
        rev = int(op.total_revenue) if op.total_revenue else 0
        total_revenue += rev
        total_hours += float(op.worked_hours)
        
        workers.append(RevenueWorkerDetail(
            person_id=person.person_id,
            name=person.names.get("full_name", "Unknown"),
            hours=float(op.worked_hours),
            overtime=float(op.overtime_hours),
            revenue=rev
        ))

    return DailyRevenueResult(
        client_org_id=client_org_id,
        date=operation_date,
        worker_count=len(workers),
        total_hours=total_hours,
        total_revenue=total_revenue,
        workers=workers
    )
