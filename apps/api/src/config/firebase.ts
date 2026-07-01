import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "./env.js";

let initialized = false;

export function initFirebase() {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) return;

  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  initialized = true;
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!initialized) return;

  try {
    await getMessaging().send({ token: fcmToken, notification: { title, body }, ...(data && { data }) });
  } catch (err) {
    process.stdout.write(
      JSON.stringify({ ts: new Date().toISOString(), level: "warn", msg: "FCM send failed", err: String(err) }) + "\n",
    );
  }
}
