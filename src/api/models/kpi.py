from sqlalchemy import Column, String, JSON, DateTime, func, ForeignKey, Integer, Float, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class KPITarget(Base):
    """
    KPI目標モデル
    """
    __tablename__ = "kpi_targets"

    target_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    target_type = Column(String(20), nullable=False) # 'company', 'division', 'user'
    target_entity_id = Column(String(50)) # 'dispatch', or UUID as string
    
    metric = Column(String(50), nullable=False) # 'revenue', 'active_workers', etc.
    period = Column(String(7), nullable=False) # '2025-01'
    
    target_value = Column(Float, nullable=False)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
