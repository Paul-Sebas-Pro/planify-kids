#!/bin/sh
set -e

echo "[api:prod] Synchronisation schéma Prisma..."
pnpm --filter @planify-kids/api exec prisma db push --accept-data-loss

echo "[api:prod] Démarrage..."
exec node apps/api/dist/server.js
