# PROJECT_STATE.md - Planify Kids

## 📊 Vue d'ensemble

- **Projet**: Planify Kids
- **Version**: 0.1.0
- **Démarré le**: 2026-04-08
- **Statut**: En développement — Sprint 3 en cours (App mobile Flutter — enfants)

---

## 🗓 Sessions de Développement

### Session 7 - 2026-06-13

**Objectif**: Sprint 3 — App mobile Flutter (vue enfant)

**Concepts introduits**:

- **Riverpod 3 naming** : `AuthNotifier` → provider nommé `authProvider` (pas `authNotifierProvider`) — convention sans suffixe `Notifier` dans Riverpod 3
- **Riverpod 3 AsyncValue** : `valueOrNull` supprimé → `.value` retourne `T?` nativement
- **PowerSync 2.x schema** : `Schema([...])` positionnel (pas `tables:`), `PowerSyncBackendConnector.fetchCredentials()` retourne `PowerSyncCredentials(endpoint, token)`
- **Flutter snap ARM64** : binaires officiels Linux x64 incompatibles ARM64 → `sudo snap install flutter --classic` résout sur WSL2 ARM64
- **Drift + PowerSync** : PowerSync gère sync + SQLite ; Drift utilisé pour définir le schéma et les DAO via `PowerSyncDatabase` comme exécuteur sous-jacent
- **build_runner Riverpod 3** : option `--delete-conflicting-outputs` supprimée, utiliser directement `flutter pub run build_runner build`

**Modifications**:

```diff
+ apps/mobile/                                  (projet Flutter créé via flutter create)
+ apps/mobile/lib/config/env.dart              (API_BASE_URL, POWERSYNC_URL via dart-define)
+ apps/mobile/lib/models/auth_user.dart
+ apps/mobile/lib/models/schedule_item.dart
+ apps/mobile/lib/models/badge.dart
+ apps/mobile/lib/models/exchange.dart
+ apps/mobile/lib/models/family_member.dart
+ apps/mobile/lib/database/schema.dart         (PowerSync schema — 6 tables)
+ apps/mobile/lib/database/connector.dart      (PlanifyConnector extends PowerSyncBackendConnector)
+ apps/mobile/lib/database/database.dart       (openAppDatabase — init + connect)
+ apps/mobile/lib/shared/services/secure_storage.dart
+ apps/mobile/lib/shared/services/api_client.dart  (Dio — auth, planning, badges, exchanges, stats)
+ apps/mobile/lib/shared/providers/providers.dart  (secureStorage, apiClient, powerSyncDatabase)
+ apps/mobile/lib/shared/theme/app_theme.dart  (Material 3, Fredoka + Nunito, couleur #6C63FF)
+ apps/mobile/lib/features/auth/auth_provider.dart     (AuthNotifier — login/logout)
+ apps/mobile/lib/features/auth/login_screen.dart
+ apps/mobile/lib/features/tasks/tasks_provider.dart   (todayTasks + TasksNotifier.markCompleted)
+ apps/mobile/lib/features/tasks/today_screen.dart
+ apps/mobile/lib/features/tasks/task_card.dart
+ apps/mobile/lib/features/badges/badges_provider.dart
+ apps/mobile/lib/features/badges/badges_screen.dart
+ apps/mobile/lib/features/exchanges/exchanges_provider.dart
+ apps/mobile/lib/features/exchanges/exchanges_screen.dart
+ apps/mobile/lib/features/profile/profile_provider.dart
+ apps/mobile/lib/features/profile/profile_screen.dart
+ apps/mobile/lib/app/shell_screen.dart        (NavigationBar 4 onglets)
+ apps/mobile/lib/app/router.dart              (GoRouter — redirect auth, ShellRoute)
+ apps/mobile/lib/app/app.dart
M apps/mobile/lib/main.dart
```

**Résultats**: `flutter analyze lib/` → 0 issue. Build runner → 66 outputs générés. App structure complète, prête pour flutter run.

---

### Session 6 - 2026-04-21

