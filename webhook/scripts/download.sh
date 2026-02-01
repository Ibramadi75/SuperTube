#!/bin/sh
URL="$1"
TOKEN="$2"

# Use API_URL env var or default to production URL
API_BASE="${API_URL:-http://supertube:80}"

if [ -z "$URL" ]; then
  echo '{"error": "URL is required"}'
  exit 1
fi

# Verify token via API
VERIFY_RESULT=$(curl -s -X POST "${API_BASE}/api/webhook/verify" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}")

# Check if valid
IS_VALID=$(echo "$VERIFY_RESULT" | grep -o '"valid":true')

if [ -z "$IS_VALID" ]; then
  echo '{"error": "Invalid or missing token"}'
  exit 1
fi

# Call SuperTube API to start download
curl -s -X POST "${API_BASE}/api/downloads" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}"
