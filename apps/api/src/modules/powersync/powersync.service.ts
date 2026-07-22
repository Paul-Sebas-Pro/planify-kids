import jwt, { type Secret } from "jsonwebtoken";
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

  return jwt.sign({ familyId, role }, env.POWERSYNC_JWT_SECRET as Secret, {
    subject: memberId,
    audience: env.POWERSYNC_URL,
    algorithm: "HS256",
    expiresIn: "50m",
    // Doit matcher le "kid" enregistré dans le keystore PowerSync (dashboard
    // Client Auth) — sinon PSYNC_S2101 "Could not find an appropriate key".
    keyid: "POWERSYNC_JWT_SECRET",
  });
}
