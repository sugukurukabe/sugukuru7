import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class SlackFileFetcher:
    """Slackファイル取得サービス"""
    
    def __init__(self, token: str = "xoxb-dummy-token"):
        self.token = token
    
    async def fetch_file(self, slack_file_id: str) -> tuple[bytes, str, str]:
        """
        Slack File IDからファイルを取得
        Returns: (content, filename, mime_type)
        """
        async with httpx.AsyncClient() as client:
            # ファイル情報取得
            info_response = await client.get(
                "https://slack.com/api/files.info",
                headers={"Authorization": f"Bearer {self.token}"},
                params={"file": slack_file_id}
            )
            file_info = info_response.json()
            
            if not file_info.get("ok"):
                logger.error(f"Slack API error: {file_info.get('error')}")
                raise Exception(f"Slack API error: {file_info.get('error')}")
            
            file_data = file_info["file"]
            file_url = file_data["url_private"]
            filename = file_data["name"]
            mime_type = file_data["mimetype"]
            
            # ファイルダウンロード
            file_response = await client.get(
                file_url,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            return file_response.content, filename, mime_type
