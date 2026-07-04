import { Hono } from "hono";
import { handle } from "hono/vercel";
import app from "../apps/api/src/app.js";
import { connectMongo } from "../apps/api/src/config/mongo.js";
import { prisma } from "../apps/api/src/config/database.js";
import { initSentry } from "../apps/api/src/config/sentry.js";
import { initFirebase } from "../apps/api/src/config/firebase.js";

// Node.js runtime — nécessaire pour argon2 et firebase-admin (native addons)
export const config = { runtime: "nodejs" };

// Initialisations au démarrage Lambda — réutilisées sur les invocations tièdes
initSentry();
initFirebase();
prisma.$connect().catch(console.error);
connectMongo().catch(console.error);

// Monte l'app au préfixe /api (rewrite Vercel conserve le path original)
const root = new Hono();
root.route("/api", app);

export default handle(root);
