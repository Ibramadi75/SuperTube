#!/bin/sh
set -e

# Start .NET API in background
dotnet SuperTube.Api.dll &

# Start nginx in foreground
nginx -g "daemon off;"
