import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireRole,
} from "../../core/middleware/auth.middleware.js";
import {
  createMemberSchema,
  updateMemberSchema,
  updatePinSchema,
  updateFcmTokenSchema,
} from "./members.schema.js";
import {
  listMembersService,
  createMemberService,
  updateMemberService,
  updatePinService,
  unlockPinService,
  updateFcmTokenService,
  deleteMemberService,
  getMemberTimelineService,
} from "./members.service.js";

export const membersRoutes = new Hono();

// Toutes les routes nécessitent un token valide
membersRoutes.use("*", authMiddleware);

// GET /family/members
membersRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");
  const members = await listMembersService(familyId);
  return c.json({ success: true, data: members });
});

// POST /family/members  (parent uniquement)
membersRoutes.post(
  "/",
  requireRole("PARENT"),
  zValidator("json", createMemberSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const input = c.req.valid("json");
    const member = await createMemberService(familyId, input);
    return c.json({ success: true, data: member }, 201);
  },
);

// PATCH /family/members/:id  (parent uniquement)
membersRoutes.patch(
  "/:id",
  requireRole("PARENT"),
  zValidator("json", updateMemberSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const member = await updateMemberService(id, familyId, input);
    return c.json({ success: true, data: member });
  },
);

// PATCH /family/members/:id/pin  (parent uniquement)
membersRoutes.patch(
  "/:id/pin",
  requireRole("PARENT"),
  zValidator("json", updatePinSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const id = c.req.param("id");
    const { pin } = c.req.valid("json");
    await updatePinService(id, familyId, pin);
    return c.json({ success: true });
  },
);

// PATCH /family/members/:id/pin/unlock  (parent uniquement)
// Lève le blocage anti-force brute (5 PIN faux → 15 min) sans attendre.
membersRoutes.patch("/:id/pin/unlock", requireRole("PARENT"), async (c) => {
  const { familyId } = c.get("user");
  const id = c.req.param("id");
  const member = await unlockPinService(id, familyId);
  return c.json({ success: true, data: member });
});

// PATCH /family/members/:id/fcm-token  (self-service — tout rôle, soi-même uniquement)
membersRoutes.patch(
  "/:id/fcm-token",
  zValidator("json", updateFcmTokenSchema),
  async (c) => {
    const { familyId, memberId } = c.get("user");
    const id = c.req.param("id");
    const { fcmToken } = c.req.valid("json");
    await updateFcmTokenService(id, familyId, memberId, fcmToken);
    return c.json({ success: true });
  },
);

// GET /family/members/:id/timeline
membersRoutes.get("/:id/timeline", async (c) => {
  const { familyId } = c.get("user");
  const id = c.req.param("id");
  const events = await getMemberTimelineService(id, familyId);
  return c.json({ success: true, data: events });
});

// DELETE /family/members/:id  (parent uniquement)
membersRoutes.delete("/:id", requireRole("PARENT"), async (c) => {
  const { familyId, sub } = c.get("user");
  const id = c.req.param("id");
  await deleteMemberService(id, familyId, sub);
  return c.json({ success: true });
});
