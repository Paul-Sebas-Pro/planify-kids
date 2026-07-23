import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` n'a besoin d'aucune connexion réelle (génération basée
// sur le schema uniquement) — un fallback évite l'échec de `postinstall`
// dans les contextes où DATABASE_URL n'est pas encore défini (install CI,
// bundler de fonctions serverless Vercel avant que le vrai buildCommand
// n'ait tourné). `db:push`/`db:seed`/etc. utilisent la vraie valeur dès
// qu'elle est présente dans l'environnement.
export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "postgresql://build:build@localhost/build",
  },
});
