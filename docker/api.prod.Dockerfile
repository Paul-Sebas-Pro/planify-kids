# ── Stage 1 : dépendances ────────────────────────────────────────────────────
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ── Stage 2 : build ──────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY packages/types ./packages/types
COPY apps/api ./apps/api

# Générer le client Prisma (URL fictive — generate ne touche pas la DB)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm --filter @planify-kids/api db:generate

# Compiler TypeScript → dist/
RUN pnpm --filter @planify-kids/api build

# Supprimer les devDependencies (garde .prisma/client intact car non géré par pnpm)
RUN pnpm prune --prod --no-optional

# ── Stage 3 : runner de production ───────────────────────────────────────────
FROM node:24-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

WORKDIR /app
ENV NODE_ENV=production

# Workspace config (pour pnpm scripts dans entrypoint)
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# node_modules purgés + client Prisma généré
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Sources compilées
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Schéma Prisma (pour db:push au démarrage)
COPY apps/api/src/prisma/schema.prisma ./apps/api/src/prisma/schema.prisma
COPY apps/api/prisma.config.ts ./apps/api/prisma.config.ts

COPY docker/api-prod-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
