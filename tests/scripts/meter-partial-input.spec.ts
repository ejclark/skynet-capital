import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
import {
  ledgerArgs,
  ledgerStage,
  mainEpisodes,
  parseCommitLog,
  stagesOf,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/failure-to-fix.mjs";
import {
  LANE_EVENTS,
  LANE_WORKFLOWS,
  NON_LANE_EVENTS,
  readLanes,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/lanes.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { localVerify, NO_VERIFY_LOG } from "../../scripts/agent-meter.mjs";
import { dialWindows, type Leg, renderTable, summarize } from "../../scripts/dial-spend.mjs";

// A ROW THAT MISSED PART OF ITS INPUT MUST SAY SO (#6694). The post-merge audit of 2026-11-02 found
// three meter rows with one cause: each read an outside source, missed part of it, and printed as
// though it had it all (#6689, #6691, #6693). An empty read and an unreadable one look the same
// unless the row is told apart on purpose (docs/LESSONS.md, "The guest list was never on the
// volume", 2026-08-25). So this file holds one case per meter row that reads an outside source
// (scripts/agent-meter.mjs, scripts/agent-meter/, scripts/dial-spend.mjs): feed it that source
// empty, unreadable, still open or unpriced, and the row must print unknown, "at least" or a count
// of what it missed, never the answer a clean read gives. A new row of that kind gets a case here.
// Not a gate on new rows: the #6590 reviewer question asks that; promote this only if a later
// audit confirms the same cause again.

const MIN = 60000;
const at = (iso: string) => Date.parse(iso);

describe("npm run meter where this machine holds none of the checkout's local files", () => {
  // #6689 and #6471: in a cloud checkout the meter matched no transcript folder (only the laptop's
  // was there) and printed "none in the window", the same line as a quiet week; local verify
  // printed "0 of 0 failed" with no ship.sh log at all, the same as nothing failing.
  let dir: string;
  let out = "";
  const section = (name: string) => out.split("\n\n").find((block) => block.startsWith(name)) ?? "";

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "meter-partial-input-"));
    mkdirSync(join(dir, "bin"));
    // A gh that refuses, so the REST sections read unavailable and no spec spends the bucket.
    writeFileSync(join(dir, "bin", "gh"), "#!/bin/bash\nexit 1\n");
    chmodSync(join(dir, "bin", "gh"), 0o755);
    // Only the laptop's folder: not this checkout's, so nothing here is a reading.
    mkdirSync(join(dir, "projects", "-Users-eric-Developer-skynet-capital"), { recursive: true });
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const seam of ["AGENT_TRANSCRIPTS_DIR", "AGENT_MEMORY_DIR"]) delete env[seam];
    const res = spawnSync(
      "node",
      [
        "scripts/agent-meter.mjs",
        "--since",
        "2026-11-01T00:00:00Z",
        "--until",
        "2026-11-02T00:00:00Z",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...env,
          HOME: dir,
          PATH: `${join(dir, "bin")}:${process.env.PATH}`,
          AGENT_CHECKOUT_DIR: "/home/user/skynet-capital",
          AGENT_PROJECTS_DIR: join(dir, "projects"),
          // No ship-verify.jsonl under it: ship.sh never ran on this machine.
          AGENT_RUNS_DIR: join(dir, "runs"),
        },
        timeout: 60000,
      },
    );
    expect(res.status).toBe(0);
    out = res.stdout;
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("workflow agents: unknown, never none in the window (#6689)", () => {
    expect(out).not.toMatch(/none in the window/);
    expect(section("workflow agents")).toMatch(/unknown: no transcripts/);
  });

  it("startup and the memory index: unknown, never none or 0 of 200 (#6471)", () => {
    expect(section("startup")).toMatch(/unknown: no transcripts/);
    expect(out).toMatch(/memory index: unknown/);
    expect(out).not.toMatch(/memory index: 0 of/);
  });

  it("flow: unknown (#6689)", () => {
    expect(section("flow")).toMatch(/unknown/);
  });

  it("local verify: unknown, never 0 of 0 failed (#6471)", () => {
    expect(out).toContain(`local verify: ${NO_VERIFY_LOG}`);
    expect(out).not.toMatch(/local verify: 0 of 0 failed/);
  });

  it("local verify: a log with no row in the window is a quiet window, read as one", () => {
    const quiet = localVerify(
      [{ at: "2026-09-01T00:00:00Z", ok: false }],
      at("2026-11-01T00:00:00Z"),
    );
    expect(quiet).toEqual({ runs: 0, failed: 0, bySteps: {} });
  });
});

