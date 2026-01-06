from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from src.api.models.dispatch import GeneratedDocument
from src.api.models.visa import VisaRecord

class DocumentChecklistService:
    """必要書類チェックリストサービス"""
    
    REQUIRED_DOCS = {
        "ssw1": [
            {"type": "resident_card", "label": "在留カード", "required": True},
            {"type": "photo", "label": "顔写真", "required": True},
            {"type": "passport", "label": "パスポート", "required": True},
            {"type": "health_checkup", "label": "健康診断書", "required": True, "validity_months": 12},
            {"type": "bank_account", "label": "銀行口座情報", "required": True},
            {"type": "employment_contract", "label": "雇用契約書", "required": True},
            {"type": "support_plan", "label": "支援計画書", "required": True},
        ]
    }
    
    @staticmethod
    async def get_checklist(db: AsyncSession, person_id: UUID, visa_type: str = "ssw1"):
        """人材のチェックリスト状況を取得"""
        # 提出済み書類
        stmt = select(GeneratedDocument).where(GeneratedDocument.person_id == person_id)
        res = await db.execute(stmt)
        submitted_docs = {d.document_type: d for d in res.scalars().all()}
        
        requirements = DocumentChecklistService.REQUIRED_DOCS.get(visa_type, [])
        checklist = []
        submitted_count = 0
        required_count = 0
        
        for req in requirements:
            doc_type = req["type"]
            is_required = req["required"]
            if is_required: required_count += 1
            
            doc = submitted_docs.get(doc_type)
            status = "missing"
            if doc:
                status = "submitted"
                if is_required: submitted_count += 1
                # TODO: Check expiry
            
            checklist.append({
                "docType": doc_type,
                "docTypeName": req["label"],
                "required": is_required,
                "status": status,
                "document": doc
            })
            
        completion_rate = (submitted_count / required_count * 100) if required_count > 0 else 0
        
        return {
            "personId": person_id,
            "completionRate": completion_rate,
            "checklist": checklist
        }
