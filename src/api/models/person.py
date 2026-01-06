from sqlalchemy import Column, String, DateTime, func, ForeignKey, Integer, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class User(Base):
    """
    内部ユーザーモデル
    システムの管理画面を利用するスタッフ。
    """
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=True)
    
    email = Column(String(255), nullable=False)
    name = Column(String(100))
    name_kana = Column(String(100))
    role = Column(String(50), nullable=False, default="viewer")
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.department_id"), nullable=True)
    
    preferences = Column(JSONB, default={})
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

class Department(Base):
    """
    部署モデル
    テナント内の組織階層を管理します。
    """
    __tablename__ = "departments"

    department_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20))
    parent_department_id = Column(UUID(as_uuid=True), ForeignKey("departments.department_id"), nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Person(Base):
    """
    人材（People）モデル
    SmartHRやSlackから統合された外国人スタッフの情報。
    """
    __tablename__ = "people"

    person_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    names = Column(JSONB, nullable=False)  # full_name, legal_last, etc.
    demographics = Column(JSONB, default={})  # birth_date, gender, nationality
    contact_info = Column(JSONB, default={})  # email, phone, address
    
    # インポート用の直接カラム（019マイグレーションで追加）
    nationality = Column(String(50))  # 国籍 (indonesia, vietnam, etc.)
    date_of_birth = Column(DateTime)  # 生年月日
    current_visa_type = Column(String(50))  # 現在の在留資格
    visa_expiry_date = Column(DateTime)  # 在留期限
    
    current_status = Column(
        Enum('monitoring', 'applying', 'preparing', 'received', 'lost', 'resigned', 'resigned_planned', 'overseas_waiting', name='person_status'), 
        default="monitoring"
    )
    current_status_notes = Column(String)
    
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    smarthr_crew_id = Column(String(100))
    smarthr_sync_at = Column(DateTime(timezone=True))
    slack_hr_list_id = Column(String(100))
    slack_visa_list_id = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # リレーション
    employments = relationship("Employment", back_populates="person")
    visa_records = relationship("VisaRecord", back_populates="person")
    visa_cases = relationship("VisaCase", back_populates="person")
