import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import {
  dialWindows,
  type Exec,
  type Leg,
  legFromLog,
  readLegs,
  renderTable,
  summarize,
} from "../../scripts/dial-spend.mjs";

// DOES THE DIAL MOVE BURN? (#6470) The sum is simple; the wiring is what could lie. These specs pin
// that a leg lands in the position its START fell in, that an unpriced or unread leg is never
// counted as zero spend, and that the REST budget stops the read and says so.

const EVENTS = [
  { event: "labeled", label: "work-mode:normal", at: "2026-09-30T04:19:34Z" },
  { event: "unlabeled", label: "work-mode:normal", at: "2026-10-15T04:37:17Z" },
  { event: "labeled", label: "work-mode:conserve", at: "2026-10-15T04:37:17Z" },
  { event: "unlabeled", label: "work-mode:conserve", at: "2026-10-18T06:14:41Z" },
  { event: "labeled", label: "work-mode:normal", at: "2026-10-18T06:14:42Z" },
  { event: "labeled", label: "some-other-label", at: "2026-10-20T00:00:00Z" },
];
const NOW = Date.parse("2026-10-20T00:00:00Z");

const leg = (at: string, usd: number | null, lane = "research", run = 1): Leg => ({
  lane,
  at,
  usd,
  run,
});

describe("the dial's windows, from the label events", () => {
  it("opens a window at each dial label and closes it at the next", () => {
    const windows = dialWindows(EVENTS, { until: NOW });
    expect(windows.map((w) => w.position)).toEqual(["normal", "conserve", "normal"]);
    expect(new Date(windows[1]?.from ?? 0).toISOString()).toBe("2026-10-15T04:37:17.000Z");
    expect(new Date(windows[1]?.to ?? 0).toISOString()).toBe("2026-10-18T06:14:42.000Z");
    expect(windows[2]?.to).toBe(NOW);
  });

  it("clips to the asked span and drops what falls outside it", () => {
    const since = Date.parse("2026-10-16T00:00:00Z");
    const windows = dialWindows(EVENTS, { since, until: NOW });
    expect(windows.map((w) => w.position)).toEqual(["conserve", "normal"]);
    expect(windows[0]?.from).toBe(since);
  });

  it("ignores a label that is not on the dial", () => {
    expect(dialWindows(EVENTS, { until: NOW })).toHaveLength(3);
  });
});

describe("a job log, read for its price", () => {
  const ENVELOPE = `﻿2026-11-01T06:04:03.2785140Z Current runner version: '2.338.2'
2026-11-01T06:04:50.4449734Z   "num_turns": 6,
2026-11-01T06:04:50.4450359Z   "total_cost_usd": 0.31474159999999995,
2026-11-01T06:04:50.8745944Z COST=$(jq -r "$RESULT_FILTER | .total_cost_usd // \\"?\\"" "$F")
2026-11-01T06:04:50.9025805Z ##[notice]cost — event=treasury-refunding-2026-11-04 usd=0.31474159999999995 turns=6`;

  it("takes the lane from the job's file name, and the time from its first line", () => {
    const parsed = legFromLog("1_research due events (treasury-2026-11-04, x....txt", ENVELOPE, 9);
    expect(parsed).toEqual({
      lane: "research",
      at: "2026-11-01T06:04:03.278Z",
      usd: 0.31474159999999995,
      run: 9,
    });
  });

  it("reads a build's envelope when it has no cost notice", () => {
    const parsed = legFromLog(
      "2_build feedback issue.txt",
      `2026-10-16T10:00:00.0000000Z start\n2026-10-16T10:30:00.0000000Z   "total_cost_usd": 6.5,\n`,
      9,
    );
    expect(parsed?.lane).toBe("feedback");
    expect(parsed?.usd).toBe(6.5);
  });

  it("keeps a leg with no price as unpriced rather than as free", () => {
    const parsed = legFromLog(
      "2_build plan issue.txt",
      "2026-10-16T10:00:00.0000000Z died before the session started\n",
      9,
    );
    expect(parsed?.lane).toBe("plan");
    expect(parsed?.usd).toBeNull();
  });

  it("is not a leg when the job holds no session", () => {
    expect(legFromLog("3_route.txt", "2026-10-16T10:00:00.0000000Z x\n", 9)).toBeNull();
  });
});

