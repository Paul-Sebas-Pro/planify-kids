FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

WORKDIR /app

# Installer les dépendances (contexte monorepo)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --no-frozen-lockfile

# Copier les sources (remplacées par volume mount en dev)
COPY packages/types ./packages/types
COPY apps/web ./apps/web

EXPOSE 5173

CMD ["pnpm", "--filter", "@planify-kids/web", "dev"]
