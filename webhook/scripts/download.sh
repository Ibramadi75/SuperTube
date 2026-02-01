#!/bin/sh
URL="$1"

if [ -z "$URL" ]; then
  echo "Error: URL is required"
  exit 1
fi

# Call SuperTube API
curl -s -X POST "http://supertube:80/api/downloads" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}"
