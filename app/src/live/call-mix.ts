/**
 * THE CALL MIX (#1704 slice 3) — the honest "sentiment" tell. No model writes a sentiment here:
 * each authored call is sorted by its opening words into one of four classes and the board shows
 * the counts for the range. The classes are coarse on purpose — a call is a sentence, not a score —
 * and the row still carries the sentence verbatim beside the count.
 *
 *   stand-aside  "Stand aside", "No position", "Never…", "Do not…", "Nothing…", "Avoid…", "Flat…"
 *   watch        the call is to watch, monitor, or wait for a named observation
 *   act          the call opens with a verb that moves capital or protection
 *   conditional  everything else — a specific instruction shaped "do X only if Y"
 */
export type CallClass = "stand-aside" | "watch" | "act" | "conditional";
export const CALL_CLASSES: readonly CallClass[] = ["stand-aside", "watch", "act", "conditional"];

const STAND_ASIDE =
  /^(stand aside|no (new |fresh )?(position|exposure|trade|entry|entries)|nothing|never|do not|don't|avoid|flat|sit out|pass|stay out|no [a-z]+ position)/i;
const WATCH = /^(watch|monitor|wait|observe|track|hold(?! through))/i;
const ACT =
  /^(buy|sell|accumulate|add|trim|reduce|hedge|enter|exit|close|open|short|long|roll|protect|take profit|size|scale)/i;

export function classifyCall(call: string): CallClass {
  const text = call.replace(/\*\*/g, "").trim();
  if (STAND_ASIDE.test(text)) return "stand-aside";
  if (WATCH.test(text)) return "watch";
  if (ACT.test(text)) return "act";
  return "conditional";
}

export type CallMix = Record<CallClass, number>;

export function callMix(calls: readonly string[]): CallMix {
  const mix: CallMix = { "stand-aside": 0, watch: 0, act: 0, conditional: 0 };
  for (const call of calls) mix[classifyCall(call)] += 1;
  return mix;
}

export const CALL_CLASS_LABEL: Record<CallClass, string> = {
  "stand-aside": "stand aside",
  watch: "watch",
  act: "act",
  conditional: "a specific instruction",
};

/**
 * Hub events: how many ledgers in the set name each event id as adjacent (the probe-ref corridor
 * graph). Returns the top `limit` by count, ties broken by id — computed, never generated.
 */
export function hubEvents(
  adjacency: readonly (readonly string[])[],
  limit = 5,
): { readonly id: string; readonly count: number }[] {
  const degree = new Map<string, number>();
  for (const ids of adjacency) {
    for (const id of new Set(ids)) degree.set(id, (degree.get(id) ?? 0) + 1);
  }
  return [...degree.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}
