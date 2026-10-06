// The R&D → Playbooks shoot's performance fixture (`/api/outpost/performance`), moved out of
// `playbook-store.mjs` unchanged so that harness stays under the code-line cap.
//
// The selected account's own closed trades per playbook (#3665 slice 3): S1-NVDA has a record,
// HC-SAURON has none — so one frame shows both the numbers and the honest empty state. The
// house-wide block (slice 4) has both: every account's trips, larger than the account's own and
// drawn beside it, never summed into it. The cycle mix (slice 5) counts option trips only, so
// S1-NVDA's 7 house contracts split across cycles while HC-SAURON, which trades only shares, says
// so in words instead of printing three zeros.
const HOUR = 3_600_000;
const row = (playbookId, over) => ({
  playbookId,
  avgHoldMs: 10 * 24 * HOUR,
  longestHold: { holdMs: 15 * 24 * HOUR },
  shortestHold: { holdMs: 26 * HOUR },
  byDirection: { long: over.trades, short: 0 },
  byInstrument: { stock: over.trades, call: 0, put: 0 },
  byCycle: { weekly: 0, monthly: 0, quarterly: 0 },
  ...over,
});
export const performance = {
  house: [
    row("S1-NVDA", {
      trades: 19,
      wins: 13,
      losses: 6,
      winRate: 68.4,
      netRealized: 3_915.2,
      returnPct: 4.7,
      capitalCommitted: 83_300,
      byInstrument: { stock: 12, call: 7, put: 0 },
      byCycle: { weekly: 2, monthly: 4, quarterly: 1 },
    }),
    row("HC-SAURON", {
      trades: 212,
      wins: 109,
      losses: 97,
      winRate: 52.9,
      netRealized: -1_284.75,
      returnPct: -0.6,
      capitalCommitted: 214_050,
      avgHoldMs: 7 * HOUR,
      longestHold: { holdMs: 4 * 24 * HOUR + 2 * HOUR },
      shortestHold: { holdMs: 18 * 60_000 },
      byDirection: { long: 188, short: 24 },
    }),
  ],
  mine: [
    row("S1-NVDA", {
      trades: 4,
      wins: 3,
      losses: 1,
      winRate: 75,
      netRealized: 842.5,
      returnPct: 6.2,
      capitalCommitted: 13_580,
      byInstrument: { stock: 3, call: 1, put: 0 },
      byCycle: { weekly: 0, monthly: 1, quarterly: 0 },
    }),
  ],
  accounts: ["sauron"],
};
