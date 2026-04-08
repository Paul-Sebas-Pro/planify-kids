import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log("✅ MongoDB connecté");
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
