from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List
from datetime import date
from src.api.schemas.common import BaseSchema, TimestampSchema

class PersonBase(BaseModel):
    names: dict = Field(..., description="full_name, legal_last, etc.")
    demographics: dict = {}
    contact_info: dict = {}
    current_status: str = "monitoring"

class PersonCreate(PersonBase):
    tenant_id: UUID
    assigned_to: Optional[UUID] = None
    smarthr_crew_id: Optional[str] = None

class PersonUpdate(BaseModel):
    names: Optional[dict] = None
    demographics: Optional[dict] = None
    contact_info: Optional[dict] = None
    current_status: Optional[str] = None
    assigned_to: Optional[UUID] = None

class PersonRead(PersonBase, TimestampSchema):
    person_id: UUID
    assigned_to: Optional[UUID] = None
