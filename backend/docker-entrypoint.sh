#!/bin/sh
# Container entrypoint: apply DB migrations, optionally seed demo data, start server.
# The app service `depends_on` postgres with condition: service_healthy, so the
# database is reachable by the time this runs.
set -e

echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

if [ "$DEMO_MODE" = "true" ]; then
  echo "[entrypoint] DEMO_MODE=true → seeding demo data (idempotent)..."
  node seed_superadmin.js || echo "[entrypoint] seed_superadmin skipped/failed (continuing)"
  node seed_pricebook.js  || echo "[entrypoint] seed_pricebook skipped/failed (continuing)"
  node seed_jobs.js       || echo "[entrypoint] seed_jobs skipped/failed (continuing)"
fi

echo "[entrypoint] Starting server on port ${PORT:-3001}..."
exec node server.js
