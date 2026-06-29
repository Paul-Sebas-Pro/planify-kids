# ── Stage 1 : build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/types ./packages/types
COPY apps/web ./apps/web

# Build Vite (typecheck + bundle)
RUN pnpm --filter @planify-kids/web build

# ── Stage 2 : runner nginx ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Template nginx — envsubst remplace ${API_URL} au démarrage (image nginx officielle)
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

# Valeur par défaut pour docker-compose (écrasé par env var en prod Fly.io)
ENV API_URL=http://api:3000

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
