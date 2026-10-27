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

/**
 * True when everything `raw` held survives in `parsed` unchanged: every object key with its value,
 * every array element in place. `parsed` may ADD a key (a parser filling in `accountId` from its
 * map key), never drop or change one. A total parser drops what it cannot read — a malformed
 * record, an unknown mode, a field a newer build added — so this is how a caller about to rewrite
 * the whole file asks whether the rewrite would lose any of it (`JsonFileStore.loadIfReadable`).
 */
export function survivesParse(raw: unknown, parsed: unknown): boolean {
  if (Array.isArray(raw)) {
    return (
      Array.isArray(parsed) &&
      raw.length === parsed.length &&
      raw.every((value, i) => survivesParse(value, parsed[i]))
    );
  }
  if (isRecord(raw)) {
    return (
      isRecord(parsed) &&
      Object.entries(raw).every(
        ([key, value]) => key in parsed && survivesParse(value, parsed[key]),
      )
    );
  }
  return Object.is(raw, parsed);
}
