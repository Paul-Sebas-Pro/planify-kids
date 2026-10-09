import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
    // Vercel (variable VERCEL posée par la plateforme) : chaque instance
    // serverless a son propre pool. Avec le défaut de pg (10 connexions par
    // instance), quelques instances parallèles (rafale d'écritures de la
    // tablette à la reconnexion) saturaient le pooler Supabase
    // (EMAXCONNSESSION, vu en prod). Peu de connexions par instance, comme le
    // recommande Supabase en serverless — avec le pooler en mode transaction
    // (port 6543) dans DATABASE_URL.
    max: process.env["VERCEL"] ? 2 : 10,
  });

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
