// Sauron's Heartbeat-tab fixture for the accounts shoot (`accounts.mjs`): the no-trade log, the same
// log with traded rounds included, COND-SCOUT's shadow probes, and the playbook roll call with its
// verdict builder. Pure data — the mutable switches that pick between these (`tradedPassesIncluded`,
// `sauronSatOut`) and the live-clock `sauronHeartbeat` stay in the shoot script, which closes over
// them. Lifted out of `accounts.mjs` (a pure move); `accounts-fixture.mjs` imports it back too.

// The Heartbeat tab's no-trade log (#3687 slice 4): an idle stretch, a pass the risk guards
// refused, and a halted one — the passes that never became an Activity row.
export const sauronNoTrades = {
  available: true,
  kind: "bot",
  cycles: [
    {
      at: "2026-09-23T18:59:00Z",
      quietSince: "2026-09-23T18:22:00Z",
      mode: "live",
      status: "quiet",
      headline: "no signals fired for 148 cycles — watching",
      rawCount: 0,
      guardedCount: 0,
      outcomes: [],
    },
    {
      at: "2026-09-23T18:21:00Z",
      mode: "live",
      status: "refused",
      headline: "refused by S2 — earnings print inside the hold",
      rawCount: 1,
      guardedCount: 0,
      outcomes: [],
      refusedIntents: [
        {
          symbol: "NVDA",
          side: "buy",
          quantity: 40,
          strategy: "sauron-panic-claim",
          reason: "panic -0.82 exhausting, rebound momentum turning",
        },
      ],
    },
    {
      at: "2026-09-23T14:05:00Z",
      mode: "live",
      status: "halted",
      headline: "halted: daily-loss breaker",
      rawCount: 0,
      guardedCount: 0,
      outcomes: [],
      halted: "daily-loss breaker",
    },
  ],
};
// The same log with the traded rounds included (#3961) — the round behind the MSFT fill above, and
// the whole reason the toggle exists: one order placed, a sibling the broker rejected, and an idea
// the position cap refused, none of which had anywhere to render while traded passes were hidden.
export const sauronAllPasses = {
  available: true,
  kind: "bot",
  cycles: [
    {
      at: "2026-09-23T19:02:00.000Z",
      mode: "live",
      status: "placed",
      headline: "1 placed · 1 rejected · 1 refused by guards",
      rawCount: 3,
      guardedCount: 2,
      outcomes: [
        {
          symbol: "MSFT",
          side: "buy",
          quantity: 9,
          strategy: "beta-scout-forced-pick",
          reason: "forced pick — highest combined strength of 2 candidates (sentiment 0.60)",
          action: "placed",
          fill: "9 @ $428.10",
          activityAnchor: "act-ord-s3",
          momentum: -0.001,
          sentiment: 0.6,
        },
        {
          symbol: "AMZN",
          side: "buy",
          quantity: 18,
          reason: "second forced pick — sentiment 0.50",
          action: "rejected",
          resultStatus: "rejected: insufficient buying power",
        },
      ],
      refusedIntents: [
        {
          symbol: "NVDA",
          side: "buy",
          quantity: 40,
          strategy: "sauron-panic-claim",
          reason: "panic -0.82 exhausting, rebound momentum turning",
          guardReason: "the per-position cap left no room",
        },
      ],
    },
    ...sauronNoTrades.cycles,
  ],
};
// COND-SCOUT's shadow probes on the Heartbeat (#3651 slice 7b) — illustrative ledger: one bet with
// enough closes for a verdict (its band spans zero), one still unproven, two probes open.
const probesNow = Date.now();
const probeDay = 86_400_000;
export const sauronProbes = {
  available: true,
  simulated: true,
  at: probesNow,
  open: [
    {
      id: "NVDA@1",
      symbol: "NVDA",
      hypothesis: "trend-continuation",
      openedAt: probesNow - 2.1 * probeDay,
      expiresAt: probesNow + 11.9 * probeDay,
      entryPrice: 182.4,
      stopPrice: 173.28,
      notional: 1459.2,
      markRoi: 0.018,
    },
    {
      id: "MSFT@2",
      symbol: "MSFT",
      hypothesis: "oversold-rebound",
      openedAt: probesNow - 1.2 * probeDay,
      expiresAt: probesNow + 3.8 * probeDay,
      entryPrice: 468.1,
      stopPrice: 444.7,
      notional: 1404.3,
      markRoi: -0.006,
    },
  ],
  retros: [
    {
      probeId: "GOOGL@3",
      symbol: "GOOGL",
      hypothesis: "oversold-rebound",
      reason: "horizon",
      closedAt: probesNow - 1 * probeDay,
      daysHeld: 5,
      roi: 0.024,
      roiPerDay: 0.0048,
      directionRight: true,
      soonerWasBetter: true,
      earlierExits: [],
      laterExits: [{ label: "1 week", roi: 0.031 }, { label: "3 weeks" }, { label: "1 month" }],
      market: { symbol: "SPY", roi: 0.013, excess: 0.011 },
    },
    {
      probeId: "TSLA@4",
      symbol: "TSLA",
      hypothesis: "trend-continuation",
      reason: "invalidated",
      closedAt: probesNow - 3 * probeDay,
      daysHeld: 3.4,
      roi: -0.052,
      roiPerDay: -0.0153,
      directionRight: false,
      soonerWasBetter: false,
      earlierExits: [],
      laterExits: [{ label: "2 months" }, { label: "6 months" }, { label: "10 months" }],
      market: { symbol: "SPY", roi: 0.008, excess: -0.06 },
    },
  ],
  verdicts: [
    {
      hypothesis: "oversold-rebound",
      closes: 11,
      winRate: 0.636,
      meanRoi: 0.009,
      band: { ci: { low: -0.6, high: 2.3 } },
      meanExcessVsMarket: 0.004,
      outliers: [],
      call: "no edge shown",
      callWithoutOutliers: "no edge shown",
    },
    {
      hypothesis: "trend-continuation",
      closes: 3,
      winRate: 0.333,
      meanRoi: -0.011,
      band: { ci: null },
      meanExcessVsMarket: -0.019,
      outliers: [],
      call: "unproven",
      callWithoutOutliers: "unproven",
    },
  ],
};

