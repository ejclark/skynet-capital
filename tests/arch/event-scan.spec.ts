import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.js";
import { earningsAsEvents, MARKET_EVENTS } from "../../src/domain/market-events.js";

/** One fixture events file + an empty calendar and ledger dir, validated through the real CLI. */
function validateFixture(entryOrder: readonly (readonly [string, string])[]): string {
  const dir = mkdtempSync(join(tmpdir(), "event-scan-order-"));
  try {
    const entries = entryOrder
      .map(
        ([id, date]) =>
          `  { id: "${id}", kind: "macro-print", title: "${id}", date: "${date}", ` +
          `status: "confirmed", source: "BLS: fixture", impact: "low", symbols: [] },`,
      )
      .join("\n");
    writeFileSync(
      join(dir, "market-events.ts"),
      `export const MARKET_EVENTS: readonly MarketEvent[] = [\n${entries}\n];\n`,
    );
    writeFileSync(
      join(dir, "earnings-calendar.ts"),
      "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n",
    );
    return execFileSync(
      "node",
      [
        "scripts/event-scan.mjs",
        "--validate",
        `--events-file=${join(dir, "market-events.ts")}`,
        `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
        `--ledger-dir=${join(dir, "no-ledgers")}`,
      ],
      { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Event-calendar contract gate — the committed tables (src/domain/market-events.ts +
// earnings-calendar.ts) and every assessment ledger (docs/research/events/) must satisfy the
// contract scripts/event-scan.mjs enforces, because the daily Routine and the detect workflow
// both act on its word. Static analysis — no network, no session, no test recursion.
describe("event-scan contract", () => {
  it("the committed tables and ledgers satisfy the contract", () => {
    expect(() =>
      execFileSync("node", ["scripts/event-scan.mjs", "--validate"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  // THE ORDERING GATE (#1341): MARKET_EVENTS is STORED in (date, id) order so two research lanes
  // adding events for different dates insert at different anchors and plain git merges them —
  // GitHub's server-side merge never runs the custom driver #1324 wired, so file order is the only
  // lever that works there. Nothing teaches a research session this rule (the research prompt is
  // envelope-protected); the red gate is how they learn it, so it has to actually go red.
  it("--validate rejects an out-of-order entry and names it", () => {
    expect(() =>
      validateFixture([
        ["alpha", "2026-01-01"],
        ["charlie", "2026-03-01"],
        ["bravo", "2026-02-01"],
      ]),
    ).toThrow(/out of \(date, id\) order/);
  });

  it("--validate accepts entries in (date, id) order, tie broken by id", () => {
    expect(() =>
      validateFixture([
        ["alpha", "2026-01-01"],
        ["bravo", "2026-02-01"],
        ["charlie", "2026-02-01"],
      ]),
    ).not.toThrow();
  });

  // The Routine and the detect workflow both read this one output. If its shape drifts, the
  // pickup silently stops working — exactly the failure a scheduled job hides best.
  it("--due emits the JSON shape both pickup layers consume", () => {
    const out = execFileSync("node", ["scripts/event-scan.mjs", "--due"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const due = JSON.parse(out);
    expect(Array.isArray(due)).toBe(true);
    for (const event of due) {
      expect(event).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          kind: expect.any(String),
          title: expect.any(String),
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          status: expect.any(String),
          impact: expect.any(String),
          symbols: expect.any(Array),
          daysUntil: expect.any(Number),
          reason: expect.any(String),
          ledger: expect.any(String),
        }),
      );
    }
  });

  // THE DRIFT GATE: the scanner reads the TS tables by marker-string extraction (it must run
  // without `npm ci`), which only stays honest while extraction and the real modules agree. If
  // anyone reshapes a table so extraction breaks or diverges, this goes red the same day.
  it("marker-string extraction matches the real module exports byte for byte", () => {
    const out = execFileSync("node", ["scripts/event-scan.mjs", "--dump"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const dumped = JSON.parse(out);
    expect(dumped.curated).toEqual(JSON.parse(JSON.stringify(MARKET_EVENTS)));
    expect(dumped.derived).toEqual(JSON.parse(JSON.stringify(earningsAsEvents(UPCOMING_PRINTS))));
  });
});
