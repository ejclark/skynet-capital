import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.js";
import { earningsAsEvents, MARKET_EVENTS } from "../../src/domain/market-events.js";
import { loadMarketEvents } from "../../src/domain/market-events-data.js";

const entry = (id: string, date: string) => ({
  id,
  kind: "macro-print",
  title: id,
  date,
  status: "confirmed",
  source: "BLS: fixture",
  impact: "low",
  symbols: [],
});

/** A fixture events DIRECTORY (one JSON file per event, issue #1449) + an empty calendar and
 *  ledger dir, validated through the real CLI. `files` maps file name → entry, so a spec can put
 *  an entry under the wrong name on purpose. */
function validateFixture(files: Record<string, object>): string {
  const dir = mkdtempSync(join(tmpdir(), "event-scan-"));
  try {
    mkdirSync(join(dir, "events"));
    for (const [name, event] of Object.entries(files))
      writeFileSync(join(dir, "events", name), `${JSON.stringify(event, null, 2)}\n`);
    writeFileSync(
      join(dir, "earnings-calendar.ts"),
      "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n",
    );
    return execFileSync(
      "node",
      [
        "scripts/event-scan.mjs",
        "--validate",
        `--events-dir=${join(dir, "events")}`,
        `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
        `--ledger-dir=${join(dir, "no-ledgers")}`,
      ],
      { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Event-calendar contract gate — the committed calendar (src/domain/market-events/*.json +
// earnings-calendar.ts) and every assessment ledger (docs/research/events/) must satisfy the
// contract scripts/event-scan.mjs enforces, because the event lane acts on its word. Static
// analysis — no network, no session, no test recursion.
describe("event-scan contract", () => {
  it("the committed calendar and ledgers satisfy the contract", () => {
    expect(() =>
      execFileSync("node", ["scripts/event-scan.mjs", "--validate"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  // THE PLACEMENT GATE (#1449): one file per event, named by its id. That is the whole reason
  // concurrent research PRs stopped conflicting — a lane can only write the file its own event id
  // names — so a file whose name disagrees with its id has to go red and say which name is right.
  it("--validate rejects a file whose name is not its id and names the fix", () => {
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "bravo.json": entry("charlie", "2026-02-01"),
      }),
    ).toThrow(/bravo\.json: file name must equal its id — rename it to "charlie\.json"/);
  });

  it("--validate accepts one well-named file per event, in any directory order", () => {
    expect(() =>
      validateFixture({
        "charlie.json": entry("charlie", "2026-02-01"),
        "alpha.json": entry("alpha", "2026-01-01"),
        "bravo.json": entry("bravo", "2026-02-01"),
      }),
    ).not.toThrow();
  });

  it("the loader sorts the directory into (date, id) order and rejects a misnamed file loudly", () => {
    const dir = mkdtempSync(join(tmpdir(), "market-events-"));
    try {
      writeFileSync(join(dir, "charlie.json"), JSON.stringify(entry("charlie", "2026-02-01")));
      writeFileSync(join(dir, "alpha.json"), JSON.stringify(entry("alpha", "2026-03-01")));
      writeFileSync(join(dir, "bravo.json"), JSON.stringify(entry("bravo", "2026-02-01")));
      expect(loadMarketEvents(dir).map((e) => e.id)).toEqual(["bravo", "charlie", "alpha"]);
      writeFileSync(join(dir, "delta.json"), JSON.stringify(entry("echo", "2026-04-01")));
      expect(() => loadMarketEvents(dir)).toThrow(/delta\.json: id "echo" does not match/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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

  // THE DRIFT GATE: the scanner reads the calendar directory and the earnings TS table itself (it
  // must run without `npm ci`), which only stays honest while its read and the real modules agree.
  // If anyone reshapes either so the reads diverge, this goes red the same day.
  it("the scanner's read matches the real module exports byte for byte", () => {
    const out = execFileSync("node", ["scripts/event-scan.mjs", "--dump"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const dumped = JSON.parse(out);
    expect(dumped.curated).toEqual(JSON.parse(JSON.stringify(MARKET_EVENTS)));
    expect(dumped.derived).toEqual(JSON.parse(JSON.stringify(earningsAsEvents(UPCOMING_PRINTS))));
  });
});
