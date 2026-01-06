from sqlalchemy import Column, String, JSON, DateTime, func, ForeignKey, Date, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class DispatchSlot(Base):
    """
    派遣スロットモデル
    週別の配置グリッドにおける個別の枠を管理します。
    """
    __tablename__ = "dispatch_slots"

    slot_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    slot_date = Column(Date, nullable=False)
    
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.assignment_id"), nullable=True)
    client_org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=True)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=True)
    
    slot_status = Column(String(20), default="planned")  # 'planned', 'confirmed', etc.
    
    # シミュレーション用
    is_simulation = Column(Boolean, default=False)
    simulation_session_id = Column(UUID(as_uuid=True), ForeignKey("simulation_sessions.session_id"), nullable=True)
    
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SimulationSession(Base):
    """
    シミュレーションセッションモデル
    配置変更のプレビュー用。
    """
    __tablename__ = "simulation_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    session_name = Column(String(255))
    base_date = Column(Date, nullable=False)
    start_week = Column(Date, nullable=False)
    end_week = Column(Date, nullable=False)
    
    status = Column(String(20), default="draft")  # 'draft', 'applied', 'discarded'
    changes_summary = Column(JSON, default={})
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
class ImmigrationNotice(Base):
    """
    入管届出モデル
    """
    __tablename__ = "immigration_notices"

    notice_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=False)
    
    notice_type = Column(String(50), nullable=False)
    event_date = Column(Date, nullable=False)
    deadline = Column(Date, nullable=False)
    status = Column(String(20), default="pending")
    
    generated_file_path = Column(String)
    generated_at = Column(DateTime(timezone=True))
    submitted_at = Column(DateTime(timezone=True))
    submission_method = Column(String(50))
    receipt_number = Column(String(100))
    rejection_reason = Column(String)
    retry_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class GeneratedDocument(Base):
    """
    生成書類モデル
    """
    __tablename__ = "generated_documents"

    document_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=True)
    employment_id = Column(UUID(as_uuid=True), ForeignKey("employments.employment_id"), nullable=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.assignment_id"), nullable=True)
    notice_id = Column(UUID(as_uuid=True), ForeignKey("immigration_notices.notice_id"), nullable=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.deal_id"), nullable=True)
    
    document_type = Column(String(50), nullable=False)
    template_used = Column(String(100))
    file_path = Column(String, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer)
    mime_type = Column(String(100))
    
    status = Column(String(20), default="generated")
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    downloaded_at = Column(DateTime(timezone=True))
    
    generation_params = Column(JSON)
    error_message = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
