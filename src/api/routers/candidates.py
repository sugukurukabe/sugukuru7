from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from uuid import UUID

from src.api.database import get_db
from src.api.models.candidate import DealProposal
from src.api.models.deal import Deal
from src.api.models.person import Person, User
from src.api.schemas.candidate import CandidateInSearch, CandidateSearchResponse, DealProposalCreate, DealProposalRead
from src.api.services.candidate_search import CandidateSearchService

router = APIRouter()

@router.get("/search", response_model=CandidateSearchResponse, response_model_by_alias=False)
async def search_candidates(
    availability: Optional[List[str]] = Query(None),
    visa_types: Optional[List[str]] = Query(None),
    nationalities: Optional[List[str]] = Query(None),
    skills: Optional[List[str]] = Query(None),
    keyword: Optional[str] = Query(None),
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    候補者を検索します。
    """
    # テナントIDを取得 (デモ用に最初のテナントを使用)
    from src.api.models.tenant import Tenant
    tenant_result = await db.execute(select(Tenant).limit(1))
    tenant = tenant_result.scalar_one_or_none()
    tenant_id = tenant.tenant_id if tenant else UUID("00000000-0000-0000-0000-000000000001")

    res = await CandidateSearchService.search_candidates(
        db, tenant_id, availability, visa_types, nationalities, skills, None, None, None, keyword, limit, offset
    )
    return res

@router.get("/{person_id}", response_model=CandidateInSearch, response_model_by_alias=False)
async def get_candidate_detail(
    person_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    候補者の詳細情報を取得します。
    """
    from src.api.models.tenant import Tenant
    tenant_result = await db.execute(select(Tenant).limit(1))
    tenant = tenant_result.scalar_one_or_none()
    tenant_id = tenant.tenant_id if tenant else UUID("00000000-0000-0000-0000-000000000001")

    res = await CandidateSearchService.get_candidate_detail(db, tenant_id, person_id)
    if not res:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return res

@router.post("/{person_id}/propose")
async def propose_candidate(
    person_id: UUID,
    proposal_in: DealProposalCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    候補者を商談に提案リストとして追加します。
    """
    tenant_id = UUID("00000000-0000-0000-0000-000000000001") # Dummy
    
    # 既存チェック
    stmt = select(DealProposal).where(
        DealProposal.deal_id == proposal_in.deal_id,
        DealProposal.person_id == person_id
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already proposed")

    proposal = DealProposal(
        tenant_id=tenant_id,
        deal_id=proposal_in.deal_id,
        person_id=person_id,
        notes=proposal_in.notes,
        status="proposed"
    )
    db.add(proposal)
    await db.commit()
    
    return {"status": "success"}

@router.get("/proposals", response_model=List[DealProposalRead])
async def get_proposals(
    deal_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    商談に紐づく提案候補者一覧を取得します。
    """
    stmt = (
        select(DealProposal, Deal.deal_name, Person.names, User.name)
        .join(Deal, DealProposal.deal_id == Deal.deal_id)
        .join(Person, DealProposal.person_id == Person.person_id)
        .join(User, DealProposal.proposed_by == User.user_id, isouter=True)
        .where(DealProposal.deal_id == deal_id)
    )
    result = await db.execute(stmt)
    
    proposals = []
    for prop, dname, pnames, uname in result.all():
        proposals.append(DealProposalRead(
            proposal_id=prop.proposal_id,
            deal_id=prop.deal_id,
            deal_name=dname,
            person_id=prop.person_id,
            person_name=pnames.get("full_name", "Unknown"),
            proposed_by_name=uname or "System",
            proposed_at=prop.proposed_at,
            status=prop.status,
            notes=prop.notes
        ))
    
    return proposals
