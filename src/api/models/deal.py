from sqlalchemy import Column, String, Integer, JSON, DateTime, func, ForeignKey, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class Deal(Base):
    """
    商談モデル
    ショウダナプリからの同期データおよび営業ステータスを管理します。
    """
    __tablename__ = "deals"

    deal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    deal_number = Column(String(50), unique=True)
    deal_name = Column(String(255), nullable=False)
    
    # 顧客情報
    client_org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=True)
    client_name = Column(String(255))
    client_name_kana = Column(String(255))
    client_address = Column(String)
    client_phone = Column(String(50))
    
    # 契約条件
    contract_category = Column(String(50), nullable=False) # Enum as String for flexibility: 'labor_dispatch', etc.
    job_description = Column(String)
    
    # 期間
    expected_start_date = Column(Date)
    expected_end_date = Column(Date)
    
    # 勤務条件 (JSONB)
    work_schedule = Column(JSONB, server_default='{}')
    overtime_config = Column(JSONB, server_default='{}')
    
    # 募集条件
    required_headcount = Column(Integer, default=1)
    filled_headcount = Column(Integer, default=0)
    hourly_rate_no_license = Column(Integer)
    hourly_rate_with_license = Column(Integer)
    
    # 責任者 (JSONB)
    supervisor = Column(JSONB, server_default='{}')
    sugukuru_manager_name = Column(String(100))
    
    # 福利厚生 (JSONB)
    accommodation = Column(JSONB, server_default='{}')
    
    # ステータス
    status = Column(String(50), default="lead") # 'lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'
    probability = Column(Integer, default=0)
    
    # 担当
    sales_rep_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    notes = Column(String)
    
    # ショウダナプリ連携
    shoudana_row_id = Column(Integer)
    shoudana_synced_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))

    # Relationships
    activities = relationship("DealActivity", back_populates="deal", order_by="DealActivity.activity_date.desc()")

class DealActivity(Base):
    """
    商談活動ログモデル
    商談ごとのタイムラインを記録します。
    """
    __tablename__ = "deal_activities"

    activity_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.deal_id"), nullable=False)
    
    activity_type = Column(String(50), nullable=False) # 'call', 'visit', 'email', 'proposal', 'negotiation', 'status_change'
    activity_date = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(String)
    outcome = Column(String(255))
    next_action = Column(String(255))
    next_action_date = Column(Date)
    
    old_status = Column(String(50))
    new_status = Column(String(50))
    
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    deal = relationship("Deal", back_populates="activities")
