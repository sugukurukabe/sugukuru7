
from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class Billing(Base):
    """
    請求データモデル
    """
    __tablename__ = "billings"

    billing_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    # 請求先情報
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.org_id"), nullable=True)
    client_name = Column(String(255), nullable=False) # 組織マスタになくても保存できるように
    
    # 請求日・対象月
    billing_date = Column(Date, nullable=False)
    target_month = Column(String(7)) # YYYY-MM format
    
    # 金額
    total_amount = Column(Integer, default=0)
    tax_amount = Column(Integer, default=0)
    
    # 明細 (JSONB array structure)
    # [{ "description": "...", "quantity": "...", "unit_price": 1000, "amount": 2000 }]
    items = Column(JSONB, default=[])
    
    status = Column(String(50), default="draft") # draft, sent, paid, overdue
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization")
