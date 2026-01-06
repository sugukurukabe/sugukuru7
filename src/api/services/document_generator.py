import os
import logging
from datetime import datetime, date
from uuid import UUID
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.api.services.excel_template import ExcelTemplateProcessor
from src.api.services.word_template import WordTemplateProcessor
from src.api.models.person import Person, User
from src.api.models.organization import Organization
from src.api.models.employment import Employment, Assignment

logger = logging.getLogger(__name__)

class DocumentGeneratorService:
    @staticmethod
    async def generate_zuitoji_dispatch_change(
        db: AsyncSession,
        person_id: UUID,
        old_assignment_id: UUID,
        new_assignment_id: UUID,
        output_dir: str = "storage/notices"
    ):
        """
        随時届出（派遣先変更）のExcelを生成
        """
        # データ取得
        person = await db.get(Person, person_id)
        old_assign = await db.get(Assignment, old_assignment_id)
        new_assign = await db.get(Assignment, new_assignment_id)
        
        if not person or not new_assign:
            raise ValueError("Person or Assignment not found")

        old_org = await db.get(Organization, old_assign.client_org_id) if old_assign else None
        new_org = await db.get(Organization, new_assign.client_org_id)

        # テンプレートデータ
        data = {
            "氏名": person.names.get("full_name"),
            "氏名カナ": f"{person.names.get('legal_last_kana', '')} {person.names.get('legal_first_kana', '')}",
            "在留カード番号": "AB12345678CD", # TODO: Get from visa records
            "届出事由発生日": new_assign.start_date.strftime("%Y/%m/%d"),
            "旧派遣先": old_org.name if old_org else "なし",
            "新派遣先": new_org.name
        }

        template_path = "templates/immigration/随時届出_派遣先変更.xlsx"
        filename = f"随時届出_派遣先変更_{person.names.get('legal_last_kana', 'DOC')}_{datetime.now().strftime('%Y%m%d%H%M')}.xlsx"
        output_path = os.path.join(output_dir, filename)

        processor = ExcelTemplateProcessor(template_path)
        processor.fill_placeholders(data)
        processor.save(output_path)

        return output_path, filename

    @staticmethod
    async def generate_employment_contract(
        db: AsyncSession,
        person_id: UUID,
        employment_id: UUID,
        output_dir: str = "storage/contracts"
    ):
        """
        雇用契約書のWordを生成
        """
        person = await db.get(Person, person_id)
        employment = await db.get(Employment, employment_id)
        
        if not person or not employment:
            raise ValueError("Person or Employment not found")

        data = {
            "氏名": person.names.get("full_name"),
            "会社名": "株式会社スグクル",
            "就業開始日": employment.start_date.strftime("%Y/%m/%d") if employment.start_date else "未定",
            "時給": f"¥{employment.hourly_rate or 0}",
            "担当者": "壁"
        }

        template_path = "templates/contracts/雇用契約書_特定技能.docx"
        filename = f"雇用契約書_特定技能_{person.names.get('legal_last_kana', 'DOC')}_{datetime.now().strftime('%Y%m%d%H%M')}.docx"
        output_path = os.path.join(output_dir, filename)

        processor = WordTemplateProcessor(template_path)
        processor.fill_placeholders(data)
        processor.save(output_path)

        return output_path, filename
