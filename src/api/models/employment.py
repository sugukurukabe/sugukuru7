from sqlalchemy import Column, String, DateTime, func, ForeignKey, Date, Integer, Boolean, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class Employment(Base):
    """
    雇用モデル
    人と雇用主（正規組織）の関係を管理します。
    """
    __tablename__ = "employments"

    employment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=False)
    employer_org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=False)
    
    employment_type = Column(
        Enum('staff', 'dispatch', 'contract', 'trainee', 'ssw1', 'ssw2', 'intern', name='employment_type'), 
        nullable=False
    )
    contract_category = Column(Enum('labor_dispatch', 'subcontracting', 'recruitment', 'temp_to_perm', name='contract_category'))
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    
    salary_type = Column(String(20))
    salary_amount = Column(Integer)
    
    social_insurance_date = Column(Date)
    
    status = Column(Enum('active', 'inactive', 'pending', 'terminated', name='employment_status'), default="active")
    acceptance_difficulty_flag = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # リレーション
    person = relationship("Person", back_populates="employments")
    assignments = relationship("Assignment", back_populates="employment")

class Assignment(Base):
    """
    派遣配置モデル
    雇用されている人材がどのクライアント企業（派遣先）にいるかを管理します。
    """
    __tablename__ = "assignments"

    assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    employment_id = Column(UUID(as_uuid=True), ForeignKey("employments.employment_id"), nullable=False)
    client_org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=False)
    
    site_name = Column(String(255))
    site_address = Column(JSONB)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    
    hourly_rate = Column(Integer)
    hourly_rate_with_license = Column(Integer)
    standard_hours_per_day = Column(Numeric(4, 2), default=8.0)
    
    status = Column(Enum('planned', 'active', 'completed', 'cancelled', name='assignment_status'), default="planned")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # リレーション
    employment = relationship("Employment", back_populates="assignments")
