import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requireRole } from "../../core/middleware/auth.middleware.js";
import {
  listChallengesService,
  createChallengeService,
  updateChallengeService,
} from "./challenges.service.js";
import {
  createChallengeSchema,
  updateChallengeSchema,
} from "./challenges.schema.js";

export const challengesRoutes = new Hono();

challengesRoutes.use("*", authMiddleware);

// GET /challenges
challengesRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");
  const challenges = await listChallengesService(familyId);
  return c.json({ success: true, data: challenges });
});

// POST /challenges
challengesRoutes.post(
  "/",
  requireRole("PARENT"),
  zValidator("json", createChallengeSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const input = c.req.valid("json");
    const challenge = await createChallengeService(familyId, input);
    return c.json({ success: true, data: challenge }, 201);
  },
);

// PATCH /challenges/:id
challengesRoutes.patch(
  "/:id",
  requireRole("PARENT"),
  zValidator("json", updateChallengeSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const challenge = await updateChallengeService(id, familyId, input);
    return c.json({ success: true, data: challenge });
  },
);