describe("the table: dollars and legs per hour, by position and lane", () => {
  const windows = dialWindows(EVENTS, {
    since: Date.parse("2026-10-15T00:00:00Z"),
    until: Date.parse("2026-10-19T00:00:00Z"),
  });

  it("puts a leg in the position its start fell in, and divides by that position's hours", () => {
    const rows = summarize(
      [
        leg("2026-10-15T01:00:00Z", 2, "research", 1),
        leg("2026-10-16T01:00:00Z", 1, "research", 2),
        leg("2026-10-16T01:05:00Z", 1, "research", 2),
        leg("2026-10-17T01:00:00Z", 2, "research", 3),
        leg("2026-10-18T07:00:00Z", 3, "research", 4),
      ],
      windows,
    );
    const conserve = rows.find((r) => r.position === "conserve" && r.lane === "research");
    const hours = (Date.parse("2026-10-18T06:14:42Z") - Date.parse("2026-10-15T04:37:17Z")) / 3.6e6;
    expect(conserve?.hours).toBeCloseTo(hours);
    expect(conserve?.legs).toBe(3);
    expect(conserve?.runs).toBe(2);
    expect(conserve?.usd).toBe(4);
    expect(conserve?.usdPerHour).toBeCloseTo(4 / hours);
    expect(conserve?.legsPerHour).toBeCloseTo(3 / hours);
    expect(conserve?.legsPerRun).toBe(1.5);
    const normal = rows.find((r) => r.position === "normal" && r.lane === "research");
    expect(normal?.legs).toBe(2);
    expect(normal?.usd).toBe(5);
  });

  it("adds a window's hours once when a position returns, so a rate cannot double", () => {
    const rows = summarize([leg("2026-10-15T01:00:00Z", 1)], windows);
    const hours = rows.find((r) => r.position === "normal")?.hours ?? 0;
    const expected =
      (Date.parse("2026-10-15T04:37:17Z") - Date.parse("2026-10-15T00:00:00Z")) / 3.6e6 +
      (Date.parse("2026-10-19T00:00:00Z") - Date.parse("2026-10-18T06:14:42Z")) / 3.6e6;
    expect(hours).toBeCloseTo(expected);
  });

  it("counts an unpriced leg as a leg and never as zero dollars", () => {
    const rows = summarize(
      [leg("2026-10-16T01:00:00Z", 2), leg("2026-10-16T02:00:00Z", null)],
      windows,
    );
    const row = rows.find((r) => r.position === "conserve");
    expect(row?.legs).toBe(2);
    expect(row?.unpriced).toBe(1);
    expect(row?.usd).toBe(2);
  });

  it("gives every position a row for every lane, so a lane that spent nothing reads $0.00", () => {
    const rows = summarize([leg("2026-10-16T01:00:00Z", 2)], windows);
    const plan = rows.find((r) => r.position === "conserve" && r.lane === "plan");
    expect(plan?.legs).toBe(0);
    expect(plan?.usdPerHour).toBe(0);
    expect(plan?.usdPerLeg).toBeNull();
    expect(renderTable(rows)).toMatch(
      /\| conserve \| plan \| 74 \| 0\.00 \| 0\.0 \| 0\.00 \| no price \| \$0\.00 \|/,
    );
  });

  it("still names a position whose every run went unread, as a floor of nothing", () => {
    const rows = summarize([], windows, { unread: [{ at: "2026-10-16T05:00:00Z" }] });
    expect(renderTable(rows)).toMatch(/\| conserve \| research .*at least \$0\.00/);
    expect(renderTable(rows)).toContain("Unread runs: conserve 1");
  });

  it("marks a position whose runs were not all read as a floor", () => {
    const rows = summarize([leg("2026-10-16T01:00:00Z", 2)], windows, {
      unread: [{ at: "2026-10-16T05:00:00Z" }],
    });
    expect(rows.find((r) => r.position === "conserve")?.unreadRuns).toBe(1);
    expect(renderTable(rows)).toMatch(/conserve \| research .*at least/);
  });
});

