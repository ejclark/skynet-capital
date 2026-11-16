/**
 * The base rate every event quest carries (#7028 slice 4): no study has measured a ledger's buy
 * signal, so it is "untested" in words. Its own module so the order path can record an event quest
 * taken (`quest-taken.ts`, slice 6) without importing `event-quests.ts`, whose campaign catalog
 * (`src/domain/campaigns.ts`) reads its directory at import — a cost, and a cwd dependence, the
 * order routes never had.
 */
export const EVENT_UNTESTED = {
  kind: "untested",
  note: "No study has measured how this ledger's buy signal pays yet. It is the house's written stance, not a tested rate.",
} as const;
