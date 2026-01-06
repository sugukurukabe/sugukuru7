"""
企業名正規化サービス

CSVからインポートされる企業名の表記ゆれを吸収し、統一されたorg_idを返します。

対応パターン:
- "派遣-スグクル(株)" → "スグクル株式会社"
- "片平-派遣" → "(有)片平農産"  
- "(株)芝原" / "芝原-派遣" / "(株)芝原, 芝原-派遣" → "(株)芝原"
- "スグクル(株)-委託" → "スグクル株式会社"
"""
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.models.organization import Organization, OrganizationAlias
from uuid import UUID
import re
import logging

logger = logging.getLogger(__name__)

class OrganizationNormalizer:
    """
    企業名の正規化サービス
    表記ゆれを解消し、統一された org_id を返します。
    """
    
    # よく使われる企業名のエイリアス（初期データ）
    KNOWN_ALIASES = {
        # スグクル関連
        "派遣-スグクル(株)": "スグクル株式会社",
        "スグクル(株)-委託": "スグクル株式会社",
        "スグクル(株)": "スグクル株式会社",
        
        # 片平農産関連
        "片平-派遣": "(有)片平農産",
        "(有)片平農産": "(有)片平農産",
        
        # 芝原関連
        "芝原-派遣": "(株)芝原",
        "(株)芝原": "(株)芝原",
        
        # 新保農園関連
        "新保農園-派遣": "(株)新保農園",
        "(株)新保農園": "(株)新保農園",
        
        # その他派遣先
        "新口農園-派遣": "新口農園",
        "あずま園-派遣": "あずま園",
        "サングリーン-派遣": "サングリーン",
        "竹下商店-派遣": "竹下商店",
        "くしまアオイファーム-派遣": "くしまアオイファーム",
        "JA物流かごしま-派遣": "JA物流かごしま",
        "ALL農事-派遣": "ALL農事",
        "今隈製茶-派遣": "今隈製茶",
        "南原農園-派遣": "南原農園",
        "榎原秀志-派遣": "榎原秀志",
        "鳥越秀一-派遣": "鳥越秀一",
        "かめい-派遣": "(有)かめい",
        "浦産業-派遣": "浦産業",
        
        # 直接雇用先
        "(有)青山養鶏場": "(有)青山養鶏場",
        "(有)川辺フーズ": "(有)川辺フーズ",
        "(有)かめい": "(有)かめい",
        "(有)東馬場農場": "(有)東馬場農場",
        "WinWin(株)": "WinWin株式会社",
        "開屋本舗(株)": "開屋本舗株式会社",
        "かじや農産(株)": "かじや農産株式会社",
        "(株)SBF": "(株)SBF",
        "(株)松田工業": "(株)松田工業",
        "(株)蒼天産業": "(株)蒼天産業",
        
        # 個人事業主
        "植松裕補": "植松裕補",
        "加藤秀文": "加藤秀文",
        "末吉利也": "末吉利也",
        "谷口理恵": "谷口理恵",
        "市囿庄一": "市囿庄一",
    }
    
    @staticmethod
    def _normalize_company_string(name: str) -> str:
        """
        企業名文字列を正規化
        - 前後の空白削除
        - 派遣接頭辞/接尾辞を除去
        - 株式会社等の表記統一
        """
        if not name:
            return ""
        
        name = name.strip()
        
        # 先頭の "派遣-" を除去
        if name.startswith("派遣-"):
            name = name[3:]
        
        # 末尾の "-派遣" を除去
        if name.endswith("-派遣"):
            name = name[:-3]
        
        # 末尾の "-委託" を除去
        if name.endswith("-委託"):
            name = name[:-3]
        
        return name.strip()
    
    @staticmethod
    async def get_org_id_by_name(db: AsyncSession, name: str, tenant_id: UUID) -> UUID:
        """
        企業名（またはエイリアス名）から org_id を取得します。
        見つからない場合は、新規作成を検討するか、ログを記録します。
        """
        if not name:
            return None
            
        original_name = name.strip()
        normalized_name = OrganizationNormalizer._normalize_company_string(name)
        
        # 0. 既知のエイリアスチェック
        canonical_name = OrganizationNormalizer.KNOWN_ALIASES.get(original_name)
        if not canonical_name:
            canonical_name = OrganizationNormalizer.KNOWN_ALIASES.get(normalized_name)
        
        search_names = [original_name, normalized_name]
        if canonical_name:
            search_names.append(canonical_name)
        
        # 1. 直接一致を確認（organizations テーブル）
        for search_name in search_names:
            if not search_name:
                continue
            stmt = select(Organization).where(
                Organization.name == search_name,
                Organization.tenant_id == tenant_id,
                Organization.deleted_at == None
            )
            result = await db.execute(stmt)
            org = result.scalar_one_or_none()
            if org:
                return org.org_id
            
        # 2. エイリアスでの一致を確認（organization_aliases テーブル）
        for search_name in search_names:
            if not search_name:
                continue
            stmt = select(OrganizationAlias).where(OrganizationAlias.alias_name == search_name)
            result = await db.execute(stmt)
            alias = result.scalar_one_or_none()
            if alias:
                return alias.org_id
        
        # 3. 部分一致検索（LIKE）
        like_pattern = f"%{normalized_name}%"
        stmt = select(Organization).where(
            Organization.name.ilike(like_pattern),
            Organization.tenant_id == tenant_id,
            Organization.deleted_at == None
        ).limit(1)
        result = await db.execute(stmt)
        org = result.scalar_one_or_none()
        if org:
            # 見つかった場合、エイリアスも追加
            new_alias = OrganizationAlias(
                org_id=org.org_id,
                alias_name=original_name,
                source="partial_match"
            )
            try:
                db.add(new_alias)
                await db.flush()
            except Exception:
                pass  # 重複エラーは無視
            return org.org_id
            
        # 4. 見つからない場合は新規作成
        final_name = canonical_name or normalized_name or original_name
        logger.info(f"Creating new organization: '{final_name}' (input: '{original_name}')")
        
        # org_type を推測
        org_type = "client_company"  # デフォルト
        
        new_org = Organization(
            tenant_id=tenant_id,
            name=final_name,
            org_type=org_type,
            business_division="dispatch",  # デフォルト
            settings={
                "imported": True, 
                "needs_review": True,
                "original_input": original_name,
            }
        )
        db.add(new_org)
        await db.flush()
        
        # 元の名前をエイリアスとして登録
        if original_name != final_name:
            new_alias = OrganizationAlias(
                org_id=new_org.org_id,
                alias_name=original_name,
                source="auto_generated"
            )
            db.add(new_alias)
        
        return new_org.org_id

    @classmethod
    async def register_alias(cls, db: AsyncSession, org_id: UUID, alias_name: str, source: str = "manual") -> bool:
        """
        新しいエイリアスを登録します
        """
        try:
            new_alias = OrganizationAlias(
                org_id=org_id,
                alias_name=alias_name,
                source=source
            )
            db.add(new_alias)
            await db.flush()
            return True
        except Exception as e:
            logger.error(f"Failed to register alias '{alias_name}': {e}")
            return False

    @classmethod
    async def get_all_aliases(cls, db: AsyncSession, org_id: UUID) -> list:
        """
        組織に紐づく全てのエイリアスを取得
        """
        stmt = select(OrganizationAlias).where(OrganizationAlias.org_id == org_id)
        result = await db.execute(stmt)
        return result.scalars().all()
