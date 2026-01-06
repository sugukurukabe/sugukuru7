import csv
import io
import json
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Union
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.models.person import Person
from src.api.models.visa import VisaRecord, VisaCase
from src.api.models.employment import Employment, Assignment
from src.api.models.organization import Organization
from src.api.services.org_normalizer import OrganizationNormalizer
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

class SlackListImporter:
    """
    SlackリストのCSVインポートサービス
    """
    
    # ===== マッピング定数 =====

    # 現在の状況 → current_status ENUM (DB値に合わせて調整)
    STATUS_MAP = {
        '監理・管理中': 'monitoring',
        '管理中': 'monitoring',
        '申請中': 'applying',
        '申請準備中': 'preparing',
        '受領登録完了': 'received',
        '失注': 'lost',
        '退職': 'resigned',
        '退職予定': 'resigned_planned',
        '海外待機': 'overseas_waiting',
        '入国待ち': 'overseas_waiting',
        '内定': 'preparing',
        '稼働中': 'monitoring',
        '休職中': 'monitoring',
        '': 'monitoring',
        None: 'monitoring',
    }

    # 国籍 → nationality (小文字で統一)
    NATIONALITY_MAP = {
        'ベトナム': 'vietnam',
        'VN': 'vietnam',
        'インドネシア': 'indonesia',
        'ID': 'indonesia',
        'フィリピン': 'philippines',
        'PH': 'philippines',
        'ミャンマー': 'myanmar',
        'MM': 'myanmar',
        '中国': 'china',
        'CN': 'china',
        'カンボジア': 'cambodia',
        'KH': 'cambodia',
        'ネパール': 'nepal',
        'NP': 'nepal',
        'タイ': 'thailand',
        'TH': 'thailand',
        'スリランカ': 'sri_lanka',
        'LK': 'sri_lanka',
        '': 'other',
        None: 'other',
    }

    # 在留資格 → visa_type (DB値 'tokutei_gino_1', 'gino_jisshu_1' 等に合わせて調整)
    VISA_TYPE_MAP = {
        '特定技能1号': 'tokutei_gino_1',
        '特定技能１号': 'tokutei_gino_1',
        '特定技能2号': 'tokutei_gino_2',
        '特定技能２号': 'tokutei_gino_2',
        '技能実習1号': 'gino_jisshu_1',
        '技能実習１号': 'gino_jisshu_1',
        '技能実習2号': 'gino_jisshu_2',
        '技能実習２号': 'gino_jisshu_2',
        '技能実習3号': 'gino_jisshu_3',
        '技能実習３号': 'gino_jisshu_3',
        '技能実習': 'gino_jisshu_1',
        '特定活動': 'tokkatsu',
        '留学': 'student',
        '家族滞在': 'dependent',
        '永住者': 'permanent_resident',
        '定住者': 'other', # DBにない場合はother
        '日本人の配偶者等': 'other',
        '技術・人文知識・国際業務': 'engineer_specialist',
        '': 'other',
        None: 'other',
    }

    # 申請種類 → case_type (DB値 'new_dispatch', 'change_a' 等に合わせて調整)
    CASE_TYPE_MAP = {
        '新規-派遣': 'new_dispatch',
        '新規－派遣': 'new_dispatch',
        '新規-直接': 'new_direct',
        '新規－直接': 'new_direct',
        '変更申請A': 'change_a',
        '変更申請Ａ': 'change_a',
        '変更申請B': 'change_b',
        '変更申請Ｂ': 'change_b',
        '更新-派遣': 'renewal_dispatch',
        '更新-直接': 'renewal_direct',
        '更新申請': 'renewal_dispatch',
        '随時届（派遣先変更）': 'zuitoji_dispatch',
        '随時届出（派遣先変更）': 'zuitoji_dispatch',
        '随時届（終了）': 'zuitoji_termination',
        '随時届出（終了）': 'zuitoji_termination',
        '': 'notification',
        None: 'notification',
    }

    # 事業区分 → business_division
    DIVISION_MAP = {
        '派遣': 'dispatch',
        '派遣事業': 'dispatch',
        '農受託': 'subcontracting',
        '農受託事業': 'subcontracting',
        '請負': 'subcontracting',
        '登録支援': 'support',
        '登録支援事業': 'support',
        'IT': 'it',
        'IT事業': 'it',
        '': 'dispatch',
        None: 'dispatch',
    }

    @staticmethod
    def safe_map(value: str, mapping: dict, default: str = None) -> str:
        """安全にマッピングを適用（全角/半角、前後空白を正規化）"""
        if value is None:
            return mapping.get(None, default)
        
        # 正規化
        normalized = value.strip()
        
        # 全角数字・英字を半角に変換
        normalized = normalized.translate(str.maketrans(
            'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９',
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        ))
        
        # マッピング検索
        if normalized in mapping:
            return mapping[normalized]
        
        # 部分一致検索（キーがvalueに含まれるか）
        for key, mapped_value in mapping.items():
            if key and normalized and key in normalized:
                return mapped_value
        
        return default or mapping.get('', default)

    @staticmethod
    def _parse_date(date_str: str) -> Optional[date]:
        """日付文字列をパース（複数フォーマット対応）"""
        if not date_str or not date_str.strip():
            return None
        
        date_str = date_str.strip()
        
        formats = [
            '%Y/%m/%d',
            '%Y-%m-%d',
            '%Y年%m月%d日',
            '%m/%d/%Y',
            '%d/%m/%Y',
        ]
        
        for fmt in formats:
            try:
                # ユーザー提供の replace('/', '-') 的な前処理
                d_str = date_str.replace('/', '-')
                if fmt == '%Y/%m/%d': fmt = '%Y-%m-%d'
                return datetime.strptime(d_str if '-' in d_str else date_str, fmt).date()
            except ValueError:
                continue
        
        return None

    @classmethod
    async def import_staff_list(cls, db: AsyncSession, csv_content: str, tenant_id: UUID) -> Dict[str, Any]:
        """
        人材管理リスト鹿児島.csv をインポートします
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        success_count = 0
        skip_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            try:
                # 名前 (必須)
                full_name = row.get("名前", "").strip()
                if not full_name:
                    skip_count += 1
                    continue

                # マッピング適用
                nationality = cls.safe_map(row.get("国籍"), cls.NATIONALITY_MAP, "other")
                current_status = cls.safe_map(row.get("現在の状況"), cls.STATUS_MAP, "monitoring")
                current_visa_type = cls.safe_map(row.get("現在の在留資格"), cls.VISA_TYPE_MAP, "other")
                
                # 組織名の正規化
                org_name = row.get("受入れ企業")
                org_id = await OrganizationNormalizer.get_org_id_by_name(db, org_name, tenant_id)

                # 日付パース
                birth_date = cls._parse_date(row.get("生年月日"))
                visa_expiry = cls._parse_date(row.get("期限日"))

                # names JSONB
                names_json = {
                    "full_name": full_name,
                    "gender": row.get("性別", ""),
                    "email": row.get("メールアドレス", "")
                }

                # UPSERT (名前でマッチング)
                # Note: 019_add_import_columns.sql で作成した UNIQUE インデックスを利用
                sql = text("""
                    INSERT INTO people (
                        tenant_id, names, current_status, nationality, date_of_birth, 
                        current_visa_type, visa_expiry_date, updated_at
                    ) VALUES (
                        :tenant_id, :names, :current_status, :nationality, :date_of_birth,
                        :current_visa_type, :visa_expiry_date, NOW()
                    )
                    ON CONFLICT (tenant_id, (names->>'full_name'))
                    DO UPDATE SET
                        current_status = EXCLUDED.current_status,
                        nationality = EXCLUDED.nationality,
                        date_of_birth = EXCLUDED.date_of_birth,
                        current_visa_type = EXCLUDED.current_visa_type,
                        visa_expiry_date = EXCLUDED.visa_expiry_date,
                        updated_at = NOW()
                """)
                
                await db.execute(sql, {
                    "tenant_id": tenant_id,
                    "names": json.dumps(names_json, ensure_ascii=False),
                    "current_status": current_status,
                    "nationality": nationality,
                    "date_of_birth": birth_date,
                    "current_visa_type": current_visa_type,
                    "visa_expiry_date": visa_expiry
                })

                success_count += 1

            except Exception as e:
                await db.rollback()
                logger.error(f"Error importing row {row_num}: {e}")
                errors.append(f"Row {row_num} ({full_name}): {str(e)}")
                skip_count += 1

        await db.commit()
        return {"success_count": success_count, "skip_count": skip_count, "errors": errors}

    @classmethod
    async def import_visa_list(cls, db: AsyncSession, csv_content: str, tenant_id: UUID) -> Dict[str, Any]:
        """
        ビザ申請依頼リスト.csv をインポートします
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        success_count = 0
        skip_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            try:
                name = row.get("名前", "").strip()
                if not name:
                    continue

                # 1. 人材の検索
                stmt = select(Person).where(
                    Person.names.op('->>')('full_name') == name,
                    Person.tenant_id == tenant_id
                )
                result = await db.execute(stmt)
                person = result.scalar_one_or_none()
                
                if not person:
                    errors.append(f"Row {row_num}: Person not found: {name}")
                    skip_count += 1
                    continue

                # 2. 企業名の正規化
                org_name = row.get("受入れ企業") or row.get("会社名")
                org_id = await OrganizationNormalizer.get_org_id_by_name(db, org_name, tenant_id)

                # 3. マッピング適用
                case_type = cls.safe_map(row.get("申請種類"), cls.CASE_TYPE_MAP, "notification")
                deadline = cls._parse_date(row.get("期限日"))
                
                # 作成状況をタグ配列に変換
                raw_status = row.get("作成状況", "").strip()
                status_tags = [s.strip() for s in raw_status.split(",") if s.strip()]
                
                # 優先度
                try:
                    priority_val = row.get("優先度", "2")
                    priority = int(priority_val if priority_val else "2")
                    priority = max(1, min(5, priority))
                except (ValueError, TypeError):
                    priority = 2

                # 4. ビザ案件の重複チェック (暫定: 同じ人物、タイプ、期限)
                stmt = select(VisaCase).where(
                    VisaCase.person_id == person.person_id,
                    VisaCase.case_type == case_type,
                    VisaCase.deadline == deadline,
                    VisaCase.tenant_id == tenant_id
                )
                result = await db.execute(stmt)
                existing_case = result.scalar_one_or_none()
                
                if not existing_case:
                    new_case = VisaCase(
                        tenant_id=tenant_id,
                        person_id=person.person_id,
                        client_org_id=org_id,
                        client_name_raw=org_name,
                        case_type=case_type,
                        is_completed=row.get("完了済み", "").lower() == "true",
                        priority=priority,
                        deadline=deadline,
                        status_tags=status_tags
                    )
                    db.add(new_case)
                    success_count += 1
                else:
                    # 更新も検討できるが、今回はスキップ
                    skip_count += 1

            except Exception as e:
                await db.rollback()
                logger.error(f"Error in row {row_num}: {e}")
                errors.append(f"Row {row_num} ({name}): {str(e)}")
                skip_count += 1

        await db.commit()
        return {"success_count": success_count, "skip_count": skip_count, "errors": errors}
