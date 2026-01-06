from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
from src.api.schemas.common import BaseSchema, TimestampSchema

class OrganizationBase(BaseModel):
    name: str
    name_kana: Optional[str] = None
    name_short: Optional[str] = None
    org_type: str  # ENUM
    region: Optional[str] = None
    prefecture: str = "鹿児島県"

class OrganizationCreate(OrganizationBase):
    tenant_id: UUID
    corporate_number: Optional[str] = None
    contact_info: dict = {}
    address: dict = {}
    billing_config: dict = {}

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    name_kana: Optional[str] = None
    name_short: Optional[str] = None
    contact_info: Optional[dict] = None
    address: Optional[dict] = None
    billing_config: Optional[dict] = None

class OrganizationRead(OrganizationBase, TimestampSchema):
    org_id: UUID
    corporate_number: Optional[str] = None

class OrganizationAliasBase(BaseModel):
    alias_name: str
    source: Optional[str] = None

class OrganizationAliasRead(OrganizationAliasBase):
    alias_id: UUID
    org_id: UUID

    model_config = ConfigDict(from_attributes=True)
