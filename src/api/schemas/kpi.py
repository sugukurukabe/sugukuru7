from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID

class KPIMetric(BaseModel):
    value: float
    target: Optional[float] = None
    achievement: Optional[float] = None
    trend: Optional[str] = None # 'up', 'down', 'stable'
    changePercent: Optional[float] = None
    previousValue: Optional[float] = None

class TrendPoint(BaseModel):
    month: str
    value: float

class DivisionSummary(BaseModel):
    division: str
    divisionName: str
    revenue: float
    revenueShare: float
    workers: int
    utilizationRate: float

class CompanyKPI(BaseModel):
    period: str
    periodLabel: str
    summary: Dict[str, KPIMetric]
    byDivision: List[DivisionSummary]
    trends: Dict[str, List[TrendPoint]]

class DivisionKPI(BaseModel):
    division: str
    divisionName: str
    icon: str
    metrics: Dict[str, KPIMetric]
    topClients: List[Dict[str, Any]]

class UserKPI(BaseModel):
    userId: UUID
    userName: str
    role: str
    period: str
    metrics: Dict[str, Any]
    deals: Optional[List[Dict[str, Any]]] = None
    ranking: Optional[Dict[str, Any]] = None

class KPITargetCreate(BaseModel):
    target_type: str
    target_entity_id: Optional[str] = None
    metric: str
    period: str
    target_value: float

class KPITargetRead(BaseModel):
    targetId: UUID = Field(alias="target_id")
    targetType: str = Field(alias="target_type")
    metric: str
    period: str
    targetValue: float = Field(alias="target_value")

    class Config:
        allow_population_by_field_name = True