describe("reading the runs, on a REST budget", () => {
  const dir = () => mkdtempSync(join(tmpdir(), "dial-spend-"));
  const run = (id: number, minutes: number) => ({
    id,
    run_started_at: "2026-10-16T10:00:00Z",
    updated_at: new Date(Date.parse("2026-10-16T10:00:00Z") + minutes * 60_000).toISOString(),
    event: "workflow_dispatch",
  });
  const fake = (runs: readonly ReturnType<typeof run>[]) => {
    const calls: string[] = [];
    const exec: Exec = (cmd, args) => {
      const [_sub, path] = args.filter((a) => !a.startsWith("--"));
      calls.push(String(path));
      // One object per line across pages, as `--paginate --jq '.[] | …'` prints. Only one event's
      // list holds the runs: a run has one event.
      if (cmd === "gh" && String(path).includes("/runs?"))
        return String(path).includes("event=workflow_dispatch")
          ? runs.map((r) => JSON.stringify(r)).join("\n")
          : "";
      return Buffer.from("zip");
    };
    return { exec, calls };
  };
  const unzip = () => [{ name: "1_research due events (a).txt", text: LOG }];
  const LOG = `2026-10-16T10:01:00.0000000Z start\n2026-10-16T10:02:00.0000000Z   "total_cost_usd": 1.5,\n`;

  it("reads a long run once and serves it from the local cache the next time", () => {
    const cacheDir = dir();
    try {
      const first = fake([run(101, 10)]);
      const opts = {
        since: Date.parse("2026-10-16T00:00:00Z"),
        until: Date.parse("2026-10-16T23:00:00Z"),
        cacheDir,
        maxCalls: 50,
        unzip,
        now: Date.parse("2026-11-01T00:00:00Z"),
      };
      const a = readLegs({ ...opts, exec: first.exec });
      expect(a.legs).toEqual([
        { lane: "research", at: "2026-10-16T10:01:00.000Z", usd: 1.5, run: 101 },
      ]);
      expect(first.calls.filter((c) => c.endsWith("/101/logs"))).toHaveLength(1);
      const again = fake([run(101, 10)]);
      const b = readLegs({ ...opts, exec: again.exec });
      expect(b.legs).toEqual(a.legs);
      expect(again.calls).toEqual([]);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("counts an empty archive as a run with no legs, and does not ask again", () => {
    // A run cancelled while queued: GitHub answers 200 with a 22-byte zip and it has no jobs.
    const cacheDir = dir();
    try {
      const opts = {
        since: Date.parse("2026-10-16T00:00:00Z"),
        until: Date.parse("2026-10-16T23:00:00Z"),
        cacheDir,
        maxCalls: 50,
        now: Date.parse("2026-11-01T00:00:00Z"),
      };
      const emptyRun: Exec = (_cmd, args) =>
        String(args[args.length - 1]).endsWith("/logs")
          ? Buffer.alloc(22)
          : String(args).includes("event=workflow_dispatch")
            ? JSON.stringify(run(111, 10))
            : "";
      const out = readLegs({ ...opts, exec: emptyRun });
      expect(out.legs).toEqual([]);
      expect(out.unread).toEqual([]);
      const again = fake([run(111, 10)]);
      readLegs({ ...opts, exec: again.exec });
      expect(again.calls).toEqual([]);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("reports a log it could not fetch as unread, never as no spend", () => {
    const cacheDir = dir();
    try {
      const failing: Exec = (_cmd, args) => {
        if (String(args[args.length - 1]).endsWith("/logs")) throw new Error("HTTP 500");
        return String(args).includes("event=workflow_dispatch") ? JSON.stringify(run(112, 10)) : "";
      };
      const out = readLegs({
        since: Date.parse("2026-10-16T00:00:00Z"),
        until: Date.parse("2026-10-16T23:00:00Z"),
        cacheDir,
        maxCalls: 50,
        exec: failing,
      });
      expect(out.legs).toEqual([]);
      expect(out.unread).toEqual([expect.objectContaining({ run: 112 })]);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("does not keep a list until the day is well past, since a run may still be in flight", () => {
    const cacheDir = dir();
    try {
      const justAfterMidnight = Date.parse("2026-10-17T00:05:00Z");
      const opts = {
        since: Date.parse("2026-10-16T00:00:00Z"),
        until: Date.parse("2026-10-16T23:00:00Z"),
        cacheDir,
        maxCalls: 50,
        unzip,
      };
      readLegs({ ...opts, exec: fake([]).exec, now: justAfterMidnight });
      // The day is not kept yet, so a later reading lists it again and sees the run finished.
      const later = fake([run(121, 10)]);
      const out = readLegs({
        ...opts,
        exec: later.exec,
        now: Date.parse("2026-10-17T12:00:00Z"),
      });
      expect(out.legs).toHaveLength(1);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("skips a run too short to hold a session, without a log call", () => {
    const cacheDir = dir();
    try {
      const { exec, calls } = fake([run(102, 1)]);
      const out = readLegs({
        since: Date.parse("2026-10-16T00:00:00Z"),
        until: Date.parse("2026-10-16T23:00:00Z"),
        cacheDir,
        maxCalls: 50,
        exec,
        unzip,
      });
      expect(out.legs).toEqual([]);
      expect(calls.some((c) => c.endsWith("/logs"))).toBe(false);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("stops at the budget, and reports what it did not read rather than a smaller total", () => {
    const cacheDir = dir();
    try {
      const { exec, calls } = fake([run(201, 10), run(202, 10), run(203, 10)]);
      const out = readLegs({
        since: Date.parse("2026-10-16T00:00:00Z"),
        until: Date.parse("2026-10-16T23:00:00Z"),
        cacheDir,
        maxCalls: 5,
        exec,
        unzip,
      });
      // One day's three lists, two logs, and the run it could not afford is named.
      expect(calls).toHaveLength(5);
      expect(out.calls).toBe(5);
      expect(out.legs).toHaveLength(2);
      expect(out.unread).toEqual([expect.objectContaining({ run: 203 })]);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("over the real CLI, joins label events to cached legs and only ever calls gh to read", () => {
    const cacheDir = dir();
    try {
      const log = join(cacheDir, "calls.log");
      const gh = join(cacheDir, "gh");
      const events = EVENTS.map((e) => JSON.stringify(e)).join("\n");
      const runs = JSON.stringify(run(301, 10));
      writeFileSync(
        gh,
        `#!/bin/sh
echo "$*" >> "${log}"
case "$*" in
  *issues/4153/events*) cat <<'EOF'
${events}
EOF
  ;;
  *event=workflow_dispatch*) echo '${runs}' ;;
  *) ;;
esac
`,
      );
      chmodSync(gh, 0o755);
      writeFileSync(
        join(cacheDir, "legs-301.json"),
        JSON.stringify([{ lane: "research", at: "2026-10-16T10:01:00.000Z", usd: 1.5, run: 301 }]),
      );
      const out = execFileSync(
        process.execPath,
        [
          "scripts/dial-spend.mjs",
          "--since",
          "2026-10-16",
          "--until",
          "2026-10-17",
          "--cache",
          cacheDir,
        ],
        {
          encoding: "utf8",
          env: { ...process.env, PATH: `${cacheDir}${delimiter}${process.env.PATH}` },
        },
      );
      expect(out).toMatch(/\| conserve \| research \| 24 \|/);
      expect(out).toContain("$0.06"); // $1.50 over the 24 hours of the asked span
      for (const call of readFileSync(log, "utf8").trim().split("\n")) {
        expect(call).toMatch(/^api /);
        expect(call).not.toMatch(/ -X |--method| -f |--field/);
      }
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });
});