**Objectif**: Sprint 2 — Gamification (points/badges/récompenses) + Dashboard stats + Échanges de tâches

**Concepts introduits**:

- **Filtered relation count Prisma** : `_count: { select: { assignments: { where: { status: "COMPLETED" } } } }` — compte filtré sur une relation, disponible en Prisma v7
- **Guard anti-doublon échange** : vérification `getPendingExchangeForItem` avant création — évite deux échanges PENDING sur le même item
- **Réassignation atomique** : à l'acceptation d'un échange, `scheduleItem.assignedToMemberId` est mis à jour dans le même service call

**Modifications**:

```diff
+ apps/api/src/services/gamification.ts              (awardPointsForTask + checkAndAwardBadges)
+ apps/api/src/modules/rewards/rewards.schema.ts
+ apps/api/src/modules/rewards/rewards.repository.ts
+ apps/api/src/modules/rewards/rewards.service.ts
+ apps/api/src/modules/rewards/rewards.routes.ts
+ apps/api/src/modules/badges/badges.routes.ts       (GET /badges, GET /badges/member/:id)
+ apps/api/src/modules/exchanges/exchanges.schema.ts
+ apps/api/src/modules/exchanges/exchanges.repository.ts
+ apps/api/src/modules/exchanges/exchanges.service.ts
+ apps/api/src/modules/exchanges/exchanges.routes.ts
+ apps/api/src/modules/members/family.stats.routes.ts (GET /family/stats)
+ apps/api/src/prisma/seed.ts                        (7 badges par défaut)
+ apps/web/src/features/rewards/RewardsPage.tsx
+ apps/web/src/services/rewards.api.ts
+ packages/types/src/rewards.ts
+ packages/types/src/exchanges.ts
M apps/api/src/modules/planning/planning.repository.ts  (+ getScheduleItemWithTask)
M apps/api/src/modules/planning/planning.service.ts     (trigger gamification à la complétion)
M apps/api/src/app.ts                                   (+ rewards, badges, exchanges, family/stats)
M apps/web/src/features/dashboard/DashboardPage.tsx     (classement + badges par enfant)
M apps/web/src/features/planning/PlanningPage.tsx       (bouton Échanger + section échanges)
M apps/web/src/services/planning.api.ts                 (+ exchangesApi)
M apps/web/src/services/api.ts                          (+ familyApi.stats)
M apps/web/src/app/routes.tsx                           (+ /rewards)
M apps/web/src/components/layout/AppLayout.tsx          (+ nav Récompenses)
M packages/types/src/family.ts                          (+ FamilyStats, ChildStats)
M packages/types/src/index.ts                           (+ rewards, exchanges)
```

**Résultats**: `pnpm typecheck` passe sur api et web (0 erreur)

---

### Session 5 - 2026-04-12

**Objectif**: Sprint 2 — Planning greedy + routes API + page web + correctifs Prisma v7 + TypeScript strict

**Concepts introduits**:

- **Prisma v7 `prisma.config.ts`** : `url = env("DATABASE_URL")` supprimé du `datasource db {}` dans `schema.prisma` ; déplacé dans `prisma.config.ts` via `defineConfig` + `env()` de `"prisma/config"` (évite les erreurs TypeScript car le fichier est hors de `include: ["src/**/*"]`)
- **`exactOptionalPropertyTypes: true`** : Prisma génère les champs optionnels en `T | null`, Zod en `T | undefined` — incompatibles avec ce mode strict. Pattern : `?? null` pour CREATE, spreads conditionnels `...(field !== undefined && { field: value })` pour UPDATE
- **`vite-env.d.ts`** : `/// <reference types="vite/client" />` requis pour que tsc accepte les imports CSS dans un projet Vite

**Modifications**:

