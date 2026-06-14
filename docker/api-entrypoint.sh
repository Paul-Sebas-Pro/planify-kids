#!/bin/sh
set -e

echo "[api] Génération du client Prisma..."
pnpm --filter @planify-kids/api exec prisma generate

echo "[api] Synchronisation du schéma Prisma..."
pnpm --filter @planify-kids/api exec prisma db push --accept-data-loss

echo "[api] Démarrage du serveur de développement..."
exec pnpm --filter @planify-kids/api dev
