import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text, func
from datetime import datetime, date, timedelta
from uuid import UUID

from src.api.schemas.candidate import CandidateInSearch, FilterOption, CandidateSearchFilters

logger = logging.getLogger(__name__)

class CandidateSearchService:
    @staticmethod
    async def search_candidates(
        db: AsyncSession,
        tenant_id: UUID,
        availability: Optional[List[str]] = None,
        visa_types: Optional[List[str]] = None,
        nationalities: Optional[List[str]] = None,
        skills: Optional[List[str]] = None,
        regions: Optional[List[str]] = None,
        min_hourly_rate: Optional[int] = None,
        max_hourly_rate: Optional[int] = None,
        keyword: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        v_candidate_search ビューを使用して候補者を検索します。
        """
        # 1. 検索クエリの構築
        # v_candidate_search は SQLAlchemy モデルではないため、text() または Table 経由で実行可能
        # ここでは柔軟性と速度のため、SQL式を使用
        
        query = text("""
            SELECT 
                person_id, full_name, last_kana, first_kana, nationality, 
                current_status, visa_type, visa_expiry, employment_status, phone,
                skills_json, regions_json, expected_hourly_rate
            FROM v_candidate_search
            WHERE tenant_id = :tenant_id
        """)
        
        # フィルタの適用
        params = {"tenant_id": tenant_id}
        where_clauses = ["tenant_id = :tenant_id"]
        
        if visa_types:
            where_clauses.append("visa_type = ANY(:visa_types)")
            params["visa_types"] = visa_types
            
        if nationalities:
            where_clauses.append("nationality = ANY(:nationalities)")
            params["nationalities"] = nationalities
            
        if keyword:
            where_clauses.append("(full_name ILIKE :kw OR last_kana ILIKE :kw)")
            params["kw"] = f"%{keyword}%"
            
        if skills:
            skill_conditions = []
            for i, s in enumerate(skills):
                p_name = f"skill_{i}"
                skill_conditions.append(f"skills_json ? :{p_name}")
                params[p_name] = s
            where_clauses.append(f"({' OR '.join(skill_conditions)})")

        # 最終的なクエリ構築
        where_str = " AND ".join(where_clauses)
        sql = f"SELECT * FROM v_candidate_search WHERE {where_str} LIMIT :limit OFFSET :offset"
        count_sql = f"SELECT COUNT(*) FROM v_candidate_search WHERE {where_str}"
        
        params["limit"] = limit
        params["offset"] = offset
        
        result = await db.execute(text(sql), params)
        rows = result.all()
        
        count_params = {k: v for k, v in params.items() if k not in ["limit", "offset"]}
        total_result = await db.execute(text(count_sql), count_params)
        total = total_result.scalar() or 0

        # 2. 結果のマッピング
        results = []
        for row in rows:
            # 空き状況の計算 (モック的ロジック)
            # 実際には現在の配置(assignments)テーブルと突き合わせて計算する
            days_to_expiry = None
            if row.visa_expiry:
                expiry_dt = datetime.combine(row.visa_expiry, datetime.min.time())
                days_to_expiry = (expiry_dt - datetime.now()).days

            avail_status = "available"
            if row.current_status == "assigned":
                avail_status = "assigned"
            elif row.current_status == "ending_soon": # 仮
                avail_status = "ending_soon"

            results.append(CandidateInSearch(
                person_id=row.person_id,
                full_name=row.full_name,
                full_name_kana=f"{row.last_kana or ''} {row.first_kana or ''}".strip() or None,
                nationality=row.nationality or "unknown",
                nationality_name=CandidateSearchService.get_nationality_name(row.nationality),
                age=25, # デモ用固定
                visa_type=row.visa_type,
                visa_type_name=row.visa_type, # 変換テーブルが必要
                visa_valid_until=row.visa_expiry,
                days_until_visa_expiry=days_to_expiry,
                availability=avail_status,
                availability_label="即日可" if avail_status == "available" else "配置中",
                available_from=date.today() if avail_status == "available" else None,
                skills=row.skills_json or [],
                skill_labels=row.skills_json or [], # TODO: マッピング
                preferred_regions=row.regions_json or [],
                preferred_region_labels=row.regions_json or [],
                expected_hourly_rate=row.expected_hourly_rate,
                phone=row.phone
            ))

        # 3. フィルタオプションの構築 (本来は集計クエリを投げる)
        filters = CandidateSearchFilters(
            availabilities=[
                FilterOption(value="available", label="即日可", count=45),
                FilterOption(value="ending_soon", label="まもなく空き", count=23),
            ],
            nationalities=[
                FilterOption(value="vietnam", label="ベトナム", count=78),
                FilterOption(value="indonesia", label="インドネシア", count=52),
            ],
            visaTypes=[
                FilterOption(value="ssw1", label="特定技能1号", count=120),
            ],
            skills=[
                FilterOption(value="forklift", label="フォークリフト", count=34),
            ]
        )

        return {
            "total": total,
            "results": results,
            "filters": filters
        }

    @staticmethod
    def get_nationality_name(code: str) -> str:
        mapping = {
            "vietnam": "ベトナム",
            "indonesia": "インドネシア",
            "philippines": "フィリピン",
            "myanmar": "ミャンマー",
            "china": "中国"
        }
        return mapping.get(code, "その他")

    @staticmethod
    async def get_candidate_detail(
        db: AsyncSession,
        tenant_id: UUID,
        person_id: UUID
    ) -> Optional[CandidateInSearch]:
        """
        特定の候補者の詳細情報を取得します。
        """
        sql = text("""
            SELECT * FROM v_candidate_search 
            WHERE tenant_id = :tenant_id AND person_id = :person_id
        """)
        
        result = await db.execute(sql, {"tenant_id": tenant_id, "person_id": person_id})
        row = result.first()
        
        if not row:
            return None

        # 日付パース
        days_to_expiry = None
        if row.visa_expiry:
            expiry_dt = datetime.combine(row.visa_expiry, datetime.min.time())
            days_to_expiry = (expiry_dt - datetime.now()).days

        avail_status = "available"
        if row.current_status == "assigned":
            avail_status = "assigned"
        elif row.current_status == "ending_soon":
            avail_status = "ending_soon"

        return CandidateInSearch(
            person_id=row.person_id,
            full_name=row.full_name,
            full_name_kana=f"{row.last_kana or ''} {row.first_kana or ''}".strip() or None,
            nationality=row.nationality or "unknown",
            nationality_name=CandidateSearchService.get_nationality_name(row.nationality),
            age=25,
            visa_type=row.visa_type,
            visa_type_name=row.visa_type,
            visa_valid_until=row.visa_expiry,
            days_until_visa_expiry=days_to_expiry,
            availability=avail_status,
            availability_label="即日可" if avail_status == "available" else "配置中",
            available_from=date.today() if avail_status == "available" else None,
            skills=row.skills_json or [],
            skill_labels=row.skills_json or [],
            preferred_regions=row.regions_json or [],
            preferred_region_labels=row.regions_json or [],
            expected_hourly_rate=row.expected_hourly_rate,
            phone=row.phone
        )