```diff
+ apps/api/src/services/planning-greedy.ts        (algo greedy pur — sans dépendance DB)
+ apps/api/src/modules/planning/planning.schema.ts
+ apps/api/src/modules/planning/planning.repository.ts
+ apps/api/src/modules/planning/planning.service.ts
+ apps/api/src/modules/planning/planning.routes.ts
+ apps/web/src/services/planning.api.ts
+ apps/web/src/features/planning/PlanningPage.tsx
+ apps/web/src/vite-env.d.ts
M apps/api/src/app.ts                             (+ route /planning)
M apps/api/src/prisma/schema.prisma               (suppression url= datasource)
M apps/api/prisma.config.ts                       (pointé vers src/prisma/schema.prisma + datasource url)
M apps/api/src/modules/members/members.repository.ts  (exactOptionalPropertyTypes fixes)
M apps/api/src/modules/tasks/tasks.repository.ts      (exactOptionalPropertyTypes fixes)
M apps/web/src/app/routes.tsx                     (+ /planning)
M apps/web/src/components/layout/AppLayout.tsx    (+ nav Planning)
M packages/types/src/planning.ts                  (Schedule, ScheduleDetail, ScheduleItemDetail)
```

**Résultats**: `pnpm typecheck` passe sur api et web (0 erreur)

---

### Session 4 - 2026-04-11

**Objectif**: Sprint 1 — Tests unitaires services (definition of done)

**Concepts introduits**:

- **`vi.mock()` avec factory** : `vi.mock("module", () => ({ fn: vi.fn() }))` — obligatoire quand le module a des dépendances transitives non disponibles (ex. `@prisma/client` non généré) ; sans factory, Vitest charge le module réel pour l'auto-mocker
- **Mocks ESM hoistés** : `vi.mock()` est hoistés en tête de fichier par Vitest — les appels sont évalués avant les imports, d'où la syntaxe `vi.mocked(fn)` après l'import

**Modifications**:

```diff
+ apps/api/vitest.config.ts
+ apps/api/src/modules/auth/auth.service.test.ts     (7 tests)
+ apps/api/src/modules/members/members.service.test.ts  (8 tests)
+ apps/api/src/modules/tasks/tasks.service.test.ts      (6 tests)
```

**Résultats**: 21/21 tests passent, durée ~250ms

---

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
- [x] **Tests unitaires services** (Session 4) — auth, members, tasks — 21 tests
- [x] **Planning greedy** (Session 5 — S2) — algo greedy, repository, service, routes `/planning`
- [x] **Page Planning web** (Session 5 — S2) — liste schedules + vue détail par jour + mise à jour statut
- [x] **Gamification** (Session 6 — S2) — points à la complétion, badges automatiques (POINTS + TASKS_COMPLETED), seed 7 badges
- [x] **CRUD Récompenses** (Session 6 — S2) — création/édition/suppression parent, demandes enfants, validation/refus parent
- [x] **Dashboard stats** (Session 6 — S2) — classement enfants par points, tâches complétées, badges par enfant
- [x] **Échanges de tâches** (Session 6 — S2) — proposition, acceptation/refus, réassignation automatique

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
| POST    | /planning/generate  | Oui  | PARENT |
| GET     | /planning           | Oui  | any    |
| GET     | /planning/:id       | Oui  | any    |
| PATCH   | /planning/items/:id | Oui  | any    |
| DELETE  | /planning/:id       | Oui  | PARENT |
| GET     | /family/stats       | Oui  | any    |
| GET     | /rewards            | Oui  | any    |
| POST    | /rewards            | Oui  | PARENT |
| PATCH   | /rewards/:id        | Oui  | PARENT |
| DELETE  | /rewards/:id        | Oui  | PARENT |
| GET     | /rewards/claims     | Oui  | PARENT |
| POST    | /rewards/:id/claim  | Oui  | any    |
| PATCH   | /rewards/claims/:id | Oui  | PARENT |
| GET     | /badges             | Oui  | any    |
| GET     | /badges/member/:id  | Oui  | any    |
| GET     | /exchanges          | Oui  | any    |
| POST    | /exchanges          | Oui  | any    |
| PATCH   | /exchanges/:id      | Oui  | any    |

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
