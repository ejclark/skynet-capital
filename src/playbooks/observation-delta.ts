import { observationKey, type PlaybookObservation } from "../domain/playbook-observation.js";

/**
 * Say each observation once, and again only when it changes (#5489). A pass runs every 15 seconds
 * but a 5-minute bar closes every 300, and the decision record is also written to disk and the
 * wire — handing it every signal in a 20-session window each pass would write the same few
 * kilobytes thousands of times a day. So the persona remembers what it last said about each key
 * and returns only what is new or moved on.
 *
 * The quote is left out of the comparison: it is read fresh every pass, while the signal's
 * outcome only changes when a bar does, and the store keeps the first quote it was given
 * (`mergeObservation`). A restart or a roster swap builds a fresh memory, so it says everything
 * once more; the store's upsert makes that harmless. The memory is never pruned — it grows by the
 * handful of signals a name makes in a day.
 */
export function observationDelta(): (
  observations: readonly PlaybookObservation[],
) => PlaybookObservation[] {
  const said = new Map<string, string>();
  return (observations) =>
    observations.filter((o) => {
      const { quote: _quote, ...rest } = o as PlaybookObservation & { quote?: unknown };
      const fingerprint = JSON.stringify(rest);
      const key = observationKey(o);
      if (said.get(key) === fingerprint) return false;
      said.set(key, fingerprint);
      return true;
    });
}
