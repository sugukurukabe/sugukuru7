from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.database import get_db
from src.api.config import settings
import re

router = APIRouter()

def mask_password(url: str) -> str:
    """URLからパスワードをマスク"""
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:***@', url)

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    システムのヘルスチェックエンドポイント
    DB接続確認も行います。
    """
    db_url_masked = mask_password(settings.DATABASE_URL)
    try:
        # DB接続テスト
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "db_host": db_url_masked.split("@")[-1].split("/")[0] if "@" in db_url_masked else "unknown"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": str(e),
            "db_url": db_url_masked,
            "error_type": type(e).__name__
        }

