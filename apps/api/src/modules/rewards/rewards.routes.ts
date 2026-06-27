import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireRole,
} from "../../core/middleware/auth.middleware";
import {
  createRewardSchema,
  updateRewardSchema,
  claimRewardSchema,
  reviewClaimSchema,
} from "./rewards.schema";
import {
  listRewardsService,
  createRewardService,
  updateRewardService,
  deleteRewardService,
  listClaimsService,
  listMyClaimsService,
  claimRewardService,
  reviewClaimService,
} from "./rewards.service";

export const rewardsRoutes = new Hono();

rewardsRoutes.use("*", authMiddleware);

// GET /rewards
rewardsRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");
  const rewards = await listRewardsService(familyId);
  return c.json({ success: true, data: rewards });
});

// POST /rewards  (parent uniquement)
rewardsRoutes.post(
  "/",
  requireRole("PARENT"),
  zValidator("json", createRewardSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const input = c.req.valid("json");
    const reward = await createRewardService(familyId, input);
    return c.json({ success: true, data: reward }, 201);
  },
);

// PATCH /rewards/:id  (parent uniquement)
rewardsRoutes.patch(
  "/:id",
  requireRole("PARENT"),
  zValidator("json", updateRewardSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const reward = await updateRewardService(id, familyId, input);
    return c.json({ success: true, data: reward });
  },
);

// DELETE /rewards/:id  (parent uniquement)
rewardsRoutes.delete("/:id", requireRole("PARENT"), async (c) => {
  const { familyId } = c.get("user");
  const id = c.req.param("id");
  await deleteRewardService(id, familyId);
  return c.json({ success: true });
});

// GET /rewards/claims  (parent — toutes les demandes famille)
rewardsRoutes.get("/claims", requireRole("PARENT"), async (c) => {
  const { familyId } = c.get("user");
  const claims = await listClaimsService(familyId);
  return c.json({ success: true, data: claims });
});

// GET /rewards/my-claims  (tout membre — ses propres demandes)
rewardsRoutes.get("/my-claims", async (c) => {
  const { memberId } = c.get("user");
  const claims = await listMyClaimsService(memberId);
  return c.json({ success: true, data: claims });
});

// POST /rewards/:id/claim  (tout membre — demande une récompense)
rewardsRoutes.post(
  "/:id/claim",
  zValidator("json", claimRewardSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const rewardId = c.req.param("id");
    const input = c.req.valid("json");
    const claim = await claimRewardService(rewardId, familyId, input);
    return c.json({ success: true, data: claim }, 201);
  },
);

// PATCH /rewards/claims/:claimId  (parent — approuve ou rejette)
rewardsRoutes.patch(
  "/claims/:claimId",
  requireRole("PARENT"),
  zValidator("json", reviewClaimSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const claimId = c.req.param("claimId");
    const input = c.req.valid("json");
    const claim = await reviewClaimService(claimId, familyId, input);
    return c.json({ success: true, data: claim });
  },
);
