// The R&D → Playbooks shoot's performance fixture (`/api/outpost/performance`), moved out of
// `playbook-store.mjs` unchanged so that harness stays under the code-line cap.
//
// The selected account's own closed trades per playbook (#3665 slice 3): S1-NVDA has a record,
// SAURON has none — so one frame shows both the numbers and the honest empty state. The
// house-wide block (slice 4) has both: every account's trips, larger than the account's own and
// drawn beside it, never summed into it. The cycle mix (slice 5) counts option trips only, so
// S1-NVDA's 7 house contracts split across cycles while SAURON, which trades only shares, says
// so in words instead of printing three zeros.
import { funnelSessions, playbookFunnelView } from "../../src/autonomous/playbook-funnel.ts";
import { sessionBounds } from "../../src/domain/market-session.ts";
import { playbookFunnelJson } from "../../src/server/playbook-performance.ts";

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
    row("SAURON", {
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
  // Each house playbook's funnel (#4450 slices 5a–5b), folded by the server's own code from FIXTURE
  // store rows: S1-NVDA checked every session, in its run-up window (its declared signal) on the
  // last three and asking once, SAURON (no research signal) asking most days with some orders
  // refused, and every other card checked by no bot.
  funnel: houseFunnel(),
  // Who started the bots' closed trades (`byInitiator`) is the Balance section's now (#5493 slice
  // 3): its fixture is `scripts/shoot/book-health.mjs`.
};

function houseFunnel() {
  const sessions = funnelSessions(new Date("2026-10-16T21:00:00Z"));
  const checks = [];
  const intents = [];
  const fate = (hour, n, guardReason, action, resultStatus) =>
    intents.push({ hour, playbookId: "SAURON", guardReason, action, resultStatus, n });
  sessions.forEach((date, i) => {
    const open = Math.floor(sessionBounds(date).openAt / HOUR);
    const inWindow = i >= sessions.length - 3;
    for (let h = 0; h < 7; h++) {
      checks.push({ hour: open + h, playbookId: "S1-NVDA", n: 120, signals: inWindow ? 120 : 0 });
      checks.push({ hour: open + h, playbookId: "SAURON", n: 120, signals: 0 });
    }
    if (i === sessions.length - 3)
      intents.push({
        hour: open + 1,
        playbookId: "S1-NVDA",
        guardReason: null,
        action: "placed",
        resultStatus: "filled",
        n: 1,
      });
    if (i % 3 === 2) return; // a quiet day: SAURON's rules asked for nothing
    fate(open + 1, 1, null, "placed", "filled");
    if (i % 2 === 0) fate(open + 2, 1, "insufficient-cash", null, null);
    if (i === 4) fate(open + 3, 1, "position-cap", null, null);
  });
  return playbookFunnelJson(playbookFunnelView({ checks, intents }, sessions));
}
