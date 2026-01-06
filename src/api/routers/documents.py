from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from src.api.database import get_db
from src.api.models.dispatch import GeneratedDocument
from src.api.services.document_storage import DocumentStorageService
from src.api.services.document_checklist import DocumentChecklistService

router = APIRouter()

@router.post("/upload")
async def upload_document(
    person_id: UUID = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """書類アップロード"""
    storage_service = DocumentStorageService()
    tenant_id = UUID("00000000-0000-0000-0000-000000000001") # Dummy
    
    content = await file.read()
    file_path = await storage_service.upload(
        content, file.filename, tenant_id, person_id, doc_type
    )
    
    doc = GeneratedDocument(
        tenant_id=tenant_id,
        person_id=person_id,
        document_type=doc_type,
        file_path=file_path,
        file_name=file.filename,
        file_size_bytes=len(content),
        mime_type=file.content_type,
        status="generated"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    return doc

@router.get("/by-person/{person_id}")
async def get_person_documents(
    person_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """人材別の書類一覧を取得"""
    # 実際にはクエリを投げる
    return {"personId": person_id, "documents": []}

@router.get("/checklist/{person_id}")
async def get_checklist(
    person_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """必要書類チェックリストを取得"""
    return await DocumentChecklistService.get_checklist(db, person_id)
