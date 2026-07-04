# PROJECT_STATE.md - Planify Kids

## 📊 Vue d'ensemble

- **Projet**: Planify Kids
- **Version**: 0.1.0
- **Démarré le**: 2026-04-08
- **Statut**: Sprint 5 TERMINÉ — D1 ✅ D2 ✅ D3 ✅ D4 ✅
- **Last Session**: 2026-07-04 — Migration déploiement Fly.io → Vercel
- **Next Steps**: Redéployer (fix dépendances `hono` racine) → revérifier `/api/health` → seeder Supabase

---

## 🗺 Directions Sprint 5 — À prioriser

### Direction 1 — Finaliser l'app Flutter enfant ⭐ (recommandée)

**Contexte** : backend complet, design tablette fait (`pages-auth.pen`). App enfant démarre + tâches du jour fonctionnent. Manque :

- [x] **Screen récompenses** — liste récompenses + `POST /rewards/:id/claim` + mes demandes
- [x] **Screen notifications** — liste, marquer lu au tap, "Tout lire"
- [x] **Navigation 5 onglets** — Aujourd'hui · Récompenses · Échanges · Badges · Profil ; lien cloche profil → `/notifications`
- [~] **Vérification sync PowerSync** — scaffoldé ; non fonctionnel sans instance PowerSync cloud (reporté)
- [x] **UI polish** — design system tokens : seed #4CAF50, background #F5F7FB, card 20px, button 16px, Baloo 2 scores ; TaskCard 4 états ; TodayScreen bannière progression

**Valeur** : sans ça, les enfants ne peuvent pas utiliser l'app.

---

### Direction 2 — UX web parent — polish & responsive

- [x] **Empty states illustrés** — `EmptyState` component : emoji + titre + CTA ; Tasks, Rewards, Planning, Family
- [x] **Skeletons** — `SkeletonCard/List/StatCard` animate-pulse ; remplace "Chargement..." dans toutes les pages
- [x] **Responsive mobile** — sidebar drawer hamburger mobile + backdrop overlay ; padding adaptatif p-4/p-8
- [x] **PWA** — `vite-plugin-pwa` : manifest standalone, Workbox cache NetworkFirst `/api/*`, icône SVG maskable

**Valeur** : améliore l'expérience quotidienne des parents sur tous supports.

---

### Direction 3 — Features avancées

- [x] **Notifications push** — FCM opt-in : `firebase-admin` backend, `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` env vars ; `sendPushNotification()` no-op sans creds ; `notifyTasksAssigned()` crée notif in-app + push FCM par enfant après génération planning ; route `PATCH /family/members/:id/fcm-token` self-service ; Flutter `firebase_core` + `firebase_messaging` + `PushNotificationService` (skip si pas de config) ; plugin google-services Android conditionnel (`google-services.json` requis pour activer)
- [x] **Real-time SSE** — `GET /events` Hono streamSSE, pub/sub par familyId ; emit task_completed + claim_submitted ; frontend EventSource + invalidate queries + toast natif
- [x] **Challenges famille** — `FamilyChallenge` Prisma ; `GET/POST /challenges`, `PATCH /challenges/:id` ; check auto après attribution points ; ChallengesPage web + SSE `challenge_completed`
- [x] **Timeline enfant** — `GET /family/members/:id/timeline` (tâches + badges + claims agrégés) ; `MemberTimelineModal` web depuis FamilyPage ; `HistoryScreen` Flutter poussée depuis Profile

**Valeur** : engagement et rétention long terme.

---

### Direction 4 — Qualité & production-readiness

- [x] **Tests E2E Playwright** — scénarios critiques : auth (login/erreur/déconnexion) + planning (charge + génère) + rapport (sélecteur semaine + affichage) ; job CI `e2e` (needs: api+smoke+web) — build + preview + Playwright chromium
- [x] **Docker production** — multi-stage builds (3 stages API, 2 stages Web/nginx) ; `docker-compose.prod.yml` vars requises `:?` ; health checks `/health` + nginx ; `.env.prod.example` ; `pnpm prune --prod` stage runner
- [x] **Monitoring** — `requestLogger` middleware JSON (`ts/method/path/status/ms/familyId`) remplace Hono logger ; Sentry opt-in (`SENTRY_DSN` / `VITE_SENTRY_DSN`) — `initSentry()` no-op si absent ; `Sentry.ErrorBoundary` React avec fallback UI
- [x] **CI/CD deploy** — Vercel : `vercel.json` (`framework: null`, buildCommand avec `DATABASE_URL` fictive pour `prisma generate`, `outputDirectory: apps/web/dist`, rewrites `/api/*` → fonction) ; `api/index.ts` (Hono `handle`, `runtime: "nodejs"`, mount `/api`, init Sentry/Firebase/Prisma/Mongo) ; deploy automatique sur push main via intégration GitHub Vercel ; `pnpm-workspace.yaml` `onlyBuiltDependencies` étendu (@prisma/engines, @firebase/util, protobufjs) ; `binaryTargets: rhel-openssl-3.0.x` dans schema.prisma

**Valeur** : prépare le déploiement réel pour de vraies familles.

---

## 🚀 Déploiement Vercel — Procédure

**Architecture** :

- **Web** (React/Vite) → Vercel static site (`apps/web/dist`)
- **API** (Hono) → Vercel Serverless Function Node.js (`api/index.ts`) — routée via `vercel.json` rewrite `/api/*`
- **PostgreSQL** → Supabase (Session pooler port 5432)
- **MongoDB** → MongoDB Atlas

**Limitations à connaître** :

- `GET /events` (SSE) : timeout Serverless Function 10s (Hobby) → connexions SSE coupées, dégradé en polling TanStack Query
- Cron planning (`node-cron`) : ne tourne pas en serverless → génération semaine suivante manuelle via `POST /planning/generate` (Vercel Cron à implémenter ultérieurement)
- Node.js runtime : Vercel supporte max 22.x — le projet déclare `>=24` mais le code compilé tourne sur 22 sans problème

### Prérequis

- Compte Vercel (gratuit, sans CB)
- Projet **Supabase** créé
- **MongoDB Atlas** cluster disponible

### 1. PostgreSQL — Supabase

Récupère l'URI dans Supabase → **Settings → Database → Connection string → URI** (mode **Session pooler**, port **5432**) :

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

Si le mot de passe contient `@`, l'encoder en `%40`.

### 2. Synchroniser le schéma Supabase

```bash
# Depuis la racine du monorepo (à relancer après chaque modification schema.prisma)
DATABASE_URL="postgresql://..." pnpm --filter @planify-kids/api db:push --accept-data-loss
```

