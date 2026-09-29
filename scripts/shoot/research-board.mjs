// Visual harness for R&D's Board under a symbol scope (#3962) — the BEFORE/AFTER pair for the
// `sym:` filter, from the REAL built shell over stub APIs. PHONE FIRST (docs/PICTURES.md): the
// 390px frames are where the change has to read, because the scoped doc lists are the whole point
// and a study that only mentions the name has to be distinguishable from one the name owns at that
// width. One run photographs both states by flipping what `/api/research/mentions` answers: an
// empty map is exactly the pre-#3962 world (slug matching only), a populated one is the fix.
// Usage: npm run build --prefix app && npm run shoot:research-board [outdir]
import { openShell } from "./shell.mjs";

const doc = (slug, title, lastAssessed = null) => ({
  slug,
  title,
  lastAssessed,
  href: `/research/${slug}`,
});

const event = (id, title, date, symbols = [], kind = "earnings", impact = "high") => ({
  id,
  title,
  date,
  kind,
  impact,
  symbols,
  researched: true,
});

const call = (eventId, text, horizon, confidence, tldr) => ({
  eventId,
  call: text,
  horizon,
  confidence,
  href: `/research/events/${eventId}`,
  lastAssessed: "2026-09-24",
  horizons: { today: { call: text, horizon, confidence } },
  tldr,
});

// A shelf where the gap is visible: ONE study is named for NVDA, three others only mention it —
// the supplier and memory studies are the exact case the issue opens with.
const research = {
  events: [
    event("nvda-2026-11-18-print", "NVDA Q3 FY27 earnings print", "2026-11-18", ["NVDA"]),
    event("avgo-2026-12-10-print", "AVGO Q4 FY26 earnings print", "2026-12-10", ["AVGO"]),
    event("mu-2026-12-17-print", "MU Q1 FY27 earnings print", "2026-12-17", ["MU"]),
    event("cpi-2026-10-14", "CPI release (Sep 2026 data)", "2026-10-14", [], "macro-print"),
  ],
  closures: [],
  calls: [
    call(
      "nvda-2026-11-18-print",
      "Stand aside through the print",
      "today",
      "medium",
      "Implied ~8% against ~3.1% realized — no edge in buying the event.",
    ),
    call(
      "avgo-2026-12-10-print",
      "Watch — defined risk only after the tape confirms",
      "today",
      "low",
      "AVGO's cadence spread makes a dated entry unsafe.",
    ),
  ],
  symbols: [
    {
      symbol: "NVDA",
      href: "/research/symbol/NVDA",
      next: { title: "Q3 FY27", date: "2026-11-18" },
    },
    {
      symbol: "AVGO",
      href: "/research/symbol/AVGO",
      next: { title: "Q4 FY26", date: "2026-12-10" },
    },
    { symbol: "MU", href: "/research/symbol/MU", next: { title: "Q1 FY27", date: "2026-12-17" } },
  ],
  studies: [
    doc("nvda-accelerator-cycle", "The NVDA accelerator cycle, print to print", "2026-09-24"),
    doc("ai-supply-chain", "Who ships into the AI build-out — the supplier map", "2026-09-22"),
    doc("memory-pricing", "Memory pricing and what it does to accelerator margins", "2026-09-19"),
    doc("weeks/2026-W39", "The market week of 2026-09-21 — 2026-W39", "2026-09-26"),
    doc("hedging-a-quiet-tape", "Hedging a quiet tape", "2026-09-11"),
  ],
  ledgers: [
    doc("events/nvda-2026-11-18-print", "NVDA Q3 FY27 print — ledger", "2026-09-24"),
    doc("events/avgo-2026-12-10-print", "AVGO Q4 FY26 print — ledger", "2026-09-23"),
    doc("events/mu-2026-12-17-print", "MU Q1 FY27 print — ledger", "2026-09-20"),
    doc("events/cpi-2026-10-14", "CPI (Sep 2026 data) — ledger", "2026-09-18"),
  ],
};

// What the corpus search finds for NVDA: three studies and two ledgers that say NVDA without being
// about it. Empty for the BEFORE frames — the state the board was in before this endpoint existed.
const MENTIONS = {
  bySymbol: {
    NVDA: [
      "ai-supply-chain",
      "memory-pricing",
      "weeks/2026-W39",
      "events/avgo-2026-12-10-print",
      "events/mu-2026-12-17-print",
    ],
  },
};

let searchWired = false;

const { page, origin, shoot, close } = await openShell({
  name: "research-board",
  viewport: { width: 390, height: 1200 },
  quality: 64,
  stubs: {
    "/api/research": research,
    "/api/research/mentions": () => (searchWired ? MENTIONS : { bySymbol: {} }),
    "/api/plays": { plays: [] },
  },
});

/** Land on the board scoped to NVDA over every ledger, and wait for the lists to settle. */
async function openScopedBoard() {
  await page.goto(`${origin}/app/research?q=sym%3ANVDA&span=all`);
  await page.getByRole("heading", { name: "R&D" }).waitFor();
  await page.getByRole("heading", { name: "Studies" }).waitFor();
  await page.waitForLoadState("networkidle");
}

// BEFORE — `sym:NVDA` matches a slug and nothing else: one study, one ledger. The three studies
// that discuss NVDA on every page are invisible, which is the defect.
await openScopedBoard();
await shoot("research-board-scope-before-phone");
await page.setViewportSize({ width: 1280, height: 1100 });
await shoot("research-board-scope-before-desktop");

// AFTER — the corpus search answers, so those studies appear, each marked "mentions NVDA" beneath
// the one marked "named for NVDA". Same query, same payload; only the search is wired.
searchWired = true;
await page.setViewportSize({ width: 390, height: 1200 });
await openScopedBoard();
await shoot("research-board-scope-after-phone");
await page.setViewportSize({ width: 1280, height: 1100 });
await shoot("research-board-scope-after-desktop");

// The empty state says the name back rather than blaming "this filter" — the second EARS criterion.
await page.setViewportSize({ width: 390, height: 1200 });
await page.goto(`${origin}/app/research?q=sym%3AZZZT&span=all`);
await page.getByRole("heading", { name: "Studies" }).waitFor();
await page.waitForLoadState("networkidle");
await shoot("research-board-scope-empty-phone");

await close();
