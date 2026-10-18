// Visual harness for the recap on R&D's by-symbol view (#4807 slice 4), from the REAL built shell
// over stub APIs. Naming a symbol in the filter (`sym:CRWV`) leads the board with its recap; the
// summary is the real `outlookOf` over a ledger that states `**Call:** hold until …`, served the
// way `/api/research/outlook` serves it. Phone first (docs/PICTURES.md). JPEG ≤100KB.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/symbol-recap-rd.mjs [outdir]
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.ts";
import { outlookOf } from "../../src/research/symbol-outlook.ts";
import { openShell } from "./shell.mjs";

const md = `# CRWV Q3 print — crwv-print

**Last assessed:** 2026-10-16

## At a glance

**TL;DR.** Hold the shares through the run-up; no new entries once the print window opens.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | Hold | Medium | The shares carry no new bet until the print clears. | A close under $70 before the print. |

- **Call:** hold until 2026-11-09
- **Buy signal:** no
`;

const outlook = outlookOf({
  symbol: "CRWV",
  now: "2026-10-16T14:00:00Z",
  prints: UPCOMING_PRINTS,
  events: [],
  ledger: { path: "docs/research/events/crwv-print.md", md, eventDate: "2026-11-12" },
});

const { page, origin, shoot, close } = await openShell({
  name: "symbol-recap-rd",
  viewport: { width: 390, height: 844 },
  stubs: {
    "/api/settings": {
      authConfigured: true,
      adminWired: false,
      fleetSuspended: false,
      timezones: [],
      accounts: [
        { id: "human-eric", name: "Eric", kind: "human", hostConfigured: false, profile: null },
      ],
    },
    "/api/trade/plays": { linked: true, wheels: true, nextUp: "101", plays: [] },
    "/api/research": {
      events: [],
      closures: [],
      calls: [],
      symbols: [{ symbol: "CRWV", next: { title: "CRWV Q3 print", date: "2026-11-12" } }],
      studies: [],
      ledgers: [],
    },
    "/api/research/calendar": { events: [], closures: [], calls: [] },
    "/api/research/mentions": { bySymbol: { CRWV: [] } },
    "/api/research/outlook": { outlooks: { CRWV: outlook } },
  },
});

await page.goto(`${origin}/app/research?q=sym%3ACRWV`);
await page.locator(".recap").waitFor();
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
if (overflow > 0) console.warn(`shoot/symbol-recap-rd: ${overflow}px sideways scroll at 390`);
await shoot("symbol-recap-rd-phone");
await close();
