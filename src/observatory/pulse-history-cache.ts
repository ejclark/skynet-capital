import type { EquitySample, HistoryStore } from "./history-record.js";
import { PulseHistoryFold } from "./pulse-history-fold.js";

/**
 * ONE LIVE PULSE FOLD PER PARTICIPANT, KEPT UP TO DATE BY WHAT WAS APPENDED (#4612 slice 7, #4619).
 *
 * The first read of a participant folds its whole history file once; every later read folds only
 * the lines appended since (`HistoryStore.since`), so a Pulse costs the samples recorded since the
 * last one — a handful — instead of all ~61k. The fold holds answers, not samples
 * (`pulse-history-fold.ts`), so twelve participants at 180 days stay well under a megabyte.
 *
 * Two cases fall back to a full rebuild, both rare and both correct by construction: the file was
 * replaced (shorter than where the fold stopped), or an appended sample is older than the last one
 * folded — the fold is a forward scan, and every figure it keeps assumes time order. A store with
 * no `since` (the in-memory one offline mode runs) is folded from `list` on every read; its
 * histories are small by construction.
 *
 * Reads for one participant run one at a time: two Pulses landing together would otherwise both
 * fold the same appended lines into the same fold.
 */
export function pulseHistoryReader(
  store: HistoryStore,
): (participantId: string) => Promise<PulseHistoryFold> {
  const folds = new Map<string, { fold: PulseHistoryFold; offset: number }>();
  const queue = new Map<string, Promise<PulseHistoryFold>>();

  async function rebuild(participantId: string): Promise<PulseHistoryFold> {
    const since = store.since?.bind(store);
    if (!since) return PulseHistoryFold.of(await store.list(participantId));
    const tail = await since(participantId, 0);
    const fold = PulseHistoryFold.of(tail.entries);
    folds.set(participantId, { fold, offset: tail.offset });
    return fold;
  }

  async function refresh(participantId: string): Promise<PulseHistoryFold> {
    const held = folds.get(participantId);
    const since = store.since?.bind(store);
    if (!(held && since)) return rebuild(participantId);
    const tail = await since(participantId, held.offset);
    if (tail.reset || !inOrderAfter(held.fold, tail.entries)) return rebuild(participantId);
    for (const sample of tail.entries) held.fold.add(sample);
    held.offset = tail.offset;
    return held.fold;
  }

  return (participantId) => {
    const prior = queue.get(participantId) ?? Promise.resolve(undefined);
    const next = prior.catch(() => undefined).then(() => refresh(participantId));
    queue.set(participantId, next);
    const settle = (): void => {
      if (queue.get(participantId) === next) queue.delete(participantId);
    };
    next.then(settle, settle);
    return next;
  };
}

/** True when `entries` can be folded onto `fold` as they are: each no earlier than the one before. */
function inOrderAfter(fold: PulseHistoryFold, entries: readonly EquitySample[]): boolean {
  let last = fold.last?.at ?? "";
  for (const s of entries) {
    if (s.at < last) return false;
    last = s.at;
  }
  return true;
}
