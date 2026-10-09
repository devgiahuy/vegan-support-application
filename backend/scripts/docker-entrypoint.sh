#!/bin/sh
set -eu

run_seed="${RUN_SEED:-true}"
case "$run_seed" in
  true|false) ;;
  *)
    echo "[startup] RUN_SEED must be true or false." >&2
    exit 1
    ;;
esac

echo "[startup] Applying MongoDB schema..."
node scripts/mongo-schema.mjs

if [ "$run_seed" = "true" ]; then
  echo "[startup] Running database seed..."
  node dist-seed/prisma/seed.js
  echo "[startup] Database seed completed."
else
  echo "[startup] Database seed skipped (RUN_SEED=false)."
fi

echo "[startup] Starting API..."
exec node dist/server.js
