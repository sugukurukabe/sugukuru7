from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from src.api.config import settings

# 非同期エンジンの作成
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # 開発時はSQLログを出力
    future=True
)

# 非同期セッションファクトリの作成
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    """
    SQLAlchemy モデルのベースクラス
    """
    pass

async def get_db():
    """
    FastAPI 依存関係注入用のデータベースセッション取得関数
    """
    async with SessionLocal() as session:
        yield session
