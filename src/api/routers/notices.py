from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import os
from uuid import UUID
from typing import List, Dict, Any

from src.api.database import get_db
from src.api.models.dispatch import ImmigrationNotice
from src.api.services.document_generator import DocumentGeneratorService

router = APIRouter()

@router.get("/")
async def list_notices(
    status: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """届出一覧を取得"""
    # TODO: Implement filtering and actual model fields
    return []

@router.post("/generate")
async def generate_notice(
    data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """
    手動で届出書類を生成します。
    """
    notice_type = data.get("notice_type")
    person_id = UUID(data.get("person_id"))
    
    if notice_type == "zuitoji_dispatch_change":
        old_id = UUID(data["old_assignment_id"]) if data.get("old_assignment_id") else None
        new_id = UUID(data["new_assignment_id"])
        
        path, filename = await DocumentGeneratorService.generate_zuitoji_dispatch_change(
            db, person_id, old_id, new_id
        )
        return {"status": "success", "filePath": path, "fileName": filename}
    
    raise HTTPException(status_code=400, detail="Unsupported notice type")

@router.get("/{notice_id}/download")
async def download_notice(
    notice_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """生成されたファイルをダウンロード"""
    # 本来は generated_documents テーブルからパスを取得する
    # デモ用に固定パスの例
    file_path = f"storage/notices/sample.xlsx"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(path=file_path, filename="immigration_notice.xlsx")
