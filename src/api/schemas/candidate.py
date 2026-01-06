from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from src.api.schemas.common import BaseSchema

class CandidateInSearch(BaseModel):
    personId: UUID = Field(alias="person_id")
    fullName: str = Field(alias="full_name")
    fullNameKana: Optional[str] = Field(None, alias="full_name_kana")
    nationality: str
    nationalityName: str = Field(alias="nationality_name")
    age: Optional[int] = None
    
    visaType: Optional[str] = Field(None, alias="visa_type")
    visaTypeName: Optional[str] = Field(None, alias="visa_type_name")
    visaValidUntil: Optional[date] = Field(None, alias="visa_valid_until")
    daysUntilVisaExpiry: Optional[int] = Field(None, alias="days_until_visa_expiry")
    
    availability: str # 'available', 'ending_soon', 'assigned'
    availabilityLabel: str = Field(alias="availability_label")
    availableFrom: Optional[date] = Field(None, alias="available_from")
    
    skills: List[str] = []
    skillLabels: List[str] = Field([], alias="skill_labels")
    
    preferredRegions: List[str] = Field([], alias="preferred_regions")
    preferredRegionLabels: List[str] = Field([], alias="preferred_region_labels")
    
    expectedHourlyRate: Optional[int] = Field(None, alias="expected_hourly_rate")
    
    photoUrl: Optional[str] = Field(None, alias="photo_url")
    phone: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class FilterOption(BaseModel):
    value: str
    label: str
    count: int

class CandidateSearchFilters(BaseModel):
    availabilities: List[FilterOption]
    nationalities: List[FilterOption]
    visaTypes: List[FilterOption]
    skills: List[FilterOption]

    model_config = ConfigDict(populate_by_name=True)

class CandidateSearchResponse(BaseModel):
    total: int
    results: List[CandidateInSearch]
    filters: CandidateSearchFilters

class DealProposalCreate(BaseModel):
    deal_id: UUID
    notes: Optional[str] = None

class DealProposalRead(BaseModel):
    proposalId: UUID = Field(alias="proposal_id")
    dealId: UUID = Field(alias="deal_id")
    dealName: str = Field(alias="deal_name")
    personId: UUID = Field(alias="person_id")
    personName: str = Field(alias="person_name")
    proposedByName: str = Field(alias="proposed_by_name")
    proposedAt: datetime = Field(alias="proposed_at")
    status: str
    notes: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
