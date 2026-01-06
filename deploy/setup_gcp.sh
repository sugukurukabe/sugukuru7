#!/bin/bash
set -e

# PATH setup to ensure gcloud and other binaries are found
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_ID="sugukuru7"
REGION="asia-northeast1"

echo "Checking GCP configuration..."
gcloud config set project $PROJECT_ID

echo "Enabling Google Cloud Services..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com

echo "--------------------------------------------------"
echo "API Setup Complete."
echo "--------------------------------------------------"
