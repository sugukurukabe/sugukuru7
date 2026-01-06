from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class BaseSchema(BaseModel):
    """
    全てのスキーマのベースクラス
    SQLAlchemy モデルとの親和性を高める設定。
    """
    model_config = ConfigDict(from_attributes=True)

class IDSchema(BaseSchema):
    """
    IDのみを返す基本的なスキーマ
    """
    id: UUID

class TimestampSchema(BaseSchema):
    """
    作成・更新日時を含むスキーマ
    """
    created_at: datetime
    updated_at: Optional[datetime] = None
