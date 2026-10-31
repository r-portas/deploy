#!/usr/bin/env bash
# Pulls the latest changes, then rebuilds and restarts the app.
set -euo pipefail

# Run from the repo root regardless of where the script is invoked from
cd "$(dirname "$0")"

git pull --ff-only

# --build is needed since the image is built from source, `up -d` alone reuses the old image
docker compose up -d --build

# Drop the previous image, which is left dangling after a rebuild
docker image prune -f
