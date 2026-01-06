# SUGUKURU カスタムドメイン設定ガイド

## 📋 お持ちのドメイン
- `sugu-kuru.co.jp` (想定)

## 🎯 推奨構成

| サービス | ドメイン | 用途 |
|---------|---------|------|
| Web App | `app.sugu-kuru.co.jp` | フロントエンド |
| API | `api.sugu-kuru.co.jp` | バックエンドAPI |

## 🔧 設定手順

### Step 1: ドメイン所有権の確認

1. Google Search Console または Cloud Console でドメイン所有権を確認
2. TXT レコードを DNS に追加

### Step 2: Cloud Run へのドメインマッピング

```bash
# Web アプリ
gcloud run domain-mappings create \
  --service=sugukuru-web \
  --domain=app.sugu-kuru.co.jp \
  --region=asia-northeast1 \
  --project=sugukuru7

# API
gcloud run domain-mappings create \
  --service=sugukuru-api \
  --domain=api.sugu-kuru.co.jp \
  --region=asia-northeast1 \
  --project=sugukuru7
```

### Step 3: DNS レコードの設定

Cloud Run からの指示に従い、以下いずれかを設定:

#### オプション A: CNAME レコード (推奨)
```
app.sugu-kuru.co.jp  CNAME  ghs.googlehosted.com.
api.sugu-kuru.co.jp  CNAME  ghs.googlehosted.com.
```

#### オプション B: A レコード
```
app.sugu-kuru.co.jp  A  216.239.32.21
                     A  216.239.34.21
                     A  216.239.36.21
                     A  216.239.38.21
```

### Step 4: SSL 証明書の発行

Cloud Run は自動的に Let's Encrypt の SSL 証明書を発行します。
DNS 設定後、15-60分で HTTPS が有効になります。

### Step 5: 確認

```bash
# ドメインマッピング状態確認
gcloud run domain-mappings describe app.sugu-kuru.co.jp \
  --region=asia-northeast1 \
  --project=sugukuru7

# HTTPS アクセステスト
curl https://app.sugu-kuru.co.jp/
```

## 📝 備考

- SSL 証明書の発行には DNS の伝播を待つ必要があります（最大48時間）
- 開発・テスト環境は引き続き `.run.app` ドメインを使用可能

## 🔒 現在のURL

| サービス | 現在のURL |
|---------|---------|
| Web | https://sugukuru-web-1027796998462.asia-northeast1.run.app |
| API | https://sugukuru-api-1027796998462.asia-northeast1.run.app |
| API Docs | https://sugukuru-api-1027796998462.asia-northeast1.run.app/docs |
