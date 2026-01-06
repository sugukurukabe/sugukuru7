"""
SmartHRからのCSVインポートサービス

SmartHR_crews_*.csv のフォーマット:
社員番号,姓,名,部署1 部署,役職1 役職,雇用形態,入社年月日,生年月日
"""
import csv
import io
import json
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.models.person import Person

logger = logging.getLogger(__name__)

class SmartHRImporter:
    """
    SmartHRからのCSVインポートサービス
    """
    
    # 雇用形態マッピング
    EMPLOYMENT_TYPE_MAP = {
        '正社員': 'seishain',
        '役員': 'executive',
        '契約社員': 'contract',
        '派遣社員': 'dispatch',
        '派遣雇用': 'dispatch',
        'パート': 'part_time',
        'アルバイト': 'part_time',
        '業務委託': 'subcontract',
        '業務委託雇用': 'subcontract',
        'その他': 'other',
        '': 'other',
        None: 'other',
    }
    
    # 部署マッピング (事業区分に変換)
    DEPARTMENT_MAP = {
        '農業派遣事業部': 'dispatch',
        '畜産派遣事業部': 'dispatch',
        '顧客・サービス開発部門': 'it',
        '総務部門': 'support',
        '': 'dispatch',
        None: 'dispatch',
    }

    @staticmethod
    def _parse_date(date_str: str) -> Optional[date]:
        """日付文字列をパース（複数フォーマット対応）"""
        if not date_str or not date_str.strip() or date_str == '""':
            return None
        
        date_str = date_str.strip().strip('"')
        
        formats = [
            '%Y/%m/%d',
            '%Y-%m-%d',
            '%Y年%m月%d日',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        return None

    @staticmethod
    def _normalize_name(last_name: str, first_name: str) -> str:
        """名前を正規化（全角スペース、半角スペースで統一）"""
        last = (last_name or "").strip()
        first = (first_name or "").strip()
        
        # 全角スペースを半角に統一
        last = last.replace("　", " ")
        first = first.replace("　", " ")
        
        if last and first:
            return f"{last} {first}"
        return last or first

    @classmethod
    async def import_csv(cls, db: AsyncSession, csv_content: str, tenant_id: UUID) -> Dict[str, Any]:
        """
        SmartHR 従業員CSV をインポートします
        
        今回のCSVヘッダー:
        社員番号,姓,名,部署1 部署,役職1 役職,雇用形態,入社年月日,生年月日
        """
        # BOM付UTF-8対策
        if csv_content.startswith('\ufeff'):
            csv_content = csv_content[1:]
            
        reader = csv.DictReader(io.StringIO(csv_content))
        success_count = 0
        update_count = 0
        skip_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            try:
                # 基本情報取得
                crew_id = row.get("社員番号", "").strip()
                last_name = row.get("姓", "").strip()
                first_name = row.get("名", "").strip()
                full_name = cls._normalize_name(last_name, first_name)
                
                # 空行スキップ
                if not full_name:
                    skip_count += 1
                    continue

                # マッピング適用
                department = row.get("部署1 部署", "")
                position = row.get("役職1 役職", "")
                employment_type_raw = row.get("雇用形態", "")
                employment_type = cls.EMPLOYMENT_TYPE_MAP.get(employment_type_raw, "other")
                business_division = cls.DEPARTMENT_MAP.get(department, "dispatch")
                
                # 日付パース
                birth_date = cls._parse_date(row.get("生年月日"))
                hire_date = cls._parse_date(row.get("入社年月日"))
                
                # names JSONB
                names_json = {
                    "full_name": full_name,
                    "last_name": last_name,
                    "first_name": first_name,
                }
                
                # demographics JSONB
                demographics_json = {}
                if birth_date:
                    demographics_json["birth_date"] = birth_date.isoformat()
                
                # contact_info JSONB (SmartHRにメール等があれば)
                contact_info_json = {}
                
                # 追加情報 (SmartHR固有)
                smarthr_meta = {
                    "department": department,
                    "position": position,
                    "employment_type": employment_type_raw,
                    "hire_date": hire_date.isoformat() if hire_date else None,
                    "imported_at": datetime.now().isoformat(),
                }

                # UPSERT: 社員番号でマッチング優先、なければ名前でマッチング
                sql = text("""
                    INSERT INTO people (
                        tenant_id, names, demographics, contact_info,
                        current_status, smarthr_crew_id, smarthr_sync_at, updated_at
                    ) VALUES (
                        :tenant_id, :names, :demographics, :contact_info,
                        'monitoring', :smarthr_crew_id, NOW(), NOW()
                    )
                    ON CONFLICT (tenant_id, (names->>'full_name'))
                    DO UPDATE SET
                        smarthr_crew_id = COALESCE(EXCLUDED.smarthr_crew_id, people.smarthr_crew_id),
                        demographics = people.demographics || EXCLUDED.demographics,
                        smarthr_sync_at = NOW(),
                        updated_at = NOW()
                    RETURNING (xmax = 0) as inserted
                """)
                
                result = await db.execute(sql, {
                    "tenant_id": tenant_id,
                    "names": json.dumps(names_json, ensure_ascii=False),
                    "demographics": json.dumps(demographics_json, ensure_ascii=False),
                    "contact_info": json.dumps(contact_info_json, ensure_ascii=False),
                    "smarthr_crew_id": crew_id if crew_id else None,
                })
                
                row_result = result.fetchone()
                if row_result and row_result.inserted:
                    success_count += 1
                else:
                    update_count += 1

            except Exception as e:
                logger.error(f"Error importing SmartHR row {row_num} ({full_name}): {e}")
                errors.append(f"Row {row_num} ({full_name}): {str(e)}")
                skip_count += 1

        await db.commit()
        
        return {
            "success_count": success_count,
            "update_count": update_count,
            "skip_count": skip_count,
            "errors": errors,
            "total_processed": success_count + update_count + skip_count
        }

    @classmethod
    async def merge_with_slack_data(cls, db: AsyncSession, tenant_id: UUID) -> Dict[str, Any]:
        """
        SmartHRデータとSlackリストデータをマージ
        名前の部分一致でマッチングを試みる
        """
        # SmartHR側のデータ取得
        stmt = select(Person).where(
            Person.tenant_id == tenant_id,
            Person.smarthr_crew_id.isnot(None)
        )
        result = await db.execute(stmt)
        smarthr_people = result.scalars().all()
        
        merge_count = 0
        conflict_count = 0
        
        for person in smarthr_people:
            smarthr_name = person.names.get("full_name", "")
            
            # Slack側で同名を探す（SmartHR未連携のもの）
            slack_stmt = select(Person).where(
                Person.tenant_id == tenant_id,
                Person.names.op('->>')('full_name') == smarthr_name,
                Person.smarthr_crew_id.is_(None),
                Person.person_id != person.person_id
            )
            slack_result = await db.execute(slack_stmt)
            slack_person = slack_result.scalar_one_or_none()
            
            if slack_person:
                # マージ処理（Slack側の追加情報をSmartHR側にコピー）
                logger.info(f"Merging {smarthr_name}: SmartHR {person.person_id} <- Slack {slack_person.person_id}")
                
                # 在留資格などの情報をマージ
                # TODO: 実際のマージロジックはビジネス要件に応じて実装
                merge_count += 1
        
        return {
            "merge_count": merge_count,
            "conflict_count": conflict_count
        }