// Sauron's playbooks as #5037's round 2 drew them (#5073), less HC-SAURON (dissolved 2026-10-16):
// six on, BETA-SCOUT off. The roll call is the server's own `playbookRollCall` output for these
// verdicts on 2026-10-09 — every reason and date verbatim — so the frame shows the real copy,
// including TACO-DJT's contradiction (can't fire on the roll call, a verdict on the verdict table)
// that one card per playbook resolves.
export const sauronVerdict = (playbookId, mode, state, since, sinceIsLowerBound = false) => ({
  playbookId,
  mode,
  state,
  since,
  sinceIsLowerBound,
});
const ON_ESTIMATE = (sym, date) =>
  `On, but the next print date for ${sym} (${date}) is an estimate — only a confirmed date opens a position.`;
export const sauronRollCall = [
  {
    playbookId: "S1-NVDA",
    status: "armed",
    mode: "standard",
    reason: ON_ESTIMATE("NVDA", "2026-11-18"),
  },
  {
    playbookId: "G1-GOOG",
    status: "armed",
    mode: "standard",
    reason: ON_ESTIMATE("GOOG", "2026-10-28"),
  },
  {
    playbookId: "TACO-DJT",
    status: "blocked",
    reason: "No news feed is wired to it yet, so its trigger never arrives.",
  },
  {
    playbookId: "CRWV-WHEEL",
    status: "armed",
    mode: "aggressive",
    reason: "On and waiting for its own window to open.",
    nextEntry: "2026-11-18",
  },
  {
    playbookId: "NVDA-CALL-SPREAD",
    status: "armed",
    mode: "aggressive",
    reason: ON_ESTIMATE("NVDA", "2026-11-18"),
  },
  {
    playbookId: "SAURON",
    status: "armed",
    mode: "aggressive",
    reason:
      "On, reading live price and sentiment every pass — there is no date window to wait for.",
  },
  {
    playbookId: "BETA-SCOUT",
    status: "off",
    reason:
      "Not running here: it runs only on the first bot the bots app runs, and only while the forced-pick setting is on in operations.",
  },
];
