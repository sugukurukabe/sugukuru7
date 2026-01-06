import os
import logging
from uuid import UUID
from fastapi import UploadFile
from typing import Optional
from google.cloud import storage
import datetime

logger = logging.getLogger(__name__)

class DocumentStorageService:
    """GCS書類保存サービス"""
    
    def __init__(self, bucket_name: str = "sugukuru-docs"):
        # 実際には settings から取得するが、モック環境用
        self.bucket_name = bucket_name
        # GCSが使えない環境（ローカル）ではローカル保存にフォールバックする仕組みを持つのが望ましい
        try:
            self.client = storage.Client()
            self.bucket = self.client.bucket(self.bucket_name)
            self.use_gcs = True
        except Exception as e:
            logger.warning(f"GCS client initialization failed, falling back to local: {e}")
            self.use_gcs = False
            self.local_root = "storage/documents"
            os.makedirs(self.local_root, exist_ok=True)
    
    async def upload(
        self,
        file_content: bytes,
        filename: str,
        tenant_id: UUID,
        person_id: UUID,
        doc_type: str
    ) -> str:
        """
        書類を保存
        パス: documents/{tenant_id}/{person_id}/{doc_type}/{timestamp}_{filename}
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        rel_path = f"documents/{tenant_id}/{person_id}/{doc_type}/{timestamp}_{filename}"
        
        if self.use_gcs:
            blob = self.bucket.blob(rel_path)
            blob.upload_from_string(file_content)
            return f"gs://{self.bucket_name}/{rel_path}"
        else:
            full_path = os.path.join(self.local_root, rel_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "wb") as f:
                f.write(file_content)
            return full_path
    
    async def generate_signed_url(self, file_path: str, expiration_minutes: int = 60) -> str:
        """署名付きURLを生成（一時的なアクセス用）"""
        if self.use_gcs and file_path.startswith("gs://"):
            # 実際の実装では blob.generate_signed_url を使用
            return "https://storage.googleapis.com/...signed_url_mock..."
        
        # ローカルの場合はダミー
        return f"/api/v1/documents/view?path={file_path}"
