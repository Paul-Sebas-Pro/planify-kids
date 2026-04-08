# Cahier des charges - Planify Kids

## 1. Présentation du projet

### Nom

**Planify Kids**

### Type

Application SaaS Web + Mobile + Tablette (offline-first)

### Objectif

Gérer intelligemment les tâches ménagères familiales avec gamification pour enfants.

### Cible

Familles avec enfants **6 à 20 ans**

---

## 2. Objectifs produit

Objectifs principaux :

1. Automatiser répartition tâches
2. Responsabiliser enfants
3. Gamifier tâches ménagères
4. Interface simple tablette
5. Fonctionnement offline
6. Éviter conflits familiaux

---

## 3. Utilisateurs

### Parent (admin)

Permissions :

* créer famille
* gérer tâches
* générer planning
* gérer récompenses
* voir statistiques

---

### Enfant

Permissions :

* voir planning
* cocher tâche
* échanger tâche
* gagner points
* voir badges

---

## 4. Fonctionnalités principales

### 4.1 Gestion famille

* créer famille
* ajouter enfant
* avatar enfant
* couleur enfant
* âge enfant
* rôle utilisateur

---

### 4.2 Gestion tâches

Champs :

* nom
* description
* icône
* points
* difficulté
* durée
* fréquence
* actif
* obligatoire

---

### 4.3 Planning automatique

Types :

* quotidien
* hebdomadaire
* mensuel

Règles :

* 80% enfants
* 20% parents
* équilibrage
* rotation
* IA distribution

---

### 4.4 Échange tâches

Fonction :

* drag & drop
* échange enfant
* validation auto
* tâche toujours assignée

---

### 4.5 Validation tâches

Workflow :

* enfant coche
* animation
* points
* badge

---

### 4.6 Gamification

Points :

* par tâche
* bonus série
* bonus semaine

Badges :

* première tâche
* série
* champion

Récompenses :

* personnalisées
* coût points
* validation parent

---

### 4.7 Notifications

* rappel tâche
* tâche oubliée
* badge gagné
* récompense

Supports :

* tablette
* mobile
* web

---

## 5. Règles métier

### Règle 1

Toutes tâches assignées

### Règle 2

80% enfants

### Règle 3

Rotation équitable

### Règle 4

Équilibrage difficulté

### Règle 5

Échanges autorisés

### Règle 6

Offline prioritaire

---

## 6. Architecture technique

Frontend tablette :

* Flutter

Web admin :

* React

Backend :

* Express

ORM :

* Prisma

DB principale :

* PostgreSQL

Logs :

* MongoDB

Auth :

* Argon2
* JWT

---

## 7. Authentification

Parents :

* email
* password argon2
* JWT

Enfants :

* sélection avatar
* PIN optionnel

---

## 8. Base de données

PostgreSQL :

* families
* users
* members
* tasks
* schedules
* schedule_items
* badges
* rewards
* exchanges

MongoDB :

* logs
* analytics
* sync

---

## 9. Offline-first

Stockage local tablette :

* planning
* tâches
* membres
* points
* badges

Sync :

* last_sync
* updated_at
* merge conflits

---

## 10. UX/UI

Principes :

* gros boutons
* couleurs enfants
* drag & drop
* animations
* tableau mural

---

## 11. Écrans

1 Planning mural
2 Mes tâches
3 Échange
4 Badges
5 Récompenses
6 Admin parents
7 Gestion tâches
8 Famille

---

## 12. API REST

Auth :
POST /auth/login

Tasks :
GET /tasks
POST /tasks
PATCH /tasks/:id
DELETE /tasks/:id

Planning :
GET /planning
PATCH /planning/swap
PATCH /planning/complete

Family :
GET /family
POST /family/member

---

## 13. Gamification

Points :

* difficulté
* durée
* bonus

Badges :

* milestones
* streak
* challenge

---

## 14. Statistiques

Parents voient :

* tâches par enfant
* points
* badges
* progression

---

## 15. Multi-langue

Langues :

* Français
* Anglais
* Espagnol
* Portugais

i18n :

* textes
* badges
* notifications

---

## 16. Roadmap

### MVP

* famille
* tâches
* planning auto
* check tâche
* points
* offline

---

### V1

* badges
* récompenses
* échanges
* notifications

---

### V2

* IA avancée
* statistiques
* mobile parents
* widgets

---

## 17. Non fonctionnel

Performance :

* offline rapide
* sync < 2s

Sécurité :

* JWT
* argon2
* multi tenant

Accessibilité :

* enfants 6 ans
* tactile

---

## 18. Assets open source

Icons :

* Material Icons
* Phosphor

Fonts :

* Inter
* Nunito
* Poppins

Images :

* unDraw
* OpenMoji

---
