#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: ./deploy.sh PROJECT_ID [REGION]"
  exit 1
fi

if [[ -z "${DB_HOST:-}" || -z "${DB_USER:-}" || -z "${DB_PASSWORD:-}" || -z "${BACKEND_URL:-}" ]]; then
  echo "Set DB_HOST, DB_USER, DB_PASSWORD, and BACKEND_URL before running this script."
  exit 1
fi

SHORT_SHA="${SHORT_SHA:-$(git rev-parse --short HEAD)}"
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/crm-backend:${SHORT_SHA}"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/crm-frontend:${SHORT_SHA}"

gcloud config set project "$PROJECT_ID"

echo "Building container images..."
gcloud builds submit --config cloudbuild.yaml .

echo "Deploying backend to Cloud Run..."
gcloud run deploy crm-backend \
  --image "$BACKEND_IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DB_HOST="$DB_HOST",DB_USER="$DB_USER",DB_PASSWORD="$DB_PASSWORD",DB_NAME=crm,ADMIN_EMAIL="${ADMIN_EMAIL:-admin@crm.local}"

echo "Deploying frontend to Cloud Run..."
gcloud run deploy crm-frontend \
  --image "$FRONTEND_IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NUXT_PUBLIC_API_BASE="$BACKEND_URL"

echo "Deployment complete."
