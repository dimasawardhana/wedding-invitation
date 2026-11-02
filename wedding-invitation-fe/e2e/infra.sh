#!/usr/bin/env bash
# Brings up the infrastructure the e2e suite needs: Postgres + MinIO (with the
# public uploads bucket) from the backend's compose file, plus a dedicated
# `wedding_e2e` database so test rows never touch development data.
#
# Idempotent: safe to re-run. Leaves containers running after the suite so the
# next run starts fast; `docker compose down` stops them.
set -euo pipefail

COMPOSE_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../wedding-invitation-be" && pwd)/docker-compose.yml"
E2E_DB="${E2E_DB:-wedding_e2e}"

echo "==> Starting Postgres + MinIO"
# Port collisions with other local stacks are handled by shifting the host-side
# mappings via env: DB_PORT, MINIO_API_PORT, MINIO_CONSOLE_PORT.
docker compose -f "$COMPOSE_FILE" up -d db minio minio-init

echo "==> Waiting for Postgres"
for _ in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> Ensuring database '$E2E_DB' exists"
if docker compose -f "$COMPOSE_FILE" exec -T db \
    psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$E2E_DB'" | grep -q 1; then
  echo "    already present"
else
  docker compose -f "$COMPOSE_FILE" exec -T db psql -U postgres -c "CREATE DATABASE $E2E_DB"
fi

echo "==> Infrastructure ready"
