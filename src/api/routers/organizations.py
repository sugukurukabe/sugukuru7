from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from src.api.database import get_db
from src.api.models.organization import Organization
from src.api.schemas.organization import OrganizationRead, OrganizationCreate

router = APIRouter()

@router.get("/", response_model=List[OrganizationRead])
async def list_organizations(db: AsyncSession = Depends(get_db)):
    """
    組織一覧を取得します。
    """
    result = await db.execute(select(Organization).where(Organization.deleted_at == None))
    return result.scalars().all()

@router.post("/", response_model=OrganizationRead)
async def create_organization(org_in: OrganizationCreate, db: AsyncSession = Depends(get_db)):
    """
    新しい組織を作成します。
    """
    db_org = Organization(**org_in.model_dump())
    db.add(db_org)
    await db.commit()
    await db.refresh(db_org)
    return db_org
