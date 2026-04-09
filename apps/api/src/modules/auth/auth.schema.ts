import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court (8 caractères min.)"),
  familyName: z.string().min(1, "Nom de famille requis").max(80),
  parentName: z.string().min(1, "Prénom requis").max(80),
  timezone: z.string().default("Europe/Paris"),
  locale: z.enum(["fr", "en", "es", "pt"]).default("fr"),
});

export const loginSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
