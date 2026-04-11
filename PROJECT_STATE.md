# PROJECT_STATE.md - Planify Kids

## 📊 Vue d'ensemble

- **Projet**: Planify Kids
- **Version**: 0.1.0
- **Démarré le**: 2026-04-08
- **Statut**: En développement — Sprint 1 terminé / Sprint 2 à planifier

---

## 🗓 Sessions de Développement

### Session 3 - 2026-04-11

**Objectif**: Sprint 1 frontend — UI Admin minimal (S1-10/11/12)

**Concepts introduits**:

- **Zustand `persist`** : `persist(...)` de `zustand/middleware` — stocke le token dans `localStorage` sous la clé `"auth-store"` ; `api.ts` le lit directement sans couplage au store
- **TanStack Query + mutations** : `useMutation` avec `onSuccess` invalide le `queryKey` correspondant — pattern `qc.invalidateQueries({ queryKey: [...] })`
- **`RequireAuth` guard** : Composant wrapper qui lit `isAuthenticated()` depuis le store et redirige sur `/login` si faux ; utilisé comme `element` sur les routes imbriquées
- **Proxy Vite** : `vite.config.ts` reroute `/api/*` vers le backend — `api.ts` utilise `/api` comme base sans exposer l'URL réelle
- **Tailwind v4 CSS custom properties** : `rounded-(--radius-button)` au lieu de `rounded-[var(--radius-button)]` — syntaxe native v4

**Modifications**:

```diff
+ apps/web/src/services/api.ts              (client fetch typé — auth, members, tasks)
+ apps/web/src/store/auth.store.ts          (Zustand persist — token, user, family, member)
+ apps/web/src/features/auth/LoginPage.tsx  (formulaire login + redirect)
+ apps/web/src/features/dashboard/DashboardPage.tsx (stats + cartes enfants)
+ apps/web/src/features/family/FamilyPage.tsx       (CRUD membres avec modale)
+ apps/web/src/features/tasks/TasksPage.tsx         (CRUD tâches + toggle inactives)
+ apps/web/src/components/layout/AppLayout.tsx      (sidebar nav + déconnexion)
M apps/web/src/app/routes.tsx              (RequireAuth + routes imbriquées)
```

**Décisions d'architecture**:

- **Token lu depuis localStorage** : `api.ts` parse `"auth-store"` directement — évite d'importer le store Zustand dans un module non-React
- **`isActive` toggle** : checkbox visible uniquement en mode édition ; la création part toujours sur `isActive: true`
- **Suppression membre courant bloquée côté UI** : le bouton "Supprimer" est masqué si `m.id === currentMember?.id` (protection miroir du backend)

**Tests ajoutés**: Aucun (à faire — Sprint 1 definition of done)

---

### Session 2 - 2026-04-10

**Objectif**: Sprint 1 backend — Auth + CRUD Members + CRUD Tasks

**Concepts introduits**:

- **Prisma v7 + adapter** : Instanciation obligatoire via `PrismaPg` (`@prisma/adapter-pg`) — `new PrismaClient({ adapter })` au lieu de la connection string directe
- **Prisma.TransactionClient** : Type correct pour le callback `$transaction` — `import type { Prisma } from "@prisma/client"` ; erreur IDE résolue après `prisma generate`
- **Zod v4** : `z.email()` en top-level (plus `z.string().email()`), `z.iso.date()` pour les dates ISO
- **`requireRole` middleware** : Factory Hono qui vérifie le rôle JWT avant d'accéder à une route — à passer après `authMiddleware`
- **Multi-tenant guard** : Toutes les queries Prisma incluent `familyId` issu du JWT — jamais depuis le body

**Modifications**:

```diff
M apps/api/package.json          (+ @hono/zod-validator, prisma.schema path, @prisma/adapter-pg)
M apps/api/src/config/database.ts (pattern PrismaPg adapter v7)
M apps/api/src/app.ts            (montage /auth, /family/members, /tasks)
+ apps/api/src/modules/auth/auth.schema.ts
+ apps/api/src/modules/auth/auth.repository.ts  (transaction User+Family+Member)
+ apps/api/src/modules/auth/auth.service.ts     (Argon2 + JWT)
+ apps/api/src/modules/auth/auth.routes.ts      (register, login, me)
+ apps/api/src/modules/members/members.schema.ts
+ apps/api/src/modules/members/members.repository.ts
+ apps/api/src/modules/members/members.service.ts
+ apps/api/src/modules/members/members.routes.ts
+ apps/api/src/modules/tasks/tasks.schema.ts
+ apps/api/src/modules/tasks/tasks.repository.ts
+ apps/api/src/modules/tasks/tasks.service.ts
+ apps/api/src/modules/tasks/tasks.routes.ts
```

**Décisions d'architecture**:

- **familyId depuis JWT** : Jamais depuis le body de la requête — évite toute usurpation multi-tenant
- **`isActive` filtre par défaut** : `GET /tasks` ne retourne que les tâches actives ; `?all=true` pour tout voir
- **Auto-suppression bloquée** : Un membre ne peut pas se supprimer lui-même (`userId === requesterId`)
- **Transaction atomique register** : `User + Family + FamilyMember` créés dans une seule transaction Prisma

