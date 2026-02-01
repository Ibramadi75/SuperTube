#!/bin/sh
set -e

# Default token if not set
WEBHOOK_TOKEN="${WEBHOOK_TOKEN:-changeme}"

# Generate hooks.json from template
sed "s/WEBHOOK_TOKEN_PLACEHOLDER/$WEBHOOK_TOKEN/g" \
  /etc/webhook/hooks.template.json > /etc/webhook/hooks.json

echo "Webhook started with token: ${WEBHOOK_TOKEN:0:4}****"

# Start webhook
exec webhook -hooks /etc/webhook/hooks.json -verbose
