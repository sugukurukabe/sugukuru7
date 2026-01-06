from sqlalchemy import Column, String, JSON, DateTime, func, ForeignKey, Integer, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from src.api.database import Base

class DealProposal(Base):
    """
    商談への候補者提案モデル
    商談に対して特定の候補者を提案した際の記録。
    """
    __tablename__ = "deal_proposals"

    proposal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.deal_id"), nullable=False)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.person_id"), nullable=False)
    
    proposed_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    proposed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String(20), default="proposed") # proposed, accepted, rejected
    notes = Column(String)

    # Relationships
    deal = relationship("src.api.models.deal.Deal")
    person = relationship("src.api.models.person.Person")
    proposer = relationship("src.api.models.person.User")

    __table_args__ = (
        UniqueConstraint('deal_id', 'person_id', name='uq_deal_person_proposal'),
    )
