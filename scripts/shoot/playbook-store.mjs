// Visual harness for R&D → Playbooks (#3623; the Playbook Store, #885) from the REAL built shell over
// stub APIs. Every frame enters through the retired desk URL `/app/u/<id>/playbooks`, so the shots
// also prove the redirect lands on R&D with the account pre-selected. The delegation fog (#1707):
// the same card before and after rung 102 is earned — locked draws the door (Subscribe visible and
// disabled under the sentence naming the rung); earned draws the form. Phone frame first
// (docs/PICTURES.md → mobile-first), then desktop.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:playbook-store [outdir]
import { openShell } from "./shell.mjs";

const NOTE =
  "Delegating capital opens after your first filled 102 (Sell stock). " +
  "Every house playbook buys and then sells for you — the round trip by hand is the rung that proves it.";

const cards = [
  {
    id: "S1-NVDA",
    symbol: "NVDA",
    description:
      "Pre-print positioning bid, NVDA only — long the run-up, out before the dead final week.",
    enter: "From D-20 to D-6 ahead of a CONFIRMED earnings date. An estimated date stays dark.",
    exitTakeProfit: "No separate take-profit — the thesis is the window, not a price target.",
    exitCutLosses:
      "Flat from D-5 through the print — the final week is NVDA's dead zone regardless of price.",
    hold: "No confirmed date in range, or already inside D-5: flat and waiting.",
    symbols: ["NVDA"],
    evidence:
      "docs/research/nvda-earnings-cycle.md F1–F2: +9.08% mean D-20→D-5 era, 14/14, P=0.004",
    evidenceHref: "/research/nvda-earnings-cycle",
    window: "D-20 to D-6",
    size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
    traits: [
      {
        id: "flat-before-the-release",
        label: "Flat before the release",
        claim: "Long D-20 to D-6, and out of the market by the time the number is public.",
      },
      {
        id: "confirmed-dates-only",
        label: "Confirmed dates only",
        claim:
          "Re-run with the same date as an estimate rather than confirmed: no position at all.",
      },
    ],
    metrics: [],
    // The house-wide subscriber count (#3970): a busy playbook, and — below — one nobody runs yet,
    // so one frame carries both the number and the "none yet" wording.
    subscribers: 3,
  },
  {
    id: "HC-SAURON",
    symbol: "AAPL",
    description:
      "Research-volume mode across a ten-name tech universe — small, frequent tranches probe every sentiment extreme and every momentum run.",
    enter: "Small tranches on panic (mean-reversion) or an ordinary momentum run.",
    exitTakeProfit: "Takes half off into exhausted euphoria, letting the rest ride.",
    exitCutLosses:
      "A universal momentum stop closes the WHOLE position the moment the thesis breaks.",
    hold: "Quiet conditions (no extreme, no run): does nothing that cycle.",
    symbols: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA", "CRWV", "MRVL"],
    evidence:
      "src/personas/sauron-hardcore.ts (Eric, 2026-08-20) — trade volume as research data, not P/L; not yet a docs/research/ backtest of its own.",
    traits: [],
    metrics: [],
    subscribers: 0,
  },
];

const store = (locked) => ({
  cards,
  capitalUnderManagement: 0,
  canManage: true,
  delegation: { locked, unlocksAfter: "102", unlocksAfterName: "Sell stock", note: NOTE },
});

const desk = {
  generatedAt: "2026-09-06T00:00:00Z",
  desk: {
    id: "human-joe",
    name: "Uncle Joe",
    kind: "human",
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$1,000,000.00",
    },
  },
};

// The shell's header reads the account roster on every `/app/*` surface — unstubbed it throws
// before the route ever renders.
const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-joe", name: "Uncle Joe", kind: "human", hostConfigured: false, profile: null },
  ],
};

// The selected account's own closed trades per playbook (#3665 slice 3): S1-NVDA has a record,
// HC-SAURON has none — so one frame shows both the numbers and the honest empty state. The
// house-wide block (slice 4) has both: every account's trips, larger than the account's own and
// drawn beside it, never summed into it.
const HOUR = 3_600_000;
const performance = {
  house: [
    {
      playbookId: "S1-NVDA",
      trades: 19,
      wins: 13,
      losses: 6,
      winRate: 68.4,
      netRealized: 3_915.2,
      returnPct: 4.7,
      capitalCommitted: 83_300,
      avgHoldMs: 10 * 24 * HOUR,
      longestHold: { holdMs: 15 * 24 * HOUR },
      shortestHold: { holdMs: 26 * HOUR },
      byDirection: { long: 19, short: 0 },
      byInstrument: { stock: 12, call: 7, put: 0 },
    },
    {
      playbookId: "HC-SAURON",
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
      byInstrument: { stock: 212, call: 0, put: 0 },
    },
  ],
  mine: [
    {
      playbookId: "S1-NVDA",
      trades: 4,
      wins: 3,
      losses: 1,
      winRate: 75,
      netRealized: 842.5,
      returnPct: 6.2,
      capitalCommitted: 13_580,
      avgHoldMs: 9 * 24 * HOUR,
      longestHold: { holdMs: 14 * 24 * HOUR + 3 * HOUR },
      shortestHold: { holdMs: 2 * 24 * HOUR + 6 * HOUR },
      byDirection: { long: 4, short: 0 },
      byInstrument: { stock: 3, call: 1, put: 0 },
    },
  ],
  accounts: ["human-joe"],
};

// One shell per state rather than a reload: the browser serves a fulfilled route from its own
// memory cache on reload, so a second state has to be a second page load with its own stubs.
async function frame(tag, locked, expect, viewport, scrollTo, path = "/app/u/human-joe/playbooks") {
  const { page, origin, shoot, close } = await openShell({
    name: "playbook-store",
    ...(viewport ? { viewport } : {}),
    stubs: {
      "/api/playbook-store": store(locked),
      "/api/desk/*": desk,
      "/api/settings": settings,
      "/api/outpost/performance": performance,
    },
  });
  await page.goto(`${origin}${path}`);
  if (path.startsWith("/app/u/"))
    await page.waitForURL(/\/app\/research\?.*section=playbooks.*account=human-joe/);
  await page.getByText(expect).first().waitFor();
  if (scrollTo)
    await page
      .getByText(scrollTo)
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
  await shoot(tag);
  await close();
}

const PHONE = { width: 390, height: 844 };
await frame(
  "phone-account-metrics",
  false,
  "No closed trades on this playbook yet",
  PHONE,
  "Closed trades",
);
// Catalog-only (no account picked): the house block alone, on every card (#3665 slice 4).
await frame(
  "phone-catalog-house",
  false,
  "House — every account",
  PHONE,
  "212",
  "/app/research?section=playbooks",
);
// The subscriber count (#3970), at the top of the deck where it is read: "3 accounts" on one card
// and "none yet" on the other, in catalog-only mode so the count is proven to show without one.
await frame(
  "phone-subscriber-count",
  false,
  "Subscribed and active",
  PHONE,
  "Subscribed and active",
  "/app/research?section=playbooks",
);
await frame("phone-delegation-earned", false, "Capital to delegate", PHONE);
await frame("delegation-locked", true, "Delegating capital opens after");
await frame("delegation-earned", false, "Capital to delegate");
