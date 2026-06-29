import type { MiddlewareHandler } from "hono";

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();

  // Pas de log sur /health pour ne pas polluer
  if (c.req.path === "/health") return;

  const user = c.get("user") as { familyId?: string } | undefined;

  const entry = {
    ts: new Date().toISOString(),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Date.now() - start,
    ...(user?.familyId && { familyId: user.familyId }),
  };

  process.stdout.write(JSON.stringify(entry) + "\n");
};
