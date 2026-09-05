import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The adaptive-cadence decision (impact tier × days-to-event → reassess interval) lives as a pure
// function inside scripts/event-scan.mjs, and — matching the handoff pattern — the CLI is the unit
// under test: fixtures in a temp dir, `--today` pinning the clock, `--due` JSON as the observable.
// Bands under test are the REAL committed table (assessment-cadence.json): critical =
// 61+d→7d · 21–60d→3d · 8–20d→2d · 0–7d→daily; low = 15+d→30d · 0–14d→7d; closeOut 6d.
const TODAY = "2026-06-01";

interface Fixture {
  readonly id: string;
  readonly date: string;
  readonly impact: string;
  readonly status?: string;
  readonly source?: string;
  readonly lastAssessed?: string;
  readonly hasOutcome?: boolean;
}

const FIXTURES: readonly Fixture[] = [
  { id: "crit-never", date: "2026-08-01", impact: "critical" },
  { id: "crit-61-fresh", date: "2026-08-01", impact: "critical", lastAssessed: "2026-05-26" },
  { id: "crit-61-stale", date: "2026-08-01", impact: "critical", lastAssessed: "2026-05-25" },
  { id: "crit-60", date: "2026-07-31", impact: "critical", lastAssessed: "2026-05-29" },
  { id: "crit-8", date: "2026-06-09", impact: "critical", lastAssessed: "2026-05-30" },
  { id: "crit-7", date: "2026-06-08", impact: "critical", lastAssessed: "2026-05-31" },
  { id: "crit-7-fresh", date: "2026-06-08", impact: "critical", lastAssessed: "2026-06-01" },
  {
    id: "est-61-stale",
    date: "2026-08-01",
    impact: "critical",
    status: "estimate",
    source: "EST: cadence",
    lastAssessed: "2026-05-25",
  },
  { id: "passed-unscored", date: "2026-05-31", impact: "critical", lastAssessed: "2026-05-30" },
  {
    id: "passed-scored",
    date: "2026-05-31",
    impact: "critical",
    lastAssessed: "2026-05-31",
    hasOutcome: true,
  },
  { id: "passed-old", date: "2026-05-20", impact: "critical", lastAssessed: "2026-05-19" },
  { id: "low-15", date: "2026-06-16", impact: "low", lastAssessed: "2026-05-20" },
  { id: "low-14", date: "2026-06-15", impact: "low", lastAssessed: "2026-05-25" },
];

let dir: string;
let due: Map<string, { reason: string; intervalDays: number | null }>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "event-scan-"));
  // One JSON file per event (issue #1449) — the same directory shape the real calendar uses.
  const eventsDir = join(dir, "market-events");
  mkdirSync(eventsDir);
  for (const f of FIXTURES)
    writeFileSync(
      join(eventsDir, `${f.id}.json`),
      JSON.stringify({
        id: f.id,
        kind: "macro-print",
        title: f.id,
        date: f.date,
        status: f.status ?? "confirmed",
        source: f.source ?? "BLS: fixture",
        impact: f.impact,
        symbols: [],
      }),
    );
  writeFileSync(
    join(dir, "earnings-calendar.ts"),
    "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n",
  );
  const ledgerDir = join(dir, "events");
  mkdirSync(ledgerDir);
  for (const f of FIXTURES) {
    if (!f.lastAssessed) continue;
    writeFileSync(
      join(ledgerDir, `${f.id}.md`),
      `# ${f.id}\n**Last assessed:** ${f.lastAssessed}\n${f.hasOutcome ? "\n## Outcome\nscored.\n" : ""}`,
    );
  }

  const out = execFileSync(
    "node",
    [
      "scripts/event-scan.mjs",
      "--due",
      `--today=${TODAY}`,
      `--events-dir=${join(dir, "market-events")}`,
      `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
      `--ledger-dir=${ledgerDir}`,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  due = new Map(
    JSON.parse(out).map((e: { id: string; reason: string; intervalDays: number | null }) => [
      e.id,
      { reason: e.reason, intervalDays: e.intervalDays },
    ]),
  );
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("assessment cadence (via event-scan.mjs --due)", () => {
  it("a never-assessed upcoming event is due immediately — adding the event IS the trigger", () => {
    expect(due.get("crit-never")?.reason).toBe("never-assessed");
  });

  it("outside the interval → due; inside it → quiet (critical, 61d out, 7d band)", () => {
    expect(due.get("crit-61-stale")).toEqual({ reason: "interval-elapsed", intervalDays: 7 });
    expect(due.has("crit-61-fresh")).toBe(false);
  });

  it("band boundary 61/60: the interval tightens from 7d to 3d", () => {
    expect(due.get("crit-60")?.intervalDays).toBe(3);
  });

  it("band boundary 8/7: every-2-days becomes the daily pulse of the final week", () => {
    expect(due.get("crit-8")?.intervalDays).toBe(2);
    expect(due.get("crit-7")?.intervalDays).toBe(1);
    expect(due.has("crit-7-fresh")).toBe(false); // assessed today — tomorrow's pulse, not two
  });

  it("estimate and confirmed get identical cadence — research is not action", () => {
    expect(due.get("est-61-stale")).toEqual(due.get("crit-61-stale"));
  });

  it("a passed event gets ONE close-out inside the window, then silence forever", () => {
    expect(due.get("passed-unscored")?.reason).toBe("event-passed-unscored");
    expect(due.has("passed-scored")).toBe(false); // ## Outcome exists — scored
    expect(due.has("passed-old")).toBe(false); // outside closeOutWithinDays — aged out
  });

  it("low tier stays sparse: 30d interval at 15d out, 7d inside two weeks", () => {
    expect(due.has("low-15")).toBe(false); // 12d since last check < 30d interval
    expect(due.get("low-14")?.intervalDays).toBe(7);
  });
});
