/**
 * Small shared type guards for the total, defensive parsers every `JsonFileStore`-backed state
 * module writes (`bot-controls.ts`, `subscription-state.ts`, …) — one copy, not one per store.
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
