import { Hono } from "hono";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { issuePowerSyncToken } from "./powersync.service.js";

export const powersyncRoutes = new Hono();

powersyncRoutes.use("*", authMiddleware);

// GET /powersync/token — émet un JWT dédié PowerSync (aud/exp propres,
// distinct du JWT applicatif) à partir de la session déjà authentifiée.
powersyncRoutes.get("/token", async (c) => {
  const { memberId, familyId, role } = c.get("user");
  const token = issuePowerSyncToken(memberId, familyId, role);
  return c.json({ success: true, data: { token } });
});
