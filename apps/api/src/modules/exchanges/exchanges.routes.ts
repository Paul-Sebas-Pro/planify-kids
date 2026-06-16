import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../core/middleware/auth.middleware";
import {
  proposeExchangeSchema,
  respondExchangeSchema,
} from "./exchanges.schema";
import {
  listExchangesService,
  proposeExchangeService,
  respondExchangeService,
} from "./exchanges.service";

export const exchangesRoutes = new Hono();

exchangesRoutes.use("*", authMiddleware);

// GET /exchanges?limit=N&status=PENDING|ACCEPTED|REFUSED
exchangesRoutes.get("/", async (c) => {
  const { familyId } = c.get("user");
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 50), 1), 200);
  const rawStatus = c.req.query("status");
  const status =
    rawStatus === "PENDING" || rawStatus === "ACCEPTED" || rawStatus === "REFUSED"
      ? rawStatus
      : undefined;
  const exchanges = await listExchangesService(familyId, limit, status);
  return c.json({ success: true, data: exchanges });
});

// POST /exchanges  — proposer un échange
exchangesRoutes.post(
  "/",
  zValidator("json", proposeExchangeSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const input = c.req.valid("json");
    const exchange = await proposeExchangeService(familyId, input);
    return c.json({ success: true, data: exchange }, 201);
  },
);

// PATCH /exchanges/:id  — accepter ou refuser
exchangesRoutes.patch(
  "/:id",
  zValidator("json", respondExchangeSchema),
  async (c) => {
    const { familyId } = c.get("user");
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const exchange = await respondExchangeService(id, familyId, input);
    return c.json({ success: true, data: exchange });
  },
);
