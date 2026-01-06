from sqlalchemy import Column, String, DateTime, func, ForeignKey, Date, Boolean, Integer, ARRAY, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class VisaRecord(Base):
    """
    在留資格履歴モデル
    本人の現在の在留資格および過去の履歴を管理します。
    """
    __tablename__ = "visa_records"

    visa_record_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=False)
    
    visa_type = Column(
        Enum('tokutei_gino_1', 'tokutei_gino_2', 'tokkatsu', 'gino_jisshu_1', 'gino_jisshu_2', 'gino_jisshu_3', 'engineer_specialist', 'skilled_labor', 'designated_activities', 'student', 'dependent', 'permanent_resident', 'overseas_waiting', 'other', name='visa_type'), 
        nullable=False
    )
    resident_card_number = Column(String(20))
    
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=False)
    
    resident_card_file_ids = Column(ARRAY(String))  # Slack File IDs
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # リレーション
    person = relationship("Person", back_populates="visa_records")

class VisaCase(Base):
    """
    ビザ申請案件モデル
    Slackの「ビザ申請依頼リスト」に対応する、個別の申請プロセス管理。
    """
    __tablename__ = "visa_cases"

    case_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    case_number = Column(String(50), unique=True)
    
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=False)
    client_org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=True)
    client_name_raw = Column(String(255))
    
    case_type = Column(
        Enum('new_dispatch', 'new_direct', 'change_a', 'change_b', 'renewal_dispatch', 'renewal_direct', 'renewal_subcontract', 'zuitoji_dispatch', 'zuitoji_termination', 'notification', name='visa_case_type'), 
        nullable=False
    )
    target_visa_type = Column(
        Enum('tokutei_gino_1', 'tokutei_gino_2', 'tokkatsu', 'gino_jisshu_1', 'gino_jisshu_2', 'gino_jisshu_3', 'engineer_specialist', 'skilled_labor', 'designated_activities', 'student', 'dependent', 'permanent_resident', 'overseas_waiting', 'other', name='visa_type')
    )
    contract_type = Column(String(50))
    
    employment_start_date = Column(Date)
    employment_end_date = Column(Date)
    deadline = Column(Date)
    
    status_tags = Column(ARRAY(String))  # ['申請準備中', '署名返信待ち']
    is_completed = Column(Boolean, default=False)
    priority = Column(Integer, default=2)
    
    requested_by_email = Column(String(255))
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    drive_folder_url = Column(String)
    company_docs_file_id = Column(String(100))
    
    notes = Column(String)
    
    slack_list_row_id = Column(String(100))
    slack_synced_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # リレーション
    person = relationship("Person", back_populates="visa_cases")
