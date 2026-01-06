from sqlalchemy import Column, String, DateTime, func, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class Organization(Base):
    """
    組織（企業マスタ）モデル
    派遣先企業や委託先企業を管理します。
    """
    __tablename__ = "organizations"

    org_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    # ENUM types from database
    org_type = Column(
        Enum('dispatch_agency', 'client_company', 'support_org', 'rso', 'government', name='org_type'), 
        nullable=False
    )
    business_division = Column(
        Enum('dispatch', 'subcontracting', 'support', 'it', name='business_division'), 
        nullable=False, 
        default="dispatch"
    )
    
    name = Column(String(255), nullable=False)
    name_kana = Column(String(255))
    name_short = Column(String(100))
    corporate_number = Column(String(13))
    
    contact_info = Column(JSONB, default={})
    address = Column(JSONB, default={})
    billing_config = Column(JSONB, default={})
    
    region = Column(String(50))
    prefecture = Column(String(20), default="鹿児島県")
    
    settings = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # リレーション
    aliases = relationship("OrganizationAlias", back_populates="organization")

class OrganizationAlias(Base):
    """
    企業名正規化用エイリアスモデル
    Slackなどからのインポート時に表記ゆれを吸収するために使用します。
    """
    __tablename__ = "organization_aliases"

    alias_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=False)
    alias_name = Column(String(255), nullable=False, unique=True)
    source = Column(String(50))  # 'slack_hr', 'smarthr', etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # リレーション
    organization = relationship("Organization", back_populates="aliases")
