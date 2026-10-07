# PROJECT_STATE.md - Planify Kids

## 📊 Vue d'ensemble

- **Projet**: Planify Kids
- **Version**: 0.1.0
- **Démarré le**: 2026-04-08
- **Statut**: Sprint 5/6/7 TERMINÉS ✅ — **offline PowerSync tenu et vérifié en réel sur tablette** (lecture tous écrans + écriture offline-first confirmée : mode avion, persistance, remontée après reconnexion), dernier gros morceau du cahier des charges. i18n FR/EN + détection auto langue faits. **Audit cahier des charges round 2 fait (2026-07-23)** : 5 écarts réels identifiés (drag & drop absent, animations validation absentes, badge "challenge" déconnecté du système Badge, PIN enfant pas vraiment optionnel, merge-conflict sync non formalisé) — voir Backlog Sprint 8. Pas de blocage produit connu à ce jour.
- **Last Session**: 2026-07-23/24 — Trois volets. **(1) Clôture PowerSync** : setup PowerSync Cloud terminé après une longue série de bugs réels diagnostiqués et corrigés un par un (cast SQL, pooler Supavisor incompatible réplication logique, JWT sans `kid`, secret HS256 mal encodé, toggle "Development tokens" interférant avec `request.jwt()`, `POWERSYNC_URL` périmé après recréation du projet, et le bug final — PowerSync matérialise une ligne locale via le nom de table **Postgres source** du `FROM` des sync rules et pas le nom de table déclaré côté client : `FROM "Badge"` → row_type `"Badge"`, mais le schema mobile déclare `badges` — sans alias explicite (`FROM "Badge" badges`), la ligne reste bloquée dans `ps_oplog`, jamais copiée vers `ps_data__<table>`, sync "réussie" sans la moindre erreur mais tables locales vides. Diagnostiqué via l'outil officiel `diagnostics-app.powersync.com` + un script Dart autonome (vraie `PowerSyncDatabase` sur fichier temporaire hors app, inspectant directement `ps_oplog` vs `ps_data__*`) — bien plus fiable que les logs dashboard, qui mélangeaient en plus les sessions de l'outil diagnostics web (`powersync-js`) avec le vrai device (`powersync-dart-core`), source de plusieurs fausses pistes. **Test final sur tablette : succès** (lecture + écriture offline confirmées de bout en bout). Bug annexe trouvé pendant ces tests : tri échanges cassé (colonne `created_at` jamais scaffoldée dans le schema PowerSync local) — fixé, tri `ORDER BY created_at DESC`. **(2) Régressions CI/Vercel découvertes en marge du rebuild APK** : build Vercel cassé (bundler serverless `/api/index.ts` a un pipeline séparé du `buildCommand` custom, ne générait jamais le client Prisma pour ce chemin) — fix `postinstall: prisma generate` + fallback JS dans `prisma.config.ts` (le helper `env()` strict cassait l'install CI, `DATABASE_URL` pas encore défini à ce stade) ; 11 tests E2E cassés par la détection auto langue (Chromium headless en `en-US` par défaut) — fix `locale: "fr-FR"` dans `playwright.config.ts`. Puis l'environnement Docker local a cassé au même endroit (`postinstall` tourne avant que `schema.prisma` soit copié dans l'image `api.Dockerfile`, car copié en 2 temps pour le cache de layers) — fix ordre des `COPY`, + nouveau flag `--reset-db` sur `scripts/docker-dev.sh` (force-reset schéma local + reseed, pour une DB locale avec colonne requise ajoutée sur données déjà là). **(3) 3 demandes UX** (proposées puis validées avant implémentation) : filtres planning web (`PlanningPage.tsx` — chips membre/statut + vue Semaine/Jour) ; mêmes filtres sur le mural mobile (`PlanningWallScreen`, demande explicite tablette) ; carte récompense mobile refaite (`RewardsScreen` — nom sur 2 lignes + ellipsis au lieu de `ListTile` qui écrasait le bouton "Demander" sur les noms longs). Tout testé et confirmé fonctionnel par l'utilisateur (web + mobile).
- **Session 27 - 2026-07-23**: Development tokens désactivé sur le dashboard PowerSync (utilisateur, hors session). Audit cahier des charges round 2 (agent Explore, 10 points ciblés — items déjà fermés au 2026-07-06 exclus du scope) : 5 écarts réels + 3 écarts cosmétiques (routes API nommées différemment mais fonctionnellement équivalentes, archi Hono/émojis/ES-PT déjà assumés). Détail complet en Backlog Sprint 8. Aucun code touché cette session — audit + doc seulement.
- **Next Steps**: Aucun blocage connu. Voir Backlog Sprint 8 pour les 5 écarts audit (à prioriser avec l'utilisateur). Items mineurs restants : (1) `vite.config.ts` PWA manifest `lang: "fr"` statique (devrait suivre la langue détectée/choisie). (2) ~~`task_card_test.dart` 4 échecs pré-existants~~ — corrigés Session 28 (tests périmés).

---

## 🗺 Directions Sprint 5 — À prioriser

### Direction 1 — Finaliser l'app Flutter enfant ⭐ (recommandée)

**Contexte** : backend complet, design tablette fait (`pages-auth.pen`). App enfant démarre + tâches du jour fonctionnent. Manque :

- [x] **Screen récompenses** — liste récompenses + `POST /rewards/:id/claim` + mes demandes
- [x] **Screen notifications** — liste, marquer lu au tap, "Tout lire"
- [x] **Navigation 5 onglets** — Aujourd'hui · Récompenses · Échanges · Badges · Profil ; lien cloche profil → `/notifications`
- [x] **Vérification sync PowerSync** — fonctionnel et testé en réel sur tablette (2026-07-23/24), voir section "📋 Backlog Sprint 7" pour le détail complet
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

Puis exécuter `apps/api/src/prisma/supabase-security.sql` dans Supabase → SQL Editor (idempotent) : active RLS sur toutes les tables `public` + event trigger `ensure_rls` pour les futures tables. Sans ça, le Data API Supabase (PostgREST) expose toutes les tables en CRUD à quiconque a l'URL + la clé anon (Security Advisor `0013_rls_disabled_in_public`). Aucun impact app : Prisma (rôle `postgres`, propriétaire) et PowerSync (rôle `BYPASSRLS`) ne sont pas soumis à RLS.

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

- **Web + API** : `https://planify-kids-api.vercel.app`
- **Health** : `https://planify-kids-api.vercel.app/api/health`
- **API base** : `https://planify-kids-api.vercel.app/api`

> Pour Flutter : `API_BASE_URL = "https://planify-kids-api.vercel.app/api"`

### Monitoring

- Logs fonction : Vercel → **Functions** tab → `api/index`
- Sentry (si configuré) : ajouter `SENTRY_DSN` dans les env vars Vercel

---

## 📱 Installation Android — Procédure (tablette enfant)

**Contexte** : l'app Flutter (`apps/mobile`) est l'interface enfant. Pas de publication Play Store prévue — installation directe (sideload) sur les tablettes familiales. Build release signé avec la clé debug (suffisant pour du sideload, pas pour le Play Store).

### Prérequis Android

- Flutter SDK installé sur la machine de build (`flutter --version` ≥ 3.13)
- Tablette Android avec **Sources inconnues** activées (Paramètres → Sécurité) — nécessaire pour installer un APK hors Play Store
- Optionnel (installation via câble) : **Débogage USB** activé (Paramètres → Options développeur) + `adb` installé sur la machine de build

### 1. Générer l'APK release avec l'URL API de production

Depuis `apps/mobile` :

```bash
flutter pub get
flutter build apk --release \
  --dart-define=API_BASE_URL=https://planify-kids-api.vercel.app/api \
  --dart-define=POWERSYNC_URL=https://<instance>.powersync.journeyapps.com
```

> Sans `API_BASE_URL`, l'app pointe vers `http://10.0.2.2:3000` (valeur par défaut, réservée à l'émulateur Android en dev local) — indispensable pour un vrai appareil. Sans `POWERSYNC_URL` (défaut vide), pas de sync offline. URL de l'instance : dashboard PowerSync (elle change si l'instance est recréée).
>
> **Localisations générées non versionnées (depuis 2026-10-07)** : `apps/mobile/lib/l10n/app_localizations*.dart` sont dans le `.gitignore` mobile et recréés par `flutter pub get` / `flutter build` (`generate: true`). Avant, la sortie différente selon la version de Flutter (PC Windows channel master vs WSL) bloquait chaque `git pull` sur le PC Windows. **Une dernière fois** sur le PC Windows, pour récupérer le commit qui les retire : `git restore apps/mobile/lib/l10n` puis `git pull` (git supprime alors les fichiers, `flutter pub get` les recrée).

L'APK généré se trouve dans :

```text
apps/mobile/build/app/outputs/flutter-apk/app-release.apk
```

### 2. Installer sur la tablette

**Option A — via câble USB (`adb`)** :

```bash
adb install -r apps/mobile/build/app/outputs/flutter-apk/app-release.apk
```

**Option B — sans câble** : transférer `app-release.apk` sur la tablette (clé USB, Drive, email, etc.), l'ouvrir depuis le gestionnaire de fichiers de la tablette, autoriser l'installation depuis cette source si demandé.

### 3. Premier lancement

1. Ouvrir l'app "mobile" (nom d'affichage actuel — cosmétique, `android:label="mobile"` dans `AndroidManifest.xml`, à renommer si besoin)
2. Onglet **Enfant** → saisir le **code famille** (visible côté web parent, page Famille) → sélectionner le profil enfant → saisir le **PIN** 4 chiffres
3. Vérifier l'écran "Aujourd'hui" : tâches du jour visibles, marquage complété fonctionnel

### Limitations connues sur tablette

- **PowerSync / sync offline** : fonctionnel (vérifié en réel 2026-07-24). L'instance PowerSync Cloud (offre gratuite) **se met en pause après une période d'inactivité** — symptôme : connexion enfant OK mais liste des tâches vide sur tablette. Fix : redéployer l'instance depuis le dashboard PowerSync (constaté 2026-10-06).
- **Notifications push FCM** : nécessite `google-services.json` dans `apps/mobile/android/app/` + env vars Firebase côté Vercel (`FIREBASE_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY`) — sans ça, no-op silencieux, pas de crash
- **SSE temps réel** : dégradé en polling TanStack Query côté web ; côté Flutter, pas de SSE utilisé (polling natif)

### Mise à jour de l'app

Pas de mécanisme d'auto-update — reproduire les étapes 1-2 à chaque nouvelle version (nouvel APK avec `versionCode` incrémenté dans `pubspec.yaml`, `adb install -r` remplace en conservant les données locales).

### Build sur WSL2/ARM64 — bloqué, contournement PC Intel

Tentative de build sur machine dev principale (WSL2, host **aarch64**) : échec définitif. Le NDK Android ne fournit pas de toolchain native Linux ARM64 (clang packagé `linux-x86_64` en dur, peu importe la version) — nécessite émulation qemu-x86_64, qui elle-même requiert les libs userspace amd64 (`libc6:amd64`...) absentes du miroir `ports.ubuntu.com` (dédié ARM, pas de paquets amd64 disponibles). Pas de solution apt simple sur cette machine.

**Solution retenue** : build effectué sur PC Windows 11 **Intel i7** (x86_64 natif) — Flutter (channel master, pour matcher `sdk: ^3.13.0-201.0.dev` du `pubspec.yaml`), Android Studio (SDK + NDK 28.2.13676358 + cmake/ninja installés nativement, licences acceptées via l'UI).

Deux fixes supplémentaires nécessaires côté Windows (déjà commités) :

- `apps/mobile/android/gradle.properties` : `kotlin.incremental=false` — bug connu Kotlin/Gradle sous Windows quand le cache pub (`C:\Users\...`) et le projet (`D:\...`) sont sur des lettres de lecteur différentes (`IllegalArgumentException: this and base files have different roots`)
- `apps/mobile/android/app/build.gradle.kts` : `isCoreLibraryDesugaringEnabled = true` + dépendance `coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")` — requis par `flutter_local_notifications`

**Résultat** : build APK release réussi, installation tablette réussie, premiers tests réels effectués (cf. backlog Sprint 6 ci-dessous pour les retours).

---

## 📋 Backlog Sprint 7 — Audit cahier des charges + bug distribution planning (2026-07-06)

### 🔴 Priorité 1 — Bug de fond confirmé (rotation planning)

- [x] **Bug — Pas de rotation des tâches entre les semaines** : signalé par l'utilisateur ("les mêmes tâches sont affectées à chaque enfant toutes les semaines"). **Root cause confirmée par lecture de code** : `generatePlanningGreedy()` (`apps/api/src/services/planning-greedy.ts`) réinitialise la charge cumulée (`load`) à **zéro pour chaque appel** de génération hebdomadaire — aucune mémoire des semaines précédentes n'est transmise ni lue en DB. De plus, `leastLoadedChild()` départage les égalités de charge par ordre d'itération du `Map` (= ordre des enfants passés en paramètre, stable). Conséquence : à charge égale (toujours 0-0 en début de semaine), la 1ère occurrence de tâche (tri déterministe : obligatoire d'abord, puis difficulté décroissante, puis chronologique) est **systématiquement** assignée au même enfant, semaine après semaine, à l'identique. La rotation "équitable" ne s'applique qu'*à l'intérieur* d'une semaine, jamais *entre* les semaines. **Fix appliqué (2026-07-06)** : (a) nouveau paramètre `initialLoad` sur `generatePlanningGreedy()`, alimenté par `getMemberLoadHistory()` (`planning.repository.ts`, nouvelle fonction — somme des `TaskTemplate.points` de tous les `ScheduleItem` antérieurs à `startDate`, groupés par `assignedToMemberId`) et branché dans `generatePlanningService()` (`planning.service.ts`) ; (b) rotation de l'ordre de départage des égalités par numéro de semaine (`Math.floor(startDate.getTime() / 7j) % children.length`) pour couvrir aussi le cas sans historique (1ère génération). 4 nouveaux tests `planning-greedy.test.ts` (rotation inter-semaines, prise en compte `initialLoad`, rétrocompatibilité sans le paramètre). 252/252 tests + typecheck API 0 erreur. **Correctif (2026-07-06, testé en réel)** : le fix initial sommait **tout** l'historique depuis la création de la famille — sur une famille ayant subi le bug pendant plusieurs semaines/mois, ce déséquilibre cumulé (dette) écrasait le tie-break et faisait basculer **toutes** les tâches vers l'enfant historiquement défavorisé pendant des semaines entières (symptôme identique côté utilisateur : aucune variation perçue entre deux semaines testées). Fix : `getMemberLoadHistory()` borné à une fenêtre glissante de 28 jours (`LOAD_HISTORY_WINDOW_DAYS`) au lieu de l'historique complet.

### 🟠 Demandes utilisateur (2026-07-19)

- [x] **UI Planning — texte tronqué dans les cartes** : vue calendrier semaine (`WeekCalendar`, `PlanningPage.tsx`), colonnes 7 jours très étroites (`min-w-140`) + `truncate` coupait net le nom du membre et le nom de la tâche dès qu'ils dépassaient la largeur de colonne. Fix : colonnes élargies (`min-w-180`) + `truncate` remplacé par `line-clamp-2` sur les deux (texte enveloppé sur 2 lignes, ellipsis seulement si toujours trop long), ligne membre passée en `items-start` avec pastille couleur alignée (`mt-0.5`) pour rester propre quand le nom wrap. Vérifié visuellement (Playwright + capture d'écran) avec noms longs injectés.
- [x] **Règle 80/20 parents/enfants absente du planning** : `planning.service.ts` filtrait `role === "CHILD"` uniquement — les parents ne recevaient jamais de tâche. Fix : `PARENT` inclus dans le pool passé à `generatePlanningGreedy()` (`planning.service.ts`, constante `CHILD_SHARE = 0.8`) + nouveau champ `weight` sur `GreedyChild` (poids enfant = `0.8/nbEnfants`, poids parent = `0.2/nbParents`) ; `leastLoadedChild()` compare `charge/poids` au lieu de la charge brute (`planning-greedy.ts`). **Piège découvert au test réel** : sur la famille démo (historique 28j 100% enfants, 0% parent), le déséquilibre historique écrasait le ratio de poids — le parent restait "moins chargé" en valeur absolue pendant toute la génération, résultat : 100% des tâches basculaient sur le parent (symétrique inverse du bug initial). Fix : la charge initiale (`initialLoad`) est recentrée **par groupe de poids** sur sa propre moyenne avant comparaison — un déséquilibre historique *entre* groupes (enfants vs parents) ne pèse plus sur le ratio de CETTE génération, seule la fairness *interne* à un groupe (rotation entre enfants) reste pilotée par l'historique. Vérifié en réel (génération semaine réelle, famille démo 2 enfants + 1 parent : ~24% parent sur 28 tâches, répartition mixte confirmée visuellement). 6 tests `planning-greedy.test.ts` (dont 2 nouveaux : split pondéré ~80/20, rétrocompatibilité poids égaux). 256/256 tests + typecheck API/web 0 erreur.
- [x] **Persistance code famille — app mobile enfant** : `_ChildLoginFormState` (`login_screen.dart`) repartait toujours avec un champ code famille vide, et `AuthNotifier.logout()` faisait un `storage.clear()` complet (`SharedPreferences`) qui aurait de toute façon empêché de le garder. Fix : nouvelle clé `familyCode` dédiée dans `SecureStorageService` (`getFamilyCode`/`saveFamilyCode`), sauvegardée dans `loginChild()` après connexion réussie ; nouvelle méthode `clearSession()` (ne retire que token+user) appelée par `logout()` et par le nettoyage d'état corrompu dans `build()`, à la place de `clear()` — le code famille survit à la déconnexion. `_ChildLoginFormState.initState()` précharge le code mémorisé et relance automatiquement `_loadChildren()` — il ne reste plus qu'à saisir le PIN après une déconnexion. **Piège de test** : le fake `_FakeStorage` des tests widget (`login_screen_test.dart`) n'overridait pas les nouvelles méthodes → appelait le vrai plugin `SharedPreferences` en environnement de test (aurait crashé) ; corrigé (méthodes ajoutées au fake) + nouveau test dédié (code prérempli + recherche auto). 10/10 tests widget (login+today) + `flutter analyze` 0 issue. Note : 4 échecs pré-existants dans `task_card_test.dart`, confirmés non liés à ce changement (mêmes échecs avec `git stash`), hors scope — non traités.
- [x] **Bug annexe — icône de tâche manquante/cassée en prod (découvert en creusant un faux "diff visuel Vercel vs local")** : l'utilisateur signalait un rendu différent entre le déploiement Vercel (icônes en case vide "☐") et le dev local (émojis corrects) sur la page Planning. Après investigation (logs de build Vercel écartés : erreurs TS `import type` non bloquantes, cosmétiques), **root cause réelle** : `TasksPage.tsx` (formulaire de création/édition de tâche) n'a jamais eu de champ pour saisir `icon` — toutes les tâches créées via l'app web (dont celles de la vraie famille de l'utilisateur en prod) sont enregistrées avec `icon: null`, contrairement aux tâches de démo (`seed.ts`) qui ont un émoji codé en dur. Le glyphe vide venait donc d'une valeur manquante, pas d'un bug de rendu/déploiement. Fix : nouveau composant partagé `IconPicker` (`components/shared/IconPicker.tsx`, grille de boutons émoji sélectionnables, même pattern que le picker avatar existant de `FamilyPage.tsx`) intégré à `TasksPage.tsx` (12 émoji tâches ménagères, défaut au 1er si aucun) et `RewardsPage.tsx` (remplace l'ancien input texte libre par 12 émoji récompenses) — élimine aussi le risque de faute de frappe/caractère invalide en tapant l'emoji à la main. Vérifié fonctionnellement (lecture de la valeur persistée via l'API après sélection+soumission : codepoints Unicode valides confirmés, ex. `🛏️` U+1F6CF, `🍕` U+1F355) — rendu visuel non vérifiable par capture d'écran car le conteneur de test n'a pas de police emoji installée (tofu générique sur tout le sandbox, y compris les émojis de démo qui pourtant s'affichent bien chez l'utilisateur). Typecheck web 0 erreur.
- [x] **Créneaux midi + soir selon calendrier scolaire France/DOM-TOM** : demande — génération du planning sur 2 créneaux (midi ET soir) le weekend/vacances/jours fériés, 1 seul créneau (soir) les jours d'école, zones vacances scolaires + DOM-TOM prises en compte. **2 APIs gouv distinctes nécessaires** (une seule mentionnée par l'utilisateur ne couvrait que les jours fériés) : `calendrier.api.gouv.fr` (jours fériés, 13 zones dont métropole + DOM-TOM) et `data.education.gouv.fr` dataset `fr-en-calendrier-scolaire` (vacances scolaires, Zone A/B/C métropole + territoires DOM-TOM comme `location`/`zones`) — vérifiées en direct par requêtes curl avant implémentation (labels exacts des zones confirmés via facet, ex. `"Réunion"` pas `"La Réunion"`, `"Nouvelle Calédonie"` sans tiret).
  - **Schéma** : `Family.schoolZone` (nouvel enum `CalendarZone`, 12 valeurs — Zone A/B/C + 9 DOM-TOM ; Saint-Barthélemy/Saint-Martin rattachés à Guadeloupe, Alsace-Moselle non distingué de Zone B, limites documentées en commentaire schema.prisma), `ScheduleItem.slot` (`Slot` : `NOON`/`EVENING`, défaut `EVENING`), nouvelle table `SchoolCalendarCache` (zone/date/type/label, unique zone+date+type) — appliqué via `db push` (le projet n'utilise pas `prisma migrate`, `migrate dev` a d'ailleurs demandé un reset destructif faute d'historique de migrations existant, **abandonné sans l'exécuter**, `db push` utilisé à la place comme convention établie du projet).
  - **`school-calendar.ts`** (nouveau service) : fetch + upsert cache DB pour les 2 APIs, `getOffDays()`/`classifyDays()` avec lazy-fill (sync à la volée si zone jamais interrogée — filet de sécurité pour le serverless Vercel, cron `startCalendarSyncCron()` hebdomadaire ajouté à `planning-cron.ts` pour les environnements où le cron tourne, même limite connue que le cron planning existant).
  - **`planning-greedy.ts`** : nouveau param `dayTypes` (`Map<date, "SCHOOL_DAY"|"OFF_DAY">`), `getOccurrences()` génère 1 occurrence (soir, 19h) en `SCHOOL_DAY` ou 2 (midi 12h + soir 19h) en `OFF_DAY` — uniquement pour les tâches `daily` (hebdo/mensuel restent à 1 créneau, pas une routine quotidienne à dédoubler). Défaut rétrocompatible : sans `dayTypes` fourni, tous les jours sont `SCHOOL_DAY` (comportement historique inchangé pour une famille n'ayant pas renseigné sa zone).
  - **Piège timezone découvert aux tests** : le serveur tourne en `Europe/Paris` (pas UTC) ; des `setHours(0,0,0,0)` (reset local) combinés à des clés `toISOString().slice(0,10)` (UTC) décalaient le dernier jour d'une plage d'un jour en arrière — supprimés, le code ne fait plus aucun reset d'heure explicite (aligné sur le pattern déjà utilisé partout ailleurs dans le projet).
  - **Web** : `SettingsPage.tsx` — sélecteur "Zone scolaire" (`CALENDAR_ZONE_LABELS`) ; `PlanningPage.tsx` — badge MIDI/SOIR sur chaque carte planning (`SLOT_LABELS`).
  - **Vérifié en réel** (famille démo, via appels API directs + navigateur) : zone `ZONE_C` + génération sur période de vacances d'été → 100% des jours en 2 créneaux (30 items = 5 tâches × 3 jours × 2 créneaux) ; génération sur semaine scolaire normale (16-22 nov 2026) → lundi-vendredi 1 créneau/soir chacun, samedi-dimanche 2 créneaux chacun (45 items = 5×5 + 2×10), confirmé aussi visuellement (badges MIDI/SOIR sur les cartes). Cache DB réel vérifié en base (22 jours fériés, 531 jours de vacances synchronisés depuis les vraies API gouv). 10 tests `planning-greedy.test.ts` + 6 tests `school-calendar.test.ts` (nouveaux). 266/266 tests API + typecheck API/web 0 erreur.
  - **Limite connue** : l'heure exacte stockée sur `ScheduleItem.date` (12h/19h) est nominale — pas de conversion timezone réelle vers l'heure locale de la famille (`Family.timezone` existe mais n'est utilisé nulle part dans le projet, y compris avant cette session) ; l'affichage MIDI/SOIR côté UI est correct car piloté par le champ `slot` dédié, pas par un calcul sur l'heure.
  - **Suite mobile (même session)** : `ScheduleItem` (Dart, `models/schedule_item.dart`) n'avait pas de champ `slot` — ajouté (parse JSON, défaut `EVENING` si absent) ; badge Midi/Soir (icône soleil/lune + texte) ajouté sur `TaskCard` (`features/tasks/task_card.dart`), au-dessus du nom de tâche. `flutter analyze` 0 issue ; tests widget : mêmes 4 échecs pré-existants dans `task_card_test.dart` (confirmés non liés, cf. entrée persistance code famille ci-dessus), aucune nouvelle régression.
  - **⚠️ APK non reconstruit** : ce fix + la persistance du code famille (fix précédent, déjà commité) sont dans le code source mais **pas encore sur la tablette réelle** — Flutter n'a pas d'auto-update, il faut rebuild + réinstaller l'APK (procédure "Installation Android" plus haut, build sur PC Windows Intel — bloqué sur cette machine WSL2/ARM64) avant que l'utilisateur puisse les voir en usage réel.

### Améliorations issues de l'audit cahier des charges (2026-07-06)

Audit complet `CAHIER_CHARGES.md` vs code réel effectué — écarts identifiés, classés par valeur réelle pour une famille utilisatrice (pas un simple cochage de cases) :

- [x] **Notification "badge gagné" manquante** : un badge est décerné (`checkAndAwardBadges()`, `apps/api/src/services/gamification.ts`) et loggé en Mongo (`BADGE_EARNED`), mais aucune notification in-app/push n'était créée. Fix (2026-07-20) : `notifyBadgeEarned()` (`notifications.service.ts`, même pattern in-app + push FCM que `notifyTasksAssigned`) appelé dans `checkAndAwardBadges()` pour chaque badge nouvellement décerné. Nouvelle valeur enum `NotificationType.BADGE_EARNED`.
- [x] **Bonus série (streak) absent de la gamification** : `checkAndAwardBadges()` ne supportait que `"POINTS"` et `"TASKS_COMPLETED"`. Fix (2026-07-21) : `conditionType: "STREAK"` (pas de champ enum Prisma — `conditionType` est un `String` libre, pas de migration nécessaire), calculé via `computeStreak()` (`gamification.ts`) — jours consécutifs (dérivés localement des `completedAt`, piège timezone déjà documenté évité) en remontant depuis aujourd'hui tant qu'au moins une tâche a été complétée ce jour-là. 3 badges seedés (`En feu` 3j, `Semaine parfaite` 7j, `Invincible` 30j). `seedBadges()` rendu additif par nom (au lieu de "skip si déjà seedé") — sinon un nouveau badge ajouté au tableau n'a aucun effet sur une DB déjà seedée (dev local, famille démo prod). 2 nouveaux tests `gamification.test.ts` (série atteinte / série interrompue). 272/272 tests, typecheck 0 erreur. `db:seed` lancé en local (`.env` racine complet, contrairement à `apps/api/.env`) : `3 new badge(s) seeded (7 already present)` — confirmé additif, DB locale à jour. **Reste à lancer sur la DB prod** (Vercel/Supabase) pour que les badges existent aussi en réel.
- [x] **Notification "tâche oubliée" absente** : aucun rappel proactif après échéance manquée. Fix (2026-07-20) : cron `startForgottenTaskCron()` (`planning-cron.ts`, quotidien 20:00) scanne les `ScheduleItem` PENDING du jour et notifie chaque membre via `notifyTasksForgotten()`.
- [x] **Notification "rappel tâche" absente** : pas de rappel le matin pour les tâches du jour. Fix (2026-07-20) : cron `startTaskReminderCron()` (`planning-cron.ts`, quotidien 08:00), même logique de scan que ci-dessus via `notifyTasksReminder()`. Les deux crons partagent `notifyPendingTasksForToday()` (bornes du jour en heure locale, pas de piège `setHours`+`toISOString` — cf. leçon Session 21).
- [x] **Règle 80/20 parents/enfants non implémentée** : doublon avec l'entrée déjà cochée dans "Demandes utilisateur (2026-07-19)" plus haut — fait via commit `40304f7`, jamais mise à jour ici lors de l'audit initial.
- [x] **i18n absent (multi-langue FR/EN/ES/PT prévu au cahier)** : chantier minimal FR/EN fait (2026-07-21), pas les 4 langues d'un coup. **Web** : `react-i18next`, clés dans `apps/web/src/i18n/locales/{fr,en}.json`, store Zustand `preferences.store.ts` (langue persistée), sélecteur dans Paramètres, toutes les pages migrées. **Mobile** : `flutter_localizations` + ARB (`apps/mobile/lib/l10n/app_{fr,en}.arb`, pas `easy_localization` — permet un repli `AppLocalizations.of(context) ?? AppLocalizationsFr()` qui évite de casser les tests widget existants), `AppLocale` provider Riverpod persisté via `SecureStorageService`, sélecteur dans Profil, tous les écrans migrés. Dates dynamiques via helpers centralisés. Contenu dynamique API (noms de tâches/récompenses créés par l'utilisateur) non traduit — hors scope volontaire. Follow-up mineur non traité : `vite.config.ts` PWA manifest `lang: "fr"` statique. **Détection auto langue navigateur/appareil ajoutée (2026-07-22)** : sélecteur manuel prioritaire dès usage (`hasExplicitChoice` web / persistance `SecureStorageService` mobile), voir Session courante pour le détail technique.
- [x] **Offline réel (PowerSync)** : promesse produit centrale du cahier (§2, §9, règle métier 6) — **tenue et vérifiée en réel (2026-07-23/24)**. Arbitrage tranché (2026-07-22) : intégration complète (pas de cache lecture seule dégradé). **Code** : backend (`GET /powersync/token`, `sync-rules.yaml`), mobile (`connector.dart` réel, 5 providers de lecture sur DB locale, écriture `TasksNotifier` offline-first via crud queue PowerSync). **Setup PowerSync Cloud** (instance créée, Postgres connecté en direct avec rôle `REPLICATION BYPASSRLS`, publication `powersync`, sync rules déployées, Client Auth HS256 configuré) — nombreux bugs réels rencontrés et corrigés un par un (cast SQL non supporté, pooler Supavisor incompatible réplication logique, JWT sans `kid`, secret HS256 mal encodé, toggle Dev tokens interférant, `POWERSYNC_URL` périmé après recréation du projet, **et le bug final** : PowerSync matérialise une ligne locale via le nom de table **Postgres source** du `FROM` des sync rules, pas le nom de table déclaré côté client — sans alias explicite (`FROM "Badge" badges`), les lignes restent bloquées dans `ps_oplog`/jamais copiées vers `ps_data__<table>`, sync "réussie" sans aucune erreur mais tables locales vides — historique complet en Session ci-dessous). CI/Vercel cassés pendant le rebuild APK (client Prisma non généré pour le bundler serverless Vercel, locale e2e en anglais) — fixés. **Test final sur tablette (2026-07-24) : succès** — lecture (tous écrans), écriture offline-first (marquer fait en mode avion, persistance, remontée après reconnexion) tous confirmés. Bug annexe trouvé et fixé : tri échanges (colonne `created_at` manquante au schema local PowerSync, jamais scaffoldée).
- [x] **Écran "Planning mural" dédié absent** : le cahier des charges prévoit un affichage tableau pensé pour être collé au mur (lecture à distance, vue famille complète), distinct de "Mes tâches" par enfant connecté, à l'origine envisagé **sans login enfant individuel**. Fait (2026-07-21) : `PlanningWallScreen` (mobile) — écran lecture seule accessible depuis Profil, groupe les tâches par jour puis Midi/Soir, affiche membre (pastille couleur + nom) + tâche + statut pour **tous** les membres (pas juste l'enfant connecté). Nouveau `ApiClient.getWeekSchedule()` (choisit le planning couvrant aujourd'hui, sinon le plus récent) + 2 providers (`weekPlanningProvider`, `planningWallMembersProvider`). Test widget écrit (`planning_wall_screen_test.dart` — chargement/vide/erreur/données), `flutter analyze` 0 issue, `flutter test` +16 -4 (échecs pré-existants inchangés, pas de régression). **Décision produit (2026-07-21)** : accès conservé via Profil (connecté) — le mode kiosque sans login (accès par code famille seul) est explicitement écarté pour l'instant, jugé chantier séparé (route publique, sécurité lecture seule) à ne pas mélanger avec ce livrable. **Rebuild APK + vérification en réel faits** — item clos.

**Valeur** : items classés par impact réel constaté (émotionnel enfant, équité familiale, fiabilité produit) plutôt que par simple conformité au cahier des charges.

---

## 📋 Backlog Sprint 8 — Audit cahier des charges round 2 (2026-07-23)

Audit ciblé (agent Explore, 10 points du cahier jamais vérifiés explicitement — items déjà fermés au 2026-07-06 exclus du scope : offline PowerSync, planning mural, streak, 80/20, notifications, i18n FR/EN). Résultat : 5 écarts réels, 3 écarts cosmétiques sans impact.

### 🟠 Écarts réels — à prioriser

- [ ] **§4.4/§10 — Pas de drag & drop nulle part** : cahier demande glisser-déposer pour proposer un échange de tâche. Réel : web = `<select>` HTML (`apps/web/src/features/planning/PlanningPage.tsx:782-795`), mobile = `DropdownButtonFormField` dans `_ProposeExchangeDialog` (`apps/mobile/lib/features/exchanges/exchanges_screen.dart:294,319`). Aucun `Draggable`/`DragTarget`/`dnd-kit`/`react-dnd` dans tout le repo. Fonctionnel identique, mais interaction moins ludique/rapide sur tablette tactile que le geste attendu pour des enfants 6-20 ans.
- [x] **§4.5/§10 — Pas d'animation de célébration** — **A + B + C faits (2026-10-06, Session 28)** : (A) tâche cochée = gerbe de confettis + « +N pts » qui s'envole depuis le bouton + vibration + rebond de la carte dans « Terminé » ; (B) dernière tâche du jour = célébration plein écran (confettis, 🏆, « Bravo {name} ! »), fermeture auto 3,5 s ou au tap ; (C) fenêtre « Nouveau badge ! » (icône qui grossit, nom, description, confettis, fermeture auto 5 s ou au tap) à l'arrivée d'une ligne `member_badges` via sync, quel que soit l'onglet ouvert ; pas de rejeu, pas d'animation au 1er lancement pour les badges déjà acquis. **Reste à vérifier en réel (rebuild APK).** Constat initial : cocher une tâche / gagner un badge = simple changement d'état visuel plat (web : `transition-colors` Tailwind seulement, pas de lib d'anim au `package.json` ; mobile : zéro `AnimatedContainer`/`AnimationController` dans `apps/mobile/lib`). Cahier §4.5 attend explicitement une "animation" dans le workflow de validation. Manque le renforcement ludique/émotionnel censé motiver les enfants.
- [x] **§13 — Badge "challenge" déconnecté** — **fait (2026-10-07, Session 28)** : `conditionType: "CHALLENGES_COMPLETED"`, 3 badges seedés (🤝 Esprit d'équipe 1 défi, 🏅 Super équipe 5, 👑 Famille de légende 10), décernés à chaque enfant de la famille à la réussite d'un défi ; seuls les défis réussis après l'arrivée de l'enfant comptent. **`db:seed` à relancer sur la prod** (additif). Constat initial : `Badge.conditionType` supporte `TASKS_COMPLETED`/`POINTS`/`STREAK` (`apps/api/src/services/gamification.ts:113-117`) mais aucun `"CHALLENGE"`. `FamilyChallenge` (`schema.prisma:296-311`, module `apps/api/src/modules/challenges/`) est un système à part entière, à points/période, sans aucune référence à `Badge` — terminer un défi familial donne un bonus de points mais jamais de badge dédié.
- [x] **§7 — PIN enfant pas vraiment optionnel** — **fait (2026-10-07, Session 28)**, option validée : PIN désactivable par enfant, sur décision explicite du parent (`FamilyMember.pinRequired`, défaut `true` — un enfant créé sans PIN n'est jamais « ouvert »). Web : case « Connexion sans PIN » dans la modale PIN + statut sur la carte enfant (🔒 PIN défini / 🔓 Sans PIN / ⚠️ PIN à définir). Mobile : champ PIN masqué, connexion au tap sur le prénom. Constat initial : `pin` nullable en base et absent de `createMemberSchema` (donc optionnel à la création), mais `loginChildService` lève `UnauthorizedError("Aucun PIN configuré")` si absent (`apps/api/src/modules/auth/auth.service.ts:112-114`) et `loginChildSchema.pin` est obligatoire côté validation (`apps/api/src/modules/auth/auth.schema.ts:17-21`). Un enfant sans PIN configuré ne peut pas se connecter — pas de mode "avatar seul" pour les plus jeunes comme le cahier §7 semble l'envisager.
- [ ] **§9 — Merge-conflict sync non formalisé** : `PlanifyConnector.uploadData()` (`apps/mobile/lib/database/connector.dart:22-43`) rejoue chaque écriture locale comme un `PATCH` REST séquentiel, sans comparaison de version/horodatage. PowerSync gère une file CRUD mais aucune stratégie de résolution de conflit n'est codée/documentée — "dernier écrit gagne" implicite. Risque faible en usage réel (1 appareil/enfant), mais 2 appareils modifiant le même item hors-ligne en simultané s'écraseraient silencieusement.

### 🟢 Écarts cosmétiques — sans impact, pour information

- Routes API nommées différemment du cahier mais fonctionnellement équivalentes : `/planning/swap` → `/exchanges` (module dédié) ; `/planning/complete` → `PATCH /planning/items/:itemId` (générique, couvre aussi undo/skip) ; `/family/member` → `/family/members` (pluriel).
- Architecture Hono (pas Express) — déviation assumée depuis le début du projet.
- Icônes émoji via `IconPicker` maison (pas Material Icons/Phosphor) — déviation assumée.
- Multi-langue ES/PT jamais implémenté (seuls FR/EN faits) — déjà connu, scope réduit volontairement en Session 21.

**Conforme, vérifié** : dashboard stats parent (tâches/points/badges/progression par enfant, `apps/web/src/features/dashboard/DashboardPage.tsx`), badges milestones + streak, routes tasks/auth/family/planning fonctionnellement complètes.

**Valeur** : les 5 écarts réels touchent l'expérience enfant (ludique/émotionnel) et 2 angles morts produit (accès sans PIN, conflits multi-appareils) plutôt que des trous fonctionnels — rien de bloquant, mais mesure l'écart entre "cahier des charges" et "produit fini poli".

---

## 📋 Backlog Sprint 6 — Retours terrain tablette (2026-07-05)

Retours du premier test réel sur tablette Android (login enfant + usage quotidien) :

### 🔴 Priorité 1 — Bloquant onboarding

- [x] **Bug 4a — Code famille non visible pour l'enfant** : ajouté `code` au type `Family` (`packages/types/src/family.ts`), exposé dans `registerService`/`loginService` (`auth.service.ts`) + nouvelle route `GET /family` (`family.settings.routes.ts`, parent only). Affiché dans `SettingsPage.tsx` web (bloc "Code famille" en tête de page). **Vérifié en réel (2026-07-06)** : login enfant OK sur tablette.
- [x] **Bug 4b — Bouton "Sélectionner" pas réactif après saisie PIN** : cause confirmée — le `TextField` du PIN (`login_screen.dart`, `_ChildLoginForm`) n'avait pas de `onChanged`, donc `setState` jamais déclenché à la frappe (le bouton ne se recalculait qu'au `setState` du `FilterChip` de sélection enfant). Fix : `onChanged: (_) => setState(() {})` ajouté. `flutter analyze` 0 issue. **Vérifié en réel (2026-07-06)** sur tablette.

### 🟠 Priorité 2 — Fonctionnalité manquante

- [x] **Bug 2 — Proposer un échange de tâche (côté enfant)** : `POST /exchanges` existait déjà côté API et même `ApiClient.proposeExchange()` était déjà écrit côté Flutter — seule l'UI manquait. Ajouté : `ExchangesNotifier.propose()` + provider `familyMembersProvider` (`exchanges_provider.dart`), FAB "Proposer" + dialog `_ProposeExchangeDialog` (`exchanges_screen.dart`) — sélection tâche du jour (`todayTasksProvider`, PENDING uniquement) + sélection enfant destinataire (`familyMembersProvider`, exclut soi-même). `flutter analyze` 0 issue sur tout `lib/`. **Vérifié en réel (2026-07-06)** sur tablette.

### 🟡 Priorité 3 — Bugs UX

- [x] **Bug 1 — Pas de retour arrière "Fait" → "À faire"** : tap sur le badge "Fait ✓" (`task_card.dart`, icône ↩️ ajoutée) → dialog de confirmation (`today_screen.dart`, `_confirmUndo`) → `TasksNotifier.markPending()` (`tasks_provider.dart`). **Bug de fond découvert et corrigé en même temps** : l'API (`planning.service.ts`, `updateScheduleItemService`) ne retirait jamais les points crédités quand une tâche repassait de `COMPLETED` à un autre statut — exploit possible (re-compléter après un undo redonnait les points une 2ᵉ fois). Ce bug touchait aussi le web (`PlanningPage.tsx` cycle déjà `COMPLETED → SKIPPED → PENDING` sans déduction). Fix : nouvelle fonction `revokePointsForTask()` (`gamification.ts`, décrémente + log Mongo `POINTS_REVOKED`) appelée symétriquement à `awardPointsForTask()` — corrige web et mobile en un seul point (le service layer partagé). Les badges déjà décernés ne sont pas repris (décision : un badge gagné reste acquis). 122/122 tests + typecheck API/web 0 erreur + `flutter analyze` 0 issue. **Vérifié en réel (2026-07-06)** : plus de crash section Échanges, undo tâche + retrait points confirmés sur tablette.
- [x] **Bug 3 — Message d'erreur générique dans "Échanges"** : root cause trouvée par lecture de code (pas juste un message vague à améliorer) — `exchangeInclude.scheduleItem.select` (`exchanges.repository.ts`) n'incluait pas `assignedToMemberId`, alors que `ScheduleItemInfo.fromJson` (Flutter, `models/exchange.dart`) le cast en `String` non-nullable. Dès qu'un échange existait, `GET /exchanges` renvoyait ce champ `null` → crash de parsing Dart (`TypeError`, pas un `DioException`) → `ApiErrorWidget` tombait dans le cas générique faute de reconnaître l'erreur. Fix : `assignedToMemberId` ajouté au select API (cohérent avec `getExchangeById` qui l'avait déjà séparément) + parsing Flutter rendu tolérant (`as String? ?? ''`) en défense en profondeur. Ajouté aussi un `debugPrint(error)` dans `ApiErrorWidget` pour que les prochaines erreurs génériques restent diagnosticables sans changer le message affiché à l'enfant. 122/122 tests + typecheck API 0 erreur + `flutter analyze` 0 issue. **Vérifié en réel (2026-07-06)** : section Échanges s'affiche sans crash sur tablette.

**Valeur** : ces 4 points bloquent ou dégradent l'usage quotidien réel par les enfants — priorité haute avant tout nouveau développement de feature.

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

### Session 28 - 2026-10-06

**Objectif**: Corriger les 14 erreurs Supabase Security Advisor `0013_rls_disabled_in_public` (une par table Prisma).

**Concepts introduits**:

- **Le Data API Supabase (PostgREST) expose le schéma `public` en CRUD** à quiconque a l'URL du projet + la clé anon, même si l'app ne l'utilise pas (ici : aucun `@supabase/*` dans le code, tout passe par Prisma). Sans RLS, `User.passwordHash` et les PIN (hachés argon2) étaient lisibles.
- **RLS activée sans aucune policy = accès refusé à `anon`/`authenticated`, sans impact app** : Prisma se connecte en rôle `postgres` (propriétaire des tables, RLS non appliquée au propriétaire), PowerSync en rôle `BYPASSRLS` + réplication logique.
- **`prisma db push` ne gère pas RLS** : event trigger `ensure_rls` (recette officielle Supabase) pour activer RLS automatiquement sur toute future table de `public`.
- **Faux positifs de l'éditeur SQL Supabase** : il signale `DROP EVENT TRIGGER IF EXISTS` comme destructif, et lit la chaîne `'CREATE TABLE AS'` comme la création d'une table nommée `AS`. Ne pas accepter sa proposition d'« enable RLS » automatique (ajouterait un `ALTER TABLE AS` invalide).
- **Warning log `42602 invalid configuration parameter name "supautils.restrict_extension_versions"`** : interne à Supabase (décalage de version de l'extension `supautils`), sans effet, rien à faire.
- **L'instance PowerSync Cloud gratuite se met en pause après inactivité** : connexion enfant OK mais liste des tâches vide. Fix : redéployer l'instance depuis le dashboard PowerSync. Fausse piste initiale (RLS soupçonnée) écartée.
- **Animations de célébration (Sprint 8, écart §4.5 — volets A + B validés par l'utilisateur avant implémentation)** : package `confetti` (pur Dart, piloté par `AnimationController`, aucun `Timer` → pas de "pending timer" en test widget). Module `shared/widgets/celebration.dart` : `showTaskDoneBurst()` (`OverlayEntry` positionné sur le centre du bouton **calculé au moment du tap** — la carte change de section juste après, l'effet ne doit pas la suivre) et `showAllDoneCelebration()` (`showGeneralDialog`, fermeture auto via `AnimationController` plutôt que `Timer`, disposé si l'enfant ferme avant). Rebond de la carte : `TweenAnimationBuilder` joué une seule fois à la création — la carte cochée est un **nouvel élément** (autre section de la liste, les keys ne matchent qu'entre frères), d'où un flag `celebrate` piloté par `_justCompletedId` dans `TodayScreen` (passé en `ConsumerStatefulWidget`). Réglage système « réduire les animations » respecté (`MediaQuery.maybeDisableAnimationsOf`) : vibration + texte seuls.
- **Volet C — badge gagné** : `BadgeCelebrationListener` (monté dans `ShellScreen`, donc actif sur tous les onglets) écoute `memberBadgesProvider`. Mémoire locale = **date `earnedAt` du dernier badge fêté par membre** (`SecureStorageService.getBadgesCelebratedUntil`), pas une liste d'ids : au 1er passage elle est fixée à « maintenant » → les badges déjà acquis ne rejouent jamais, même si la 1re sync arrive plus tard (1er lancement hors ligne), alors que le 1er badge gagné après installation est bien fêté. Traitements sérialisés (deux émissions rapprochées ne lisent pas la même date). **File d'attente des célébrations plein écran** (`_enqueue` dans `celebration.dart`) : le badge « Première tâche » arrive par la sync 1-3 s après la dernière tâche, pendant la célébration « journée terminée » — elles s'enchaînent au lieu de s'empiler. `_AllDoneCelebration` factorisé en `_CelebrationCard` générique (headline/emoji/titre/sous-titre/durée).
- **Piège PowerSync — `timestamp` sans fuseau** (vérifié doc PowerSync) : Prisma `DateTime` = `timestamp(3)` Postgres sans fuseau (valeurs UTC), synchronisé au format `YYYY-MM-DD hh:mm:ss.sss` **sans `Z`** → `DateTime.parse` le lit en heure locale (décalage 1-2 h en France). Aurait fait passer un badge gagné juste après l'installation sous le seuil, jamais fêté. Fix : `parseUtcTimestamp()` (`models/badge.dart`) pour `earned_at`, `.toLocal()` à l'affichage (`badges_screen.dart`). **Les autres `fromLocalRow` (`exchange.created_at`, `schedule_item.date`) ont le même défaut, non corrigé** (impact nul aujourd'hui : tri fait en SQL, date planning nominale comparée en texte) — à garder en tête.
- **Bug points figés (signalé après rebuild APK, 2026-10-07)** : le serveur créditait bien (`PATCH /planning/items/:id` → `awardPointsForTask`), mais les 3 écrans mobile (bandeau Aujourd'hui, Profil, Récompenses) lisaient `AuthUser.points`, **copie figée au login**, jamais rafraîchie. Pas que cosmétique : `canAfford` (Récompenses) utilisait cette valeur → enfant incapable de réclamer une récompense pourtant payable avant de se reconnecter. Rendu visible par le « +N pts » animé. Fix : `myPointsProvider` (`shared/providers/my_points_provider.dart`) lit `family_members.points` en local PowerSync (déjà synchronisé), repli sur la valeur du login sans ligne locale. Les points restent ceux du serveur : hors ligne, ils montent à la reconnexion (le serveur seul crédite).
- **2 failles multi-tenant corrigées (2026-10-07)** — repérées en lisant le code du bug des points, puis recherche systématique des routes `:id` dont le service ne reçoit pas `familyId` : (1) `PATCH /planning/items/:itemId` ne vérifiait pas l'appartenance de l'item à la famille du token → tout compte authentifié pouvait changer le statut (donc **créditer/retirer des points**) d'un item d'une autre famille s'il connaissait son UUID. Fix : `updateScheduleItemService(itemId, familyId, input)` lève `NotFoundError` (404, ne révèle pas l'existence) si l'item est absent ou d'une autre famille — un item inexistant donnait avant une erreur Prisma P2025 (500). (2) `GET /badges/member/:memberId` renvoyait les badges de n'importe quel membre (fuite en lecture, faible sensibilité) → filtre `member: { familyId }` (relation, source de vérité, plutôt que la colonne `familyId` dénormalisée pour PowerSync). Toutes les autres routes `:id` passent déjà `familyId`.
- **Crud queue PowerSync bloquée sur 4xx — corrigé (2026-10-07)** : `PlanifyConnector.uploadData` laissait remonter toute erreur HTTP → si un item coché hors ligne avait été supprimé côté serveur entre-temps (planning supprimé par le parent), le `PATCH` répondait 404, le batch n'était jamais complété et **toutes les écritures locales suivantes restaient bloquées** (retry infini). Comportement préexistant (avant : 500 Prisma). Fix : `isPermanentRejection()` (`connector.dart`) — un 4xx définitif est abandonné (log `debugPrint`), la file continue ; PowerSync réaligne la ligne locale sur l'état serveur une fois la file vidée. Restent rejoués : erreurs réseau, 5xx, **401** (session expirée — l'écriture ne doit pas être perdue), 408, 429.
- **PIN enfant optionnel (Sprint 8, §7)** : options présentées (désactivation explicite par enfant / implicite « pas de PIN = libre » / statu quo + meilleur message), **option explicite choisie**. Raison : sans PIN, le code famille devient le seul secret ; or il est généré par `Math.random().toString(36)` (6 caractères, non cryptographique) et aucune route d'auth n'a de limite de tentatives — une ouverture implicite aurait rendu tout nouvel enfant accessible par défaut. `loginChildSchema.pin` devient optionnel, vérifié seulement si `pinRequired`. `GET /auth/family-members` expose `pinRequired` (mobile : absent = exigé, compatible ancienne API). Avertissement affiché au parent dans la modale (« toute personne connaissant le code famille pourra se connecter à sa place »).
- **Fuite du hash PIN corrigée** : `GET /family/members` (accessible à tout membre, enfants compris) renvoyait les lignes Prisma complètes, **hash argon2 du PIN** et `fcmToken` inclus — un PIN à 4 chiffres haché se casse hors ligne en minutes (10 000 essais) : un enfant pouvait retrouver le PIN de son frère/sa sœur. Fix (`members.repository.ts`) : `omit: { fcmToken }` + `toPublicMember()` remplace `pin` par `hasPin` (booléen) sur list/create/update ; `getMemberById` (usage interne) inchangé. Type partagé `FamilyMember` : `hasPin`, `pinRequired`.
- **⚠️ Ordre de déploiement (colonnes requises par le code)** : `db push` de `pinRequired`, `failedPinAttempts`, `pinLockedUntil`, `failedLoginAttempts`, `loginLockedUntil` sur la DB prod **avant** de pousser le code — sinon Vercel déploie une API qui sélectionne une colonne inexistante et la connexion enfant casse. Colonne additive avec défaut : l'ancien code n'est pas gêné par l'ordre inverse.
- **Anti-force brute (2026-10-07)** : aucune limite de tentatives sur `/auth/login-child` (PIN 4 chiffres = 10 000 combinaisons) ni `/auth/login`. Fix : `verifyWithLockout()` (`auth.service.ts`) — 5 échecs → blocage 15 min (`TooManyAttemptsError`, HTTP 429), par enfant (`FamilyMember.failedPinAttempts/pinLockedUntil`) et par compte parent (`User.failedLoginAttempts/loginLockedUntil`). Compteur **en base** (un compteur mémoire ne tient pas sur Vercel serverless) et **incrémenté atomiquement AVANT la vérification** : une rafale de requêtes parallèles ne peut pas toutes passer le contrôle avant le 1er échec enregistré (au-delà du quota → 429 sans vérifier). Pendant le blocage, le secret n'est même pas vérifié. Succès → compteur remis à zéro (les fautes de frappe isolées ne s'accumulent pas). Compromis assumé : un tiers peut bloquer un compte 15 min en se trompant exprès (déni de service limité).
- **Déblocage par le parent (manque signalé par l'utilisateur au test)** : un enfant bloqué devait attendre 15 min sans recours. Fix : `PATCH /family/members/:id/pin/unlock` (parent uniquement, enfant de sa famille). Web (demande utilisateur : info visuelle explicite) : carte enfant cerclée de rouge + bandeau `LockedBanner` sous la carte — icône cadenas (SVG inline, pas de lib d'icônes dans le projet), « Compte verrouillé — changer le code PIN », heure de fin du blocage, boutons « Changer le PIN » (ouvre la modale PIN) et « Débloquer ». Définir un nouveau PIN débloque aussi (`updateMemberPin` remet compteur et blocage à zéro — cas typique du PIN oublié). Pas d'équivalent pour le compte parent bloqué (attendre 15 min). Rappel : la désactivation du PIN est **volontairement web uniquement** — l'app mobile est l'interface enfant, sans écran réservé au parent.
- **Code famille cryptographique** : `randomFamilyCode()` en `crypto.randomInt` sur A-Z0-9. L'ancien `Math.random().toString(36).slice(2, 8)` était prédictible **et pouvait produire moins de 6 caractères** (ex. `0.5` → `"I"`) — une telle famille ne pouvait jamais connecter ses enfants (`loginChildSchema` exige 6). Codes existants inchangés.
- **Bug web préexistant — messages d'erreur API jamais affichés** : les 4 clients API web (`api.ts`, `planning.api.ts`, `challenges.api.ts`, `rewards.api.ts`) lisaient `err.message`, alors que l'API renvoie `{ error: "..." }` → le parent voyait « HTTP 401 » au lieu de « Email ou mot de passe incorrect » (et aurait vu « HTTP 429 » au blocage). Fix : `err.error ?? err.message`.
- Mobile : message dédié sur 429 (« Trop d'essais. Attends 15 minutes ou demande à un parent. ») au lieu de « PIN incorrect ».
- **Badge « challenge » (Sprint 8, §13)** : logique dans `gamification.ts` (pas dans `challenges.service.ts`, qui est déjà importé par `gamification.ts` — dépendance circulaire évitée). `checkChallengesAfterPoints()` renvoie désormais le nombre de défis réussis ; si > 0, `checkBadgesForFamilyChildren()` réévalue **tous** les badges de chaque enfant — corrige au passage un trou préexistant : le bonus de points d'un défi pouvait franchir un seuil de badge `POINTS` sans que personne ne le vérifie. `checkAndAwardBadges()` prend le membre (avec `createdAt`) et compte `FamilyChallenge` `COMPLETED` avec `completedAt >= member.createdAt`.
- **Fire-and-forget retiré sur Vercel** : `checkChallengesAfterPoints(...).catch(() => {})` n'était pas attendu — sur Vercel serverless, une promesse encore en vol après l'envoi de la réponse peut être interrompue (défi jamais validé, bonus jamais versé). Désormais `await` dans un `try/catch` qui logge (`console.error`) sans faire échouer la complétion de la tâche. **D'autres fire-and-forget subsistent** (`GamificationLog.create(...).catch`, logs Mongo) — impact faible (historique), non traités.
- **Les 4 échecs historiques de `task_card_test.dart`** : tests simplement périmés vs le composant (format `+10 pts`, bouton absent — pas désactivé — sans `onComplete`, chip « Fait ✓ » à la place d'une icône `check_circle`). Réalignés sur le comportement voulu, pas l'inverse.

**Modifications** :

```diff
+ apps/api/src/prisma/supabase-security.sql   (RLS toutes tables public + event trigger ensure_rls + requête de vérification, idempotent)
+ apps/mobile/lib/shared/widgets/celebration.dart   (gerbe +pts, célébration plein écran)
M apps/mobile/lib/features/tasks/task_card.dart     (gerbe au tap "Fait !", rebond `celebrate`)
M apps/mobile/lib/features/tasks/today_screen.dart  (ConsumerStatefulWidget, _justCompletedId, célébration dernière tâche)
M apps/mobile/lib/l10n/app_{fr,en}.arb + app_localizations*.dart  (celebrationAllDoneSubtitle, celebrationTapToContinue)
M apps/mobile/pubspec.yaml                          (confetti ^0.8.0)
M apps/mobile/test/widget/task_card_test.dart       (4 tests périmés réalignés + gerbe + réduire animations)
M apps/mobile/test/widget/today_screen_test.dart    (célébration dernière tâche / pas la dernière)
+ apps/mobile/lib/features/badges/badge_celebration.dart  (takeBadgesToCelebrate + BadgeCelebrationListener)
M apps/mobile/lib/app/shell_screen.dart             (body enveloppé par BadgeCelebrationListener)
M apps/mobile/lib/shared/services/secure_storage.dart  (get/saveBadgesCelebratedUntil, survit au logout)
M apps/mobile/lib/models/badge.dart                 (parseUtcTimestamp pour earned_at)
M apps/mobile/lib/features/badges/badges_screen.dart  (earnedAt.toLocal() à l'affichage)
+ apps/mobile/test/widget/badge_celebration_test.dart  (parseUtcTimestamp, takeBadgesToCelebrate, listener)
+ apps/mobile/lib/shared/providers/my_points_provider.dart (+ .g.dart)  (points en direct)
M apps/mobile/lib/features/{tasks/today_screen,rewards/rewards_screen,profile/profile_screen}.dart  (myPointsProvider)
M apps/mobile/lib/features/*/*.g.dart               (hashes de debug régénérés, périmés)
M apps/mobile/test/widget/today_screen_test.dart + test/database/powersync_local_test.dart  (points en direct)
M apps/api/src/modules/planning/{planning.service,planning.routes,planning.routes.test}.ts  (scope familyId sur PATCH items)
+ apps/api/src/modules/planning/planning.service.test.ts  (crédit, retrait, autre famille 404, inexistant 404)
M apps/api/src/modules/badges/{badges.routes,badges.routes.test}.ts  (filtre member.familyId)
M apps/mobile/lib/database/connector.dart          (isPermanentRejection : 4xx définitif abandonné)
M apps/mobile/test/database/powersync_local_test.dart  (404 débloque la file, 500/401 gardés)
M apps/api/src/prisma/schema.prisma                 (FamilyMember.pinRequired)
M apps/api/src/modules/auth/{auth.schema,auth.service,auth.repository,auth.service.test}.ts  (PIN optionnel si !pinRequired)
M apps/api/src/modules/members/{members.repository,members.schema,members.service,members.service.test}.ts  (pinRequired, toPublicMember)
+ apps/api/src/modules/members/members.repository.test.ts  (pin/fcmToken jamais renvoyés)
M apps/api/src/modules/planning/planning.service.ts  (annotation FamilyMember Prisma retirée)
M packages/types/src/family.ts                      (hasPin, pinRequired)
M apps/web/src/features/family/FamilyPage.tsx + services/api.ts + i18n/locales/{fr,en}.json  (PinStatus, case « Connexion sans PIN »)
M apps/mobile/lib/features/auth/{login_screen,auth_provider}.dart + shared/services/api_client.dart  (PIN masqué, connexion au tap)
M apps/mobile/lib/l10n/*  (loginChildFailed)
M apps/mobile/test/widget/login_screen_test.dart     (enfant avec / sans PIN, message 429)
M apps/api/src/prisma/schema.prisma                 (compteurs + dates de blocage User / FamilyMember)
M apps/api/src/core/errors/AppError.ts + core/middleware/error.middleware.ts  (TooManyAttemptsError 429)
M apps/api/src/modules/auth/{auth.service,auth.repository,auth.service.test}.ts  (verifyWithLockout, randomFamilyCode crypto)
+ apps/api/src/modules/auth/auth.repository.test.ts  (code famille toujours 6 caractères)
M apps/web/src/services/{api,planning.api,challenges.api,rewards.api}.ts  (lecture du champ `error`)
M apps/api/src/modules/members/{members.repository,members.service,members.routes}.ts + tests  (unlockPin, nouveau PIN = déblocage)
M apps/web/src/features/family/FamilyPage.tsx + services/api.ts + i18n  (statut Bloqué + bouton Débloquer, bandeau LockedBanner)
M apps/api/src/services/{gamification,gamification.test}.ts  (CHALLENGES_COMPLETED, checkBadgesForFamilyChildren, await défis)
M apps/api/src/modules/challenges/challenges.service.ts  (renvoie le nombre de défis réussis)
+ apps/api/src/modules/challenges/challenges.service.test.ts
M apps/api/src/prisma/seed.ts                       (3 badges défis)
M packages/types/src/family.ts                      (pinLockedUntil)
M apps/mobile/lib/features/auth/login_screen.dart + l10n  (loginTooManyAttempts)
M PROJECT_STATE.md                                  (étape RLS dans la procédure de déploiement, limitation pause PowerSync)
```

**Résultats** :

- Script exécuté sur la DB prod : Security Advisor 0 erreur.
- App web fonctionnelle, connexion + liste des tâches tablette OK (après redéploiement PowerSync).
- Mobile : `flutter analyze` 0 issue, `flutter test` **46/46 — suite 100 % verte** (fin des 4 échecs `task_card_test.dart`).
- API : **326/326 tests**, typecheck API + web 0 erreur.
- Animations (A + B + C) et points en direct **vérifiés en réel sur tablette** après rebuild APK.

**Prochaine session** : (1) Vérifier en réel : PIN optionnel (web + tablette), blocage après 5 PIN faux + déblocage par le parent, message d'erreur de login web lisible. (2) `db:seed` sur la prod (badges défis) + vérifier en réel : créer un défi à objectif bas, le réussir, voir « Nouveau badge ! Esprit d'équipe » sur la tablette de chaque enfant. (3) Reste du Backlog Sprint 8 : drag & drop, merge-conflict sync.

---

### Session 27 - 2026-07-23

**Objectif**: Reprise post-clôture PowerSync. Désactivation "Development tokens" (dashboard PowerSync, fait par l'utilisateur hors session). Ré-audit cahier des charges vs code réel (round 2, dernier audit exhaustif au 2026-07-06) — identifier les écarts restants maintenant que PowerSync/streak/planning mural/i18n FR-EN/80-20 sont bouclés.

**Méthode** : agent Explore délégué sur 10 points précis du cahier jamais vérifiés explicitement (drag & drop échange, animations UX, routes API exactes, badges milestones/streak/challenge, dashboard stats, PIN optionnel, merge-conflict sync, assets icônes/fonts, archi Express vs Hono, i18n ES/PT) — scope volontairement restreint aux items non déjà fermés par les sessions précédentes, pour éviter de re-vérifier du terrain déjà couvert.

**Résultats** :

- 5 écarts réels identifiés (drag & drop absent partout, animations de célébration absentes, badge "challenge" déconnecté du système `Badge`/`FamilyChallenge`, PIN enfant pas vraiment optionnel — bloque la connexion sans lui, merge-conflict sync jamais formalisé) — détail complet + fichier:ligne en Backlog Sprint 8.
- 3 écarts cosmétiques confirmés sans impact (nommage routes API, archi Hono, icônes émoji, ES/PT absents) — déjà connus ou sans conséquence fonctionnelle.
- Conformité confirmée sur dashboard stats parent, badges milestones/streak, routes CRUD principales.
- Aucun code touché — session 100% audit + documentation (`PROJECT_STATE.md`).

**Prochaine session** : Prioriser et traiter les 5 écarts réels du Backlog Sprint 8 avec l'utilisateur (aucun n'est bloquant, à arbitrer par valeur/effort). Items mineurs toujours en attente : `vite.config.ts` PWA manifest `lang: "fr"` statique, 4 échecs pré-existants `task_card_test.dart`.

---

### Session 26 - 2026-07-23/24

**Objectif**: Clôturer offline PowerSync (dernier gros morceau du cahier des charges) — setup PowerSync Cloud complet, debug jusqu'au bout, vérification réelle sur tablette. Puis 2 vagues de régressions découvertes en marge (CI/Vercel, environnement Docker local), et 3 demandes UX ponctuelles (filtres planning web/mobile, refonte carte récompense).

**Concepts introduits**:

- **PowerSync dérive le `row_type` de matérialisation du nom de table Postgres source du `FROM`, pas du nom de table déclaré côté client** : `FROM "Badge"` → type `"Badge"` ; le schema mobile déclare `badges` (snake_case). Sans alias explicite (`FROM "Badge" badges`), les lignes arrivent bien dans `ps_oplog` (comptées dans `hasSynced`/`downloadProgress`, zéro erreur visible) mais ne sont **jamais copiées** vers la table locale matérialisée `ps_data__<table>` — sync "réussie" en apparence, tables locales vides. Bug root-cause trouvé après plusieurs fausses pistes (secret HS256, `kid`, pooler, toggle Dev tokens — tous de vrais bugs rencontrés et fixés en chemin, mais pas LA cause de "aucune tâche affichée").
- **Le secret HS256 généré par `openssl rand -base64` est la forme encodée (JWK `k`), pas la clé brute** : `jwt.sign()` avec un `string` utilise les octets UTF-8 littéraux de la chaîne, mais PowerSync décode le secret en base64url avant de vérifier → signature mismatch (`PSYNC_S2101`). Fix : `Buffer.from(secret, "base64url")` avant signature.
- **PowerSync exige un `kid` dans le header JWT correspondant à la clé enregistrée dans son keystore** — sans lui, "key not found" même avec la bonne signature une fois le secret décodage fixé (`jwt.sign(..., { keyid: "..." })`).
- **Supabase Supavisor (pooler) ne supporte pas la réplication logique** — PowerSync (et tout consommateur de réplication logique Postgres) doit se connecter en direct (`db.<ref>.supabase.co`), pas via le pooler `aws-0-...pooler.supabase.com` utilisé pour les connexions applicatives classiques.
- **Le toggle "Development tokens" du dashboard PowerSync interfère avec le Client Auth custom** même quand un token HS256 valide est fourni — `request.jwt() ->> 'familyId'` résolvait `null` (buckets paramétrés jamais instanciés) tant qu'il était actif, sans aucune erreur pour l'expliquer.
- **`PowerSyncBackendConnector.fetchCredentials()` a un contrat strict** : retourner `null` = "utilisateur déconnecté" (le SDK arrête d'essayer), une erreur doit être **levée** (pas avalée) pour déclencher le retry/`invalidateCredentials()` interne. Un `try/catch { return null }` "pour la robustesse" viole ce contrat et fait tourner le SDK indéfiniment sur un token expiré en cache.
- **`':memory:'` SQLite n'est pas partagée entre connexions** dans le worker isolate natif de PowerSync — chaque connexion voit une DB vide séparée. Un fichier temporaire réel est nécessaire pour tester avec une vraie `PowerSyncDatabase`.
- **Les logs du dashboard PowerSync mélangent toutes les sessions connectées** (device réel `powersync-dart-core/... android` ET navigateur `powersync-js/... windows` si l'outil diagnostics-app est resté ouvert) sans les distinguer visuellement — plusieurs heures perdues à interpréter des logs d'un onglet de diagnostic oublié comme s'ils venaient de la tablette. Toujours vérifier le champ `user_agent`.
- **Le bundler de fonctions serverless Vercel (`/api/index.ts`) a un pipeline de build séparé du `buildCommand` custom** (qui lui lance `db:generate`) — sans `postinstall: prisma generate` dans `apps/api/package.json`, le client Prisma n'est jamais généré pour ce chemin (`@prisma/client` "no exported member" sur des types pourtant préexistants et inchangés).
- **`prisma.config.ts` avec le helper `env()` strict throw si la variable est absente** — cassait `pnpm install` dans les jobs CI où `DATABASE_URL` n'est pas encore défini à l'étape install. Fallback JS simple (`process.env["DATABASE_URL"] ?? "..."`) à la place, `prisma generate` n'a de toute façon besoin d'aucune connexion réelle.
- **Chromium headless a une locale par défaut `en-US`** — la détection auto de langue navigateur (feature de session précédente) basculait l'app en anglais dans Playwright, cassant tous les sélecteurs de texte français. Fix : `locale: "fr-FR"` dans `playwright.config.ts` (simule un vrai utilisateur FR, pas un contournement du test).
- **Un Dockerfile qui copie `package.json` seul avant `pnpm install` (pour le cache de layers) casse un hook `postinstall` qui a besoin d'autres fichiers** (ici `schema.prisma`) — ces fichiers doivent être copiés avant l'étape install, pas avec le reste des sources.

**Modifications** (liste non exhaustive, session très longue) :

```diff
M apps/api/src/prisma/schema.prisma                    (familyId dénormalisé TaskExchange/MemberBadge)
M apps/api/src/modules/exchanges/{exchanges.repository,exchanges.service}.ts
M apps/api/src/services/gamification.ts                (familyId dans memberBadge.createMany)
+ apps/api/src/modules/powersync/{powersync.service,powersync.routes}.ts
+ apps/api/powersync/sync-rules.yaml
M apps/api/package.json                                (postinstall: prisma generate)
M apps/api/prisma.config.ts                             (fallback DATABASE_URL sans throw)
M docker/api.Dockerfile                                 (COPY schema avant pnpm install)
M scripts/docker-dev.sh                                 (--reset-db)
M apps/mobile/lib/database/{schema,connector,database}.dart
M apps/mobile/lib/features/tasks/tasks_provider.dart
M apps/mobile/lib/features/planning_wall/{planning_wall_provider,planning_wall_screen}.dart  (+ filtres)
M apps/mobile/lib/features/exchanges/exchanges_provider.dart  (+ created_at, tri)
M apps/mobile/lib/features/rewards/rewards_screen.dart  (carte refaite)
M apps/mobile/lib/features/badges/badges_provider.dart
M apps/mobile/lib/models/{schedule_item,family_member,exchange,badge}.dart  (fromLocalRow)
+ apps/mobile/test/database/powersync_local_test.dart
M apps/web/src/features/planning/PlanningPage.tsx       (filtres membre/statut + vue jour)
M apps/web/playwright.config.ts                         (locale: fr-FR)
M apps/web/src/i18n/locales/{fr,en}.json + apps/mobile/lib/l10n/app_{fr,en}.arb
```

**Résultats**:

- Sync PowerSync confirmée fonctionnelle en diagnostics (262/262 `ScheduleItem` + toutes tables) puis **en conditions réelles sur tablette** : lecture tous écrans OK, écriture offline-first testée en mode avion (marquer fait → persiste → remonte après reconnexion) — confirmé par l'utilisateur.
- CI GitHub Actions + déploiement Vercel : tous verts après les 2 commits de fix (postinstall/prisma.config.ts, locale e2e).
- Environnement Docker local réparé (rebuild image + reset schéma + reseed) après avoir cassé au même endroit que Vercel (postinstall) + désync schéma local vs migration `familyId`.
- 3 demandes UX (filtres planning web/mobile, carte récompense) proposées puis validées avant implémentation — testées et confirmées fonctionnelles par l'utilisateur en web et mobile.
- `pnpm typecheck`/tests API 0 erreur, `flutter analyze` 0 issue, `flutter test` +22/-4 (mêmes 4 échecs pré-existants `task_card_test.dart`, aucune régression sur toute la session).

**Prochaine session** :

1. Désactiver "Development tokens" sur le dashboard PowerSync (utile seulement pour le diagnostic).
2. Follow-up mineur i18n : `vite.config.ts` PWA manifest `lang: "fr"` statique.
3. Ré-auditer le cahier des charges (dernier audit exhaustif au 2026-07-06) — PowerSync bouclé change la donne, voir s'il reste des écarts.
4. `task_card_test.dart` : 4 échecs pré-existants jamais investigués, à creuser si `TaskCard` est retouché.

---

### Session 25 - 2026-07-22

**Objectif**: Détection automatique de la langue navigateur/appareil (web + mobile), sélecteur manuel existant reste prioritaire dès qu'il est utilisé — approche validée avec l'utilisateur avant implémentation.

**Modifications** :

```diff
M apps/web/src/store/preferences.store.ts   (flag hasExplicitChoice)
M apps/web/src/i18n/config.ts               (détection navigator.language si !hasExplicitChoice)
M apps/mobile/lib/shared/providers/locale_provider.dart  (détection PlatformDispatcher.instance.locale si getLocale() null, sans persister)
```

**Résultats**:

- `pnpm typecheck` web 0 erreur, `flutter analyze` 0 issue, `flutter test` +18/-4 (4 échecs pré-existants `task_card_test.dart`, aucune régression).

**Prochaine session** : Backlog Sprint 7 restant — offline PowerSync (arbitrage nécessaire, voir Session 26).

---

### Session 24 - 2026-07-21

**Objectif**: APK mobile reconstruit et vérifié en réel (PC Windows). 2 bugs post-build (400 édition membre, modale qui ne se ferme pas), amélioration visuelle badges Midi/Soir mobile, streak/bonus série + écran Planning mural (backlog Sprint 7). Session arrêtée en cours d'écran Planning mural (juste avant le test widget).

**Concepts introduits**:

- **react-hook-form soumet la valeur cachée de `reset()`, pas la valeur DOM corrigée par le navigateur** : un `<input type="date">` alimenté par une valeur invalide (ISO datetime complet au lieu de `YYYY-MM-DD`) s'affiche vide côté navigateur (normalisation HTML5 standard), mais RHF garde en interne la valeur brute passée à `reset()` et la soumet telle quelle au submit — piège découvert en écrivant un test e2e qui passait à tort en ne vérifiant que le champ affiché, pas le payload réellement envoyé. Repro confirmée via Playwright (`page.route` + inspection du body de la requête interceptée) avant de conclure, pas de déduction seule.
- **Un test e2e peut être un faux positif silencieux** : le premier test écrit pour le bug "modale ne se ferme pas" passait alors que le bug était bel et bien présent — l'assertion ne vérifiait que la disparition du heading "Modifier le membre", qui redevient invisible dès que `editTarget` repasse à `null`, même si la modale reste ouverte (elle change juste de heading vers "Nouveau membre", `showForm` restant `true`). Un test qui passe avant même d'écrire le fix est suspect — vérifié explicitement ici en stashant le fix et en confirmant que le test échoue bien sans lui, avant de le considérer fiable.
- **`Badge.conditionType` est un `String` libre, pas un enum Prisma** : ajouter `"STREAK"` comme nouvelle valeur ne nécessite aucune migration/`db push`, juste du code + des données seedées.
- **`seedBadges()` "skip si count>0" bloque tout ajout futur** : ajouter un badge au tableau `badges` de `seed.ts` n'a aucun effet sur une DB déjà seedée (dev local, famille démo prod) avec ce garde-fou — rendu additif par nom pour que ce type d'ajout reste déployable sans wipe complet.
- **Planning mural — écart découvert vs cahier des charges en cours d'implémentation** : le cahier des charges veut un écran "collé au mur" **sans login enfant individuel**. Construit à la place (plus simple, réutilise l'auth existante) un écran accessible depuis Profil une fois connecté — répond au besoin "vue famille complète en lecture seule" mais pas au besoin "kiosque sans authentification". Décision à prendre en prochaine session : garder tel quel (accès via Profil suffisant ?) ou construire un vrai mode kiosque (accès par code famille seul, sans PIN membre).

**Modifications** :

```diff
M apps/web/src/features/family/FamilyPage.tsx        (fix birthDate slice YYYY-MM-DD, fix setShowForm(false) manquant)
+ apps/web/e2e/family.spec.ts                          (test régression 400 + fermeture modale, durci après faux positif détecté)
M apps/mobile/lib/features/tasks/today_screen.dart     (_SlotSubHeader : pill coloré ambre/indigo, icône 20px, texte 15px)
M apps/api/src/services/gamification.ts                (conditionType STREAK, computeStreak/dayKey)
M apps/api/src/services/gamification.test.ts            (2 tests STREAK : série atteinte / interrompue)
M apps/api/src/prisma/seed.ts                            (3 badges STREAK, seedBadges() additif par nom)
M apps/mobile/lib/shared/services/api_client.dart        (getWeekSchedule — planning courant, tous membres)
+ apps/mobile/lib/features/planning_wall/planning_wall_provider.dart
+ apps/mobile/lib/features/planning_wall/planning_wall_screen.dart
M apps/mobile/lib/app/router.dart                        (route /planning-wall)
M apps/mobile/lib/features/profile/profile_screen.dart    (entrée "Planning famille")
```

**Résultats**:

- 272/272 tests API, typecheck API + web 0 erreur, `flutter analyze` 0 issue, `flutter test` +12 -4 (échecs pré-existants inchangés, pas de régression après ajout Planning mural).
- 400 édition membre + modale non fermée : vérifiés en réel par l'utilisateur ("l'erreur 400 a disparu" / confirmé après fix modale).
- APK mobile : reconstruit sur PC Windows, persistance code famille + séparation Midi/Soir confirmées en réel (le doute initial venait d'un checkout pas à jour, pas d'un bug de code).
- Streak : `db:seed` lancé en local (`.env` racine, pas `apps/api/.env` qui lui n'a que `DATABASE_URL`) — `3 new badge(s) seeded (7 already present)`, confirmé additif. **Reste à lancer sur la DB prod** (Vercel/Supabase).
- Planning mural : implémenté, `flutter analyze` propre, **pas de test widget écrit** (session arrêtée avant), **pas vérifié en réel** (pas de rebuild APK cette session).

**Prochaine session** :

1. Écran Planning mural : écrire le test widget (pattern `today_screen_test.dart` — overrides `weekPlanningProvider`/`planningWallMembersProvider` via `ProviderScope`), trancher la question kiosque-sans-login, puis vérifier en réel après rebuild APK.
2. Lancer `pnpm --filter @planify-kids/api db:seed` **sur la DB prod** (déjà fait en local) pour peupler les badges STREAK, puis vérifier en réel qu'un enfant avec plusieurs jours consécutifs de tâches complétées reçoit bien le badge.
3. Backlog Sprint 7 restant : i18n FR/EN, offline PowerSync (arbitrage nécessaire).

---

### Session 23 - 2026-07-20

**Objectif**: 4 demandes utilisateur — récompenses non supprimables (bug confirmé), WeekCalendar web taille incohérente entre plannings, séparation visuelle Midi/Soir mobile, visuel jours fériés/vacances sur le planning web.

**Concepts introduits**:

- **FK sans `onDelete` = RESTRICT par défaut Postgres** : `RewardClaim.reward` n'avait pas de clause `onDelete` — dès qu'une récompense a été réclamée une seule fois (même une demande refusée, même ancienne), la suppression réelle (`prisma.reward.delete`) casse sur une violation de contrainte FK. Fix : pattern soft-delete déjà en place sur `TaskTemplate.isActive`, répliqué sur `Reward` — "Supprimer" (`DELETE /rewards/:id`) archive (`isActive: false`) au lieu de supprimer réellement ; `GET /rewards` filtre `isActive: true` ; historique des demandes préservé. Bug composé par un `deleteMutation` web sans `onError` — l'échec FK était totalement silencieux côté UI.
- **Bug de troncature silencieuse (WeekCalendar)** : `getDaysInRange()` (`PlanningPage.tsx`) plafonnait à 7 jours en dur (`days.length < 7`) — un planning généré manuellement sur une plage plus large avait ses items au-delà du 7e jour présents en DB mais jamais rendus, sans aucun signal. Cause racine du "chaque WeekCalendar doit être de la même taille" : les colonnes en `minmax(0, 1fr)` s'étirent différemment selon le nombre réel de jours du planning affiché. Fix : cap relevé à 31 (garde-fou, pas une limite métier) + colonnes en `minmax(150px, 1fr)` (largeur mini fixe, cohérente entre plannings).
- **Endpoint calendrier scolaire quasi prêt, juste jamais exposé** : `SchoolCalendarCache` + `classifyDays()`/`getOffDays()` (session 21, création planning midi/soir) existaient déjà avec toute la donnée fériés/vacances nécessaire, mais collapsée en `Set<string>` booléen à usage interne uniquement — aucune route API ne l'exposait. Ajout `getCalendarEntries()` (réutilise le bootstrap `ensureZoneSynced` extrait de `getOffDays`) + `GET /planning/calendar?startDate&endDate`, déclarée **avant** `GET /planning/:id` (sinon capturée comme un id — piège routes Hono déjà documenté).
- **`Border` non-uniforme + `borderRadius` = crash Flutter au paint** : tentative d'accent visuel Midi/Soir via un `Border(left: BorderSide(color: slotColor, width: 4), ...)` combiné à `BorderRadius.circular` sur le même `BoxDecoration` — Flutter rejette cette combinaison au moment du paint (`RenderDecoratedBox` exception), détecté via `flutter test` (crash complet de `today_screen_test.dart`, pas juste un test unitaire visé). Fix : bordure `Border.all` uniforme conservée, accent implémenté comme un vrai enfant (`Container` 4px coloré) dans un `Row` sous `ClipRRect`+`IntrinsicHeight` — plus sûr que de bricoler `BoxDecoration`.

**Modifications** :

```diff
M apps/api/src/prisma/schema.prisma                       (Reward.isActive)
M apps/api/src/modules/rewards/rewards.repository.ts        (archiveReward au lieu de deleteReward, filtre isActive)
M apps/api/src/modules/rewards/rewards.service.ts            (deleteRewardService archive, claim refuse une reward archivée)
M apps/api/src/modules/rewards/rewards.service.test.ts
M apps/web/src/features/rewards/RewardsPage.tsx              (onError sur deleteMutation)
M packages/types/src/rewards.ts                               (Reward.isActive)
M apps/web/src/features/planning/PlanningPage.tsx             (grille 7 colonnes fixes, cap 31j, badge/teinte jours fériés-vacances)
M apps/web/src/services/planning.api.ts                       (planningApi.calendar)
M packages/types/src/planning.ts                              (CalendarEntry)
M apps/api/src/services/school-calendar.ts                    (ensureZoneSynced extrait, getCalendarEntries)
M apps/api/src/modules/planning/planning.schema.ts             (calendarQuerySchema)
M apps/api/src/modules/planning/planning.service.ts             (getSchoolCalendarService)
M apps/api/src/modules/planning/planning.routes.ts               (GET /planning/calendar)
M apps/api/src/modules/planning/planning.routes.test.ts
M apps/mobile/lib/features/tasks/today_screen.dart              (_SlotGroup, _SlotSubHeader — sous-groupes Midi/Soir)
M apps/mobile/lib/features/tasks/task_card.dart                  (bande d'accent colorée par créneau, retrait du label inline redondant)
```

**Résultats**:

- 270/270 tests API, typecheck API + web 0 erreur.
- `flutter analyze` 0 issue. `flutter test` : +12 -4 (les 4 échecs restent les échecs pré-existants `task_card_test.dart`, confirmés non liés — voir Next Steps ci-dessus pour le détail).
- Aucun de ces changements n'est encore vérifié en réel (tablette bloquée sur rebuild APK, voir Next Steps).

**Prochaine session** :

1. Rebuild + réinstall APK mobile (PC Windows) — valider en réel séparation Midi/Soir + tout le reste en attente depuis Session 21/22.
2. Backlog Sprint 7 restant : streak, i18n, offline PowerSync, écran planning mural.
3. Optionnel : investiguer les 4 échecs pré-existants `task_card_test.dart` si du temps est dégagé (détail des causes dans Next Steps).

---

### Session 22 - 2026-07-20

**Objectif**: Sprint 7 — notifications manquantes (badge gagné, rappel matin, tâche oubliée soir). Rebuild APK mobile reporté (bloqué sur cette machine, à faire côté PC Windows).

**Concepts introduits**:

- **Bornes de "jour courant" côté cron** : pour scanner les `ScheduleItem` du jour sans retomber dans le piège timezone documenté Session 21, dérivation directe depuis les composants locaux de `Date` (`getFullYear/getMonth/getDate` → `new Date(y, m, d, h, m, s)`) plutôt que `setHours` + `toISOString()`. Isolé dans `todayRange()` (`planning-cron.ts`).
- **Mock de chaîne inter-services en test** : `gamification.ts` appelle désormais `notifications.service.ts` (qui appelle lui-même `prisma.notification`/`familyMember.findUnique` non mockés dans `gamification.test.ts`) — pattern déjà documenté (mocker le module intermédiaire) appliqué : `vi.mock("../modules/notifications/notifications.service", ...)` plutôt que de complexifier le mock Prisma existant.

**Modifications** :

```diff
M apps/api/src/prisma/schema.prisma                    (NotificationType += BADGE_EARNED, TASKS_REMINDER, TASKS_FORGOTTEN)
M apps/api/src/modules/notifications/notifications.service.ts  (notifyBadgeEarned, notifyTasksReminder, notifyTasksForgotten)
M apps/api/src/services/gamification.ts                 (appel notifyBadgeEarned dans checkAndAwardBadges)
M apps/api/src/services/gamification.test.ts             (mock notifications.service, assertion notif badge)
M apps/api/src/services/planning-cron.ts                 (startTaskReminderCron 08:00, startForgottenTaskCron 20:00, todayRange/notifyPendingTasksForToday partagés)
M apps/api/src/server.ts                                  (wiring des 2 nouveaux crons)
```

**Résultats**:

- 266/266 tests API (1 nouveau test badge), typecheck API 0 erreur.
- `db push` appliqué (3 nouvelles valeurs enum, additif).
- Pas de test dédié pour `planning-cron.ts` (aucun test cron n'existe sur ce fichier — précédent déjà établi, scheduling non testé unitairement).
- Rebuild APK (point 1 backlog) **non fait** — bloqué sur cette machine (aarch64, cf. Session pré-Sprint 7), reste à faire côté PC Windows Intel par l'utilisateur.

**Prochaine session** :

1. Confirmer le rebuild + réinstall APK côté PC Windows (persistance code famille + badge Midi/Soir + les 3 nouvelles notifications, tout à valider en réel sur tablette une fois l'APK à jour).
2. Bonus série/streak (gamification), écran "Planning mural", puis les 2 gros chantiers d'arbitrage (offline PowerSync, i18n FR/EN) — backlog inchangé.

---

### Session 21 - 2026-07-19

**Objectif**: Sprint 7 — bug rotation planning, 3 demandes UX/produit (texte tronqué, règle 80/20, persistance code famille mobile), créneaux midi/soir selon calendrier scolaire France/DOM-TOM, incident credentials Supabase

**Concepts introduits**:

- **Fenêtre d'historique bornée pour un algo de fairness** : `getMemberLoadHistory()` sommait tout l'historique depuis toujours — sur une famille ayant subi un bug d'assignation pendant des semaines, la dette cumulée écrasait le tie-break et faisait basculer 100% des tâches vers le membre défavorisé. Fix : fenêtre glissante 28j. Leçon générale : toute charge cumulée historique doit être bornée dans le temps, pas sommée depuis l'origine.
- **Recentrage par groupe de poids** : même piège rencontré une 2e fois avec la règle 80/20 (parents à 0 historique vs enfants à 100%) — fix générique : recentrer la charge initiale de chaque groupe de poids sur sa propre moyenne avant comparaison, pour que seul le poids pilote la répartition de la génération courante.
- **`prisma migrate dev` vs `db push`** : ce projet n'a jamais utilisé `prisma migrate` (pas d'historique de migrations) — `migrate dev` demande un reset destructif de la DB faute de cet historique. Toujours utiliser `db push --accept-data-loss` ici (convention établie, additive tant que le schéma ne fait que rajouter des colonnes/tables).
- **Docker dev — volumes partiels** : `docker-compose.yml` monte `apps/api/src` et `apps/web/src` en volume mais PAS `packages/types` ni `node_modules` — un changement de schéma Prisma ou de types partagés nécessite un restart (api, régénère Prisma via l'entrypoint) ou un rebuild d'image (web, `packages/types` copié au build seulement).
- **Piège timezone `setHours` local + `toISOString()` UTC** : le serveur tourne en `Europe/Paris`, pas UTC — `date.setHours(0,0,0,0)` (reset en heure locale) suivi de `.toISOString().slice(0,10)` (lecture UTC) décale le dernier jour d'une plage d'un jour en arrière quand l'offset local est positif. Ne jamais mélanger reset d'heure locale et clé de date UTC.
- **2 API gouv distinctes pour jours fériés + vacances scolaires** : `calendrier.api.gouv.fr` (jours fériés uniquement) et `data.education.gouv.fr` dataset `fr-en-calendrier-scolaire` (vacances, Zone A/B/C + DOM-TOM) sont deux sources séparées malgré l'intuition d'une seule API "calendrier France" — vérifié par requêtes curl directes avant d'écrire le service (labels de zone exacts confirmés via facet, ex. `"Réunion"` pas `"La Réunion"`).
- **Rotation de secret ≠ juste régénérer** : après rotation d'un mot de passe DB exposé en chat, il faut aussi mettre à jour TOUTES les variables d'environnement qui l'utilisent (Vercel ici) ET redéployer (Vercel ne relit pas les env vars d'un déploiement déjà buildé) — sinon le service qui l'utilise casse silencieusement.

**Modifications** (résumé — voir section "📋 Backlog Sprint 7" pour le détail complet par item) :

```diff
M apps/api/src/services/planning-greedy.ts        (rotation tie-break, poids 80/20, dayTypes midi/soir)
M apps/api/src/modules/planning/planning.repository.ts  (historique borné 28j, getFamilySchoolZone, slot)
M apps/api/src/modules/planning/planning.service.ts     (80/20, classifyDays, dayTypes)
M apps/api/src/modules/members/family.settings.routes.ts (PATCH /family schoolZone)
M apps/api/src/prisma/schema.prisma                (CalendarZone, Slot, Family.schoolZone, ScheduleItem.slot, SchoolCalendarCache)
+ apps/api/src/services/school-calendar.ts          (fetch + cache jours fériés/vacances, lazy-fill)
M apps/api/src/services/planning-cron.ts            (cron sync calendrier hebdo)
+ apps/web/src/components/shared/IconPicker.tsx      (picker émoji réutilisable)
M apps/web/src/features/tasks/TasksPage.tsx          (icône tâche)
M apps/web/src/features/rewards/RewardsPage.tsx      (icône récompense)
M apps/web/src/features/planning/PlanningPage.tsx    (texte tronqué + badge Midi/Soir)
M apps/web/src/features/settings/SettingsPage.tsx    (sélecteur zone scolaire)
M packages/types/src/family.ts, planning.ts          (CalendarZone, Slot)
M apps/mobile/lib/shared/services/secure_storage.dart (familyCode, clearSession)
M apps/mobile/lib/features/auth/auth_provider.dart   (persistance code famille)
M apps/mobile/lib/features/auth/login_screen.dart    (préchargement code famille)
M apps/mobile/lib/models/schedule_item.dart           (champ slot)
M apps/mobile/lib/features/tasks/task_card.dart       (badge Midi/Soir)
```

**Résultats**:

- Bug rotation planning + fenêtre historique : 256/256 tests, vérifié en réel (répartition mixte confirmée visuellement, plus de biais déterministe).
- Règle 80/20 : 6 tests `planning-greedy.test.ts`, vérifié en réel (~24% parent sur 28 tâches).
- Sélecteur d'icône tâches/récompenses : root cause du "icône manquante en prod" trouvée (aucun champ icône dans le formulaire web), fixé.
- Persistance code famille mobile : 10/10 tests widget, **pas encore sur la tablette réelle** (APK à reconstruire).
- Créneaux midi/soir : 266/266 tests API (16 nouveaux), vérifié en réel bout-en-bout (génération + cache DB réel peuplé — 22 jours fériés, 531 jours de vacances — + badges visibles web et mobile).
- Incident credentials Supabase : mot de passe DB exposé accidentellement en chat à 2 reprises (une fois collé par l'utilisateur, une fois via auto-read du `.env` par l'IDE) → rotation effectuée côté Supabase + Vercel (env var + redeploy), `JWT_SECRET` également exposé, à rotation recommandée. `.env` racine confirmé jamais commité (gitignore respecté).
- Typecheck API + Web : 0 erreur tout du long. `flutter analyze` : 0 issue.

**Prochaine session** (validé avec l'utilisateur) :

1. Reconstruire + réinstaller l'APK mobile (persistance code famille + badge Midi/Soir pas encore testables en réel).
2. Notification "badge gagné" manquante (`checkAndAwardBadges()` → ajouter l'appel notification, petit fix ciblé).
3. Notifications "tâche oubliée" (soir) + "rappel tâche du jour" (matin) — extension du cron `planning-cron.ts` existant, un seul chantier pour les deux.
4. Ensuite, par ordre de valeur : bonus série/streak (gamification), écran "Planning mural" (nouvel écran mobile lecture seule), puis les 2 gros chantiers nécessitant arbitrage (offline PowerSync, i18n FR/EN).

---

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
- Fix exports nommés déployé → `/api/health` répond enfin (`db: "ok"`) mais `mongo: "error"` persistant, même sur invocation chaude. Log révèle race condition cold start : réponse `/api/health` envoyée à `23:15:15.737`, log `"✅ MongoDB connecté"` imprimé 484ms après (`23:15:16.221`) — `connectMongo()` fire-and-forget (non attendu) au module top-level, la 1ère requête arrive avant la fin de connexion, `mongoose.connection.readyState` encore à 0. Fix : `await` explicite sur `prisma.$connect()` et `connectMongo()` en top-level await (permis car `"type": "module"`) — bloque le cold start jusqu'à connexion établie, coût unique (~qq centaines de ms à 8s max) amorti sur invocations chaudes suivantes.
- `/api/health` → `200 { status: "ok", db: "ok", mongo: "ok" }`. Login web + création de compte testés en production avec succès. Déploiement Vercel opérationnel de bout en bout.

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
