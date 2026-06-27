type Listener = (event: string, data: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

export function sseSubscribe(familyId: string, listener: Listener): () => void {
  if (!listeners.has(familyId)) listeners.set(familyId, new Set());
  listeners.get(familyId)!.add(listener);
  return () => {
    const set = listeners.get(familyId);
    if (set) {
      set.delete(listener);
      if (set.size === 0) listeners.delete(familyId);
    }
  };
}

export function sseEmit(familyId: string, event: string, data: unknown) {
  listeners.get(familyId)?.forEach((l) => l(event, data));
}
