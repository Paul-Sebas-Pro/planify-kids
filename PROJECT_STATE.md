# PROJECT_STATE.md - Planify Kids

## 📊 Vue d'ensemble

- **Projet**: Planify Kids
- **Version**: 0.1.0
- **Démarré le**: 2026-04-08
- **Statut**: En développement — Sprint 1

---

## 🗓 Sessions de Développement

### Session 1 - 2026-04-08

**Objectif**: Design system + Setup monorepo

**Concepts introduits**:

- **Pencil MCP** : Outil de design .pen, les instances `ref` doivent utiliser l'ID Pencil généré (ex. `ref:"VViOQ"`), pas l'ID custom
- **Tailwind CSS v4** : Config via `@theme {}` dans globals.css — plus de `tailwind.config.js`
- **pnpm workspaces** : Monorepo avec `workspace:*` pour les packages internes
- **Hono** : `app.onError()` reçoit `(err, c)` — différent d'Express

**Modifications**:

```diff
+ design/global-design.pen     (design system : couleurs, typo, spacing, états)
+ design/components.pen        (boutons, avatar, task card, badge, reward card, plan cell)
+ design/pages.pen             (5 écrans : planning, tâches, badges, récompenses, admin)
+ package.json                 (root pnpm workspaces, Node ≥24, pnpm ≥10)
+ pnpm-workspace.yaml
+ .env.example
+ .gitignore
+ apps/api/package.json        (Hono 4, Prisma 7, Argon2, Zod 4, Vitest 4)
+ apps/api/tsconfig.json
+ apps/api/src/server.ts
+ apps/api/src/app.ts
+ apps/api/src/config/env.ts   (validation Zod des vars d'env)
+ apps/api/src/config/database.ts
+ apps/api/src/config/mongo.ts
+ apps/api/src/core/errors/AppError.ts
+ apps/api/src/core/middleware/error.middleware.ts
+ apps/api/src/core/middleware/auth.middleware.ts
+ apps/api/src/prisma/schema.prisma  (10 modèles + index)
+ apps/web/package.json        (React 19, Vite 8, Tailwind v4, React Router v7)
+ apps/web/tsconfig.json
+ apps/web/vite.config.ts
+ apps/web/index.html
+ apps/web/src/main.tsx
+ apps/web/src/app/providers.tsx
+ apps/web/src/app/routes.tsx
+ apps/web/src/styles/globals.css  (Bunny Fonts + tokens Tailwind v4)
+ packages/types/src/          (auth, family, task, planning)
M CLAUDE.md
M PROJECT_STATE.md
```

**Décisions d'architecture**:

- **Hono over Express** : Edge-compatible, plus léger, meilleure DX TypeScript
- **Prisma 7** : Version résolue par pnpm — plus récente que prévu (même API)
- **Zod v4** : Version résolue — API identique à v3 pour l'usage courant
- **Bunny Fonts** : Choix vie privée + RGPD vs Google Fonts
- **Fonts dans CSS** : `@import url(bunny)` dans globals.css, pas de `<link>` dans index.html

**Tests ajoutés**: Aucun (sprint 1 — setup uniquement)

---

## 📦 Features Complétées

- [x] **Design System** (Session 1) — global-design.pen
- [x] **Composants UI** (Session 1) — components.pen
- [x] **Maquettes écrans** (Session 1) — pages.pen (5 écrans)
- [x] **Monorepo setup** (Session 1) — pnpm workspaces
- [x] **Fondation API** (Session 1) — Hono, Prisma schema, middlewares
- [x] **Fondation Web** (Session 1) — Vite, Tailwind v4, React Router
- [ ] **Auth** (Sprint 1 — S1-4/5/6) — en cours
- [ ] **CRUD Famille** (Sprint 1 — S1-7)
- [ ] **CRUD Tâches** (Sprint 1 — S1-8/9)
- [ ] **UI Admin minimal** (Sprint 1 — S1-10/11/12)

---

## 🔧 Versions réelles (post pnpm install)

| Package | Version résolue |
| --- | --- |
| Node | ≥24 |
| pnpm | ≥10 |
| TypeScript | 6.x |
| Hono | 4.12 |
| @hono/node-server | 1.19 |
| Prisma / @prisma/client | 7.7 |
| Mongoose | 9.4 |
| Argon2 | 0.44 |
| node-cron | 4.2 |
| Zod | 4.3 |
| Vitest | 4.1 |
| React | 19.2 |
| React Router | 7.14 |
| TanStack Query | 5.96 |
| Zustand | 5.0 |
| Vite | 8.0 |
| Tailwind CSS | 4.2 |

---

## 🐛 Bugs Résolus

Aucun bug résolu pour l'instant.

---

## 📝 Notes techniques

### Prisma avec Hono/Node

Le `prisma.$connect()` est appelé explicitement dans `server.ts` au démarrage.
Le client est un singleton via `globalThis` pour éviter les connexions multiples en dev (hot-reload tsx).

### Zod v4 — changements notables

- `z.string().email()` — identique
- `z.object()` — identique
- `z.coerce.number()` — identique
- Performances améliorées, taille bundle réduite
