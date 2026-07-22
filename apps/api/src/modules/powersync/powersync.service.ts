import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";

export function issuePowerSyncToken(
  memberId: string,
  familyId: string,
  role: "PARENT" | "CHILD",
): string {
  if (!env.POWERSYNC_URL || !env.POWERSYNC_JWT_SECRET) {
    throw new AppError(
      "PowerSync non configuré sur ce serveur",
      501,
      "POWERSYNC_NOT_CONFIGURED",
    );
  }

  // Le secret généré (openssl rand -base64 | tr...) est la forme base64url
  // encodée du format JWK 'k' — la clé HMAC réelle est constituée des octets
  // décodés, pas de la chaîne encodée elle-même (sinon PSYNC_S2101 "signature
  // verification failed" côté PowerSync, qui décode avant de vérifier).
  const key = Buffer.from(env.POWERSYNC_JWT_SECRET, "base64url");

  return jwt.sign({ familyId, role }, key, {
    subject: memberId,
    audience: env.POWERSYNC_URL,
    algorithm: "HS256",
    expiresIn: "50m",
    // Doit matcher le "kid" enregistré dans le keystore PowerSync (dashboard
    // Client Auth) — sinon PSYNC_S2101 "Could not find an appropriate key".
    keyid: "POWERSYNC_JWT_SECRET",
  });
}
