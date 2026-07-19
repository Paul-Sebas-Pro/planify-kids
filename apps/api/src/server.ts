import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import { prisma } from "./config/database.js";
import { startPlanningCron, startCalendarSyncCron } from "./services/planning-cron.js";
import { initSentry } from "./config/sentry.js";
import { initFirebase } from "./config/firebase.js";

initSentry();
initFirebase();

async function start() {
  // Connexions DB
  await prisma.$connect();
  console.log("✅ PostgreSQL connecté");

  await connectMongo();

  // Jobs récurrents
  startPlanningCron();
  startCalendarSyncCron();

  // Démarrage du serveur
  serve({ fetch: app.fetch, port: env.PORT, hostname: "0.0.0.0" }, () => {
    console.log(`🚀 API démarrée sur http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Démarrage impossible :", err);
  process.exit(1);
});