describe("failure-to-fix ledger: a main streak still red (#6691)", () => {
  // Reproduced on main at 2f8fca5f: one 15-minute streak beside a 3-day outage still red at the
  // window's end read p50 15 and wrote `--after 15`, the same as a healthy week.
  const untilMs = at("2026-11-01T00:00:00Z");
  const week = { sinceMs: at("2026-10-25T00:00:00Z"), untilMs };
  const none = parseCommitLog("");
  const run = (id: number, createdAt: string, conclusion: string, endedAt = createdAt) => ({
    id,
    created_at: createdAt,
    updated_at: endedAt,
    conclusion,
    failedJobs: conclusion === "failure" ? [{ job: "release · deploy bots", step: "smoke" }] : [],
  });
  const blank = { n: 0, unknown: 0, p50Min: null, p90Min: null };
  const blankStages = { toVerified: blank, detectionLag: blank, filedToFix: blank };
  const readingOf = (episodes: unknown[]) => ({
    window: { until: "2026-11-01T00:00:00Z", hours: 168 },
    sources: {
      mainCi: { episodes, stages: stagesOf(episodes), ledger: ledgerStage(episodes) },
      contracts: { stages: blankStages },
      audit: { stages: blankStages },
    },
  });
  const outageMin = (untilMs - at("2026-10-29T00:59:00Z")) / MIN;

  it("keeps the outage in the number as a floor, and says so", () => {
    const episodes = mainEpisodes(
      [
        run(1, "2026-10-26T08:00:00Z", "success"),
        run(2, "2026-10-26T09:00:00Z", "failure", "2026-10-26T09:05:00Z"),
        run(3, "2026-10-26T09:10:00Z", "success", "2026-10-26T09:20:00Z"),
        run(4, "2026-10-29T00:00:00Z", "failure", "2026-10-29T00:59:00Z"),
        run(5, "2026-10-30T00:00:00Z", "failure", "2026-10-30T00:10:00Z"),
      ],
      [],
      none,
      week,
    );
    expect(outageMin).toBe(4261);
    const reading = readingOf(episodes);
    // The stage keeps its rule: the outage is unknown and counted, never 0.
    expect(reading.sources.mainCi.stages.toVerified).toMatchObject({
      n: 1,
      unknown: 1,
      p50Min: 15,
    });
    expect(reading.sources.mainCi.ledger).toMatchObject({ n: 2, unknown: 0, floors: 1 });
    const args = ledgerArgs(reading, [{ date: "2026-10-25", after: 15 }], "2026-11-01");
    expect(Number(args[args.indexOf("--after") + 1])).toBeGreaterThanOrEqual(outageMin);
    expect(args.join(" ")).toMatch(/The number is a floor: 1 red streak/);
  });

  it("writes a row for an outage alone, as a floor, where it used to throw", () => {
    const episodes = mainEpisodes(
      [
        run(1, "2026-10-28T08:00:00Z", "success"),
        run(2, "2026-10-29T00:00:00Z", "failure", "2026-10-29T00:59:00Z"),
      ],
      [],
      none,
      week,
    );
    const reading = readingOf(episodes);
    expect(reading.sources.mainCi.stages.toVerified.p50Min).toBeNull();
    const args = ledgerArgs(reading, [], "2026-11-01");
    expect(args).toEqual(expect.arrayContaining(["--baseline", String(outageMin)]));
    expect(args.join(" ")).toContain("The number is a floor");
  });
});

describe("lanes: a lane total over every event its workflow starts on (#6520)", () => {
  const since = at("2026-10-27T05:00:00Z");
  const until = at("2026-11-01T00:00:00Z");
  const started = "2026-10-30T10:00:00Z";
  const reviewRun = {
    id: 77,
    event: "pull_request_review_comment",
    conclusion: "success",
    created_at: started,
    run_started_at: started,
    updated_at: "2026-10-30T10:20:00Z",
  };
  const rest = () => {
    const r = {
      calls: 0,
      api(path: string) {
        r.calls += 1;
        const hit =
          path.includes("claude.yml/runs?") && path.includes("event=pull_request_review_comment");
        return { workflow_runs: hit ? [reviewRun] : [] };
      },
      zip() {
        r.calls += 1;
        return Buffer.from("");
      },
    };
    return r;
  };
  const jobsOf = () => [{ name: "claude", lane: "claude.yml", startedAt: started, usd: 4.5 }];

  it("prices a run started by a PR review comment, instead of printing the week without it", () => {
    const out = readLanes({
      rest: rest(),
      cache: {},
      sinceMs: since,
      untilMs: until,
      maxRest: 100,
      jobsOf,
    });
    expect(out.counts.unlisted).toEqual([]);
    expect(out.rows["claude.yml"]).toEqual({ usd: 4.5, jobs: 1, unpriced: 0 });
  });

  it("lists every trigger of a lane workflow, or names it as one that carries no lane job", () => {
    // The drift this catches: a lane workflow gains a trigger, and the meter never lists its runs.
    const triggers = (file: string) => {
      const text = readFileSync(join(".github/workflows", file), "utf8");
      const block = /^on:\n((?:(?: {2}.*)?\n)+)/m.exec(text)?.[1] ?? "";
      return [...block.matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]);
    };
    for (const file of LANE_WORKFLOWS as string[]) {
      const events = triggers(file);
      expect(events.length).toBeGreaterThan(0);
      const missed = events.filter((e) => !(LANE_EVENTS.has(e) || NON_LANE_EVENTS.has(e)));
      expect({ file, missed }).toEqual({ file, missed: [] });
    }
  });
});

