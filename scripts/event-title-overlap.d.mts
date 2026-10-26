export function titleOverlapWarnings(
  events: readonly { id?: string; title?: string; date?: string; symbols?: readonly string[] }[],
  threshold?: number,
): string[];
