import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { pairTable } from "../../src/playbooks/pair-table.js";
import { registeredPlaybooks } from "../../src/playbooks/registry.js";
import { researchOf } from "../../src/playbooks/research-signals.js";
import { declaredRuns, recordName, scheduleSignals } from "../../src/playbooks/signal-schedule.js";
import { main, readRecords } from "../../src/scripts/signal-schedule.js";

/**
 * #4808 slice 2, EARS 2: WHEN a playbook × symbol pair exists, the research lane SHALL schedule that
 * pair's signals on their declared cadence, and SHALL schedule no instrument nothing declares.
 */

const print = (symbol: string, date: string, status: EarningsPrint["status"] = "confirmed") =>
  ({ symbol, date, status, source: "test" }) as EarningsPrint;

const runs = declaredRuns();
const keyed = (key: string) => {
  const run = runs.find((r) => r.key === key);
  if (!run) throw new Error(`no declared run ${key}`);
  return run;
};

describe("what is scheduled is exactly what the playbooks declare", () => {
  it("lists one run per declared command × ticker, and nothing else", () => {
    const expected = new Set<string>();
    for (const pair of pairTable()) {
      const research = researchOf(pair.id);
      if (research?.kind !== "signals") continue;
      for (const symbol of pair.symbols)
        for (const s of research.signals) expected.add(s.instrument.replace("<SYM>", symbol));
    }
    expect(runs.map((r) => r.key).sort()).toEqual([...expected].sort());
  });

  it("schedules no run for a playbook that declares no signal", () => {
    const none = registeredPlaybooks()
      .filter((p) => researchOf(p.id)?.kind === "none")
      .map((p) => p.id);
    expect(none.length).toBeGreaterThan(0);
    for (const run of runs) for (const id of none) expect(run.playbooks).not.toContain(id);
  });

  it("owes one run to two playbooks that name the same study on a ticker", () => {
    // S1-NVDA and the NVDA call spread both read NVDA's run-up.
    expect(keyed("node scripts/research/earnings-cycle.mjs NVDA").playbooks).toEqual([
      "NVDA-CALL-SPREAD",
      "S1-NVDA",
    ]);
  });

  it("carries each signal's own cadence", () => {
    expect(keyed("node scripts/research/premium-fit.mjs CRWV").cadence).toBe("weekly");
    expect(keyed("node scripts/research/earnings-cycle.mjs GOOG").cadence).toBe("after-each-print");
  });

  it("schedules nothing from a roster that declares nothing", () => {
    expect(declaredRuns(pairTable(), () => undefined)).toEqual([]);
  });
});

describe("a run is owed on its declared cadence", () => {
  const wheel = keyed("node scripts/research/premium-fit.mjs CRWV");
  const runUp = keyed("node scripts/research/earnings-cycle.mjs GOOG");
  const schedule = (
    run: typeof wheel,
    lastRunOn: string | undefined,
    today: string,
    prints: readonly EarningsPrint[] = [],
  ) =>
    scheduleSignals({
      runs: [run],
      records: lastRunOn ? { [run.key]: lastRunOn } : {},
      today,
      cap: 6,
      prints,
    });

  it("owes a run that has never happened", () => {
    expect(schedule(wheel, undefined, "2026-10-18").dispatch[0]?.reason).toBe("never-run");
  });

  it("owes a weekly run once seven days have passed, and not before", () => {
    expect(schedule(wheel, "2026-10-12", "2026-10-18").dispatch).toEqual([]);
    expect(schedule(wheel, "2026-10-11", "2026-10-18").dispatch[0]?.reason).toBe("week-elapsed");
  });

  it("owes a print-keyed run when a report landed after its last run", () => {
    const prints = [print("GOOG", "2026-10-14")];
    expect(schedule(runUp, "2026-10-01", "2026-10-18", prints).dispatch[0]?.reason).toBe(
      "print-landed",
    );
  });

  it("does not re-run a print-keyed study until the next report, however long it waits", () => {
    const prints = [print("GOOG", "2026-10-14"), print("GOOG", "2027-01-27")];
    expect(schedule(runUp, "2026-10-15", "2026-12-20", prints).dispatch).toEqual([]);
  });

  it("does not count the print's own day as landed, since it reports after the close", () => {
    expect(
      schedule(runUp, "2026-10-01", "2026-10-14", [print("GOOG", "2026-10-14")]).dispatch,
    ).toEqual([]);
  });

  it("re-runs on the day after the report lands, when the last run was that same day", () => {
    expect(
      schedule(runUp, "2026-10-14", "2026-10-15", [print("GOOG", "2026-10-14")]).dispatch[0]
        ?.reason,
    ).toBe("print-landed");
  });

  it("does not take an estimated date for a report that landed", () => {
    expect(
      schedule(runUp, "2026-10-01", "2026-10-18", [print("GOOG", "2026-10-14", "estimate")])
        .dispatch,
    ).toEqual([]);
  });
});