### 3. Seeder la base de données

```bash
DATABASE_URL="postgresql://..." MONGODB_URI="mongodb+srv://..." JWT_SECRET="..." \
  pnpm --filter @planify-kids/api db:seed
```

### 4. Connecter le dépôt GitHub à Vercel

1. Vercel → **Add New Project → Import Git Repository**
2. Sélectionner le dépôt GitHub
3. Vercel détecte automatiquement `vercel.json` à la racine
4. **Framework Preset** → choisir **Other** (pas Next.js)
5. Build command, output dir et install command sont pré-remplis depuis `vercel.json`

### 5. Configurer les variables d'environnement Vercel

Dans Vercel → **Settings → Environment Variables** (cocher Production + Preview + Development) :

| Variable       | Valeur                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `MONGODB_URI`  | `mongodb+srv://user:pass@cluster.mongodb.net/planify-kids`                                |
| `JWT_SECRET`   | Chaîne aléatoire 48+ chars (`openssl rand -base64 48`)                                    |
| `CORS_ORIGINS` | `https://[nom-projet].vercel.app`                                                         |

Variables optionnelles (opt-in) :

| Variable                | Valeur                           |
| ----------------------- | -------------------------------- |
| `SENTRY_DSN`            | DSN Sentry (opt-in)              |
| `VITE_SENTRY_DSN`       | DSN Sentry côté web (opt-in)     |
| `FIREBASE_PROJECT_ID`   | ID projet Firebase (opt-in, FCM) |
| `FIREBASE_CLIENT_EMAIL` | Client email Firebase (opt-in)   |
| `FIREBASE_PRIVATE_KEY`  | Clé privée Firebase (opt-in)     |

### 6. Déploiements — automatiques

Chaque `push` sur `main` déclenche :

1. CI GitHub Actions : `api` (typecheck + tests) + `smoke` + `web` + `e2e`
2. **Vercel** détecte le push et lance son propre build + deploy en parallèle

Les PRs génèrent automatiquement des preview deployments Vercel.

### URLs de production

- **Web + API** : `https://[nom-projet].vercel.app`
- **Health** : `https://[nom-projet].vercel.app/api/health`
- **API base** : `https://[nom-projet].vercel.app/api`

> Pour Flutter : `API_BASE_URL = "https://[nom-projet].vercel.app/api"`

### Monitoring

- Logs fonction : Vercel → **Functions** tab → `api/index`
- Sentry (si configuré) : ajouter `SENTRY_DSN` dans les env vars Vercel

---

## 📋 Backlog Sprint 4 — Features fonctionnelles

### 🔴 Priorité 1 — Notifications in-app

- [x] **Modèle `Notification` Prisma** — `{ id, memberId, familyId, type, message, readAt?, createdAt }` — migration
- [x] **Création auto notifications** — enfant complète tâche → notif PARENT ; APPROVED/REJECTED claim → notif enfant CHILD
- [x] **Routes API** — `GET /notifications` (non-lues en premier) + `PATCH /notifications/:id/read` + `PATCH /notifications/read-all`
- [x] **Web : cloche header** — badge nombre non-lus, dropdown liste, marquer lu au clic
- [x] **Flutter : badge NavigationBar** — indicateur non-lus sur onglet profil

### 🟠 Priorité 2 — Historique gamification (MongoDB)

- [x] **Log MongoDB events** — log `{ type, memberId, familyId, data, ts }` à chaque gain points ou badge décerné
- [x] **Route `GET /logs`** — `?memberId=&limit=50` — 50 derniers events du membre ou de la famille
- [x] **Web Dashboard : courbe points** — graphique évolution points 7 derniers jours par enfant (SVG polyline)

### 🟡 Priorité 3 — Gestion profil famille (parent)

- [x] **PATCH avatar + couleur enfant** — picker emoji + couleur dans modale FamilyPage web
- [x] **PATCH PIN enfant** — route `PATCH /family/members/:id/pin` (PARENT only) + modal PIN web
- [x] **PATCH nom famille** — route `PATCH /family` + page Paramètres web

### 🟢 Priorité 4 — Rapport hebdomadaire

- [x] **Route `GET /family/report`** — `?startDate=&endDate=` → agrégat : tâches complétées/skippées, points gagnés, badges obtenus, récompenses validées par enfant
- [x] **Web : page rapport** — sélecteur de semaine + tableau récapitulatif par enfant

---

## 📋 Backlog Sprint 3 (complété)

### 🔴 Priorité 1 — Mobile Flutter (Sprint 3 core)

- [x] **Flutter : premier lancement** — web target `http://localhost:8081`, login fonctionnel
- [x] **Auth enfant `POST /auth/login-child`** — familyCode DEMO01 + memberId + PIN ; Alice 1234 / Tom 5678
- [x] **Seed démo enrichi** — 4 tâches actives + planning semaine courante générés au seed
- [x] **Flutter : connexion API réelle** — login enfant → tâches du jour → marquer complété → points mis à jour
- [x] **Flutter : tests widget** — LoginScreen, TodayScreen, TaskCard

### 🟠 Priorité 2 — Web : génération planning (feature manquante critique)

- [x] **UI génération planning** — bouton "📅 Semaine courante" + modale startDate/endDate
- [x] **Visualisation calendrier** — vue semaine grille (lundi→dimanche), couleur par enfant, statut cliquable

### 🟡 Priorité 3 — Couverture tests API

- [x] **members.routes.test.ts** — GET/POST/PATCH/DELETE /family/members (RBAC parent/child) — 12 tests
- [x] **tasks.routes.test.ts** — GET/POST/PATCH/DELETE /tasks — 13 tests
- [x] **rewards.routes.test.ts** — CRUD rewards + claims flow — 18 tests
- [x] **badges.routes.test.ts** — GET /badges, GET /badges/member/:id — 4 tests

### 🟢 Priorité 4 — Qualité & infrastructure

- [x] **node-cron** — job `"1 0 * * *"` génère semaine suivante par famille, erreurs isolées
- [x] **Health route `/health`** — `{ status, db, mongo }` + HTTP 503 si dégradé
- [x] **Pagination** — `?limit` sur GET /planning (max 100) et GET /exchanges (max 200) + `?status` exchanges
- [x] **CI GitHub Actions** — jobs `api` (typecheck + test) + `web` (typecheck) sur push/PR → main

---

## 🗓 Sessions de Développement

### Session 20 - 2026-07-04

**Objectif**: Migration déploiement Fly.io → Vercel + Supabase

**Concepts introduits**:

