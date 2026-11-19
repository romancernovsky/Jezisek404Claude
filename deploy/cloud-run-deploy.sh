#!/usr/bin/env bash
# Deploy Ježíšek 404 to Google Cloud Run (builds the Dockerfile with Cloud Build).
#
#   PROJECT=my-project REGION=europe-west3 ./deploy/cloud-run-deploy.sh
#
# Optional variables:
#   SERVICE        Cloud Run service name                (default: jezisek-404)
#   REGION         Region (europe-west3 = Frankfurt, europe-central2 = Warsaw)  (default: europe-west3)
#   PUBLIC_URL     Custom domain for the QR code, e.g. https://xmas.example.com/ (default: the service URL)
#   PIN_SECRET     Secret Manager secret holding the host PIN (default: jezisek-host-pin; created if missing)
#   STATE_BUCKET   GCS bucket to persist show state across restarts (optional, recommended for the event)
#   SERVICE_ACCOUNT Runtime service account (default: the project's default compute service account)
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="${PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-europe-west3}"
SERVICE="${SERVICE:-jezisek-404}"
PIN_SECRET="${PIN_SECRET:-jezisek-host-pin}"
[ -n "$PROJECT" ] || { echo "Set PROJECT=<gcp-project-id> (or gcloud config set project …)"; exit 1; }
gcloud config set project "$PROJECT" >/dev/null

echo "▶ Enabling APIs (Cloud Run, Cloud Build, Artifact Registry, Secret Manager)…"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com >/dev/null

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
SA="${SERVICE_ACCOUNT:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"

echo "▶ Host PIN secret: $PIN_SECRET"
if ! gcloud secrets describe "$PIN_SECRET" >/dev/null 2>&1; then
  read -r -s -p "  Choose a host PIN (digits, used to open /host): " PIN; echo
  [ -n "$PIN" ] || { echo "PIN must not be empty"; exit 1; }
  printf '%s' "$PIN" | gcloud secrets create "$PIN_SECRET" --replication-policy=automatic --data-file=- >/dev/null
fi
gcloud secrets add-iam-policy-binding "$PIN_SECRET" --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor >/dev/null

EXTRA=()
if [ -n "${STATE_BUCKET:-}" ]; then
  echo "▶ Persisting show state in gs://$STATE_BUCKET"
  gcloud storage buckets describe "gs://$STATE_BUCKET" >/dev/null 2>&1 || gcloud storage buckets create "gs://$STATE_BUCKET" --location="$REGION" --uniform-bucket-level-access >/dev/null
  gcloud storage buckets add-iam-policy-binding "gs://$STATE_BUCKET" --member="serviceAccount:$SA" --role=roles/storage.objectUser >/dev/null
  EXTRA+=(--execution-environment gen2 --add-volume "name=state,type=cloud-storage,bucket=$STATE_BUCKET" --add-volume-mount "volume=state,mount-path=/app/data")
fi
ENV_VARS="NODE_ENV=production"
[ -n "${PUBLIC_URL:-}" ] && ENV_VARS="$ENV_VARS,PUBLIC_URL=$PUBLIC_URL"

# Why these flags:
#  --max-instances 1     votes and show state live in ONE process (never split the audience across instances)
#  --min-instances 1     no cold start, state stays in memory between requests
#  --concurrency 1000    every phone/screen keeps one live (SSE) connection; default 80 would be far too low
#  --timeout 3600        live connections may stay open up to 60 min (clients reconnect automatically after)
#  --no-cpu-throttling   timers (heartbeats, vote broadcasts) keep running between requests
echo "▶ Building and deploying $SERVICE to $REGION…"
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --min-instances 1 --max-instances 1 \
  --concurrency 1000 --timeout 3600 \
  --cpu 1 --memory 512Mi --no-cpu-throttling \
  --session-affinity \
  --service-account "$SA" \
  --set-env-vars "$ENV_VARS" \
  --set-secrets "HOST_PIN=${PIN_SECRET}:latest" \
  "${EXTRA[@]}"

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo
echo "✅ Deployed: $URL"
echo "   Screen : $URL/screen?pin=<PIN>"
echo "   Host   : $URL/host"
echo "   Phones : ${PUBLIC_URL:-$URL/}"
echo "   Health : $(curl -fsS "$URL/healthz" 2>/dev/null || echo 'not reachable yet')"
echo
echo "After the event, stop paying for the always-on instance:"
echo "   gcloud run services update $SERVICE --region $REGION --min-instances 0   # or: gcloud run services delete $SERVICE --region $REGION"
