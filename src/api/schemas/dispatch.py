from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import Optional, List, Dict
from src.api.schemas.common import BaseSchema

class WorkerSlot(BaseModel):
    personId: UUID
    name: str
    slotId: UUID

class DaySlot(BaseModel):
    workers: List[WorkerSlot]
    count: int
    required: int
    status: str  # 'fulfilled' | 'partial' | 'shortage'

class ClientDispatchRow(BaseModel):
    clientOrgId: UUID
    clientName: str
    region: Optional[str]
    businessDivision: str
    requiredWorkers: int
    slots: Dict[str, DaySlot]  # ISO date string -> DaySlot

class DispatchSummary(BaseModel):
    totalRequired: int
    totalAssigned: int
    fulfillmentRate: float

class DispatchGridResponse(BaseModel):
    weekStart: date
    weekEnd: date
    clients: List[ClientDispatchRow]
    summary: DispatchSummary

class AvailableWorker(BaseModel):
    personId: UUID
    name: str
    nationality: Optional[str]
    availableFrom: Optional[date]
    skills: List[str] = []

class SimulationChange(BaseModel):
    action: str  # 'add' | 'remove' | 'move'
    personId: UUID
    personName: str
    fromClientId: Optional[UUID] = None
    toClientId: Optional[UUID] = None
    date: date

class SimulationSessionCreate(BaseModel):
    session_name: str
    week_start: date

class SimulationSessionRead(BaseModel):
    sessionId: UUID
    sessionName: str
    weekStart: date
    status: str
    changes: List[SimulationChange] = []
