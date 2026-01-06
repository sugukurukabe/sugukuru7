# SUGUKURU デプロイ手順書

このドキュメントでは、SUGUKURU プラットフォームを Google Cloud Platform (GCP) にデプロイする手順を説明します。

## 前提条件
- `gcloud` CLI がインストールされ、認証済みであること
- `terraform` がインストールされていること
- GCP プロジェクト `sugukuru7` が作成されていること

## 1. 初期設定 (CLI)
```bash
# プロジェクトの設定
gcloud config set project sugukuru7

# 必要な API の有効化
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  artifactregistry.googleapis.com \
  servicenetworking.googleapis.com
```

## 2. Terraform によるインフラ構築
```bash
cd terraform

# DB パスワードの生成 (例)
DB_PASSWORD=$(openssl rand -base64 24)
echo "DB Password: $DB_PASSWORD" # 控えておいてください

# 初期化と適用
terraform init
terraform apply -var="db_password=$DB_PASSWORD"
```

## 3. データベースマイグレーション
Cloud SQL はプライベート IP のみのため、Cloud SQL Proxy を使用してローカルから接続します。
```bash
# Proxy の起動 (別ターミナル)
cloud_sql_proxy -instances=sugukuru7:asia-northeast1:sugukuru7-db=tcp:5432

# SQL ファイルの実行
for f in ../sql/*.sql; do
  psql "postgresql://sugukuru_admin:$DB_PASSWORD@localhost:5432/sugukuru" -f "$f"
done
```

## 4. アプリケーションのデプロイ (Cloud Build)
```bash
cd ..
gcloud builds submit --config=cloudbuild.yaml
```

## 5. 動作確認
Terraform の出力、または GCP コンソールから表示される Cloud Run の URL にアクセスして確認してください。
- API ヘルスチェック: `https://[API_URL]/api/v1/health`
- Web 画面: `https://[WEB_URL]/`

---
### 開発環境と本番環境の切り替え
`terraform/variables.tf` の `db_tier` を変更することで、DB インスタンスのスペックを調整できます。
- 開発用: `db-f1-micro`
- 本番用: `db-standard-2`