**Tests ajoutés**: Aucun (à ajouter — Sprint 1 definition of done)

---

### Session 1 - 2026-04-08

**Objectif**: Design system + Setup monorepo

**Concepts introduits**:

- **Pencil MCP** : Les instances `ref` doivent utiliser l'ID Pencil généré (ex. `ref:"VViOQ"`), pas l'ID custom
- **Tailwind CSS v4** : Config via `@theme {}` dans globals.css — plus de `tailwind.config.js`
- **pnpm workspaces** : Monorepo avec `workspace:*` pour les packages internes
- **Hono** : `app.onError()` reçoit `(err, c)` — différent d'Express

**Modifications**:

```diff
+ design/global-design.pen
+ design/components.pen
+ design/pages.pen
+ package.json + pnpm-workspace.yaml + .env.example + .gitignore
+ apps/api/  (fondation : Hono, Prisma schema 10 modèles, middlewares)
+ apps/web/  (fondation : Vite, Tailwind v4, React Router v7)
+ packages/types/src/  (auth, family, task, planning)
```

**Décisions d'architecture**:

- **Hono over Express** : Edge-compatible, plus léger, meilleure DX TypeScript
- **Bunny Fonts** : Vie privée + RGPD vs Google Fonts — `@import url(bunny)` dans CSS uniquement

---

## 📦 Features Complétées

- [x] **Design System** (Session 1) — global-design.pen
- [x] **Composants UI** (Session 1) — components.pen
- [x] **Maquettes écrans** (Session 1) — pages.pen (5 écrans)
- [x] **Monorepo setup** (Session 1) — pnpm workspaces
- [x] **Fondation API** (Session 1) — Hono, Prisma schema, middlewares
- [x] **Fondation Web** (Session 1) — Vite, Tailwind v4, React Router
- [x] **Auth backend** (Session 2 — S1-4/5/6) — register, login, JWT middleware
- [x] **CRUD Members** (Session 2 — S1-7) — list, create, update, delete
- [x] **CRUD Tasks** (Session 2 — S1-8/9) — list, create, update, delete
- [x] **UI Admin minimal** (Session 3 — S1-10/11/12) — Login, Dashboard, Family, Tasks

---

## 📋 Routes API disponibles

| Méthode | Route               | Auth | Rôle   |
| ------- | ------------------- | ---- | ------ |
| POST    | /auth/register      | Non  | —      |
| POST    | /auth/login         | Non  | —      |
| GET     | /auth/me            | Oui  | any    |
| GET     | /family/members     | Oui  | any    |
| POST    | /family/members     | Oui  | PARENT |
| PATCH   | /family/members/:id | Oui  | PARENT |
| DELETE  | /family/members/:id | Oui  | PARENT |
| GET     | /tasks              | Oui  | any    |
| POST    | /tasks              | Oui  | PARENT |
| PATCH   | /tasks/:id          | Oui  | PARENT |
| DELETE  | /tasks/:id          | Oui  | PARENT |

---

## 🔧 Versions réelles (post pnpm install)

| Package                 | Version résolue |
| ----------------------- | --------------- |
| Node                    | ≥24             |
| pnpm                    | ≥10             |
| TypeScript              | 6.x             |
| Hono                    | 4.12            |
| @hono/node-server       | 1.19            |
| @hono/zod-validator     | 0.4             |
| Prisma / @prisma/client | 7.7             |
| @prisma/adapter-pg      | 7.7             |
| Mongoose                | 9.4             |
| Argon2                  | 0.44            |
| node-cron               | 4.2             |
| Zod                     | 4.3             |
| Vitest                  | 4.1             |
| React                   | 19.2            |
| React Router            | 7.14            |
| TanStack Query          | 5.96            |
| Zustand                 | 5.0             |
| Vite                    | 8.0             |
| Tailwind CSS            | 4.2             |

---

## 🐛 Bugs Résolus

- **[2026-04-10]** `tx: any` dans `prisma.$transaction` → `Prisma.TransactionClient` (erreur IDE résolue après `prisma generate`)
- **[2026-04-10]** `database.ts` sans adapter → pattern Prisma v7 `PrismaPg` obligatoire pour PostgreSQL

---

## 📝 Notes techniques

### Prisma v7 — instanciation

```ts
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

Le client Prisma ne génère pas ses types avant `prisma generate` — les erreurs IDE "module @prisma/client n'exporte pas X" disparaissent après cette commande.

### Zod v4 — changements utilisés

- `z.email()` → top-level (remplace `z.string().email()`)
- `z.iso.date()` → validation date ISO 8601
- `z.enum([...]).default(...)` → identique v3

### Pattern multi-tenant

Toutes les queries Prisma qui touchent des données famille passent `familyId` issu de `c.get("user").familyId` (JWT). Jamais depuis `c.req.body`.