- **Vercel monorepo pnpm** : `vercel.json` avec `"framework": null` (empêche la détection auto qui écrase `buildCommand`) + `buildCommand` / `outputDirectory` / `installCommand` explicites
- **`hono/vercel` adapter** : `handle(root)` + `export const config = { runtime: "nodejs" }` — runtime Node.js obligatoire pour les native addons (argon2, firebase-admin) ; Edge runtime les interdit
- **`DATABASE_URL` fictive au build** : `prisma.config.ts` valide `env("DATABASE_URL")` au chargement du module, même pendant `prisma generate` — fix : préfixer le buildCommand avec `DATABASE_URL=postgresql://build:build@localhost/build`
- **`onlyBuiltDependencies` pnpm** : pnpm 10 ignore les build scripts par sécurité — `@prisma/engines`, `prisma`, `@firebase/util`, `protobufjs` doivent être listés pour que Prisma génère son client
- **`binaryTargets` Prisma** : `["native", "rhel-openssl-3.0.x"]` pour compatibilité Lambda Amazon Linux 2023 (runtime Vercel/AWS)
- **Limitations Vercel Hobby** : SSE (`GET /events`) coupé à 10s (Lambda timeout) → dégradé en polling TanStack Query ; cron `node-cron` non fonctionnel en serverless → génération planning manuelle

**Modifications**:

```diff
+ vercel.json                               (framework null, buildCommand DATABASE_URL fictive, outputDirectory, rewrites /api/* + SPA)
+ api/index.ts                              (Hono handle Vercel, runtime nodejs, mount /api, init Sentry/Firebase/Prisma/Mongo)
M apps/api/src/prisma/schema.prisma         (+ binaryTargets native + rhel-openssl-3.0.x)
M pnpm-workspace.yaml                       (+ @prisma/engines, prisma, @firebase/util, protobufjs dans onlyBuiltDependencies)
M .github/workflows/ci.yml                  (suppression job deploy Fly.io — Vercel deploy géré nativement)
M PROJECT_STATE.md                          (procédure déploiement Vercel, D4 mis à jour)
D fly.api.toml, fly.web.toml               (Fly.io retiré)
D docker/api.prod.Dockerfile               (Docker prod retiré — Vercel gère le build)
D docker/web.prod.Dockerfile
D docker/api-prod-entrypoint.sh
D docker/nginx.conf, docker/nginx.conf.template
D docker-compose.prod.yml
M package.json                              (+ dependencies runtime dupliquées d'apps/api — hono, prisma, argon2, mongoose, firebase-admin… résolubles depuis /api/index.ts ; + "type": "module")
M pnpm-lock.yaml                            (pnpm install après ajout dependencies racine)
```

**Résultats**:

- Build Vercel #1 échoué : `PrismaConfigEnvError` (DATABASE_URL absente au build) + build scripts pnpm ignorés → fixes appliqués (commits précédents).
- Build Vercel #2 échoué : "No Output Directory named dist" → Root Directory dashboard réglé sur `api` par erreur → corrigé à `./` (racine repo), Output Directory `apps/web/dist` confirmé.
- Build Vercel #3 réussi (warnings TS non-bloquants sur extensions `.js`/imports — esbuild bundle sans typecheck strict, ignorés).
- Env vars configurées manuellement dans dashboard Vercel : `DATABASE_URL` (Supabase session pooler), `MONGODB_URI` (Atlas), `JWT_SECRET`, `CORS_ORIGINS`.
- `GET /api/health` → 500 `FUNCTION_INVOCATION_FAILED` : `Cannot find module 'hono'`. Cause : `api/index.ts` vit à la racine du repo, hors des workspaces pnpm ; `hono` (et toutes les deps runtime) déclarées uniquement dans `apps/api/package.json` → pnpm strict n'installe pas ces packages au `node_modules` racine → tracing Vercel (`@vercel/nft`) ne trouve pas le module. Fix : dupliquer les dependencies runtime d'`apps/api` dans le `package.json` racine + `pnpm install` (crée les symlinks `.pnpm` résolubles depuis `/api/index.ts`).
- Fix dépendances déployé → nouvelle erreur `/api/health` : 500 `FUNCTION_INVOCATION_FAILED`, `Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/apps/api/src/app.js from /var/task/api/index.js not supported`. Cause : `package.json` racine sans `"type": "module"` → Vercel compile `api/index.ts` en sortie CommonJS (défaut), mais `apps/api/src/app.js` est un vrai module ESM (`apps/api/package.json` a `"type": "module"`) → `require()` échoue sur cible ESM. Fix : `"type": "module"` ajouté au `package.json` racine (cohérent avec `api/index.ts` qui utilise déjà la syntaxe `import`).
- Fix `type: module` déployé → nouvelle erreur `/api/health` : 500 `FUNCTION_INVOCATION_FAILED`, `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/apps/api/src/config/env' imported from /var/task/apps/api/src/config/database.js`. Cause : Vercel transpile chaque `.ts` en `.js` sans bundler (pas d'esbuild) — le vrai loader ESM natif de Node exige une extension explicite sur tout import relatif (`node16`/`nextnode` moduleResolution), contrairement à un bundler qui la devine. Les erreurs TS "explicit file extensions" vues au build précédent (considérées non-bloquantes à tort) pointaient déjà ce problème. Fix : script Python ajoutant `.js` sur tous les imports relatifs sans extension dans `apps/api/src/**/*.ts` (~30 fichiers) ; `pnpm typecheck` 0 erreur + 122/122 tests après coup.
- Fix extensions déployé → `/api/health` timeout : `Vercel Runtime Timeout Error: Task timed out after 300 seconds`. Cause : `PrismaPg` (pg Pool) et `mongoose.connect` sans timeout de connexion configuré → hang indéfini si connexion réseau bloquée, jusqu'au max Vercel (au lieu d'échouer vite). Fix : `connectionTimeoutMillis: 8000` sur `PrismaPg`, `serverSelectionTimeoutMS: 8000` sur `mongoose.connect`.
- Décision session : reset complet Vercel (nouveau projet) + MongoDB Atlas (nouveau cluster, Network Access `0.0.0.0/0` dès la création) — Supabase conservé inchangé. Nouveau projet Vercel créé, domaine réutilisé `planify-kids-api.vercel.app`, env vars reconfigurées manuellement.
- Fix timeouts déployé → toujours 300s hang, mais log révèle la vraie cause : `WARN: default export returned a Response` — `export default handle(root)` traité par le runtime Node Vercel en mode legacy `(req, res) => void` (pas le mode Web fetch-style), le `Response` retourné par `handle()` est ignoré silencieusement → attend un `res.end()` qui n'arrive jamais → hang jusqu'à `maxDuration`. Les timeouts DB étaient inutiles : la requête n'atteignait jamais le client de toute façon. Fix : remplacer `export default handle(root)` par des exports nommés par méthode HTTP (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`OPTIONS`), pattern officiel Hono+Vercel pour le mode Web-standard.
- Prochain déploiement à vérifier : `/api/health` doit enfin retourner `{ status, db, mongo }`.