describe("dial-spend: a row the read did not wholly reach reads at least", () => {
  const EVENTS = [
    { event: "labeled", label: "work-mode:normal", at: "2026-09-30T04:19:34Z" },
    { event: "unlabeled", label: "work-mode:normal", at: "2026-10-15T04:37:17Z" },
    { event: "labeled", label: "work-mode:conserve", at: "2026-10-15T04:37:17Z" },
    { event: "unlabeled", label: "work-mode:conserve", at: "2026-10-18T06:14:42Z" },
    { event: "labeled", label: "work-mode:normal", at: "2026-10-18T06:14:42Z" },
  ];
  const windows = dialWindows(EVENTS, {
    since: at("2026-10-15T00:00:00Z"),
    until: at("2026-10-19T00:00:00Z"),
  });
  const leg = (iso: string, usd: number | null, lane = "research", run = 1): Leg => ({
    lane,
    at: iso,
    usd,
    run,
  });

  it("a leg with no price: counts it, sums only the priced ones, and marks the row a floor (#6693)", () => {
    const rows = summarize(
      [leg("2026-10-16T01:00:00Z", 2), leg("2026-10-16T02:00:00Z", null)],
      windows,
    );
    const row = rows.find((r) => r.position === "conserve" && r.lane === "research");
    expect(row?.legs).toBe(2);
    expect(row?.unpriced).toBe(1);
    // $2 is what the priced leg cost, not what the row spent: the table must not print it as exact.
    expect(row?.usd).toBe(2);
    expect(row?.usdPerLeg).toBe(2);
    const table = renderTable(rows);
    expect(table).toMatch(/\| conserve \| research \|[^\n]*\| \$2\.00 \| at least \$0\.03 \|/);
    expect(table).toContain("Legs with no price: conserve research 1. Those rows are floors.");
    // A row with every leg priced stays exact.
    expect(table).toMatch(/\| conserve \| plan \|[^\n]*\| \$0\.00 \|$/m);
    expect(table).not.toContain("Unread runs");
  });

  it("names unpriced legs and unread runs on separate lines when a reading has both (#6693)", () => {
    const rows = summarize([leg("2026-10-18T07:00:00Z", null, "feedback")], windows, {
      unread: [{ at: "2026-10-16T05:00:00Z" }],
    });
    const notes = renderTable(rows).split("\n\n")[1]?.split("\n");
    expect(notes).toEqual([
      "Unread runs: conserve 1. Those rows are floors.",
      "Legs with no price: normal feedback 1. Those rows are floors.",
    ]);
    expect(renderTable(rows)).toMatch(
      /\| normal \| feedback \|[^\n]*\| no price \| at least \$0\.00 \|/,
    );
  });

  it("a day whose listing went unread floors every position open that day, noon or not (#6535)", () => {
    // The span opens at 15:00, after the missed day's noon stamp: that stamp falls in no window,
    // so on main it floored no row and the table printed exact figures.
    const late = dialWindows(EVENTS, {
      since: at("2026-10-16T15:00:00Z"),
      until: at("2026-10-19T00:00:00Z"),
    });
    const missed = [{ at: "2026-10-16T12:00:00Z", day: "2026-10-16" }];
    const rows = summarize([leg("2026-10-16T16:00:00Z", 2)], late, { unread: missed });
    expect(rows.find((r) => r.position === "conserve")?.unreadRuns).toBe(1);
    // Only the position open that day: normal began on the 18th.
    expect(rows.find((r) => r.position === "normal")?.unreadRuns).toBe(0);
    const table = renderTable(rows);
    expect(table).toMatch(/\| conserve \| research \|[^\n]*\| at least \$/);
    expect(table).toContain("Unread runs: conserve 1. Those rows are floors.");

    // A day that spans two positions floors both.
    const both = summarize([], late, {
      unread: [{ at: "2026-10-18T12:00:00Z", day: "2026-10-18" }],
    });
    expect(
      both.filter((r) => r.lane === "research").map((r) => [r.position, r.unreadRuns]),
    ).toEqual([
      ["conserve", 1],
      ["normal", 1],
    ]);
  });
});
