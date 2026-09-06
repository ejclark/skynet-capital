// Visual harness for the Playbook Store's delegation fog (#1707) from the REAL built shell over
// stub APIs: the same card, before and after rung 102 is earned. Locked draws the door — the
// Subscribe button visible and disabled under the sentence naming the rung; earned draws the form.
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
async function frame(tag, locked, expect) {
  const { page, origin, shoot, close } = await openShell({
    name: "playbook-store",
    stubs: { "/api/playbook-store": store(locked), "/api/desk/*": desk, "/api/settings": settings },
  });
  await page.goto(`${origin}/app/u/human-joe/playbooks`);
  await page.getByText(expect).waitFor();
  await shoot(tag);
  await close();
}

await frame("delegation-locked", true, "Delegating capital opens after");
await frame("delegation-earned", false, "Capital to delegate");