---

### Session 19 - 2026-06-28

**Objectif**: Sprint 5 D4 — Tests E2E Playwright + Docker production

**Concepts introduits**:

- **`preview.proxy` Vite** : `vite preview` n'a pas de proxy par défaut — ajout `preview.proxy` identique à `server.proxy` pour que le build servi via `vite preview` route `/api/*` vers l'API `:3000`
- **Job E2E CI `needs: [api, smoke, web]`** : E2E bloqué jusqu'à succès des 3 jobs amont — évite de lancer des tests browser si backend ou typecheck échouent
- **`getByLabel` Playwright nécessite `htmlFor`/`id`** : `<label>` sans `htmlFor` associé = `getByLabel` ne trouve pas l'input — fix LoginPage + `role="alert"` sur le paragraphe d'erreur
- **`getByText` strict mode** : si le texte existe en plusieurs éléments (nav + h2), Playwright strict mode = erreur — utiliser `getByRole("heading", ...)` pour cibler précisément
- **Docker prod 3 stages API** : `deps → builder (prisma generate + tsc + pnpm prune --prod) → runner` — `pnpm prune` garde `.prisma/client` (non géré par pnpm), supprime devDeps
- **`nginx.conf` SPA + SSE** : `try_files $uri $uri/ /index.html` pour React Router + `proxy_buffering off; proxy_read_timeout 3600s` pour SSE `/api/events`

**Modifications**:

```diff
+ apps/web/e2e/helpers.ts             (loginAs + DEMO_EMAIL/DEMO_PASSWORD)
+ apps/web/e2e/auth.spec.ts           (4 tests : login valide, erreur, redirect, déconnexion)
+ apps/web/e2e/planning.spec.ts       (3 tests : charge, génère, change statut)
+ apps/web/e2e/report.spec.ts         (3 tests : charge, affiche semaine courante, nav)
+ apps/web/playwright.config.ts       (baseURL env-aware, webServer local seulement)
M apps/web/package.json               (+ scripts e2e, e2e:ui)
M apps/web/vite.config.ts             (+ preview.proxy /api → :3000)
M apps/web/src/features/auth/LoginPage.tsx  (+ htmlFor/id labels + role="alert" error)
M .github/workflows/ci.yml            (+ job e2e : PG+Mongo services, seed, build preview, Playwright)
M .gitignore                          (+ playwright-report/ test-results/ .env.prod)
+ docker/api.prod.Dockerfile          (3 stages : deps → builder → runner node:24-alpine)
+ docker/web.prod.Dockerfile          (2 stages : builder vite → nginx:1.27-alpine)
+ docker/nginx.conf                   (SPA fallback + proxy /api/ + SSE + gzip + cache)
+ docker/api-prod-entrypoint.sh       (db:push + node dist/server.js)
+ docker-compose.prod.yml             (vars requises :?, health checks, restart: always)
+ .env.prod.example
```

**Résultats**: 10/10 tests Playwright ✅. typecheck API + Web 0 erreur. Docker prod prêt.

---

### Session 18 - 2026-06-26

**Objectif**: Sprint 4 P4 — Rapport hebdomadaire

**Concepts introduits**:

- **Agrégat multi-table sans `groupBy` Prisma** : 4 `findMany` parallèles (FamilyMember, ScheduleItem, MemberBadge, RewardClaim) scopés `familyId`, agrégation JS — plus lisible et type-safe que `groupBy` Prisma avec relations
- **`z.iso.date()` Zod v4 pour query params** : validation `startDate`/`endDate` via `querySchema.safeParse(c.req.query(...))` — pattern cohérent avec la validation body existante
- **`date lte endDate + T23:59:59.999Z`** : filtre inclusif fin de journée — évite de rater les items créés en cours de journée

**Modifications**:

```diff
+ packages/types/src/report.ts                              (ChildReport + WeeklyReport)
M packages/types/src/index.ts                               (+ export report.js)
+ apps/api/src/modules/members/family.report.routes.ts      (GET /family/report — 4 queries parallèles + agrégat)
M apps/api/src/app.ts                                       (+ /family/report avant /family)
+ apps/web/src/services/report.api.ts                       (reportApi.get)
+ apps/web/src/features/report/ReportPage.tsx               (sélecteur semaine + tableau récapitulatif)
M apps/web/src/app/routes.tsx                               (+ /report)
M apps/web/src/components/layout/AppLayout.tsx              (+ nav "Rapport")
```

**Résultats**: 122/122 tests. typecheck API + Web : 0 erreur. Sprint 4 complet.

---

### Session 17 - 2026-06-25

**Objectif**: Sprint 4 P3 — Gestion profil famille (avatar, couleur, PIN enfant, nom famille)

**Concepts introduits**:

- **`PATCH /:id/pin` après `PATCH /:id`** : Hono — `/:id/pin` a un segment `/pin` littéral supplémentaire, pas de conflit avec `/:id` même si déclaré après ; l'ordre des routes n'a pas d'impact ici
- **Mongoose 9 `Model<T>` vs `ReturnType<typeof model<T>>`** : contrainte générique renforcée en Mongoose 9 — `model<T>` attend `T extends Schema` dans le type `ReturnType` ; fix : typer l'export `const X: Model<I> = (models["X"] as Model<I>) ?? model<I>("X", schema)`
- **Zod v4 `.regex(pattern, string)` déprécié** : le second argument doit être un objet `{ message: "..." }` — `.regex(/\d{4}/, { message: "..." })`
- **Zustand `setFamily` partiel** : `set((s) => ({ family: s.family ? { ...s.family, ...updated } : null }))` — met à jour uniquement `id` et `name` sans écraser les autres champs du store

**Modifications**:

```diff
M apps/api/src/modules/members/members.schema.ts      (+ updatePinSchema)
M apps/api/src/modules/members/members.repository.ts  (+ updateMemberPin — argon2.hash)
M apps/api/src/modules/members/members.service.ts     (+ updatePinService — vérifie CHILD + familyId)
M apps/api/src/modules/members/members.routes.ts      (+ PATCH /:id/pin PARENT only)
+ apps/api/src/modules/members/family.settings.routes.ts  (PATCH /family — nom famille, PARENT only)
M apps/api/src/app.ts                                 (+ mount /family → familySettingsRoutes)
M apps/api/src/config/gamification-log.model.ts       (fix Model<IGamificationLog> vs ReturnType<...>)
M apps/web/src/store/auth.store.ts                    (+ setFamily action)
M apps/web/src/services/api.ts                        (+ familyApi.update, membersApi.updatePin)
M apps/web/src/features/family/FamilyPage.tsx         (+ avatar picker emoji + bouton PIN → PinModal)
+ apps/web/src/features/settings/SettingsPage.tsx     (form nom famille, feedback "Enregistré ✓")
M apps/web/src/app/routes.tsx                         (+ /settings)
M apps/web/src/components/layout/AppLayout.tsx        (+ nav "Paramètres")
```

**Résultats**: 122/122 tests. typecheck API + Web : 0 erreur.

---

### Session 16 - 2026-06-25

**Objectif**: Sprint 4 P1 (Notifications in-app) + P2 (Historique gamification MongoDB)

**Concepts introduits**:

- **Notification Prisma** : enum `NotificationType` + modèle `Notification` (memberId, familyId, type, message, readAt?) — `db:push` suffit, pas de migration destructive
- **Hooks non-bloquants** : `GamificationLog.create(...).catch(() => {})` — MongoDB down ne casse pas le flow gamification
- **`build_runner --build-filter`** : `flutter pub run build_runner build --build-filter="lib/features/notifications/**"` — regénère uniquement les `.g.dart` ciblés, évite l'OOM complet
- **Riverpod 3 `.value`** : `ref.watch(provider).value?.where(...)` — `valueOrNull` supprimé en Riverpod 3
- **`vi.mock` chaîne de dépendances** : quand `service.ts` importe un autre module qui lui-même importe `@prisma/client`, le test doit mocker le module intermédiaire (pas seulement le repository) pour éviter `Cannot find module '.prisma/client/default'`
- **SVG polyline chart** : `viewBox + polyline points="x1,y1 x2,y2..."` — graphique courbe sans bibliothèque externe ; `yPos = PAD.top + chartH - (v / maxVal) * chartH` pour axe Y inversé

**Modifications**:

```diff
+ apps/api/src/modules/notifications/notifications.repository.ts  (getNotifications, markRead, markAllRead, createMany)
+ apps/api/src/modules/notifications/notifications.service.ts     (list, markRead, markAllRead, notifyTaskCompleted, notifyClaimReviewed)
+ apps/api/src/modules/notifications/notifications.routes.ts      (GET /notifications, PATCH /:id/read, PATCH /read-all)
+ apps/api/src/config/gamification-log.model.ts                   (Mongoose IGamificationLog — collection gamification_logs)
+ apps/api/src/modules/logs/logs.routes.ts                        (GET /logs?memberId=&limit= — family-scoped)
M apps/api/src/prisma/schema.prisma           (+ NotificationType enum + Notification model)
M apps/api/src/app.ts                         (+ /notifications + /logs)
M apps/api/src/modules/planning/planning.repository.ts  (getScheduleItemWithTask + member.name, task.name, schedule.familyId)
M apps/api/src/modules/planning/planning.service.ts     (notifyTaskCompleted après COMPLETED)
M apps/api/src/modules/rewards/rewards.repository.ts    (getClaimById + reward.name)
M apps/api/src/modules/rewards/rewards.service.ts       (notifyClaimReviewed après APPROVED/REJECTED)
M apps/api/src/modules/rewards/rewards.service.test.ts  (vi.mock notifications.service)
M apps/api/src/services/gamification.ts       (log POINTS_EARNED + BADGE_EARNED → MongoDB, non-bloquant)
M apps/api/package.json                       (+ db:push script)
+ packages/types/src/notifications.ts
+ packages/types/src/logs.ts
M packages/types/src/index.ts                 (re-export notifications + logs)
+ apps/web/src/services/notifications.api.ts
+ apps/web/src/services/logs.api.ts
+ apps/web/src/components/layout/NotificationBell.tsx  (badge, dropdown, mark-read, refetch 30s)
+ apps/web/src/features/dashboard/PointsChart.tsx      (SVG polyline 7j, légende, empty state)
M apps/web/src/components/layout/AppLayout.tsx   (header + NotificationBell)
M apps/web/src/features/dashboard/DashboardPage.tsx  (query /logs + PointsChart)
+ apps/mobile/lib/models/notification_item.dart
+ apps/mobile/lib/features/notifications/notifications_provider.dart  (+ .g.dart)
M apps/mobile/lib/shared/services/api_client.dart  (+ getNotifications, markNotificationRead, markAllNotificationsRead)
M apps/mobile/lib/app/shell_screen.dart            (badge non-lus sur onglet Profil via notificationsProvider)
```

**Résultats**: 122/122 tests. typecheck API + Web : 0 erreur. flutter analyze : 0 issue.

---

### Session 15 - 2026-06-17

**Objectif**: P3 tests routes CRUD + P4 qualité infrastructure

**Concepts introduits**:

