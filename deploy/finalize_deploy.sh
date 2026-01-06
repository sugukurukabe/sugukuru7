#!/bin/bash
set -e

# PATH setup to ensure gcloud and other binaries are found
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# SUGUKURU Final Deployment Script
PROJECT_ID="sugukuru7"

echo "🚀 Starting Production Deployment for project: $PROJECT_ID"

# 1. Project Setup
echo "⚙️ Setting up project..."
/opt/homebrew/bin/gcloud config set project $PROJECT_ID
chmod +x deploy/setup_gcp.sh
./deploy/setup_gcp.sh

# 2. Infrastructure Step 1: Core Resources (Registry, VPC, DB)
echo "🏗️ Provisioning Core Infrastructure (Repository, etc.)..."
cd terraform
terraform init
# We target the repository first so Cloud Build can push to it
terraform apply -auto-approve \
  -target=google_artifact_registry_repository.repo \
  -target=google_compute_network.vpc_network \
  -target=google_sql_database_instance.instance \
  -target=google_storage_bucket.documents \
  -var="db_password=temporary-password-123"
cd ..

# 3. Build & Push Images
echo "📦 Building and Pushing Containers..."
CURRENT_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "manual-$(date +%s)")
/opt/homebrew/bin/gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=$CURRENT_VERSION

# 4. Infrastructure Step 2: Cloud Run Services
echo "🚀 Finalizing Infrastructure and Deploying Cloud Run..."
cd terraform
terraform apply -auto-approve -var="db_password=temporary-password-123"
cd ..

echo "✨ Deployment Finished!"
echo "--------------------------------------------------"
echo "Next Steps:"
echo "1. Populate Secret Manager values if not done."
echo "2. Run SQL migrations: gcloud sql connect sugukuru7-db --user=sugukuru_admin"
echo "--------------------------------------------------"
