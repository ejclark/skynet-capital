import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32 } from "node:zlib";
import {
  costFromLog,
  jobFiles,
  jobsFromZip,
  laneOf,
  laneRows,
  logStart,
  readLanes,
  runNeedsRead,
  SESSION_FLOOR_SEC,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/lanes.mjs";

// THE LANE METER (#6470). Every lane job's rendered log already carries the session's imputed
// total_cost_usd, read by nothing. These specs pin the three things that made the study's own
// reading wrong once: the RENDERED log form (the spend brake matched the raw `::notice::` form and
// read $0 on 12 of 12 ticks), a cache so a repeat run spends almost no REST on a shared bucket, and
// an honest count of what was not read.

/** A store-only zip of {name: text}, built here so the spec needs no zip binary. */
function storeZip(entries: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const data = Buffer.from(text, "utf8");
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + data.length;
  }
  const centralBytes = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centrals.length / 2, 8);
  end.writeUInt16LE(centrals.length / 2, 10);
  end.writeUInt32LE(centralBytes, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

const RENDERED_RESULT = [
  "﻿2026-10-30T10:00:00.1000000Z Current runner version: '2.338.2'",
  '2026-10-30T10:20:00.0000000Z   "is_error": false,',
  '2026-10-30T10:20:00.0000000Z   "num_turns": 24,',
  '2026-10-30T10:20:00.0000000Z   "total_cost_usd": 1.25,',
  '2026-10-30T10:20:00.0000000Z   "model": "claude-sonnet-5-5"',
].join("\n");

describe("lane cost from a rendered job log", () => {
  it("reads the result envelope the action prints, in the rendered form", () => {
    expect(costFromLog(RENDERED_RESULT)).toEqual({
      usd: 1.25,
      turns: 24,
      model: "claude-sonnet-5-5",
      isError: false,
    });
  });

  it("falls back to the rendered cost notice, which is ##[notice], never ::notice::", () => {
    const log =
      "2026-10-30T10:20:00.0000000Z ##[notice]cost — event=x-2026-11-05 usd=0.31 turns=6 duration_ms=16434 is_error=false";
    expect(costFromLog(log)?.usd).toBe(0.31);
    expect(costFromLog(log)?.turns).toBe(6);
    // The raw form only exists in workflow source; a log that somehow carried it is not a reading.
    expect(costFromLog("::notice::cost — event=x usd=9.99")).toBeNull();
  });

  it("reports a job that died before Claude ran as unpriced, never $0", () => {
    expect(
      costFromLog("2026-10-30T10:00:00Z Current runner version\n##[error]Process completed"),
    ).toBeNull();
  });

  it("takes the job's start from the log's first timestamp, past the byte-order mark", () => {
    expect(logStart(RENDERED_RESULT)).toBe(Date.parse("2026-10-30T10:00:00.100Z"));
    expect(logStart("no timestamp here")).toBeNull();
  });
});

describe("which jobs and runs are lane reads", () => {
  it("names a lane from the job's name, matrix suffix and all", () => {
    expect(laneOf("research due events (nvda-2026-11-05)")).toBe("research");
    expect(laneOf("build plan issue")).toBe("plan");
    expect(laneOf("repair the failure or a flagged conflict")).toBe("repair");
    expect(laneOf("claude")).toBe("claude.yml");
    expect(laneOf("route")).toBeNull();
  });

  it("keeps only top-level job files from a run's log zip", () => {
    expect(
      jobFiles(["0_build feedback issue.txt", "build feedback issue/system.txt", "3_route.txt"]),
    ).toEqual([
      { file: "0_build feedback issue.txt", name: "build feedback issue" },
      { file: "3_route.txt", name: "route" },
    ]);
  });

  it("skips a run too short to have set up a Claude session, and one still running", () => {
    const base = { conclusion: "success", run_started_at: "2026-10-30T10:00:00Z" };
    expect(runNeedsRead({ ...base, updated_at: "2026-10-30T10:00:20Z" })).toBe(false);
    expect(runNeedsRead({ ...base, updated_at: `2026-10-30T10:00:${SESSION_FLOOR_SEC}Z` })).toBe(
      true,
    );
    expect(runNeedsRead({ ...base, conclusion: null, updated_at: "2026-10-30T10:30:00Z" })).toBe(
      false,
    );
  });
});

describe("lane rows from cached runs", () => {
  it("sums by lane inside the window and counts unpriced jobs apart", () => {
    const runs = {
      1: {
        jobs: [
          { lane: "research", startedAt: "2026-10-30T10:00:00Z", usd: 1.25 },
          { lane: "research", startedAt: "2026-10-30T10:00:00Z", usd: null },
          { lane: "plan", startedAt: "2026-10-30T11:00:00Z", usd: 5.5 },
        ],
      },
      2: { jobs: [{ lane: "research", startedAt: "2026-10-20T10:00:00Z", usd: 99 }] },
    };
    const rows = laneRows(
      runs,
      Date.parse("2026-10-27T05:00:00Z"),
      Date.parse("2026-11-01T00:00:00Z"),
    );
    expect(rows.research).toEqual({ usd: 1.25, jobs: 2, unpriced: 1 });
    expect(rows.plan).toEqual({ usd: 5.5, jobs: 1, unpriced: 0 });
  });
});

/** A fake REST layer: canned bodies by path substring, every call counted like the real one. */
function fakeRest(routes: [string | RegExp, string | Buffer][]) {
  const paths: string[] = [];
  const find = (path: string) => {
    const hit = routes.find(([key]) =>
      typeof key === "string" ? path.includes(key) : key.test(path),
    );
    if (!hit) throw new Error(`fakeRest: no route for ${path}`);
    return hit[1];
  };
  // `calls` is the number the cap reads, exactly as on the real layer; `paths` is for assertions.
  const rest = {
    calls: 0,
    paths,
    api(path: string) {
      rest.calls += 1;
      paths.push(path);
      return JSON.parse(String(find(path)));
    },
    zip(runId: number) {
      const path = `/actions/runs/${runId}/logs`;
      rest.calls += 1;
      paths.push(path);
      return find(path) as Buffer;
    },
  };
  return rest;
}

const RUN = (id: number, started: string, minutes: number, conclusion = "success") => ({
  id,
  event: "workflow_dispatch",
  conclusion,
  run_started_at: started,
  updated_at: new Date(Date.parse(started) + minutes * 60000).toISOString(),
});

describe("reading the lanes over REST with a cache", () => {
  const since = Date.parse("2026-10-27T05:00:00Z");
  const until = Date.parse("2026-11-01T00:00:00Z");
  const zip = storeZip({
    "0_research due events (a-1).txt": RENDERED_RESULT,
    "1_research due events (a-2).txt": RENDERED_RESULT.replace("1.25", "2.00"),
    "2_route.txt": "2026-10-30T09:59:00.0000000Z routed",
    "research due events (a-1)/system.txt": "not a job log",
  });
  // Listings are per workflow and lane event; only the events dispatch listing has runs here.
  const routes = (): [string | RegExp, string | Buffer][] => [
    [
      /moneypenny-events\.yml\/runs\?.*event=workflow_dispatch/,
      JSON.stringify({
        workflow_runs: [
          RUN(10, "2026-10-30T09:58:00Z", 22),
          RUN(11, "2026-10-30T12:00:00Z", 0.3), // route-only: 18 seconds, never read
          RUN(12, "2026-10-30T13:00:00Z", 30, null as unknown as string), // still running
          { ...RUN(13, "2026-10-30T14:00:00Z", 5), event: "push" }, // a push only routes
          RUN(14, "2026-10-30T15:00:00Z", 5, "cancelled"), // never carries a price
        ],
      }),
    ],
    [/\.yml\/runs\?/, JSON.stringify({ workflow_runs: [] })],
    ["/actions/runs/10/logs", zip],
  ];

  it("prices each lane job from its rendered log and spends almost nothing on a repeat run", async () => {
    const cache = { version: 1, runs: {} as Record<string, unknown>, pipeline: {} };
    const cold = fakeRest(routes());
    const first = await readLanes({
      rest: cold,
      cache,
      sinceMs: since,
      untilMs: until,
      maxRest: 100,
    });
    expect(first.rows.research).toEqual({ usd: 3.25, jobs: 2, unpriced: 0 });
    expect(first.counts).toMatchObject({
      newRuns: 1,
      skippedShort: 1,
      skippedEvent: 1,
      skippedCancelled: 1,
      inProgress: 1,
      unreadRuns: 0,
    });
    // 15 listings (3 workflows × 5 lane events) + 1 zip; the short run and the running one cost nothing.
    expect(cold.calls).toBe(16);

    const warm = fakeRest(routes());
    const second = await readLanes({
      rest: warm,
      cache,
      sinceMs: since,
      untilMs: until,
      maxRest: 100,
    });
    expect(second.rows).toEqual(first.rows);
    expect(warm.calls).toBe(15);
    expect(warm.paths.some((p) => p.includes("/logs"))).toBe(false);
  });

  it("stops at the REST cap and says how many runs it left unread, never a partial total", async () => {
    const cache = { version: 1, runs: {}, pipeline: {} };
    const rest = fakeRest(routes());
    const out = await readLanes({ rest, cache, sinceMs: since, untilMs: until, maxRest: 1 });
    expect(out.counts.unreadRuns).toBe(1);
    expect(out.counts.unlisted).toHaveLength(14);
    expect(out.counts.unlisted[0]).toBe("moneypenny-events.yml issue_comment");
    expect(out.rows.research).toBeUndefined();
  });

  it("saves each run as it is read, so a cold run cut short keeps what it paid for", async () => {
    const cache = { version: 1, runs: {}, pipeline: {} };
    const saved: number[] = [];
    const persist = () => saved.push(Object.keys(cache.runs).length);
    await readLanes({
      rest: fakeRest(routes()),
      cache,
      sinceMs: since,
      untilMs: until,
      maxRest: 100,
      persist,
    });
    expect(saved).toEqual([1]);
  });

  it("refuses a window past GitHub's listing cap by name instead of printing a floor", () => {
    const full = JSON.stringify({
      workflow_runs: Array.from({ length: 100 }, (_, i) => RUN(i, "2026-10-30T09:00:00Z", 1)),
    });
    const rest = fakeRest([[/moneypenny-events\.yml\/runs\?/, full]]);
    expect(() =>
      readLanes({
        rest,
        cache: { version: 1, runs: {}, pipeline: {} },
        sinceMs: since,
        untilMs: until,
        maxRest: 100,
      }),
    ).toThrow(/listing cap/);
    expect(rest.calls).toBe(10);
  });

  it("counts a run whose log cannot be read and leaves it out of the cache for next time", async () => {
    const cache = { version: 1, runs: {}, pipeline: {} };
    const rest = fakeRest(routes());
    const jobsOf = () => {
      throw new Error("unzip -Z1 failed");
    };
    const out = await readLanes({
      rest,
      cache,
      sinceMs: since,
      untilMs: until,
      maxRest: 100,
      jobsOf,
    });
    expect(out.counts).toMatchObject({ newRuns: 1, unreadableRuns: 1 });
    expect(cache.runs).toEqual({});
  });

  it("reads a cancelled run's empty archive as no jobs, not as an unreadable log", () => {
    const empty = storeZip({});
    expect(jobsFromZip(empty, { id: 1, run_started_at: "2026-10-30T10:00:00Z" })).toEqual([]);
  });
});

// The wiring: the CLI with a fake `gh` on PATH, a temp runs dir for the cache, and nothing else on
// the network. A pure-function pass alone missed most bugs in this area (#6470), so this runs the
// script end to end twice and reads the numbers it prints.
describe("npm run meter — the lane and main-failure wiring", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "agent-meter-"));
    const fixtures = join(dir, "fixtures");
    mkdirSync(fixtures);
    mkdirSync(join(dir, "runs"));
    mkdirSync(join(dir, "projects"));
    mkdirSync(join(dir, "bin"));
    const zip = storeZip({
      "0_build plan issue.txt": RENDERED_RESULT.replace("1.25", "4.50"),
      "1_route.txt": "2026-10-30T09:59:00.0000000Z routed",
    });
    writeFileSync(
      join(fixtures, "events.json"),
      JSON.stringify({ workflow_runs: [RUN(20, "2026-10-30T09:58:00Z", 12)] }),
    );
    writeFileSync(join(fixtures, "empty-runs.json"), JSON.stringify({ workflow_runs: [] }));
    writeFileSync(join(fixtures, "run20.zip"), zip);
    writeFileSync(
      join(fixtures, "pipeline.json"),
      JSON.stringify({
        workflow_runs: [
          { ...RUN(30, "2026-10-31T12:22:00Z", 9, "failure"), event: "push", head_branch: "main" },
          { ...RUN(31, "2026-10-31T11:00:00Z", 9, "success"), event: "push", head_branch: "main" },
          {
            ...RUN(32, "2026-10-31T10:00:00Z", 9, "failure"),
            event: "pull_request",
            head_branch: "feat/x",
          },
        ],
      }),
    );
    writeFileSync(
      join(fixtures, "run30-jobs.json"),
      JSON.stringify({
        jobs: [
          { id: 1, name: "verify", conclusion: "success", steps: [] },
          {
            id: 2,
            name: "release · deploy bots",
            conclusion: "failure",
            steps: [
              { name: "deploy", conclusion: "success" },
              { name: "smoke", conclusion: "failure" },
            ],
          },
        ],
      }),
    );
    writeFileSync(join(fixtures, "pulls.json"), "[]");
    writeFileSync(join(fixtures, "search.json"), JSON.stringify({ total_count: 0, items: [] }));
    // The fake gh: the last argument is the path; a zip is served when it ends in /logs.
    writeFileSync(
      join(dir, "bin", "gh"),
      [
        "#!/bin/bash",
        `F="${fixtures}"`,
        'for p in "$@"; do :; done',
        'echo "$p" >> "$F/calls.log"',
        'case "$p" in',
        '  *moneypenny-events.yml/runs*) cat "$F/events.json" ;;',
        '  *pipeline.yml/runs*) cat "$F/pipeline.json" ;;',
        '  *.yml/runs*) cat "$F/empty-runs.json" ;;',
        '  */actions/runs/20/logs) cat "$F/run20.zip" ;;',
        '  */actions/runs/30/jobs*) cat "$F/run30-jobs.json" ;;',
        '  */pulls?*) cat "$F/pulls.json" ;;',
        '  search/issues*) cat "$F/search.json" ;;',
        '  *) echo "fake gh: no route for $p" >&2; exit 1 ;;',
        "esac",
      ].join("\n"),
    );
    chmodSync(join(dir, "bin", "gh"), 0o755);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const meter = () =>
    JSON.parse(
      execFileSync(
        "node",
        [
          "scripts/agent-meter.mjs",
          "--json",
          "--since",
          "2026-10-27T05:00:00Z",
          "--until",
          "2026-11-01T00:00:00Z",
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${join(dir, "bin")}:${process.env.PATH}`,
            AGENT_RUNS_DIR: join(dir, "runs"),
            AGENT_TRANSCRIPTS_DIR: join(dir, "projects", "-Users-eric-Developer-skynet-capital"),
            AGENT_PROJECTS_DIR: join(dir, "projects"),
            AGENT_MEMORY_DIR: join(dir, "memory"),
          },
        },
      ),
    );

  it("prints the lanes, the main failures by job, and its REST count, cold then warm", () => {
    const cold = meter();
    expect(cold.lanes.rows.plan).toEqual({ usd: 4.5, jobs: 1, unpriced: 0 });
    expect(cold.firstPass.mainFailures).toEqual({
      runs: 2,
      failed: 1,
      byJob: { "release · deploy bots › smoke": 1 },
    });
    expect(cold.firstPass.defects.audited).toBeNull();
    expect(existsSync(join(dir, "runs", "agent-meter-cache.json"))).toBe(true);
    const coldCalls = cold.rest.calls;
    expect(coldCalls).toBeGreaterThanOrEqual(7);

    const warm = meter();
    expect(warm.lanes.rows).toEqual(cold.lanes.rows);
    expect(warm.firstPass.mainFailures).toEqual(cold.firstPass.mainFailures);
    expect(warm.rest.calls).toBeLessThan(coldCalls);
    const log = readFileSync(join(dir, "fixtures", "calls.log"), "utf8");
    expect(log.match(/\/logs$/gm)?.length).toBe(1);
    expect(log.match(/\/jobs\?/gm)?.length).toBe(1);
  });
});
