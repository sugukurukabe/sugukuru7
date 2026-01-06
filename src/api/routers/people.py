from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from src.api.database import get_db
from src.api.models.person import Person
from src.api.schemas.person import PersonRead, PersonCreate

router = APIRouter()

@router.get("/", response_model=List[PersonRead])
async def list_people(db: AsyncSession = Depends(get_db)):
    """
    人材一覧を取得します。
    """
    result = await db.execute(select(Person).where(Person.deleted_at == None))
    return result.scalars().all()

@router.post("/", response_model=PersonRead)
async def create_person(person_in: PersonCreate, db: AsyncSession = Depends(get_db)):
    """
    新しい人材を登録します。
    """
    db_person = Person(**person_in.model_dump())
    db.add(db_person)
    await db.commit()
    await db.refresh(db_person)
    return db_person
