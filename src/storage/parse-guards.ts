/**
 * Small shared type guards for the total, defensive parsers every `JsonFileStore`-backed state
 * module writes (`bot-controls.ts`, `subscription-state.ts`, …) — one copy, not one per store.
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Generous but bounded — a reason/expectation is prose, never a blob. Mirrors the bridge's own
 *  body-size ceiling (`insights-listener.ts`'s `MAX_BODY_BYTES`) at the per-field level. */
const MAX_STRING_LENGTH = 2048;

/** A non-empty string within `max`, or undefined. */
export function boundedString(value: unknown, max = MAX_STRING_LENGTH): string | undefined {
  return typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined;
}
