from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from src.api.schemas.common import BaseSchema

class WorkSchedule(BaseModel):
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    breakMinutes: Optional[int] = 0
    holidays: List[str] = []

class OvertimeConfig(BaseModel):
    maxPerDay: Optional[int] = 0
    maxPerWeek: Optional[int] = 0
    maxPerMonth: Optional[int] = 0
    holidayWork: bool = False

class Accommodation(BaseModel):
    housing: str = "none" # 'company', 'sugukuru', 'none'
    transportation: bool = False
    benefits: List[str] = []

class Supervisor(BaseModel):
    commander: Optional[str] = None
    complaintHandler: Optional[str] = None

class DealBase(BaseModel):
    dealName: str = Field(alias="deal_name")
    clientName: Optional[str] = Field(None, alias="client_name")
    contractCategory: str = Field(alias="contract_category")
    status: str = "lead"
    probability: int = 0
    requiredHeadcount: int = Field(1, alias="required_headcount")
    salesRepId: Optional[UUID] = Field(None, alias="sales_rep_id")

    class Config:
        allow_population_by_field_name = True

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    dealName: Optional[str] = Field(None, alias="deal_name")
    status: Optional[str] = None
    probability: Optional[int] = None
    notes: Optional[str] = None

class DealInBoard(BaseModel):
    dealId: UUID = Field(alias="deal_id")
    dealNumber: Optional[str] = Field(None, alias="deal_number")
    dealName: str = Field(alias="deal_name")
    clientName: Optional[str] = Field(None, alias="client_name")
    contractCategory: str = Field(alias="contract_category")
    requiredHeadcount: int = Field(alias="required_headcount")
    expectedStartDate: Optional[date] = Field(None, alias="expected_start_date")
    probability: int
    salesRepName: Optional[str] = Field(None, alias="sales_rep_name")
    updatedAt: datetime = Field(alias="updated_at")

    class Config:
        allow_population_by_field_name = True
        orm_mode = True

class KanbanColumn(BaseModel):
    status: str
    statusName: str
    color: str
    deals: List[DealInBoard]
    totalCount: int
    totalValue: int = 0 # Placeholder if needed

class KanbanBoardResponse(BaseModel):
    columns: List[KanbanColumn]
    summary: Dict[str, Any]

class DealActivityCreate(BaseModel):
    activity_type: str
    description: str
    outcome: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None

class DealActivityRead(BaseModel):
    activityId: UUID = Field(alias="activity_id")
    activityType: str = Field(alias="activity_type")
    activityDate: datetime = Field(alias="activity_date")
    description: str
    outcome: Optional[str] = None
    performedByName: Optional[str] = Field(None, alias="performed_by_name")

    class Config:
        allow_population_by_field_name = True
        orm_mode = True