- **RBAC en test** : override `authMiddleware.mockImplementationOnce` pour injecter rôle CHILD sur route PARENT → vérifie 403 sans toucher `requireRole`
- **Badges sans service layer** : `prisma` mocké avec `{ badge: { findMany: vi.fn() }, memberBadge: { findMany: vi.fn() } }` — seul cas où le mock `config/database` expose des méthodes nommées
- **Pagination `take` Prisma** : `Math.min(Math.max(Number(q ?? default), 1), max)` — robuste aux NaN/négatifs ; `take:` dans `findMany`
- **`Promise.allSettled` health** : `prisma.$queryRawUnsafe("SELECT 1")` + `mongoose.connection.readyState === 1` — aucun rejet si une DB down, status `"degraded"` + HTTP 503
- **node-cron isolation** : try/catch par famille — `AppError` (pas de tâches, pas d'enfants) ignorée, cron continue sur les autres familles
- **CI `pnpm/action-setup@v4`** : `version: 10` + `cache: pnpm` dans `setup-node` — 2 jobs parallèles `api` et `web`

**Modifications**:

```diff
+ apps/api/src/modules/members/members.routes.test.ts  (12 tests — CRUD + RBAC)
+ apps/api/src/modules/tasks/tasks.routes.test.ts      (13 tests — CRUD + RBAC + activeOnly)
+ apps/api/src/modules/rewards/rewards.routes.test.ts  (18 tests — CRUD + claims flow)
+ apps/api/src/modules/badges/badges.routes.test.ts    (4 tests — prisma mocké direct)
M apps/api/src/app.ts                                  (health : Prisma SELECT 1 + Mongo readyState)
M apps/api/src/modules/planning/planning.repository.ts (+ take limit, défaut 20)
M apps/api/src/modules/planning/planning.service.ts    (forward limit)
M apps/api/src/modules/planning/planning.routes.ts     (parse ?limit, max 100)
M apps/api/src/modules/planning/planning.routes.test.ts (assertion → 2 args)
M apps/api/src/modules/exchanges/exchanges.repository.ts (+ take + status filter)
M apps/api/src/modules/exchanges/exchanges.service.ts  (forward limit + status)
M apps/api/src/modules/exchanges/exchanges.routes.ts   (parse ?limit max 200 + ?status)
M apps/api/src/modules/exchanges/exchanges.routes.test.ts (assertion → 3 args)
M apps/api/src/server.ts                               (+ startPlanningCron après connect)
+ apps/api/src/services/planning-cron.ts               (cron "1 0 * * *", semaine suivante)
+ .github/workflows/ci.yml                             (jobs api + web)
```

**Résultats**: 122/122 tests. P3 + P4 complets. Backlog Sprint 3 entièrement soldé.

---

### Session 13 - 2026-06-16

**Objectif**: Sprint 3 — Fix API réelle Flutter + tests widget

**Concepts introduits**:

- **`getTodayItems` fix** : `GET /planning` retourne `_count.items` pas les items — corrigé pour appeler `GET /planning/:id` par schedule et filtrer par `assignedToMemberId` + date locale
- **`markCompleted` fix** : PATCH retourne item sans `task` embedded → `copyWith(status: 'COMPLETED')` local au lieu de remplacer par retour API
- **`GoRouterState.uri.path`** : go_router v17 — `matchedLocation` remplacé par `uri.path` dans `_selectedIndex`
- **Logout TodayScreen** : bouton déconnexion ajouté dans AppBar TodayScreen (toujours accessible sans navigation)
- **Tests widget Riverpod 3** : pattern `FakeNotifier extends RealNotifier` — accessible depuis test car classe publique ; `Completer<T>().future` pour état loading sans timer pending ; `setUpAll(() => initializeDateFormatting('fr_FR'))` obligatoire avant `DateFormat` avec locale ; `await tester.pump()` après `pumpWidget` pour laisser `build() async` résoudre avant interaction

**Modifications**:

```diff
M apps/mobile/lib/shared/services/api_client.dart   (getTodayItems → GET /planning/:id par schedule)
M apps/mobile/lib/features/tasks/tasks_provider.dart (markCompleted → copyWith local)
M apps/mobile/lib/app/shell_screen.dart             (ConsumerWidget, uri.path, sans double AppBar)
M apps/mobile/lib/features/tasks/today_screen.dart  (+ logout button)
+ apps/mobile/test/widget/task_card_test.dart        (5 tests)
+ apps/mobile/test/widget/today_screen_test.dart     (4 tests)
+ apps/mobile/test/widget/login_screen_test.dart     (5 tests)
```

**Résultats**: 14/14 tests widget passent. Sprint 3 P1 complet.

---

### Session 14 - 2026-06-16

**Objectif**: Sprint 3 P2 — Web : UI génération planning + visualisation calendrier semaine

**Concepts introduits**:

- **`fillCurrentWeek()`** : calcul lundi courant via `(getDay()+6)%7` → `setValue("startDate")` + `setValue("endDate")` — bouton "📅 Semaine courante" dans modale de génération
- **`WeekCalendar` composant** : grille CSS `gridTemplateColumns: repeat(N, minmax(0, 1fr))` max 7 colonnes — `getDaysInRange(start, end)` génère tableau de dates ; items groupés par `date.toISOString().slice(0,10)`
- **Status cycling** : `STATUS_NEXT = { PENDING: "COMPLETED", COMPLETED: "SKIPPED", SKIPPED: "PENDING" }` — clic sur badge chip appelle `PATCH /planning/items/:id` et invalide query
- **`STATUS_BG` / `STATUS_CHIP`** : maps Tailwind bg/text classes par statut — `PENDING: "bg-amber-50"`, `COMPLETED: "bg-emerald-50"`, `SKIPPED: "bg-slate-50"`
- **`min-w-140` Tailwind v4** : valeur canonique (pas `min-w-[560px]`) — évite warning classe arbitraire

**Modifications**:

```diff
M apps/web/src/features/planning/PlanningPage.tsx  (+ fillCurrentWeek, WeekCalendar composant, STATUS_* maps, getDaysInRange, suppression DIFFICULTY_DOTS/itemsByDate/formatDateLong)
```

**Résultats**: `pnpm typecheck` → 0 erreur. Vue calendrier grille opérationnelle. Status cycling fonctionnel.

---

### Session 12 - 2026-06-15

**Objectif**: Sprint 3 — Auth enfant (familyCode + PIN) + seed enrichi + LoginScreen Flutter

**Concepts introduits**:

- **`Family.code String? @unique`** : code court 6 caractères généré via `Math.random().toString(36).slice(2,8).toUpperCase()` à la création famille — `String?` pour compatibilité schema push sans reset DB
- **`FamilyMember.pin String?`** : hash Argon2 du PIN 4 chiffres — `String?` car PARENT n'a pas de PIN
- **`GET /auth/family-members?code=`** : route publique (sans JWT) — retourne liste enfants d'une famille par code court ; utilisée par Flutter avant saisie PIN
- **`POST /auth/login-child`** : `familyCode + memberId + pin` — vérifie famille, membre CHILD, argon2.verify ; JWT identique parent : `{ sub: memberId, familyId, role: "CHILD", memberId }`
- **`memberId` dans JWT** : payload enrichi — parent : `sub=userId, memberId=parentMember.id` ; enfant : `sub=memberId=memberId`. Rétrocompatible (routes utilisent seulement `familyId` + `role`)
- **Seed planning semaine** : calcul lundi courant via `dayOfWeek = getDay(); monday = today - ((dayOfWeek+6)%7)` — planning 7 jours créé au seed, alternance Alice/Tom par tâche
- **`_ChildLoginForm` Flutter** : flow en 2 étapes — code famille → `getChildrenByCode()` → `FilterChip` sélection membre → PIN → `loginChild()` ; `_ParentLoginForm` inchangé ; `TabBar` bascule entre les deux

**Modifications**:

```diff
M apps/api/src/prisma/schema.prisma          (+ Family.code String?, + FamilyMember.pin String?)
M apps/api/src/modules/auth/auth.schema.ts   (+ loginChildSchema)
M apps/api/src/modules/auth/auth.repository.ts (+ findFamilyByCode, findChildMember, randomFamilyCode)
M apps/api/src/modules/auth/auth.service.ts  (+ getFamilyMembersService, loginChildService ; generateTokens + memberId)
M apps/api/src/modules/auth/auth.routes.ts   (+ GET /auth/family-members, POST /auth/login-child)
M apps/api/src/core/middleware/auth.middleware.ts (JwtPayload + memberId)
M apps/api/src/prisma/seed.ts                (+ Family.code, PINs Alice/Tom, 4 tâches démo, planning semaine)
M apps/mobile/lib/shared/services/api_client.dart (+ getChildrenByCode, loginChild)
M apps/mobile/lib/features/auth/auth_provider.dart (+ loginChild())
M apps/mobile/lib/features/auth/login_screen.dart  (TabBar Parent/Enfant — _ChildLoginForm)
```

**Résultats**: `GET /auth/family-members?code=DEMO01` → Alice/Tom. `POST /auth/login-child` → JWT valide. Flutter `flutter analyze` → 0 issue. Login enfant opérationnel sur `http://localhost:8081`.

---

### Session 11 - 2026-06-15

**Objectif**: Sprint 3 — Diagnostic auth enfant + décision architecture

**Concepts introduits**:

- **Auth enfant sans User account** : Alice et Tom sont des `FamilyMember` sans `User` associé — pas de credentials email/password. L'app parent (web) et l'app enfant (mobile) ont des flux d'auth distincts.
- **Pattern `POST /auth/login-child`** : Route dédiée tablette — `familyCode` (code court de la famille) + `memberId` + `PIN` 4 chiffres. Pas d'email. Décision retenue vs option A (email enfant = friction inutile sur tablette).
- **`GET /planning` vs `GET /planning/:id`** : la liste retourne `_count.items` (pas le tableau) — items détaillés uniquement via la route par ID.

**Modifications**: Aucune (session de diagnostic et décision)

---

### Session 10 - 2026-06-14

**Objectif**: Sprint 3 — Fix API parsing + auth persistence + GoRouter redirect + Flutter web target

**Concepts introduits**:

- **API response envelope** : toutes les routes retournent `{ success, data }` — ajout de `_unwrap()` / `_unwrapList()` dans `ApiClient` ; `AuthUser.fromLoginData()` pour parser `data.member` + `data.family.id`
- **AuthNotifier storage pattern** : `build()` charge depuis `SharedPreferences` (via `SecureStorageService`) au lieu d'appeler `GET /auth/me` qui retourne payload JWT pas données membre
- **GoRouter keepAlive + refreshListenable** : `@Riverpod(keepAlive: true)` évite la recréation du GoRouter à chaque changement d'état auth ; `_AuthChangeNotifier` (ChangeNotifier) bride Riverpod → GoRouter refresh ; `ref.read(authProvider)` dans redirect évite la closure stale
- **flutter_secure_storage → shared_preferences** : mismatch GLib libsecret avec snap Flutter ARM64 — remplacé par `shared_preferences` pour le dev
- **GTK first-frame gate** : runner GTK conditionne `gtk_widget_show()` au signal `first-frame` qui ne se déclenche pas avec llvmpipe — supprimé, `gtk_widget_show_all()` appelé immédiatement
- **Flutter web target avec `kIsWeb` guard** : PowerSync/SQLite natif uniquement — `openAppDatabase()` skippé sur web, `ApiClient` (Dio HTTP) fonctionne sans DB
- **CORS multi-origines** : `CORS_ORIGINS` dans docker-compose nécessite liste CSV — ajout de `http://localhost:8081` pour le web Flutter

**Modifications**:

```diff
M apps/mobile/lib/models/auth_user.dart          (+ fromLoginData, toJson, fromStorageJson)
M apps/mobile/lib/shared/services/api_client.dart (+ _unwrap/_unwrapList, fix login parsing)
M apps/mobile/lib/shared/services/secure_storage.dart (flutter_secure_storage → shared_preferences)
M apps/mobile/lib/features/auth/auth_provider.dart   (build() charge depuis storage)
M apps/mobile/lib/features/auth/login_screen.dart    (gestion erreur réseau vs credentials)
M apps/mobile/lib/features/tasks/today_screen.dart   (ApiErrorWidget)
M apps/mobile/lib/features/badges/badges_screen.dart (ApiErrorWidget)
M apps/mobile/lib/features/exchanges/exchanges_screen.dart (ApiErrorWidget)
M apps/mobile/lib/app/router.dart                (keepAlive: true + refreshListenable + ref.read)
M apps/mobile/lib/app/router.g.dart             (isAutoDispose: false)
M apps/mobile/lib/main.dart                     (+ kIsWeb guard pour openAppDatabase)
M apps/mobile/pubspec.yaml                      (shared_preferences, plateforme linux)
+ apps/mobile/lib/shared/widgets/api_error_widget.dart (401 logout / réseau / générique)
+ apps/mobile/linux/                            (GTK runner — gtk_widget_show_all immédiat)
M docker-compose.yml                            (CORS_ORIGINS + http://localhost:8081)
```

**Résultats**: Login fonctionnel dans Chrome Windows via `http://localhost:8081` — Flutter web target opérationnel, auth persistée en SharedPreferences, redirect GoRouter sans boucle

---

### Session 9 - 2026-06-14

**Objectif**: Tests d'intégration routes HTTP (Option C backlog)

**Concepts introduits**:

- **`app.request()` Hono** : méthode native pour tester les routes HTTP sans serveur — `app.request("/path", { method, headers, body })` retourne une `Response` standard
- **Mock layer routes** : mock `config/env` + `config/database` + `config/mongo` (évite process.exit et connexions) + `auth.middleware` (injecte user) + service ciblé — isole le layer HTTP sans toucher Prisma
- **Zod v4 UUID strict** : `z.string().uuid()` enforce RFC 4122 — version nibble 1-5 (position 14), variant nibble 8-b (position 19) — UUIDs maison type `a0000000-0000-0000-...` rejetés

**Modifications**:

```diff
+ apps/api/src/modules/auth/auth.routes.test.ts      (8 tests — register/login/me)
+ apps/api/src/modules/planning/planning.routes.test.ts  (13 tests — generate/list/get/patch)
+ apps/api/src/modules/exchanges/exchanges.routes.test.ts (9 tests — list/propose/respond)
M PROJECT_STATE.md                                   (Session 8 + backlog priorisé)
```

**Résultats**: 75/75 tests passent (21 unitaires + 30 routes + existants), durée ~600ms

---

### Session 8 - 2026-06-14

**Objectif**: Infrastructure Docker dev + fixes ESM/Prisma

**Concepts introduits**:

- **Proxy Vite en container** : `VITE_API_URL` utilisé côté serveur Vite (proxy), pas client — doit pointer vers le service Docker (`http://api:3000`) et non `localhost`
- **`hostname: "0.0.0.0"` Hono** : `@hono/node-server` écoute `127.0.0.1` par défaut — inaccessible depuis l'extérieur du container sans ce paramètre
- **jsonwebtoken CJS → ESM** : `import { sign } from "jsonwebtoken"` échoue en ESM strict Node 24 — pattern correct : `import jwt from "jsonwebtoken"` puis `jwt.sign(...)`
- **pnpm 11 breaking** : corepack télécharge pnpm 11 si non pinné — pnpm 11 ignore le champ `pnpm` de `package.json` → pin via `"packageManager": "pnpm@10.30.1"` + migration `overrides`/`onlyBuiltDependencies` vers `pnpm-workspace.yaml`
- **`onlyBuiltDependencies`** : pnpm 10 bloque les scripts natifs par défaut — `esbuild` (binaire) et `argon2` (addon C++) requièrent déclaration explicite

**Modifications**:

```diff
+ docker-compose.yml                    (postgres:17, mongo:8, api, web — ports dynamiques via env)
+ docker/api.Dockerfile                 (Node 24 + pnpm@10.30.1 via corepack)
+ docker/web.Dockerfile                 (Node 24 + pnpm@10.30.1 via corepack)
+ docker/api-entrypoint.sh             (prisma generate → db push → tsx watch)
+ scripts/docker-dev.sh                (détection ports ss, allocation automatique, flags --build/--down/--logs/--seed)
+ .dockerignore
M apps/api/src/server.ts               (+ hostname: "0.0.0.0" pour accessibilité container)
M apps/web/vite.config.ts              (+ host: "0.0.0.0" + proxy cible http://api:3000)
M apps/api/src/modules/auth/auth.service.ts     (jwt default import)
M apps/api/src/core/middleware/auth.middleware.ts (jwt default import)
M apps/api/src/prisma/seed.ts          (+ compte démo demo@planify.kids / demo1234 + famille Demo)
M apps/api/package.json                (Prisma 7.7 → 7.8)
M package.json                         (+ packageManager: pnpm@10.30.1)
M pnpm-workspace.yaml                  (+ overrides + onlyBuiltDependencies: esbuild, argon2)
```

**Résultats**: `./scripts/docker-dev.sh` démarre les 4 services, web accessible sur <http://localhost:5173>, login fonctionnel avec <demo@planify.kids>

---

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
- [x] **App mobile Flutter scaffold** (Session 7 — S3) — auth, tâches, badges, échanges, profil — 0 issue flutter analyze
- [x] **Infrastructure Docker dev** (Session 8) — docker-compose, scripts/docker-dev.sh, ports dynamiques, seed démo
- [x] **Tests intégration routes HTTP** (Session 9) — auth/planning/exchanges — 75/75 tests, pattern mock service layer
- [x] **Auth enfant Flutter** (Sessions 11-12 — S3) — `POST /auth/login-child`, `GET /auth/family-members?code=`, PIN Argon2, seed Alice/Tom
- [x] **Fix API réelle Flutter** (Session 13 — S3) — getTodayItems `GET /planning/:id`, markCompleted copyWith local, uri.path go_router v17, logout button
- [x] **Tests widget Flutter** (Session 13 — S3) — LoginScreen (5), TodayScreen (4), TaskCard (5) — 14/14 passent
- [x] **Planning web — semaine courante + calendrier** (Session 14 — S3) — bouton fillCurrentWeek, WeekCalendar grille, status cycling

---

## 📋 Routes API disponibles

| Méthode | Route                        | Auth | Rôle   |
| ------- | ---------------------------- | ---- | ------ |
| POST    | /auth/register               | Non  | —      |
| POST    | /auth/login                  | Non  | —      |
| GET     | /auth/me                     | Oui  | any    |
| GET     | /family/members              | Oui  | any    |
| POST    | /family/members              | Oui  | PARENT |
| PATCH   | /family/members/:id          | Oui  | PARENT |
| DELETE  | /family/members/:id          | Oui  | PARENT |
| GET     | /family/members/:id/timeline | Oui  | any    |
| GET     | /tasks                       | Oui  | any    |
| POST    | /tasks                       | Oui  | PARENT |
| PATCH   | /tasks/:id                   | Oui  | PARENT |
| DELETE  | /tasks/:id                   | Oui  | PARENT |
| POST    | /planning/generate           | Oui  | PARENT |
| GET     | /planning                    | Oui  | any    |
| GET     | /planning/:id                | Oui  | any    |
| PATCH   | /planning/items/:id          | Oui  | any    |
| DELETE  | /planning/:id                | Oui  | PARENT |
| GET     | /family/stats                | Oui  | any    |
| GET     | /family/report               | Oui  | any    |
| PATCH   | /family                      | Oui  | PARENT |
| PATCH   | /family/members/:id/pin      | Oui  | PARENT |
| GET     | /rewards                     | Oui  | any    |
| POST    | /rewards                     | Oui  | PARENT |
| PATCH   | /rewards/:id                 | Oui  | PARENT |
| DELETE  | /rewards/:id                 | Oui  | PARENT |
| GET     | /rewards/claims              | Oui  | PARENT |
| GET     | /rewards/my-claims           | Oui  | any    |
| POST    | /rewards/:id/claim           | Oui  | any    |
| PATCH   | /rewards/claims/:id          | Oui  | PARENT |
| GET     | /badges                      | Oui  | any    |
| GET     | /badges/member/:id           | Oui  | any    |
| GET     | /exchanges                   | Oui  | any    |
| POST    | /exchanges                   | Oui  | any    |
| PATCH   | /exchanges/:id               | Oui  | any    |
| GET     | /notifications               | Oui  | any    |
| PATCH   | /notifications/read-all      | Oui  | any    |
| PATCH   | /notifications/:id/read      | Oui  | any    |
| GET     | /logs                        | Oui  | any    |
| GET     | /events                      | Oui  | any    |
| GET     | /challenges                  | Oui  | any    |
| POST    | /challenges                  | Oui  | PARENT |
| PATCH   | /challenges/:id              | Oui  | PARENT |

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
| Prisma / @prisma/client | 7.8             |
| @prisma/adapter-pg      | 7.8             |
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
