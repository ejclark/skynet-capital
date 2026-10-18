// Visual harness for the recap card that leads the trade form's Guidance tab (#4807 slice 3), from
// the REAL built shell over stub APIs. The market is the position guidance specs' own frozen CRWV
// world; the summary riding on it is the real `outlookOf` over a ledger that states
// `**Call:** hold until …` and a print ahead, so the card shows the engine's answer, not a mock.
// Phone first (docs/PICTURES.md), then the same card with its until-date passed (stale). JPEG ≤100KB.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/guidance-recap.mjs [outdir]
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.ts";
import { outlookOf } from "../../src/research/symbol-outlook.ts";
import { inputs } from "../../tests/options/position-guidance-fixture.ts";
import { openShell } from "./shell.mjs";

const { stake: _fixtureStake, ...fixture } = inputs();

const ledger = (until) => `# CRWV Q3 print — crwv-print

**Last assessed:** 2026-10-16

## At a glance

**TL;DR.** Hold the shares through the run-up; no new entries once the print window opens.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | Hold | Medium | The shares carry no new bet until the print clears. | A close under $70 before the print. |

- **Call:** hold until ${until}
- **Buy signal:** no
`;

const outlook = (now, until) =>
  outlookOf({
    symbol: "CRWV",
    now,
    prints: UPCOMING_PRINTS,
    events: [],
    ledger: {
      path: "docs/research/events/crwv-print.md",
      md: ledger(until),
      eventDate: "2026-11-12",
    },
  });

const { page, origin, out, shoot, close } = await openShell({
  name: "guidance-recap",
  viewport: { width: 390, height: 844 },
  stubs: {
    "/api/trade/plays": { linked: true, wheels: true, nextUp: "101", plays: [] },
    "/api/settings": {
      authConfigured: true,
      adminWired: false,
      fleetSuspended: false,
      timezones: [],
      accounts: [
        { id: "human-eric", name: "Eric", kind: "human", hostConfigured: false, profile: null },
      ],
    },
    "/api/research": { events: [], closures: [], calls: [], symbols: [], studies: [], ledgers: [] },
    "/api/desk/*": {
      generatedAt: "2026-10-16T14:00:00Z",
      desk: {
        id: "human-eric",
        name: "Eric",
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
    },
    "/api/trade/quote": { symbol: "CRWV", last: 80, change: 0, changePct: 0, tone: "flat" },
    "/api/trade/guidance": () => ({ market: { ...fixture, outlook: current } }),
  },
});

let current = outlook("2026-10-16T14:00:00Z", "2026-11-09");
await page.goto(`${origin}/app/trade?section=guidance&symbol=CRWV`);
await page.locator(".recap").waitFor();
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
if (overflow > 0) console.warn(`shoot/guidance-recap: ${overflow}px sideways scroll at 390`);
await shoot("guidance-recap-phone");

current = outlook("2026-10-22T14:00:00Z", "2026-10-20");
await page.goto(`${origin}/app/trade?section=guidance&symbol=CRWV&stale=1`);
await page.locator(".recap[data-stale='true']").waitFor();
await shoot("guidance-recap-stale");

await close();
