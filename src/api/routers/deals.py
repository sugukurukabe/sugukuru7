from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from src.api.database import get_db
from src.api.models.deal import Deal, DealActivity
from src.api.models.person import User
from src.api.schemas.deal import (
    DealInBoard, KanbanBoardResponse, KanbanColumn, 
    DealActivityCreate, DealActivityRead, DealUpdate
)

router = APIRouter()

DEAL_STATUS_CONFIG = {
    "lead": {"name": "リード", "color": "#94a3b8"},
    "qualification": {"name": "ヒアリング", "color": "#60a5fa"},
    "proposal": {"name": "提案中", "color": "#fbbf24"},
    "negotiation": {"name": "交渉中", "color": "#f97316"},
    "won": {"name": "成約", "color": "#22c55e"},
    "lost": {"name": "失注", "color": "#ef4444"},
    "on_hold": {"name": "保留", "color": "#a855f7"}
}

@router.get("/board", response_model=KanbanBoardResponse)
async def get_deals_board(
    db: AsyncSession = Depends(get_db)
):
    """
    カンバンボード用の商談データを取得します。
    """
    # 1. 商談と担当者名を取得
    stmt = (
        select(Deal, User.name)
        .join(User, Deal.sales_rep_id == User.user_id, isouter=True)
        .where(Deal.deleted_at == None)
    )
    result = await db.execute(stmt)
    rows = result.all()

    # 2. ステータス別にグループ化
    board_data = {status: [] for status in DEAL_STATUS_CONFIG.keys()}
    for deal, rep_name in rows:
        if deal.status in board_data:
            board_data[deal.status].append(DealInBoard(
                deal_id=deal.deal_id,
                deal_number=deal.deal_number,
                deal_name=deal.deal_name,
                client_name=deal.client_name,
                contract_category=deal.contract_category,
                required_headcount=deal.required_headcount,
                expected_start_date=deal.expected_start_date,
                probability=deal.probability,
                sales_rep_name=rep_name,
                updated_at=deal.updated_at
            ))

    # 3. カラムの組み立て
    columns = []
    for status, cfg in DEAL_STATUS_CONFIG.items():
        deals = board_data[status]
        columns.append(KanbanColumn(
            status=status,
            statusName=cfg["name"],
            color=cfg["color"],
            deals=deals,
            totalCount=len(deals)
        ))

    # 4. サマリー計算 (モック的)
    summary = {
        "totalDeals": len(rows),
        "totalValue": 0, # 金額カラムがあれば集計
        "wonThisMonth": sum(1 for d, _ in rows if d.status == 'won'),
        "conversionRate": 35.5 # デモ値
    }

    return KanbanBoardResponse(columns=columns, summary=summary)

@router.patch("/{deal_id}/status")
async def update_deal_status(
    deal_id: UUID,
    status_in: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """
    商談ステータスを更新し、活動ログを記録します。
    """
    new_status = status_in.get("status")
    probability = status_in.get("probability", 0)
    
    if new_status not in DEAL_STATUS_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid status")

    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    old_status = deal.status
    deal.status = new_status
    deal.probability = probability
    deal.updated_at = datetime.now()

    # 活動ログの自動追加
    activity = DealActivity(
        deal_id=deal_id,
        activity_type="status_change",
        description=f"ステータス変更: {DEAL_STATUS_CONFIG.get(old_status, {}).get('name', old_status)} -> {DEAL_STATUS_CONFIG[new_status]['name']}",
        old_status=old_status,
        new_status=new_status
    )
    db.add(activity)
    
    await db.commit()
    return {"status": "success"}

@router.get("/{deal_id}/activities", response_model=List[DealActivityRead])
async def get_deal_activities(
    deal_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    商談の活動履歴を取得します。
    """
    stmt = (
        select(DealActivity, User.name)
        .join(User, DealActivity.performed_by == User.user_id, isouter=True)
        .where(DealActivity.deal_id == deal_id)
        .order_by(DealActivity.activity_date.desc())
    )
    result = await db.execute(stmt)
    return [
        DealActivityRead(
            activity_id=act.activity_id,
            activity_type=act.activity_type,
            activity_date=act.activity_date,
            description=act.description,
            outcome=act.outcome,
            performed_by_name=uname
        )
        for act, uname in result.all()
    ]

@router.post("/sync-shoudana")
async def sync_shoudana_puri(
    tenant_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    ショウダナプリ（Google Sheets）からの同期を実行します。
    """
    from src.api.services.shoudana_sync import ShoudanaSyncService
    
    # 実際には Google Sheets API からデータを取得する
    # ここではデモ用の空データで呼び出し
    sheet_data = [] 
    count = await ShoudanaSyncService.sync_from_sheets(db, tenant_id, sheet_data)
    
    return {"status": "success", "syncedCount": count}
