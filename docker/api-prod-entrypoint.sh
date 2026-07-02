#!/bin/sh
set -e

echo "[api:prod] Synchronisation schéma Prisma..."
/app/node_modules/.bin/prisma db push \
  --schema /app/apps/api/src/prisma/schema.prisma \
  --accept-data-loss

echo "[api:prod] Démarrage..."
exec node apps/api/dist/server.js
