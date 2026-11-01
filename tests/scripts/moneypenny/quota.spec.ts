import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { withReading } from "../../../scripts/moneypenny/pace-reading.mjs";
import {
  BAND_POINTS,
  type Order,
  pace,
  paceLine,
  type Reading,
  reckon,
  STALE_AFTER_MS,
  tick,
  wouldHaveDone,
} from "../../../scripts/moneypenny/quota.mjs";

// THE WEEKLY PACE READING (#6470). The fixture is the design panel's back-test as recorded: 17
// readings over four weeks (real lane rate-limit events, #4153 comments, get_usage lines), against
// his dated orders in his own words. Report-only: `tick` prints what a pace rule would have done.

const at = (iso: string) => Date.parse(iso);
const RESETS = {
  A: at("2026-09-29T05:00:00Z"),
  B: at("2026-10-20T05:00:00Z"),
  C: at("2026-10-27T05:00:00Z"),
  D: at("2026-11-03T05:00:00Z"),
};

const ORDERS: Order[] = [
  {
    from: "2026-10-15T04:37:17Z",
    until: "2026-10-18T06:14:41Z",
    words: "Now I have to conserve tokens",
  },
  {
    from: "2026-10-19T06:32:17Z",
    until: "2026-10-20T05:00:00Z",
    words: "go - do all the work you can to use up tokens for the weekly rate limit",
  },
  {
    from: "2026-10-26T09:42:09Z",
    until: "2026-10-27T05:00:00Z",
    words: "need to make use of tokens before weekly reset at midnight cst",
  },
  {
    from: "2026-10-26T23:12:35Z",
    until: "2026-10-27T05:00:00Z",
    words: "We have 50% weekly tokens left. Invest it all",
  },
];

/** [week, read at, used, percent gone, used minus gone, state] — backtest.out, row for row. */
const RECORD: [keyof typeof RESETS, string, number | null, number, number, string][] = [
  ["A", "2026-09-29T03:19:00Z", 99, 99, 0, "on-pace"],
  ["A", "2026-09-29T03:22:00Z", 100, 99, 1, "on-pace"],
  ["B", "2026-10-15T04:37:00Z", null, 0, 0, "blind"],
  ["B", "2026-10-18T06:14:00Z", null, 0, 0, "blind"],
  ["B", "2026-10-19T06:34:00Z", 72, 87, -15, "stand-down"],
  ["B", "2026-10-19T06:45:00Z", 73, 87, -14, "stand-down"],
  ["B", "2026-10-19T08:02:00Z", 80, 88, -8, "stand-down"],
  ["B", "2026-10-19T08:17:00Z", 81, 88, -7, "stand-down"],
  ["B", "2026-10-19T09:05:00Z", 87, 88, -1, "stand-down"],
  ["B", "2026-10-19T10:35:00Z", 91, 89, 2, "stand-down"],
  ["B", "2026-10-19T11:56:00Z", 96, 90, 6, "stand-down"],
  ["C", "2026-10-26T14:22:00Z", 42, 91, -49, "stand-down"],
  ["C", "2026-10-26T23:12:00Z", 50, 97, -47, "stand-down"],
  ["C", "2026-10-27T04:45:00Z", 100, 100, 0, "stand-down"],
  ["D", "2026-11-01T09:27:00Z", 13, 74, -61, "behind"],
  ["D", "2026-11-01T09:54:00Z", 16, 74, -58, "behind"],
  ["D", "2026-11-01T12:00:00Z", 21, 76, -55, "behind"],
];

const readingOf = ([week, time, used]: (typeof RECORD)[number]) =>
  used === null ? null : { used, at: at(time), resetsAt: RESETS[week] };

const replay = (orders: Order[]) =>
  RECORD.map((row) => reckon(readingOf(row), { orders, now: at(row[1]) }));

