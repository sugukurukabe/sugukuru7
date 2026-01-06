from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.models.organization import Organization, OrganizationAlias
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

class OrganizationNormalizer:
    """
    企業名の正規化サービス
    表記ゆれを解消し、統一された org_id を返します。
    """
    
    @staticmethod
    async def get_org_id_by_name(db: AsyncSession, name: str, tenant_id: UUID) -> UUID:
        """
        企業名（またはエイリアス名）から org_id を取得します。
        見つからない場合は、新規作成を検討するか、ログを記録します。
        """
        if not name:
            return None
            
        name = name.strip()
        
        # 1. 直接一致を確認（organizations テーブル）
        stmt = select(Organization).where(
            Organization.name == name,
            Organization.tenant_id == tenant_id,
            Organization.deleted_at == None
        )
        result = await db.execute(stmt)
        org = result.scalar_one_or_none()
        if org:
            return org.org_id
            
        # 2. エイリアスでの一致を確認（organization_aliases テーブル）
        # alias_name は UNIQUE 制約があるため、tenant_id で絞らなくても一意
        stmt = select(OrganizationAlias).where(OrganizationAlias.alias_name == name)
        result = await db.execute(stmt)
        alias = result.scalar_one_or_none()
        if alias:
            return alias.org_id
            
        # 3. 見つからない場合は新規作成（暫定対応）
        # ※ 実運用では、管理者の承認フローや突き合わせが必要。
        logger.warning(f"Organization not found: '{name}'. Creating a new entry.")
        new_org = Organization(
            tenant_id=tenant_id,
            name=name,
            org_type="client_company",  # デフォルト
            settings={"imported": True, "needs_review": True}
        )
        db.add(new_org)
        await db.flush()  # IDを確定させる
        
        # 将来のためにエイリアスも登録
        new_alias = OrganizationAlias(
            org_id=new_org.org_id,
            alias_name=name,
            source="auto_generated"
        )
        db.add(new_alias)
        
        return new_org.org_id
