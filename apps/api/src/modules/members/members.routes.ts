import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireRole,
} from "../../core/middleware/auth.middleware";
import {
  createMemberSchema,
  updateMemberSchema,
  updatePinSchema,
} from "./members.schema";
import {
  listMembersService,
  createMemberService,
  updateMemberService,
  updatePinService,
  deleteMemberService,
} from "./members.service";

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

// DELETE /family/members/:id  (parent uniquement)
membersRoutes.delete("/:id", requireRole("PARENT"), async (c) => {
  const { familyId, sub } = c.get("user");
  const id = c.req.param("id");
  await deleteMemberService(id, familyId, sub);
  return c.json({ success: true });
});
