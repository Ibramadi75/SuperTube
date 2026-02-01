#!/bin/sh
set -e

echo "Webhook started - Token verification via SuperTube API"
exec webhook -hooks /etc/webhook/hooks.json -verbose
