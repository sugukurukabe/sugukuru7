from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from typing import List, Dict, Any
from uuid import UUID

from src.api.database import get_db
from src.api.models.dispatch import DispatchSlot, SimulationSession
from src.api.models.organization import Organization
from src.api.models.person import Person
from src.api.schemas.dispatch import (
    DispatchGridResponse, ClientDispatchRow, DaySlot, WorkerSlot, 
    DispatchSummary, AvailableWorker, SimulationSessionCreate, SimulationSessionRead
)

router = APIRouter()

@router.get("/slots", response_model=DispatchGridResponse)
async def get_dispatch_grid(
    week_start: date,
    db: AsyncSession = Depends(get_db)
):
    """
    指定された週の派遣配置グリッド（企業×曜日）を取得します。
    """
    week_end = week_start + timedelta(days=6)
    
    # 1. 派遣事業の全企業を取得
    org_stmt = select(Organization).where(
        Organization.business_division == 'dispatch',
        Organization.deleted_at == None
    )
    orgs_result = await db.execute(org_stmt)
    orgs = orgs_result.scalars().all()
    
    # 2. その週のスロット（実データ）を取得
    slot_stmt = select(DispatchSlot, Person).join(
        Person, DispatchSlot.person_id == Person.person_id, isouter=True
    ).where(
        DispatchSlot.week_start == week_start,
        DispatchSlot.is_simulation == False
    )
    slots_result = await db.execute(slot_stmt)
    slots_rows = slots_result.all()

    # 3. グリッドの組み立て
    client_rows = []
    total_assigned = 0
    total_required = 0
    
    for org in orgs:
        required = org.settings.get("required_workers", 1) if org.settings else 1
        total_required += (required * 7)
        
        day_slots = {}
        for i in range(7):
            curr_date = week_start + timedelta(days=i)
            date_str = curr_date.isoformat()
            
            # この日のこの企業のワーカーを集計
            workers = []
            for slot, person in slots_rows:
                if slot.client_org_id == org.org_id and slot.slot_date == curr_date:
                    if person:
                        workers.append(WorkerSlot(
                            personId=person.person_id,
                            name=person.names.get("full_name", "Unknown"),
                            slotId=slot.slot_id
                        ))
                    total_assigned += 1
            
            count = len(workers)
            status = "fulfilled" if count >= required else "partial" if count > 0 else "shortage"
            
            day_slots[date_str] = DaySlot(
                workers=workers,
                count=count,
                required=required,
                status=status
            )
            
        client_rows.append(ClientDispatchRow(
            clientOrgId=org.org_id,
            clientName=org.name,
            region=org.region,
            businessDivision="dispatch",
            requiredWorkers=required,
            slots=day_slots
        ))

    return DispatchGridResponse(
        weekStart=week_start,
        weekEnd=week_end,
        clients=client_rows,
        summary=DispatchSummary(
            totalRequired=total_required,
            totalAssigned=total_assigned,
            fulfillmentRate=round((total_assigned / total_required * 100), 1) if total_required > 0 else 0
        )
    )

@router.get("/available-workers", response_model=List[AvailableWorker])
async def get_available_workers(
    week_start: date,
    db: AsyncSession = Depends(get_db)
):
    """
    特定の週にどこにも配置されていない人材リストを返します。
    """
    # 1. すべての人材を取得
    person_stmt = select(Person).where(Person.deleted_at == None)
    people = (await db.execute(person_stmt)).scalars().all()
    
    # 2. その週に配置済みの人材IDを取得
    assigned_stmt = select(DispatchSlot.person_id).where(
        DispatchSlot.week_start == week_start,
        DispatchSlot.person_id != None
    )
    assigned_ids = (await db.execute(assigned_stmt)).scalars().all()
    assigned_ids_set = set(assigned_ids)
    
    available = []
    for p in people:
        if p.person_id not in assigned_ids_set:
            available.append(AvailableWorker(
                personId=p.person_id,
                name=p.names.get("full_name", "Unknown"),
                nationality=p.demographics.get("nationality") if p.demographics else None,
                availableFrom=None # 実際には雇用開始日などを参照
            ))
            
    return available

@router.post("/simulations", response_model=SimulationSessionRead)
async def create_simulation(
    session_in: SimulationSessionCreate,
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    新しいシミュレーションセッションを開始します。
    """
    new_session = SimulationSession(
        tenant_id=tenant_id,
        session_name=session_in.session_name,
        base_date=date.today(),
        start_week=session_in.week_start,
        end_week=session_in.week_start + timedelta(days=6),
        status="draft"
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    return SimulationSessionRead(
        sessionId=new_session.session_id,
        sessionName=new_session.session_name,
        weekStart=new_session.start_week,
        status=new_session.status
    )
