#!/bin/bash
set -e

# PATH setup to ensure gcloud and other binaries are found
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_ID="sugukuru7"

echo "🧹 Cleaning up conflicting secrets for project: $PROJECT_ID..."
gcloud config set project $PROJECT_ID

delete_secret() {
    NAME=$1
    if gcloud secrets describe $NAME > /dev/null 2>&1; then
        echo "Deleting secret: $NAME"
        gcloud secrets delete $NAME --quiet
    fi
}

delete_secret "database-url"
delete_secret "smarthr-api-key"
delete_secret "slack-bot-token"
delete_secret "nextauth-secret"

echo "✅ Cleanup complete. Retrying deployment..."
./deploy/finalize_deploy.sh
