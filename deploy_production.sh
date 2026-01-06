#!/bin/bash
set -e

echo "🚀 SUGUKURU 本番デプロイ開始"
echo "================================"

# 変数
PROJECT_ID="sugukuru7"
REGION="asia-northeast1"
API_IMAGE="asia-northeast1-docker.pkg.dev/${PROJECT_ID}/sugukuru/sugukuru-api:latest"
WEB_IMAGE="asia-northeast1-docker.pkg.dev/${PROJECT_ID}/sugukuru/sugukuru-web:latest"

# 1. GCP設定確認
echo ""
echo "📋 Step 1: GCP設定確認"
gcloud config set project ${PROJECT_ID}

# 2. Docker認証
echo ""
echo "🔐 Step 2: Docker認証"
gcloud auth configure-docker asia-northeast1-docker.pkg.dev --quiet

# 3. Cloud Buildでビルド
echo ""
echo "🏗️ Step 3: イメージビルド"
gcloud builds submit --config cloudbuild.yaml . --timeout=1800

# 4. Cloud Run API更新
echo ""
echo "🌐 Step 4: APIサービス更新"
gcloud run deploy sugukuru-api \
  --image ${API_IMAGE} \
  --region ${REGION} \
  --platform managed \
  --memory 1Gi \
  --cpu 1 \
  --quiet

# 5. Cloud Run Web更新
echo ""
echo "🖥️ Step 5: Webサービス更新"
gcloud run deploy sugukuru-web \
  --image ${WEB_IMAGE} \
  --region ${REGION} \
  --platform managed \
  --memory 512Mi \
  --cpu 1 \
  --quiet

# 6. 公開アクセス許可
echo ""
echo "🔓 Step 6: 公開アクセス設定"
gcloud run services add-iam-policy-binding sugukuru-api \
  --region=${REGION} \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --quiet 2>/dev/null || true

gcloud run services add-iam-policy-binding sugukuru-web \
  --region=${REGION} \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --quiet 2>/dev/null || true

# 7. URL取得
echo ""
echo "================================"
echo "✅ デプロイ完了！"
echo "================================"
API_URL=$(gcloud run services describe sugukuru-api --region ${REGION} --format='value(status.url)')
WEB_URL=$(gcloud run services describe sugukuru-web --region ${REGION} --format='value(status.url)')
echo ""
echo "🌐 API URL: ${API_URL}"
echo "🖥️ Web URL: ${WEB_URL}"
echo ""
echo "🎉 ブラウザで ${WEB_URL} にアクセスしてください"