describe("the back-test: 17 recorded readings, his four dated orders", () => {
  it.each(RECORD.map((row, i) => [i, row] as const))(
    "reproduces row %i of the recorded back-test",
    (i, [, , used, gone, delta, state]) => {
      const verdict = replay(ORDERS)[i];
      expect(verdict?.state).toBe(state);
      if (used !== null) {
        expect(Math.round(verdict?.gone ?? -1)).toBe(gone);
        expect(Math.round(verdict?.delta ?? 999)).toBe(delta);
      }
    },
  );

  it("would have moved the dial 0 times, and never against his orders", () => {
    expect(replay(ORDERS).filter((v) => v.wouldSet !== null)).toHaveLength(0);
  });

  it("would still have moved 0 times with his orders removed, because nothing cleared the band", () => {
    // The fact behind the header's "a brake alone would never have fired": the zero is not his
    // orders holding a brake back. The largest reading ahead of the line in the record is +6.
    const bare = replay([]);
    expect(bare.filter((v) => v.wouldSet !== null)).toHaveLength(0);
    expect(Math.max(...bare.map((v) => v.delta ?? -999))).toBeLessThanOrEqual(BAND_POINTS);
    expect(Math.round(Math.max(...bare.map((v) => v.delta ?? -999)))).toBe(6);
  });

  it("flat 85/95 lines would have braked against his orders 4 times, which is why pace is the sum", () => {
    const flatBrakes = RECORD.filter(([, time, used]) => {
      const live = ORDERS.slice(1).some((o) => at(time) >= at(o.from) && at(time) < at(o.until));
      return used !== null && used >= 85 && live;
    });
    expect(flatBrakes).toHaveLength(4);
  });

  it("reads this week's real failure as behind pace, where no brake can act", () => {
    const week = replay(ORDERS).slice(-3);
    expect(week.map((v) => v.state)).toEqual(["behind", "behind", "behind"]);
    expect(week.every((v) => v.wouldSet === null)).toBe(true);
  });
});

describe("the rule can move: the states the record never reached", () => {
  const AHEAD: Reading = { used: 60, at: at("2026-10-30T05:00:00Z"), resetsAt: RESETS.D };

  it("would set conserve past the band, the one state that does", () => {
    const verdict = reckon(AHEAD);
    expect(pace(AHEAD).gone).toBeCloseTo((3 / 7) * 100);
    expect(verdict.state).toBe("ahead");
    expect(verdict.wouldSet).toBe("conserve");
    expect(wouldHaveDone(verdict)).toBe("would have set conserve");
  });

  it("holds exactly at the band and moves one point past it", () => {
    const line = pace(AHEAD).gone;
    expect(reckon({ ...AHEAD, used: line + BAND_POINTS }).wouldSet).toBeNull();
    expect(reckon({ ...AHEAD, used: line + BAND_POINTS + 1 }).wouldSet).toBe("conserve");
  });

  it("stands down under his order even when ahead", () => {
    const order = { from: "2026-10-29T00:00:00Z", until: "2026-10-31T00:00:00Z", words: "go" };
    const verdict = reckon(AHEAD, { orders: [order] });
    expect(verdict.state).toBe("stand-down");
    expect(verdict.wouldSet).toBeNull();
  });

  it("never says surge or halt, however far behind", () => {
    const verdict = reckon({ ...AHEAD, used: 0 });
    expect(verdict.state).toBe("behind");
    expect(verdict.wouldSet).toBeNull();
    expect(wouldHaveDone(verdict)).toBe("would have moved nothing");
  });
});

describe("a number that has gone old says so", () => {
  const READ: Reading = { used: 21, at: at("2026-11-01T12:00:00Z"), resetsAt: RESETS.D };

  it("is fresh at 12 hours and stale one minute later", () => {
    expect(STALE_AFTER_MS).toBe(12 * 3_600_000);
    const fresh = reckon(READ, { now: READ.at + STALE_AFTER_MS });
    expect(fresh.state).toBe("behind");
    const stale = reckon(READ, { now: READ.at + STALE_AFTER_MS + 60_000 });
    expect(stale.state).toBe("blind");
    expect(stale.why).toBe("stale");
    expect(paceLine(stale)).toContain("STALE");
    expect(paceLine(stale)).toContain("21% used");
  });

  it("is blind once the week it measured has reset, however recent", () => {
    const verdict = reckon({ ...READ, at: RESETS.D - 60_000 }, { now: RESETS.D + 60_000 });
    expect(verdict.state).toBe("blind");
    expect(verdict.why).toBe("the week it measured has reset");
    expect(verdict.wouldSet).toBeNull();
  });

  it("reads a missing reading as no reading, not as zero used", () => {
    expect(paceLine(reckon(null, { now: READ.at }))).toBe("pace: no reading");
  });

  it("reads an unparseable or future-dated read time as no reading, never as on pace", () => {
    const line = (r: Reading) => paceLine(reckon(r, { now: READ.at }));
    expect(line({ ...READ, at: Number.NaN })).toBe("pace: no reading");
    expect(line({ ...READ, at: READ.at + 3_600_000 })).toBe("pace: no reading");
    expect(line({ ...READ, resetsAt: Number.NaN })).toBe("pace: no reading");
  });
});

