import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// THE RESEARCH HORIZON (#2946, slice 2 — the pool cut).
//
// The dispatch ceiling bounded how many sessions a single tick may buy. It did nothing about how
// many an event buys over its life: an event 90 days out pulses repeatedly on its way in, and each
// pulse is one opus session at --max-turns 150. The horizon stops events buying sessions until
// they are close enough for the research to still be good at the print.
//
// Measured on the committed calendar (2026-09-15, 630 upcoming events): remaining-life pulses fall
// 5,375 -> 2,320, a 57% cut. A snapshot of "due today" only moves 108 -> 98 and badly understates
// it, which is why the thresholds were chosen against the pulse count instead.
//
// These specs pin the boundaries exactly (an off-by-one here silently changes spend), that the
// high/critical carve-out is what buys long-lead preparation, and — the invariant that matters
// most — that the horizon can never destroy a close-out record.

const TODAY = "2026-06-01";

interface Fixture {
  readonly id: string;
  readonly date: string;
  readonly impact: string;
  readonly lastAssessed?: string;
}

/** Run `--due` against fixture events with a given horizon, on the REAL committed bands. */
function dueUnder(horizon: object, fixtures: readonly Fixture[]): Map<string, string> {
  const dir = mkdtempSync(join(tmpdir(), "horizon-"));
  try {
    const eventsDir = join(dir, "market-events");
    mkdirSync(join(eventsDir, "proposals"), { recursive: true });
    for (const f of fixtures)
      writeFileSync(
        join(eventsDir, `${f.id}.json`),
        JSON.stringify({
          id: f.id,
          kind: "macro-print",
          title: f.id,
          date: f.date,
          status: "confirmed",
          source: "BLS: fixture",
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
    for (const f of fixtures)
      if (f.lastAssessed)
        writeFileSync(
          join(ledgerDir, `${f.id}.md`),
          `# ${f.id}\n**Last assessed:** ${f.lastAssessed}\n`,
        );

    const cadenceFile = join(dir, "assessment-cadence.json");
    const real = JSON.parse(readFileSync("assessment-cadence.json", "utf8"));
    writeFileSync(cadenceFile, JSON.stringify({ ...real, horizon }));

    const out = execFileSync(
      "node",
      [
        "scripts/event-scan.mjs",
        "--due",
        `--today=${TODAY}`,
        `--events-dir=${eventsDir}`,
        `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
        `--ledger-dir=${ledgerDir}`,
        `--cadence-file=${cadenceFile}`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    return new Map(JSON.parse(out).map((e: { id: string; reason: string }) => [e.id, e.reason]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const COMMITTED = JSON.parse(readFileSync("assessment-cadence.json", "utf8")).horizon;

// Dates relative to TODAY 2026-06-01: 07-01 = D-30, 07-16 = D-45, 07-31 = D-60, 08-01 = D-61,
// 09-01 = D-92, 05-29 = D+3 (passed).
const FIXTURES: readonly Fixture[] = [
  { id: "high-92", date: "2026-09-01", impact: "high" },
  { id: "high-61", date: "2026-08-01", impact: "high" },
  { id: "high-60", date: "2026-07-31", impact: "high" },
  { id: "medium-45-stale", date: "2026-07-16", impact: "medium", lastAssessed: "2026-01-01" },
  { id: "medium-31-stale", date: "2026-07-02", impact: "medium", lastAssessed: "2026-01-01" },
  { id: "medium-30-stale", date: "2026-07-01", impact: "medium", lastAssessed: "2026-01-01" },
  { id: "low-passed", date: "2026-05-29", impact: "low", lastAssessed: "2026-05-28" },
];

describe("the research horizon (#2946)", () => {
  const due = dueUnder(COMMITTED, FIXTURES);

  it("ships the committed 60/30 horizon", () => {
    expect(COMMITTED).toEqual({ maxDaysOut: 60, allImpactsWithinDays: 30 });
  });

  it("suppresses everything past maxDaysOut, high impact included", () => {
    // Before the horizon this fired as never-assessed on arrival — the early-stance rule applied
    // at ANY distance, which is what let events years out buy sessions.
    expect(due.has("high-92")).toBe(false);
    expect(due.has("high-61")).toBe(false);
  });

  it("is inclusive at maxDaysOut — D-60 is inside, D-61 is not", () => {
    expect(due.get("high-60")).toBe("never-assessed");
    expect(due.has("high-61")).toBe(false);
  });

  it("buys long-lead preparation for high/critical only, between the two edges", () => {
    // Same distance band (31-60d), different impact: the carve-out is the whole difference.
    expect(due.get("high-60")).toBe("never-assessed");
    expect(due.has("medium-45-stale")).toBe(false);
  });

  it("is inclusive at allImpactsWithinDays — a stale medium at D-30 is due, at D-31 is not", () => {
    expect(due.get("medium-30-stale")).toBe("interval-elapsed");
    expect(due.has("medium-31-stale")).toBe(false);
  });

  // THE INVARIANT THAT MATTERS MOST. A passed event ages out of closeOutWithinDays permanently, so
  // the horizon must never be able to destroy an outcome record — the close-out branch sits
  // upstream of the horizon check on purpose. Proven with a horizon so tight it would suppress
  // everything else, which is the only way to catch a future reordering of those two branches.
  it("never suppresses a close-out, even under a horizon that suppresses everything else", () => {
    const tight = dueUnder({ maxDaysOut: 1, allImpactsWithinDays: 0 }, FIXTURES);
    expect(tight.get("low-passed")).toBe("event-passed-unscored");
    expect(tight.has("high-60")).toBe(false);
    expect(tight.has("medium-30-stale")).toBe(false);
  });

  it("widening the horizon restores the suppressed events — they were deferred, not dropped", () => {
    const wide = dueUnder({ maxDaysOut: 100_000, allImpactsWithinDays: 100_000 }, FIXTURES);
    expect(wide.get("high-92")).toBe("never-assessed");
    expect(wide.get("medium-45-stale")).toBe("interval-elapsed");
  });

  // Fail closed: an absent or nonsensical horizon must never read as "no horizon", which is the
  // uncapped behaviour that spent a weekly token quota in ~24 hours.
  it.each([
    ["absent", undefined],
    ["zero maxDaysOut", { maxDaysOut: 0, allImpactsWithinDays: 0 }],
    ["negative inner edge", { maxDaysOut: 60, allImpactsWithinDays: -1 }],
    ["fractional", { maxDaysOut: 60.5, allImpactsWithinDays: 30 }],
    ["inner edge past the outer edge", { maxDaysOut: 30, allImpactsWithinDays: 60 }],
  ])("refuses to scan with a %s horizon rather than assuming none", (_label, horizon) => {
    expect(() => dueUnder(horizon as object, FIXTURES)).toThrow();
  });

  // The horizon check must NOT live in loadCadence: --validate exists to report every contract
  // violation at once, and throwing on load would hide the rest behind a stack trace. --dump reads
  // no cadence fields at all and must not be coupled to the horizon either.
  it("reports a bad horizon through --validate alongside other violations, not as a crash", () => {
    const dir = mkdtempSync(join(tmpdir(), "horizon-validate-"));
    try {
      mkdirSync(join(dir, "market-events", "proposals"), { recursive: true });
      writeFileSync(
        join(dir, "earnings-calendar.ts"),
        "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n",
      );
      const cadenceFile = join(dir, "assessment-cadence.json");
      const real = JSON.parse(readFileSync("assessment-cadence.json", "utf8"));
      // Two violations at once: no horizon AND no closeOutWithinDays.
      const { horizon: _h, closeOutWithinDays: _c, ...broken } = real;
      writeFileSync(cadenceFile, JSON.stringify(broken));

      const args = [
        `--events-dir=${join(dir, "market-events")}`,
        `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
        `--ledger-dir=${join(dir, "no-ledgers")}`,
        `--cadence-file=${cadenceFile}`,
      ];

      let stderr = "";
      try {
        execFileSync("node", ["scripts/event-scan.mjs", "--validate", ...args], {
          cwd: process.cwd(),
          encoding: "utf8",
          stdio: "pipe",
        });
        throw new Error("--validate should have exited non-zero");
      } catch (err) {
        stderr = (err as { stderr?: string }).stderr ?? "";
      }
      // Both reported as contract violations — the horizon does not mask the other one.
      expect(stderr).toContain("horizon { maxDaysOut, allImpactsWithinDays } is required");
      expect(stderr).toContain("closeOutWithinDays must be an integer");

      // --dump reads no cadence fields, so a bad horizon must not break it.
      const dumped = execFileSync("node", ["scripts/event-scan.mjs", "--dump", ...args], {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: "pipe",
      });
      expect(() => JSON.parse(dumped)).not.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // A suppressed event must say WHY it is quiet; a bare blank cadence note in the human report
  // reads as a bug rather than a policy.
  it("names the horizon in the human report instead of printing an empty cadence note", () => {
    const dir = mkdtempSync(join(tmpdir(), "horizon-report-"));
    try {
      const eventsDir = join(dir, "market-events");
      mkdirSync(join(eventsDir, "proposals"), { recursive: true });
      writeFileSync(
        join(eventsDir, "high-92.json"),
        JSON.stringify({
          id: "high-92",
          kind: "macro-print",
          title: "high-92",
          date: "2026-09-01",
          status: "confirmed",
          source: "BLS: fixture",
          impact: "high",
          symbols: [],
        }),
      );
      writeFileSync(
        join(dir, "earnings-calendar.ts"),
        "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n",
      );
      const out = execFileSync(
        "node",
        [
          "scripts/event-scan.mjs",
          `--today=${TODAY}`,
          `--events-dir=${eventsDir}`,
          `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
          `--ledger-dir=${join(dir, "no-ledgers")}`,
        ],
        { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
      );
      expect(out).toContain("beyond-horizon");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
