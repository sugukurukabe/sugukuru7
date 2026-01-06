from sqlalchemy import Column, String, JSON, DateTime, func, ForeignKey, Date, Numeric, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class DailyOperation(Base):
    """
    日次稼働記録モデル
    誰が、いつ、どこで、何時間働いたかの実績。
    """
    __tablename__ = "daily_operations"

    operation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    operation_date = Column(Date, nullable=False)
    
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.assignment_id"), nullable=False)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=False)
    client_org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=False)
    
    worked_hours = Column(Numeric(4, 2), default=8.0)
    overtime_hours = Column(Numeric(4, 2), default=0.0)
    is_holiday_work = Column(Boolean, default=False)
    
    hourly_rate = Column(Integer, nullable=False)
    
    # 物理テーブルのカラムとして定義（DB側でGENERATED ALWAYS ASされるが、SQLAlchemyでも定義が必要）
    base_revenue = Column(Integer)
    overtime_revenue = Column(Integer)
    total_revenue = Column(Integer)
    
    status = Column(String(20), default="planned")  # 'planned', 'confirmed', etc.
    notes = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # リレーション
    # (省略可)

class DailyRevenueSummary(Base):
    """
    日次売上サマリーモデル
    地域別・企業別の集計結果を保持します。
    """
    __tablename__ = "daily_revenue_summary"

    summary_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    summary_date = Column(Date, nullable=False)
    
    region = Column(String(50))
    client_org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=True)
    
    worker_count = Column(Integer, default=0)
    total_hours = Column(Numeric(8, 2), default=0.0)
    total_revenue = Column(Integer, default=0)
    
    breakdown = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