describe("the one line", () => {
  it("names the numbers and the gap", () => {
    const line = paceLine(reckon({ used: 21, at: at("2026-11-01T12:00:00Z"), resetsAt: RESETS.D }));
    expect(line).toBe("pace: week 21% used, 76% gone, behind pace by 55, resets 11-03 05:00Z");
  });
});

describe("the tick is report-only", () => {
  const READ: Reading = { used: 60, at: at("2026-10-30T05:00:00Z"), resetsAt: RESETS.D };

  it("prints the reading and what it would have done", () => {
    const { line } = tick({
      reading: READ,
      now: READ.at,
      readDial: () => ({ position: "normal" }),
    });
    expect(line).toContain("ahead of pace by");
    expect(line).toContain("dial normal");
    expect(line).toContain("would have set conserve (his dated words not read)");
    expect(line).toContain("report only, wrote nothing");
  });

  it.each(["conserve", "surge", "halt"] as const)(
    "treats a dial at %s as a person's hand and stands down",
    (position) => {
      const { verdict } = tick({
        reading: READ,
        now: READ.at,
        readDial: () => ({ position }),
      });
      expect(verdict.state).toBe("stand-down");
      expect(verdict.wouldSet).toBeNull();
    },
  );

  it("does not treat the conserve an unreadable dial falls back to as a person's hand", () => {
    const { verdict } = tick({
      reading: READ,
      now: READ.at,
      readDial: () => ({ position: "conserve", unreadable: true }),
    });
    expect(verdict.state).toBe("ahead");
  });

  it("reads the reading the last touch point published when the flags give none", () => {
    const { verdict, line } = tick({
      now: READ.at,
      readDial: () => ({ position: "normal", reading: READ }),
    });
    expect(verdict.state).toBe("ahead");
    expect(line).toContain("ahead of pace by");
    const flags = tick({
      reading: { ...READ, used: 0 },
      now: READ.at,
      readDial: () => ({ position: "normal", reading: READ }),
    });
    expect(flags.verdict.state).toBe("behind");
  });

  it("over the real CLI, reads the published reading off the issue and prints it as JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "quota-gh-"));
    try {
      const gh = join(dir, "gh");
      const body = withReading("The dial.", { ...READ, source: "get_usage" });
      writeFileSync(join(dir, "issue.json"), JSON.stringify({ title: "t", body, labels: [] }));
      writeFileSync(gh, `#!/bin/sh\ncat "${join(dir, "issue.json")}"\n`);
      chmodSync(gh, 0o755);
      const out = execFileSync(
        process.execPath,
        ["scripts/moneypenny/quota.mjs", "--tick", "--json", "--now", "2026-10-30T05:00:00Z"],
        {
          encoding: "utf8",
          env: { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH}` },
        },
      );
      expect(JSON.parse(out).pace).toContain("week 60% used");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("over the real CLI, refuses reading flags it cannot read rather than using the published one", () => {
    const run = () =>
      execFileSync(
        process.execPath,
        ["scripts/moneypenny/quota.mjs", "--tick", "--used", "34", "--resets-at", "11-tuesday"],
        { encoding: "utf8", stdio: "pipe" },
      );
    expect(run).toThrow(/--used needs a number/);
  });

  it("over the real CLI, only ever calls gh to read", () => {
    // Wiring, not logic: a fake `gh` first on PATH logs every call. A write of any kind (a label, a
    // comment, a title) would show as a call other than `gh api <path>` with no method flag.
    const dir = mkdtempSync(join(tmpdir(), "quota-gh-"));
    try {
      const log = join(dir, "calls.log");
      const gh = join(dir, "gh");
      writeFileSync(
        gh,
        `#!/bin/sh\necho "$*" >> "${log}"\necho '{"title":"Work mode: NORMAL","labels":[{"name":"work-mode:normal"}]}'\n`,
      );
      chmodSync(gh, 0o755);
      const out = execFileSync(
        process.execPath,
        [
          "scripts/moneypenny/quota.mjs",
          "--tick",
          "--used",
          "60",
          "--resets-at",
          "2026-11-03T05:00:00Z",
          "--read-at",
          "2026-10-30T05:00:00Z",
          "--now",
          "2026-10-30T05:00:00Z",
        ],
        {
          encoding: "utf8",
          env: { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH}` },
        },
      );
      expect(out).toContain("would have set conserve");
      const calls = readFileSync(log, "utf8").trim().split("\n");
      expect(calls.length).toBeGreaterThan(0);
      for (const call of calls) {
        expect(call).toMatch(/^api /);
        expect(call).not.toMatch(/-X|--method|-f |--field|issue edit|comment/);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
