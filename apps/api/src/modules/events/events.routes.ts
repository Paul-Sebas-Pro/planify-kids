import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { sseSubscribe } from "../../services/sse.service.js";

export const eventsRoutes = new Hono();

eventsRoutes.use(authMiddleware);

eventsRoutes.get("/", (c) => {
  const { familyId } = c.get("user");

  return streamSSE(c, async (stream) => {
    const unsubscribe = sseSubscribe(familyId, (event, data) => {
      void stream.writeSSE({ event, data: JSON.stringify(data) });
    });

    stream.onAbort(unsubscribe);

    // keep-alive toutes les 30s pour éviter les timeouts proxy
    while (!stream.closed) {
      await stream.sleep(30_000);
      if (!stream.closed) {
        await stream.writeSSE({ event: "ping", data: "" });
      }
    }
  });
});
