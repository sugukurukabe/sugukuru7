from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import Optional, List
from src.api.schemas.common import BaseSchema

class DailyOperationBase(BaseModel):
    operation_date: date
    assignment_id: UUID
    person_id: UUID
    client_org_id: UUID
    worked_hours: float = 8.0
    overtime_hours: float = 0.0
    status: str = "planned"

class DailyOperationCreate(DailyOperationBase):
    tenant_id: UUID
    hourly_rate: int

class DailyOperationRead(DailyOperationBase):
    operation_id: UUID
    total_revenue: int

class RevenueWorkerDetail(BaseModel):
    person_id: UUID
    name: str
    hours: float
    overtime: float
    revenue: int

class DailyRevenueResult(BaseModel):
    client_org_id: UUID
    date: date
    worker_count: int
    total_hours: float
    total_revenue: int
    workers: List[RevenueWorkerDetail]

class DailySummary(BaseModel):
    totalWorkers: int
    totalRevenue: int
    totalHours: float

class ClientSummary(BaseModel):
    org_id: UUID
    name: str
    workerCount: int
    totalRevenue: int

class RegionSummary(BaseModel):
    region: str
    totalRevenue: int
    clients: List[ClientSummary]

class DivisionSummary(BaseModel):
    division: str
    divisionName: str = "" # Placeholder, will be mapped in router
    workerCount: int
    totalRevenue: int
    totalHours: float
    regions: List[RegionSummary]

class DailyOperationsByDivisionResponse(BaseModel):
    date: date
    summary: DailySummary
    divisions: List[DivisionSummary]
