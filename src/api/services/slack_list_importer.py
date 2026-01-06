"""
Slackリスト（人材管理・ビザ申請依頼）のCSVインポートサービス

人材管理リスト鹿児島.csv のカラム（28個）:
名前,受入れ企業,国籍,現在の在留資格,期限日,現在の状況,申請の在留資格,ビザ種類,在留カード,申請完了PDF,
性別,顔写真,メールアドレス,随時届け（退職）,マイナンバー,運転免許,銀行口座,最新年度の住所,申請状況,
申請状況(メモ),課税・納税証明書申請の郵送日,納税課税証明書,源泉徴収票,健康診断受診日,健康診断,
完了済み,担当者,社保資格取得日
"""
import csv
import io
import json
import re
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
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
    人材管理リスト鹿児島.csv と ビザ申請依頼リスト.csv をインポート
    """
    
    # ===== マッピング定数 =====

    # 現在の状況 → current_status ENUM
    STATUS_MAP = {
        '監理・管理中': 'monitoring',
        '管理中': 'monitoring',
        '申請中': 'applying',
        '申請準備中': 'preparing',
        '受領登録完了': 'received',
        '失注': 'lost',
        '退職': 'resigned',
        '退職予定': 'resigned_planned',
        '一時帰国中': 'monitoring',  # 管理中の一種
        '海外待機': 'overseas_waiting',
        '入国待ち': 'overseas_waiting',
        '内定': 'preparing',
        '稼働中': 'monitoring',
        '休職中': 'monitoring',
        '審査完了メール有': 'applying',  # 申請中の一種
        '随時届完了': 'monitoring',
        '': 'monitoring',
        None: 'monitoring',
    }

    # 国籍 → nationality
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

    # 在留資格 → visa_type
    VISA_TYPE_MAP = {
        '特定技能1号': 'tokutei_gino_1',
        '特定技能１号': 'tokutei_gino_1',
        '特定技能2号': 'tokutei_gino_2',
        '特定技能２号': 'tokutei_gino_2',
        '特技1号更新': 'tokutei_gino_1',  # 更新中も特定技能1号
        '特定技能1号更新': 'tokutei_gino_1',
        '技能実習1号': 'gino_jisshu_1',
        '技能実習１号': 'gino_jisshu_1',
        '技能実習1号ロ': 'gino_jisshu_1',
        '技能実習１号ロ': 'gino_jisshu_1',
        '技能実習2号': 'gino_jisshu_2',
        '技能実習２号': 'gino_jisshu_2',
        '技能実習2号ロ': 'gino_jisshu_2',
        '技能実習２号ロ': 'gino_jisshu_2',
        '技能実習3号': 'gino_jisshu_3',
        '技能実習３号': 'gino_jisshu_3',
        '技能実習': 'gino_jisshu_1',
        '特定活動': 'tokkatsu',
        '留学': 'student',
        '家族滞在': 'dependent',
        '永住者': 'permanent_resident',
        '定住者': 'other',
        '日本人の配偶者等': 'other',
        '技術・人文知識・国際業務': 'engineer_specialist',
        '海外待機': 'overseas_waiting',
        '': 'other',
        None: 'other',
    }

    # ビザ種類 → business_division (派遣形態)
    VISA_CATEGORY_MAP = {
        '農業派遣': 'dispatch',
        '畜産派遣': 'dispatch',
        '請負・受託': 'subcontracting',
        '直接雇用': 'direct',
        '': 'dispatch',
        None: 'dispatch',
    }

    # 申請種類 → case_type
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
        
        # 完全一致
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
        if not date_str or not date_str.strip() or date_str == '""':
            return None
        
        date_str = date_str.strip().strip('"')
        
        formats = [
            '%Y/%m/%d',
            '%Y-%m-%d',
            '%Y年%m月%d日',
            '%m/%d/%Y',
            '%d/%m/%Y',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        return None

    @staticmethod
    def _parse_status_tags(status_str: str) -> Tuple[str, List[str]]:
        """
        現在の状況を解析し、メインステータスとタグに分離
        例: "監理・管理中, 申請中, 審査完了メール有" 
        → main_status="monitoring", tags=["申請中", "審査完了メール有"]
        """
        if not status_str:
            return "monitoring", []
        
        parts = [s.strip() for s in status_str.split(",") if s.strip()]
        
        if not parts:
            return "monitoring", []
        
        # 最初のパートをメインステータスとして扱う
        main_status_raw = parts[0]
        main_status = SlackListImporter.STATUS_MAP.get(main_status_raw, "monitoring")
        
        # 残りをタグとして保持
        tags = parts[1:] if len(parts) > 1 else []
        
        return main_status, tags

    @staticmethod
    def _parse_file_ids(file_str: str) -> List[str]:
        """
        Slackファイル ID リストをパース
        例: "F0966KQFU0J,F09AQ4W92C9" → ["F0966KQFU0J", "F09AQ4W92C9"]
        """
        if not file_str or not file_str.strip():
            return []
        
        # カンマ区切りでパース
        ids = [f.strip().strip('"') for f in file_str.split(",") if f.strip()]
        return [f for f in ids if f.startswith("F")]  # Slackファイル IDは F で始まる

    @staticmethod
    def _parse_company_names(company_str: str) -> List[str]:
        """
        複数企業名をパース
        例: "派遣-スグクル(株), 片平-派遣" → ["派遣-スグクル(株)", "片平-派遣"]
        例: "(株)芝原, 芝原-派遣" → ["(株)芝原", "芝原-派遣"]
        """
        if not company_str or not company_str.strip():
            return []
        
        # カンマ区切りでパース
        companies = [c.strip().strip('"') for c in company_str.split(",") if c.strip()]
        return companies

    @staticmethod
    def _normalize_company_name(raw_name: str) -> str:
        """
        企業名を正規化
        - "派遣-スグクル(株)" → "スグクル(株)"
        - "片平-派遣" → "(有)片平農産" (エイリアスで解決)
        - "(株)芝原" → "(株)芝原"
        """
        if not raw_name:
            return ""
        
        name = raw_name.strip()
        
        # "派遣-" や "-派遣" を除去してベース名を抽出
        if name.startswith("派遣-"):
            name = name[3:]
        if name.endswith("-派遣"):
            name = name[:-3]
        
        return name

    @classmethod
    async def import_staff_list(cls, db: AsyncSession, csv_content: str, tenant_id: UUID) -> Dict[str, Any]:
        """
        人材管理リスト鹿児島.csv をインポートします
        
        カラム:
        名前,受入れ企業,国籍,現在の在留資格,期限日,現在の状況,申請の在留資格,ビザ種類,在留カード,申請完了PDF,
        性別,顔写真,メールアドレス,随時届け（退職）,マイナンバー,運転免許,銀行口座,最新年度の住所,申請状況,
        申請状況(メモ),課税・納税証明書申請の郵送日,納税課税証明書,源泉徴収票,健康診断受診日,健康診断,
        完了済み,担当者,社保資格取得日
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        success_count = 0
        update_count = 0
        skip_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            try:
                # 名前 (必須)
                full_name = row.get("名前", "").strip().strip('"')
                if not full_name:
                    skip_count += 1
                    continue

                # マッピング適用
                nationality = cls.safe_map(row.get("国籍"), cls.NATIONALITY_MAP, "other")
                current_status, status_tags = cls._parse_status_tags(row.get("現在の状況"))
                current_visa_type = cls.safe_map(row.get("現在の在留資格"), cls.VISA_TYPE_MAP, "other")
                application_visa_type = cls.safe_map(row.get("申請の在留資格"), cls.VISA_TYPE_MAP, None)
                visa_category = cls.safe_map(row.get("ビザ種類"), cls.VISA_CATEGORY_MAP, "dispatch")
                
                # 企業名のパースと正規化
                company_names = cls._parse_company_names(row.get("受入れ企業", ""))
                primary_company = company_names[0] if company_names else ""
                primary_company_normalized = cls._normalize_company_name(primary_company)
                
                # 組織ID取得（存在しなければ自動作成）
                org_id = await OrganizationNormalizer.get_org_id_by_name(db, primary_company_normalized, tenant_id) if primary_company_normalized else None

                # 日付パース
                visa_expiry = cls._parse_date(row.get("期限日"))
                health_check_date = cls._parse_date(row.get("健康診断受診日"))
                insurance_date = cls._parse_date(row.get("社保資格取得日"))
                tax_mail_date = cls._parse_date(row.get("課税・納税証明書申請の郵送日"))

                # ファイルIDパース
                residence_card_ids = cls._parse_file_ids(row.get("在留カード", ""))
                photo_ids = cls._parse_file_ids(row.get("顔写真", ""))
                mynumber_ids = cls._parse_file_ids(row.get("マイナンバー", ""))
                license_ids = cls._parse_file_ids(row.get("運転免許", ""))
                health_check_ids = cls._parse_file_ids(row.get("健康診断", ""))
                tax_cert_ids = cls._parse_file_ids(row.get("納税課税証明書", ""))
                withholding_ids = cls._parse_file_ids(row.get("源泉徴収票", ""))
                application_pdf_ids = cls._parse_file_ids(row.get("申請完了PDF", ""))

                # names JSONB
                names_json = {
                    "full_name": full_name,
                    "gender": row.get("性別", "").strip().strip('"'),
                }

                # demographics JSONB
                demographics_json = {
                    "nationality": nationality,
                }

                # contact_info JSONB  
                email = row.get("メールアドレス", "").strip().strip('"')
                contact_info_json = {}
                if email:
                    contact_info_json["email"] = email
                
                address = row.get("最新年度の住所", "").strip().strip('"')
                if address:
                    contact_info_json["address"] = address

                # documents (Slackファイル参照)
                documents_json = {
                    "residence_card": residence_card_ids,
                    "photo": photo_ids,
                    "mynumber": mynumber_ids,
                    "driving_license": license_ids,
                    "health_check": health_check_ids,
                    "tax_certificate": tax_cert_ids,
                    "withholding_slip": withholding_ids,
                    "application_pdf": application_pdf_ids,
                }

                # application_status (申請関連情報)
                application_status_json = {
                    "status": row.get("申請状況", "").strip().strip('"'),
                    "memo": row.get("申請状況(メモ)", "").strip().strip('"'),
                    "is_completed": row.get("完了済み", "").lower() == "true",
                    "is_retired_notification": row.get("随時届け（退職）", "").lower() == "true",
                    "status_tags": status_tags,
                    "visa_category": visa_category,
                    "application_visa_type": application_visa_type,
                    "tax_mail_date": tax_mail_date.isoformat() if tax_mail_date else None,
                    "health_check_date": health_check_date.isoformat() if health_check_date else None,
                    "insurance_start_date": insurance_date.isoformat() if insurance_date else None,
                    "assigned_staff": row.get("担当者", "").strip().strip('"'),
                    "companies": company_names,
                }

                # UPSERT: 名前でマッチング
                sql = text("""
                    INSERT INTO people (
                        tenant_id, names, demographics, contact_info,
                        current_status, current_status_notes, nationality, 
                        current_visa_type, visa_expiry_date,
                        slack_hr_list_id, updated_at
                    ) VALUES (
                        :tenant_id, :names, :demographics, :contact_info,
                        :current_status, :status_notes, :nationality,
                        :current_visa_type, :visa_expiry_date,
                        :slack_hr_list_id, NOW()
                    )
                    ON CONFLICT (tenant_id, (names->>'full_name'))
                    DO UPDATE SET
                        demographics = people.demographics || EXCLUDED.demographics,
                        contact_info = people.contact_info || EXCLUDED.contact_info,
                        current_status = EXCLUDED.current_status,
                        current_status_notes = EXCLUDED.current_status_notes,
                        nationality = EXCLUDED.nationality,
                        current_visa_type = EXCLUDED.current_visa_type,
                        visa_expiry_date = EXCLUDED.visa_expiry_date,
                        updated_at = NOW()
                    RETURNING (xmax = 0) as inserted
                """)
                
                result = await db.execute(sql, {
                    "tenant_id": tenant_id,
                    "names": json.dumps(names_json, ensure_ascii=False),
                    "demographics": json.dumps(demographics_json, ensure_ascii=False),
                    "contact_info": json.dumps(contact_info_json, ensure_ascii=False),
                    "current_status": current_status,
                    "status_notes": json.dumps(application_status_json, ensure_ascii=False),
                    "nationality": nationality,
                    "current_visa_type": current_visa_type,
                    "visa_expiry_date": visa_expiry,
                    "slack_hr_list_id": f"slack_{row_num}",  # 暫定ID
                })

                row_result = result.fetchone()
                if row_result and row_result.inserted:
                    success_count += 1
                else:
                    update_count += 1

                # ドキュメント情報を別テーブルに保存（オプション）
                # TODO: documents テーブルへの保存

            except Exception as e:
                logger.error(f"Error importing row {row_num} ({full_name}): {e}")
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
                org_id = await OrganizationNormalizer.get_org_id_by_name(db, org_name, tenant_id) if org_name else None

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

                # 4. ビザ案件の重複チェック
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
                    skip_count += 1

            except Exception as e:
                logger.error(f"Error in row {row_num}: {e}")
                errors.append(f"Row {row_num} ({name}): {str(e)}")
                skip_count += 1

        await db.commit()
        return {"success_count": success_count, "skip_count": skip_count, "errors": errors}