describe("a tick hands out at most the ceiling, never-run first, and defers the rest", () => {
  const all = declaredRuns();
  const owed = (cap: number, records = {}) =>
    scheduleSignals({ runs: all, records, today: "2026-10-18", cap, prints: [] });

  it("cuts to the cap and keeps the remainder for the next tick", () => {
    const s = owed(2);
    expect(s.dispatch).toHaveLength(2);
    expect(s.deferred).toHaveLength(all.length - 2);
  });

  it("hands out nothing when the dial is at zero", () => {
    expect(owed(0).dispatch).toEqual([]);
  });

  it("serves a never-run signal before one that is merely stale", () => {
    const stale = keyed("node scripts/research/dip-bounce.mjs MU");
    const s = scheduleSignals({
      runs: all,
      records: Object.fromEntries(
        all.filter((r) => r.key !== stale.key).map((r) => [r.key, "2026-09-01"]),
      ),
      today: "2026-10-18",
      cap: 1,
      prints: [],
    });
    expect(s.dispatch[0]?.key).toBe(stale.key);
  });

  it("hands out the same runs for the same inputs", () => {
    expect(owed(3).dispatch.map((r) => r.key)).toEqual(owed(3).dispatch.map((r) => r.key));
  });
});

describe("the CLI records a run and then stops owing it", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "signal-runs-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const lines: string[] = [];
  const problems: string[] = [];
  const run = (argv: string[]) => {
    lines.length = 0;
    const code = main(argv, {
      dir,
      cap: () => 6,
      today: () => "2026-10-18",
      out: (l) => lines.push(l),
      err: (l) => problems.push(l),
    });
    return code;
  };

  it("names a record file per run, so two lanes never write one file", () => {
    expect(recordName(keyed("node scripts/research/earnings-cycle.mjs NVDA"))).toBe(
      "earnings-cycle--NVDA.json",
    );
  });

  it("records a declared run and no longer lists it", () => {
    const key = "node scripts/research/premium-fit.mjs CRWV";
    expect(run([])).toBe(0);
    expect(lines.some((l) => l.includes(key))).toBe(true);
    expect(run(["--record", key])).toBe(0);
    expect(readdirSync(dir)).toEqual(["premium-fit--CRWV.json"]);
    expect(readRecords(dir)).toEqual({ [key]: "2026-10-18" });
    run([]);
    expect(lines.some((l) => l.includes(key))).toBe(false);
  });

  it("refuses to record an instrument no playbook declares", () => {
    expect(run(["--record", "node scripts/research/intraday-edges.mjs NVDA"])).toBe(1);
    expect(readdirSync(dir)).toEqual([]);
    expect(problems.join(" ")).toContain("no playbook declares");
  });

  it("fails loudly on a record it cannot read rather than treating the run as never done", () => {
    writeFileSync(join(dir, "premium-fit--CRWV.json"), "{}\n");
    expect(() => readRecords(dir)).toThrow(/not a run record/);
  });

  it("can only lower the ceiling with --cap, and prints the owed runs as JSON", () => {
    expect(run(["--json", "--cap", "1"])).toBe(0);
    expect(JSON.parse(lines.join("\n"))).toHaveLength(1);
    expect(run(["--json", "--cap", "99"])).toBe(0);
    expect(JSON.parse(lines.join("\n"))).toHaveLength(declaredRuns().length);
  });

  it("writes a record file that round-trips", () => {
    run(["--record", "node scripts/research/dip-bounce.mjs MU", "--on", "2026-10-10"]);
    const written = JSON.parse(readFileSync(join(dir, "dip-bounce--MU.json"), "utf8"));
    expect(written).toEqual({
      instrument: "node scripts/research/dip-bounce.mjs MU",
      on: "2026-10-10",
    });
  });
});
