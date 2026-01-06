from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.database import get_db
from src.api.services.slack_list_importer import SlackListImporter
from src.api.services.smarthr_importer import SmartHRImporter
from uuid import UUID
from typing import Dict, Any

router = APIRouter()

@router.post("/slack-hr-list")
async def import_slack_hr_list(
    tenant_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    人材管理リスト鹿児島.csv をインポートします。
    """
    content = (await file.read()).decode("utf-8")
    result = await SlackListImporter.import_staff_list(db, content, tenant_id)
    return result

@router.post("/slack-visa-list")
async def import_slack_visa_list(
    tenant_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    ビザ申請依頼リスト.csv をインポートします。
    """
    content = (await file.read()).decode("utf-8")
    result = await SlackListImporter.import_visa_list(db, content, tenant_id)
    return result

@router.post("/smarthr")
async def import_smarthr(
    tenant_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    SmartHR CSV をインポートします。
    """
    content = (await file.read()).decode("utf-8")
    result = await SmartHRImporter.import_csv(db, content, tenant_id)
    return result
