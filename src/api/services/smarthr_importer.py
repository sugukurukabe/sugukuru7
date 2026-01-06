import csv
import io
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.models.person import Person

logger = logging.getLogger(__name__)

class SmartHRImporter:
    """
    SmartHRからのCSVインポートサービス
    """
    @staticmethod
    def _parse_date(date_str: str) -> Optional[str]:
        if not date_str:
            return None
        return date_str.replace('/', '-')

    @classmethod
    async def import_csv(cls, db: AsyncSession, csv_content: str, tenant_id: UUID) -> Dict[str, Any]:
        """
        SmartHR 従業員CSV をインポートします
        """
        # BOM付UTF-8対策として、先頭の変な文字を削除
        if csv_content.startswith('\ufeff'):
            csv_content = csv_content[1:]
            
        reader = csv.DictReader(io.StringIO(csv_content))
        success_count = 0
        skip_count = 0
        errors = []

        for row in reader:
            try:
                crew_id = row.get("社員番号")
                last_name = row.get("姓", "")
                first_name = row.get("名", "")
                full_name = f"{last_name} {first_name}".strip()
                
                if not full_name:
                    continue

                # 1. 人材のUPSERT (社員番号 または 名前でマッチング)
                person = None
                if crew_id:
                    stmt = select(Person).where(
                        Person.smarthr_crew_id == crew_id,
                        Person.tenant_id == tenant_id
                    )
                    result = await db.execute(stmt)
                    person = result.scalar_one_or_none()

                if not person:
                    stmt = select(Person).where(
                        Person.names["full_name"].astext == full_name,
                        Person.tenant_id == tenant_id
                    )
                    result = await db.execute(stmt)
                    person = result.scalar_one_or_none()

                if not person:
                    person = Person(
                        tenant_id=tenant_id,
                        names={"full_name": full_name, "last_name": last_name, "first_name": first_name}
                    )
                    db.add(person)
                    await db.flush()

                # 情報更新
                if crew_id:
                    person.smarthr_crew_id = crew_id
                
                demo = person.demographics or {}
                birthday = row.get("生年月日")
                if birthday:
                    demo["birthday"] = cls._parse_date(birthday)
                person.demographics = demo
                person.smarthr_sync_at = datetime.now()

                success_count += 1

            except Exception as e:
                await db.rollback()
                logger.error(f"Error importing SmartHR row {row}: {e}")
                errors.append(f"Error in row '{full_name}': {str(e)}")
                skip_count += 1

        await db.commit()
        return {"success_count": success_count, "skip_count": skip_count, "errors": errors}
