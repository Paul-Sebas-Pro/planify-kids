/**
 * Message d'erreur lisible d'une réponse HTTP en échec.
 *
 * L'API renvoie `{ success: false, error: "message" }` (error.middleware.ts).
 * Corps non JSON (page d'erreur du proxy, 502 Vercel…) : repli sur le
 * statusText, puis sur le code HTTP. `||` et non `??` : en HTTP/2 (Vercel),
 * `statusText` est une chaîne vide, qui donnerait un message vide.
 */
export async function apiErrorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: unknown;
    message?: unknown;
  } | null;
  const fromBody = [body?.error, body?.message].find(
    (v): v is string => typeof v === "string" && v !== "",
  );
  return fromBody || res.statusText || `HTTP ${res.status}`;
}
