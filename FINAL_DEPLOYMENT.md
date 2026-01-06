# SUGUKURU Platform - Final Deployment Guide

全12フェーズの機能実装が完了しました。以下は最終確認と本番デプロイの手順です。

## 1. ローカルでの最終動作確認

### データベースの構築
17個のSQLファイルを順に適用して、最新のスキーマを構築します。
```bash
# Docker Composeを使用する場合
docker-compose up -d db
for f in sql/*.sql; do
  docker exec -i sugukuru-db psql -U sugukuru -d sugukuru < $f
done
```

### バックエンドの起動
```bash
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000
```
※ `App loaded successfully` が表示されることを確認してください。

### フロントエンドの起動
```bash
cd src/web
npm install
npm run dev
```

---

## 2. 本番環境（GCP）へのデプロイ

### 設定の初期化
提供されたセットアップスクリプトを使用して、必要なAPIの有効化とSecretの作成を行います。
```bash
chmod +x deploy/setup_gcp.sh
./deploy/setup_gcp.sh
```

### インフラ構築 (Terraform)
VPC、Cloud SQL、Cloud Runの各リソースを作成します。
```bash
cd terraform
terraform init
terraform apply
```

### ビルドとデプロイ
Cloud Buildを使用してコンテナをビルドし、Cloud Runにデプロイします。
```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## 🚀 実装済み機能のハイライト
1. **経営ダッシュボード**: 全社KPIとトレンドの可視化。
2. **週次配置ツール**: 直感的なドラッグ＆ドロップによる人員配置。
3. **入管届出自動化**: 派遣先変更等の公的書類をExcel/Wordで自動生成。
4. **書類管理（Vault）**: 必要書類の充足率（Checklist）と期限監視。
5. **営業支援**: 商談カンバンと候補者提案システム。

すべてのコンポーネントが統合され、本番運用の準備が整いました。
