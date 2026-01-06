from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.config import settings

def create_app() -> FastAPI:
    """
    FastAPI アプリケーションの初期化と設定
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS 設定
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # ルーターの登録
    from src.api.routers import health, organizations, people, operations, imports, dispatch, deals, candidates, notices, kpi, documents
    app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
    app.include_router(organizations.router, prefix=f"{settings.API_V1_STR}/organizations", tags=["Organizations"])
    app.include_router(people.router, prefix=f"{settings.API_V1_STR}/people", tags=["People"])
    app.include_router(operations.router, prefix=f"{settings.API_V1_STR}/operations", tags=["Operations"])
    app.include_router(imports.router, prefix=f"{settings.API_V1_STR}/imports", tags=["Imports"])
    app.include_router(dispatch.router, prefix=f"{settings.API_V1_STR}/dispatch", tags=["Dispatch"])
    app.include_router(deals.router, prefix=f"{settings.API_V1_STR}/deals", tags=["Deals"])
    app.include_router(candidates.router, prefix=f"{settings.API_V1_STR}/candidates", tags=["Candidates"])
    app.include_router(notices.router, prefix=f"{settings.API_V1_STR}/notices", tags=["Immigration"])
    app.include_router(kpi.router, prefix=f"{settings.API_V1_STR}/kpi", tags=["KPI"])
    app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])

    @app.get("/")
    async def root():
        """
        ルートエンドポイント
        """
        return {"message": f"Welcome to {settings.PROJECT_NAME}"}

    return app

app = create_app()
