from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from src.api.database import get_db
from src.api.models.person import Person
from src.api.schemas.person import PersonRead, PersonCreate, PersonUpdate

router = APIRouter()

@router.get("/", response_model=List[PersonRead])
async def list_people(db: AsyncSession = Depends(get_db)):
    """
    人材一覧を取得します。
    """
    result = await db.execute(select(Person).where(Person.deleted_at == None))
    return result.scalars().all()

@router.get("/{person_id}", response_model=PersonRead)
async def get_person(person_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    人材の詳細を取得します。
    """
    result = await db.execute(
        select(Person).where(Person.person_id == person_id, Person.deleted_at == None)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person

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

@router.put("/{person_id}", response_model=PersonRead)
async def update_person(
    person_id: UUID, 
    person_in: PersonUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """
    人材情報を更新します。
    """
    result = await db.execute(
        select(Person).where(Person.person_id == person_id, Person.deleted_at == None)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # 更新データを適用
    update_data = person_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(person, key, value)
    
    await db.commit()
    await db.refresh(person)
    return person

@router.delete("/{person_id}")
async def delete_person(person_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    人材を論理削除します。
    """
    from datetime import datetime
    
    result = await db.execute(
        select(Person).where(Person.person_id == person_id, Person.deleted_at == None)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    person.deleted_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Person deleted successfully"}
