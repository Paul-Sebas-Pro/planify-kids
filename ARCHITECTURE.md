# ARCHITECTURE.md

## 🏛 Vision Architecturale

**Type**: [Monolithe modulaire / Microservices / Serverless]

**Principes**:

- Clean Architecture
- Separation of Concerns
- Dependency Injection
- SOLID

---

## 📂 Structure des Dossiers

- Backend Express + Prisma
- Frontend React (admin)
- App Flutter (tablette)
- Offline sync
- Mongo logs
- Clean architecture scalable

---

## 🏗️ Architecture Monorepo (recommandé)

```bash
planify-kids/
│
├── apps/
│   ├── api/
│   ├── web-admin/
│   └── tablet-app/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── i18n/
│   └── config/
│
├── docs/
├── scripts/
└── docker/
```

---

## 🚀 Backend — Express + Prisma

```plaintext
apps/api/
│
├── src/
│   ├── app.ts
│   ├── server.ts
│
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   ├── mongo.ts
│   │   └── logger.ts
│
│   ├── modules/
│   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │
│   │   ├── family/
│   │   ├── members/
│   │   ├── tasks/
│   │   ├── planning/
│   │   ├── badges/
│   │   ├── rewards/
│   │   ├── exchanges/
│   │   └── notifications/
│
│   ├── core/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logging.middleware.ts
│   │
│   │   ├── utils/
│   │   ├── errors/
│   │   └── constants/
│
│   ├── services/
│   │   ├── planning-ai.service.ts
│   │   ├── sync.service.ts
│   │   ├── gamification.service.ts
│   │   └── notification.service.ts
│
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│
│   └── mongo/
│       ├── log.repository.ts
│       └── analytics.repository.ts
│
└── package.json
```

---

## 🧠 Structure module (exemple tasks)

```plaintext
tasks/
│
├── tasks.controller.ts
├── tasks.service.ts
├── tasks.repository.ts
├── tasks.routes.ts
├── tasks.schema.ts
├── tasks.types.ts
└── tasks.mapper.ts
```

Architecture :

- Controller → HTTP
- Service → logique métier
- Repository → Prisma
- Schema → validation Zod
- Mapper → DTO

---

## 🌐 React Admin — architecture

```plaintext
apps/web-admin/
│
├── src/
│
├── app/
│   ├── layout.tsx
│   ├── providers.tsx
│   └── routes.tsx
│
├── pages/
│   ├── dashboard/
│   ├── family/
│   ├── tasks/
│   ├── planning/
│   ├── rewards/
│   └── settings/
│
├── features/
│   ├── family/
│   ├── tasks/
│   ├── planning/
│   ├── rewards/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── hooks/
│
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── tasks.service.ts
│   └── planning.service.ts
│
├── store/
│   ├── auth.store.ts
│   ├── family.store.ts
│   └── planning.store.ts
│
├── i18n/
├── styles/
└── utils/
```

---

## 📱 Flutter Tablet App — architecture

```plaintext
apps/tablet-app/
│
├── lib/
│
├── main.dart
│
├── core/
│   ├── theme/
│   ├── constants/
│   ├── utils/
│   └── widgets/
│
├── features/
│
│   ├── planning/
│   │   ├── planning_screen.dart
│   │   ├── planning_controller.dart
│   │   ├── planning_repository.dart
│   │   └── planning_widgets.dart
│
│   ├── tasks/
│   ├── family/
│   ├── badges/
│   ├── rewards/
│   └── exchange/
│
├── offline/
│   ├── local_db.dart
│   ├── sync_queue.dart
│   ├── sync_service.dart
│   └── conflict_resolver.dart
│
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   └── notification_service.dart
│
├── models/
│
├── providers/
│
└── i18n/
```

---

## 🗄️ Shared packages

### types

```plaintext
packages/types/
│
├── user.ts
├── family.ts
├── task.ts
├── planning.ts
└── index.ts
```

---

### UI shared

```plaintext
packages/ui/
│
├── button/
├── card/
├── badge/
├── avatar/
└── planning-grid/
```

---

### i18n

```plaintext
packages/i18n/
│
├── fr.json
├── en.json
├── es.json
├── pt.json
└── index.ts
```

---

## 🧠 Sync offline dossier

```plaintext
offline/
│
├── sync_queue.ts
├── sync_engine.ts
├── sync_push.ts
├── sync_pull.ts
├── conflict_resolver.ts
└── sync_types.ts
```

---

## 🔐 Auth dossier

```plaintext
auth/
│
├── argon2.ts
├── jwt.ts
├── auth.middleware.ts
└── roles.ts
```

---

## 🧪 Tests

```plaintext
tests/
│
├── unit/
├── integration/
└── e2e/
```

---

## 🐳 Docker

```plaintext
docker/
│
├── api.Dockerfile
├── postgres.yml
├── mongo.yml
└── docker-compose.yml
```

---

## ⚙️ Env

```plaintext
.env
.env.local
.env.prod
```

---

## 🧱 Clean Architecture respectée

Layers :

Controller
↓
Service
↓
Repository
↓
Prisma

---

## 🚀 Scalable pour SaaS

Supporte :

- multi-familles
- multi devices
- offline sync
- mobile
- tablette

---

## 🔄 Flux de Données

```plaintext
UI Component → Hook → Use Case → Repository → Database
                ↓
            State Management
```

---

## 🔐 Sécurité

- **Authentication**: [JWT]
- **Authorization**: [RBAC/ABAC]
- **Data Validation**: [Zod/Yup]
- **API Security**: [Rate limiting, CORS, CSP]

---

## 🧪 Stratégie de Tests

- **Unit Tests**: Core business logic (>80% coverage)
- **Integration Tests**: API endpoints
- **E2E Tests**: Critical user flows
- **Performance Tests**: [Si applicable]

---

## 🚀 Déploiement

- **Environnements**: Dev → Staging → Production
- **CI/CD**: [GitHub Actions/GitLab CI]
- **Hosting**: [Vercel]
- **Database**: [Supabase]

---

## 📊 Monitoring

- **Logs**: [Winston]
- **Errors**: [Sentry]
- **Analytics**: [Posthog/Mixpanel]
