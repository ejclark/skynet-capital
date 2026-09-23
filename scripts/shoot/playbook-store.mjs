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

// One shell per state rather than a reload: the browser serves a fulfilled route from its own
// memory cache on reload, so a second state has to be a second page load with its own stubs.
async function frame(tag, locked, expect, viewport) {
  const { page, origin, shoot, close } = await openShell({
    name: "playbook-store",
    ...(viewport ? { viewport } : {}),
    stubs: { "/api/playbook-store": store(locked), "/api/desk/*": desk, "/api/settings": settings },
  });
  await page.goto(`${origin}/app/u/human-joe/playbooks`);
  await page.waitForURL(/\/app\/research\?.*section=playbooks.*account=human-joe/);
  await page.getByText(expect).first().waitFor();
  await shoot(tag);
  await close();
}

const PHONE = { width: 390, height: 844 };
await frame("phone-delegation-earned", false, "Capital to delegate", PHONE);
await frame("delegation-locked", true, "Delegating capital opens after");
await frame("delegation-earned", false, "Capital to delegate");
