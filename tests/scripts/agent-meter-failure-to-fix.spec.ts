import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { defectsFromIssues, introducedIn } from "../../scripts/agent-meter/defects.mjs";
import {
  auditEpisodes,
  closersIn,
  contractEpisodes,
  formatStage,
  LOG_FORMAT,
  ledgerArgs,
  mainEpisodes,
  parseCommitLog,
  stagesOf,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/failure-to-fix.mjs";

// THE ONE OUTCOME NOTHING MEASURED (#6470). Eric asked for faster verification and problem
// resolution, and docs/process/PILLARS.md calls detection lag the measure of the measures, yet every
// stored number stopped at the merge. The three stages are read per failure and by source, and the
// rule these specs hold hardest is that a missing link reads unknown: a lag of 0 from a missing
// filing time would read as the best number on the page.

const MIN = 60000;
const at = (iso: string) => Date.parse(iso);
const window = { sinceMs: at("2026-10-01T00:00:00Z"), untilMs: at("2026-11-01T00:00:00Z") };

const commit = (subject: string, body: string, iso: string) =>
  [String(at(iso) / 1000), subject, body].join("\x1f");
const log = (...commits: string[]) => `${commits.join("\x1e\n")}\x1e\n`;

const run = (id: number, createdAt: string, conclusion: string, endedAt = createdAt) => ({
  id,
  created_at: createdAt,
  updated_at: endedAt,
  conclusion,
  failedJobs: conclusion === "failure" ? [{ job: "release · deploy bots", step: "smoke" }] : [],
});

const capsule = (
  number: number,
  createdAt: string,
  runId: number,
  closedAt: string | null = null,
  title = "[ci] Pipeline — release · deploy bots",
) => ({
  number,
  title,
  created_at: createdAt,
  closed_at: closedAt,
  body: `| **Run** | [${runId}](https://example.test/runs/${runId}) |`,
});

describe("the merged commits a failure is linked through", () => {
  it("reads a squash merge's PR, its merge time, and every issue its body closes", () => {
    const commits = parseCommitLog(
      log(
        commit(
          "fix(ticket): a cancelled order reads cancel requested (#6539)",
          "## Summary\n- Closes #6529\n- fixes: #6530, and part of #6470",
          "2026-11-01T13:31:18Z",
        ),
        commit("docs: no PR number", "", "2026-11-01T13:00:00Z"),
      ),
    );
    expect(commits.mergedAtByPr.get(6539)).toBe(at("2026-11-01T13:31:18Z"));
    expect(commits.closersOf(6529)).toEqual([{ pr: 6539, at: at("2026-11-01T13:31:18Z") }]);
    expect(commits.closersOf(6530)).toEqual([{ pr: 6539, at: at("2026-11-01T13:31:18Z") }]);
    expect(commits.closersOf(6470)).toEqual([]);
  });

  it("does not read a closing word inside another word, or a bare mention, as a fix", () => {
    expect(closersIn("prefixes #12, encloses #13, mentions #14")).toEqual([]);
    expect(closersIn("Closes #1\nResolved #2\nCLOSED #3")).toEqual([1, 2, 3]);
  });

  it("asks git for the three fields the parser splits on", () => {
    expect(LOG_FORMAT).toBe("%ct%x1f%s%x1f%b%x1e");
  });
});

describe("the Introduced in cell", () => {
  it("reads every PR it names, and marks 'before #N' as a floor", () => {
    expect(introducedIn("| **Introduced in** | #6327 · `scripts/a.mjs:400` |")).toEqual({
      prs: [6327],
      floor: false,
    });
    expect(
      introducedIn("| **Introduced in** | #6036, #6089 · `a.mjs:1` · #6288 · `b.ts:2` |"),
    ).toEqual({ prs: [6036, 6089, 6288], floor: false });
    // #6529's real cell. The old field regex missed it, so a confirmed defect went uncounted.
    expect(
      introducedIn(
        "| **Introduced in** | before #6335, and it defeats that PR's outcome · `a.ts:30` |",
      ),
    ).toEqual({ prs: [6335], floor: true });
    expect(introducedIn("no such field")).toBeNull();
  });

  it("counts a 'before #N' finding as confirmed without blaming #N for it", () => {
    const issue = (cell: string) => ({
      created_at: "2026-11-01T13:00:00Z",
      body: `| **Found by** | Post-merge audit 2026-11-01; two refuters |\n| **Introduced in** | ${cell} |`,
    });
    const out = defectsFromIssues(
      [issue("before #6335, and it defeats that PR's outcome"), issue("#6327 · `a.mjs:1`")],
      at("2026-11-01T00:00:00Z"),
      at("2026-11-02T00:00:00Z"),
    );
    expect(out.confirmed).toBe(2);
    expect(out.prsWithDefect).toBe(1);
  });
});

describe("main CI: one red streak is one failure", () => {
  const closes = parseCommitLog(
    log(commit("fix(deploy): boot the bots (#900)", "Closes #50", "2026-10-10T12:30:00Z")),
  );
  const none = parseCommitLog("");

  it("reads failure, filing, fix and the first green run across one streak", () => {
    const [ep, ...rest] = mainEpisodes(
      [
        run(1, "2026-10-10T09:00:00Z", "success"),
        run(2, "2026-10-10T10:00:00Z", "failure", "2026-10-10T10:20:00Z"),
        run(3, "2026-10-10T11:00:00Z", "failure", "2026-10-10T11:20:00Z"),
        run(4, "2026-10-10T12:31:00Z", "success", "2026-10-10T13:00:00Z"),
        run(5, "2026-10-10T14:00:00Z", "success"),
      ],
      [capsule(50, "2026-10-10T10:25:00Z", 2, "2026-10-10T12:30:05Z")],
      closes,
      window,
    );
    expect(rest).toEqual([]);
    expect(ep).toMatchObject({
      id: "run 2",
      name: "release · deploy bots › smoke",
      runs: 2,
      capsule: 50,
      fix: 900,
      lagMs: 5 * MIN,
      filedToFixMs: 125 * MIN,
      toVerifiedMs: 160 * MIN,
    });
  });

  it("orders by when the run was created, so an older commit finishing late cannot end a streak", () => {
    const eps = mainEpisodes(
      [
        run(10, "2026-10-10T10:00:00Z", "failure", "2026-10-10T10:20:00Z"),
        run(9, "2026-10-10T09:00:00Z", "success", "2026-10-10T10:30:00Z"),
        run(11, "2026-10-10T11:00:00Z", "success", "2026-10-10T11:20:00Z"),
      ],
      [],
      none,
      window,
    );
    expect(eps).toHaveLength(1);
    expect(eps[0].toVerifiedMs).toBe(60 * MIN);
  });

  it("reads unknown, never zero, for a streak nobody filed", () => {
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-10T10:00:00Z", "success"),
        run(3, "2026-10-10T11:00:00Z", "failure", "2026-10-10T11:10:00Z"),
        run(4, "2026-10-10T12:00:00Z", "success", "2026-10-10T12:10:00Z"),
      ],
      [],
      none,
      window,
    );
    expect(ep.capsule).toBeNull();
    expect(ep.lagMs).toBeNull();
    expect(ep.filedToFixMs).toBeNull();
    expect(ep.toVerifiedMs).toBe(60 * MIN);
  });

  it("still times the capsule's fix when the streak went green first, and says it did", () => {
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-10T08:00:00Z", "success"),
        run(3, "2026-10-10T09:00:00Z", "failure", "2026-10-10T09:10:00Z"),
        run(4, "2026-10-10T10:00:00Z", "success", "2026-10-10T10:10:00Z"),
      ],
      [capsule(50, "2026-10-10T09:15:00Z", 3)],
      closes,
      window,
    );
    expect(ep).toMatchObject({ capsule: 50, fix: 900, greenBeforeFix: true });
    expect(ep.filedToFixMs).toBe(195 * MIN);
    expect(ep.toVerifiedMs).toBe(60 * MIN);
  });

  it("reads a streak as red on a timeout, which the repair lane never files", () => {
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-10T08:00:00Z", "success"),
        run(3, "2026-10-10T09:00:00Z", "timed_out", "2026-10-10T09:10:00Z"),
        run(4, "2026-10-10T10:00:00Z", "success", "2026-10-10T10:10:00Z"),
      ],
      [],
      none,
      window,
    );
    expect(ep.toVerifiedMs).toBe(60 * MIN);
    expect(ep.lagMs).toBeNull();
  });

  it("does not read a later run's capsule about another fault as this streak's filing", () => {
    // The bots outage: #5955 open since 10-22, and run 41121443220 late in the streak filed #6406
    // about an unread job list. Read as the filing, that was a 5.7-day detection lag.
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-25T01:00:00Z", "success"),
        run(3, "2026-10-25T02:00:00Z", "failure", "2026-10-25T02:23:00Z"),
        run(4, "2026-10-30T20:00:00Z", "failure", "2026-10-30T20:20:00Z"),
        run(5, "2026-11-01T05:00:00Z", "success", "2026-11-01T05:22:00Z"),
      ],
      [
        capsule(5955, "2026-10-22T17:31:00Z", 1, "2026-11-01T09:10:00Z"),
        capsule(
          6406,
          "2026-10-30T20:21:00Z",
          4,
          "2026-10-30T20:39:00Z",
          "[ci] Pipeline — (the failed job could not be read)",
        ),
      ],
      none,
      { sinceMs: window.sinceMs, untilMs: at("2026-11-02T00:00:00Z") },
    );
    expect(ep).toMatchObject({ capsule: 5955, recurrence: true, lagMs: null });
  });

  it("falls back to any run the capsule names when the failing job could not be read", () => {
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-10T08:00:00Z", "success"),
        { ...run(3, "2026-10-10T09:00:00Z", "failure", "2026-10-10T09:10:00Z"), failedJobs: null },
        { ...run(4, "2026-10-10T10:00:00Z", "failure", "2026-10-10T10:10:00Z"), failedJobs: null },
      ],
      [capsule(50, "2026-10-10T10:15:00Z", 4)],
      none,
      window,
    );
    expect(ep).toMatchObject({ capsule: 50, name: "unknown (job not read)", lagMs: 65 * MIN });
  });

  it("treats a streak under a capsule already open as a recurrence with no new filing time", () => {
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-10T08:00:00Z", "success"),
        run(3, "2026-10-10T09:00:00Z", "failure", "2026-10-10T09:10:00Z"),
        run(4, "2026-10-10T13:00:00Z", "success", "2026-10-10T13:10:00Z"),
      ],
      [capsule(50, "2026-10-09T09:15:00Z", 1, "2026-10-10T12:30:05Z")],
      closes,
      window,
    );
    expect(ep).toMatchObject({ capsule: 50, recurrence: true, fix: 900, lagMs: null });
    expect(ep.filedToFixMs).toBeNull();
  });

  it("does not link a capsule for another job", () => {
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-10T08:00:00Z", "success"),
        run(3, "2026-10-10T09:00:00Z", "failure", "2026-10-10T09:10:00Z"),
      ],
      [capsule(50, "2026-10-10T09:15:00Z", 1, null, "[ci] Pipeline — verify")],
      none,
      window,
    );
    expect(ep.capsule).toBeNull();
  });

  it("leaves verified unknown while main is still red", () => {
    const [ep] = mainEpisodes(
      [
        run(2, "2026-10-10T08:00:00Z", "success"),
        run(3, "2026-10-10T09:00:00Z", "failure", "2026-10-10T09:10:00Z"),
      ],
      [],
      none,
      window,
    );
    expect(ep.toVerifiedMs).toBeNull();
    expect(ep.stillRed).toBe(true);
  });

  it("does not time a streak whose first failure came before the window opened", () => {
    const [ep] = mainEpisodes(
      [
        run(3, "2026-10-10T09:00:00Z", "failure", "2026-10-10T09:10:00Z"),
        run(4, "2026-10-10T10:00:00Z", "success", "2026-10-10T10:10:00Z"),
      ],
      [],
      none,
      window,
    );
    expect(ep.startedBeforeWindow).toBe(true);
    expect(ep.toVerifiedMs).toBeNull();
  });

  it("skips cancelled runs, which say nothing about main", () => {
    const eps = mainEpisodes(
      [
        run(1, "2026-10-10T08:00:00Z", "success"),
        run(2, "2026-10-10T09:00:00Z", "failure"),
        run(3, "2026-10-10T10:00:00Z", "cancelled"),
        run(4, "2026-10-10T11:00:00Z", "failure"),
      ],
      [],
      none,
      window,
    );
    expect(eps).toHaveLength(1);
    expect(eps[0].runs).toBe(2);
  });
});

describe("[fitness] contracts", () => {
  const issue = (over = {}) => ({
    number: 6501,
    title: "[fitness] alerts-reach-owner",
    created_at: "2026-10-10T09:12:00Z",
    closed_at: null,
    state_reason: null,
    ...over,
  });

  it("gives no detection lag: the failing read files the issue, so a 0 would be a claim", () => {
    const [ep] = contractEpisodes([issue()], parseCommitLog(""), window);
    expect(ep.lagMs).toBeNull();
    expect(ep.toVerifiedMs).toBeNull();
    expect(ep.filedToFixMs).toBeNull();
  });

  it("verifies when the passing contract closes the issue, and links a fix that names it", () => {
    const commits = parseCommitLog(
      log(commit("fix(bots): x (#700)", "Closes #6501", "2026-10-10T10:12:00Z")),
    );
    const [ep] = contractEpisodes([issue({ closed_at: "2026-10-10T10:42:00Z" })], commits, window);
    expect(ep.filedToFixMs).toBe(60 * MIN);
    expect(ep.toVerifiedMs).toBe(90 * MIN);
  });

  it("leaves out PRs, blind-source issues, closed-as-not-planned verification, and other dates", () => {
    const commits = parseCommitLog("");
    expect(
      contractEpisodes(
        [
          issue({ pull_request: {} }),
          issue({ title: "[fitness] cannot read fly" }),
          issue({ title: "feat(fitness): correct first" }),
          issue({ created_at: "2026-09-10T09:12:00Z" }),
        ],
        commits,
        window,
      ),
    ).toEqual([]);
    const [dropped] = contractEpisodes(
      [issue({ closed_at: "2026-10-10T10:42:00Z", state_reason: "not_planned" })],
      commits,
      window,
    );
    expect(dropped.toVerifiedMs).toBeNull();
  });
});

describe("post-merge audit findings: the time a defect sat on main", () => {
  const finding = (number: number, introduced: string, created: string, over = {}) => ({
    number,
    created_at: created,
    closed_at: "2026-11-01T13:31:20Z",
    state_reason: "completed",
    body: `| **Found by** | Post-merge audit; two refuters |\n| **Introduced in** | ${introduced} |`,
    ...over,
  });

  it("runs from the Introduced in PR's merge to the fix's merge (#6530's shape)", () => {
    const commits = parseCommitLog(
      log(
        commit("fix(moneypenny): a slice (#6537)", "- Closes #6530", "2026-11-01T13:31:18Z"),
        commit("feat(moneypenny): continuation (#6327)", "", "2026-10-27T01:00:00Z"),
      ),
    );
    const [ep] = auditEpisodes(
      [finding(6530, "#6327 · `a.mjs:400`", "2026-11-01T13:10:03Z")],
      commits,
      { sinceMs: window.sinceMs, untilMs: at("2026-11-02T00:00:00Z") },
    );
    expect(ep).toMatchObject({ id: "#6530", fix: 6537, floor: false });
    expect(ep.lagMs).toBe(at("2026-11-01T13:10:03Z") - at("2026-10-27T01:00:00Z"));
    expect(ep.filedToFixMs).toBe(at("2026-11-01T13:31:18Z") - at("2026-11-01T13:10:03Z"));
    expect(ep.toVerifiedMs).toBe(at("2026-11-01T13:31:18Z") - at("2026-10-27T01:00:00Z"));
  });

  it("starts at the earliest PR the cell names, since the defect existed from that merge", () => {
    const commits = parseCommitLog(
      log(
        commit("feat: b (#6089)", "", "2026-10-20T00:00:00Z"),
        commit("feat: a (#6036)", "", "2026-10-10T00:00:00Z"),
      ),
    );
    const [ep] = auditEpisodes(
      [finding(1, "#6036, #6089", "2026-10-21T00:00:00Z")],
      commits,
      window,
    );
    expect(ep.lagMs).toBe(11 * 24 * 60 * MIN);
  });

  it("marks 'before #N' as a floor: the defect sat at least that long", () => {
    const commits = parseCommitLog(log(commit("feat: a (#6335)", "", "2026-10-20T00:00:00Z")));
    const [ep] = auditEpisodes(
      [finding(6529, "before #6335, and it defeats", "2026-10-21T00:00:00Z")],
      commits,
      window,
    );
    expect(ep.floor).toBe(true);
    expect(ep.lagMs).toBe(24 * 60 * MIN);
  });

  it("reads unknown when the PR is not in the log, or nothing closed the finding", () => {
    const [ep] = auditEpisodes(
      [finding(1, "#6036", "2026-10-21T00:00:00Z")],
      parseCommitLog(""),
      window,
    );
    expect(ep.lagMs).toBeNull();
    expect(ep.filedToFixMs).toBeNull();
    expect(ep.toVerifiedMs).toBeNull();
  });

  it("leaves out a PR that quotes the field, and an issue without both fields", () => {
    expect(
      auditEpisodes(
        [
          finding(1, "#6036", "2026-10-21T00:00:00Z", { pull_request: {} }),
          finding(2, "#6036", "2026-10-21T00:00:00Z", { body: "**Introduced in** | #1" }),
        ],
        parseCommitLog(""),
        window,
      ),
    ).toEqual([]);
  });
});

describe("the three stages of a source", () => {
  it("gives p50 and p90 over the known spans and counts the unknown ones", () => {
    const stages = stagesOf([
      { lagMs: 10 * MIN, filedToFixMs: null, toVerifiedMs: 20 * MIN },
      { lagMs: 30 * MIN, filedToFixMs: null, toVerifiedMs: 40 * MIN },
      { lagMs: null, filedToFixMs: null, toVerifiedMs: null },
    ]);
    expect(stages.detectionLag).toEqual({ n: 2, unknown: 1, p50Min: 30, p90Min: 30 });
    expect(stagesOf([{ lagMs: 14000 }]).detectionLag.p50Min).toBe(0.23);
    expect(stages.filedToFix).toEqual({ n: 0, unknown: 3, p50Min: null, p90Min: null });
  });

  it("prints unknown, never zero, when no failure in the source has the link", () => {
    expect(formatStage("detection lag", { n: 0, unknown: 3, p50Min: null, p90Min: null })).toBe(
      "detection lag: unknown (no failure of 3 has the link)",
    );
    expect(formatStage("detection lag", { n: 2, unknown: 1, p50Min: 30, p90Min: 150 })).toBe(
      "detection lag: p50 30 min, p90 2.5h (n=2, 1 unknown)",
    );
    expect(formatStage("detection lag", { n: 1, unknown: 0, p50Min: 4320, p90Min: 4320 })).toBe(
      "detection lag: p50 3.0d, p90 3.0d (n=1)",
    );
    expect(formatStage("lag", { n: 1, unknown: 0, p50Min: 0.23, p90Min: 0.23 })).toBe(
      "lag: p50 14 s, p90 14 s (n=1)",
    );
    expect(formatStage("x", { n: 0, unknown: 0, p50Min: null, p90Min: null })).toBe(
      "x: unknown (no failure in the window)",
    );
  });
});

describe("the ledger row", () => {
  const reading = {
    window: { until: "2026-11-01T00:00:00Z", hours: 720 },
    sources: {
      mainCi: {
        stages: {
          toVerified: { n: 14, unknown: 1, p50Min: 42, p90Min: 300 },
          detectionLag: { n: 2, unknown: 12, p50Min: 4, p90Min: 9 },
          filedToFix: { n: 0, unknown: 14, p50Min: null, p90Min: null },
        },
      },
      contracts: {
        stages: {
          toVerified: { n: 0, unknown: 1, p50Min: null, p90Min: null },
          detectionLag: { n: 0, unknown: 1, p50Min: null, p90Min: null },
          filedToFix: { n: 0, unknown: 1, p50Min: null, p90Min: null },
        },
      },
      audit: {
        stages: {
          toVerified: { n: 20, unknown: 4, p50Min: 3000, p90Min: 9000 },
          detectionLag: { n: 20, unknown: 4, p50Min: 2900, p90Min: 8000 },
          filedToFix: { n: 20, unknown: 4, p50Min: 20, p90Min: 140 },
        },
      },
    },
  };

  it("writes a baseline with its worth when the loop has no rows, and an iteration after", () => {
    const first = ledgerArgs(reading, [], "2026-11-01");
    expect(first).toEqual(expect.arrayContaining(["--baseline", "42", "--worth"]));
    expect(first.join(" ")).toMatch(/audit.*p50 2\.1d/);
    expect(first.join(" ")).toMatch(/contracts.*unknown/);
    const next = ledgerArgs(reading, [{ date: "2026-10-25", after: 50 }], "2026-11-01");
    expect(next).toEqual(expect.arrayContaining(["--after", "42", "--usd", "unknown"]));
    expect(next).not.toContain("--baseline");
  });

  it("refuses to write a number that is not there, and a second row on one date", () => {
    const blank = {
      ...reading,
      sources: {
        ...reading.sources,
        mainCi: {
          stages: {
            ...reading.sources.mainCi.stages,
            toVerified: { n: 0, unknown: 3, p50Min: null, p90Min: null },
          },
        },
      },
    };
    expect(() => ledgerArgs(blank, [], "2026-11-01")).toThrow(/no main CI reading/);
    expect(() => ledgerArgs(reading, [{ date: "2026-11-01", after: 50 }], "2026-11-01")).toThrow(
      /already has a row/,
    );
  });
});

// The wiring: the CLI end to end with a fake `gh` on PATH and a real temp git repo, because a run
// of pure functions alone misses the format string, the search queries and the ledger write.
describe("npm run meter -- --failure-to-fix", () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "agent-meter-ftf-"));
    const fixtures = join(dir, "fixtures");
    mkdirSync(fixtures);
    mkdirSync(join(dir, "bin"));
    mkdirSync(join(dir, "repo"));
    const git = (args: string[], date?: string) =>
      execFileSync("git", args, {
        cwd: join(dir, "repo"),
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "t",
          GIT_AUTHOR_EMAIL: "t@example.test",
          GIT_COMMITTER_NAME: "t",
          GIT_COMMITTER_EMAIL: "t@example.test",
          ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}),
        },
      });
    git(["init", "-q", "-b", "main"]);
    const land = (message: string, date: string) =>
      git(["-c", "commit.gpgsign=false", "commit", "-q", "--allow-empty", "-m", message], date);
    land("feat: the defect lands (#6327)", "2026-10-27T01:00:00Z");
    land("fix: the defect goes (#6537)\n\n- Closes #6530\n- Closes #60", "2026-10-30T13:31:18Z");
    git(["update-ref", "refs/remotes/origin/main", "HEAD"]);

    writeFileSync(
      join(fixtures, "pipeline.json"),
      JSON.stringify({
        workflow_runs: [
          {
            id: 32,
            event: "push",
            head_branch: "main",
            created_at: "2026-10-30T13:32:00Z",
            run_started_at: "2026-10-30T13:32:00Z",
            updated_at: "2026-10-30T13:50:00Z",
            conclusion: "success",
          },
          {
            id: 31,
            event: "push",
            head_branch: "main",
            created_at: "2026-10-30T12:00:00Z",
            run_started_at: "2026-10-30T12:00:00Z",
            updated_at: "2026-10-30T12:20:00Z",
            conclusion: "failure",
          },
          {
            id: 30,
            event: "push",
            head_branch: "main",
            created_at: "2026-10-30T11:00:00Z",
            run_started_at: "2026-10-30T11:00:00Z",
            updated_at: "2026-10-30T11:20:00Z",
            conclusion: "success",
          },
        ],
      }),
    );
    writeFileSync(
      join(fixtures, "run31-jobs.json"),
      JSON.stringify({
        jobs: [
          {
            name: "release · deploy bots",
            conclusion: "failure",
            steps: [{ name: "smoke", conclusion: "failure" }],
          },
        ],
      }),
    );
    writeFileSync(
      join(fixtures, "capsules.json"),
      JSON.stringify({
        items: [
          {
            number: 60,
            title: "[ci] Pipeline — release · deploy bots",
            created_at: "2026-10-30T12:25:00Z",
            closed_at: "2026-10-30T13:31:20Z",
            state_reason: "completed",
            body: "| **Run** | [31](https://example.test/31) |",
          },
          {
            number: 61,
            title: "[ci] Moneypenny Events — route",
            created_at: "2026-10-30T12:25:00Z",
            closed_at: null,
            body: "| **Run** | [99](https://example.test/99) |",
          },
        ],
      }),
    );
    writeFileSync(
      join(fixtures, "fitness.json"),
      JSON.stringify({
        items: [
          {
            number: 6501,
            title: "[fitness] alerts-reach-owner",
            created_at: "2026-10-30T09:12:00Z",
            closed_at: null,
            state_reason: null,
          },
        ],
      }),
    );
    writeFileSync(
      join(fixtures, "audit.json"),
      JSON.stringify({
        items: [
          {
            number: 6530,
            created_at: "2026-10-30T13:10:03Z",
            closed_at: "2026-10-30T13:31:20Z",
            state_reason: "completed",
            body: "| **Found by** | Post-merge audit |\n| **Introduced in** | #6327 · `a.mjs:400` |",
          },
        ],
      }),
    );
    writeFileSync(
      join(dir, "bin", "gh"),
      [
        "#!/bin/bash",
        `F="${fixtures}"`,
        'for p in "$@"; do :; done',
        'echo "$p" >> "$F/calls.log"',
        'case "$p" in',
        '  *pipeline.yml/runs*) cat "$F/pipeline.json" ;;',
        '  */actions/runs/31/jobs*) cat "$F/run31-jobs.json" ;;',
        '  search/issues*label%3Aci-failure*) cat "$F/capsules.json" ;;',
        '  search/issues*%5Bfitness%5D*) cat "$F/fitness.json" ;;',
        '  search/issues*Introduced*) cat "$F/audit.json" ;;',
        '  *) echo "fake gh: no route for $p" >&2; exit 1 ;;',
        "esac",
      ].join("\n"),
    );
    chmodSync(join(dir, "bin", "gh"), 0o755);
    env = {
      ...process.env,
      PATH: `${join(dir, "bin")}:${process.env.PATH}`,
      AGENT_RUNS_DIR: join(dir, "runs"),
      AGENT_GIT_DIR: join(dir, "repo"),
    };
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const meter = (...extra: string[]) =>
    execFileSync(
      "node",
      [
        "scripts/agent-meter.mjs",
        "--failure-to-fix",
        "--since",
        "2026-10-27T05:00:00Z",
        "--until",
        "2026-11-01T00:00:00Z",
        ...extra,
      ],
      { cwd: process.cwd(), encoding: "utf8", env },
    );

  it("links a run, a capsule, a fix and a green run through the real format string", () => {
    const reading = JSON.parse(meter("--json"));
    expect(reading.sources.mainCi.episodes).toEqual([
      expect.objectContaining({
        id: "run 31",
        name: "release · deploy bots › smoke",
        capsule: 60,
        fix: 6537,
        lagMs: 5 * MIN,
        filedToFixMs: at("2026-10-30T13:31:18Z") - at("2026-10-30T12:25:00Z"),
        toVerifiedMs: 90 * MIN,
      }),
    ]);
    expect(reading.sources.mainCi.otherWorkflowCapsules).toBe(1);
    expect(reading.sources.contracts.stages.detectionLag.p50Min).toBeNull();
    expect(reading.sources.audit.episodes[0]).toMatchObject({ id: "#6530", fix: 6537 });
    expect(reading.sources.audit.stages.toVerified.n).toBe(1);
    expect(reading.rest.calls).toBeGreaterThan(0);
    expect(reading.commits).toBe("origin/main");
  });

  it("spends a job read once, then reads it from the meter's cache", () => {
    const callsOf = (log: string) => log.split("\n").filter((l) => l.includes("/jobs")).length;
    meter("--json");
    const calls = readFileSync(join(dir, "fixtures", "calls.log"), "utf8");
    expect(callsOf(calls)).toBe(1);
  });

  it("prints every stage by source, with unknown spelled out and its REST count", () => {
    const text = meter();
    expect(text).toMatch(/main CI, [^\n]*\n\s+detection lag: p50 5 min, p90 5 min \(n=1\)/);
    expect(text).toMatch(/\[fitness\] contracts[^\n]*\n\s+detection lag: unknown/);
    expect(text).toMatch(/post-merge audit[^\n]*\n\s+detection lag: p50 3\.5d/);
    expect(text).toMatch(/run 31 .*#60/);
    expect(text).toMatch(/rest calls this run: \d+/);
  });

  it("writes one ledger row a date through the ledger's own command", () => {
    const ledger = join(dir, "ledger");
    const out = meter("--write-ledger", "--ledger", ledger, "--date", "2026-11-01");
    expect(out).toMatch(/failure-to-verified-main-ci/);
    const [row] = readFileSync(join(ledger, "failure-to-verified-main-ci.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(row).toMatchObject({ date: "2026-11-01", before: 90, after: 90 });
    expect(row.worth).toBeGreaterThan(0);
    expect(row.changed).toMatch(/audit/);
    expect(() =>
      execFileSync(
        "node",
        [
          "scripts/agent-meter.mjs",
          "--failure-to-fix",
          "--since",
          "2026-10-27T05:00:00Z",
          "--until",
          "2026-11-01T00:00:00Z",
          "--write-ledger",
          "--ledger",
          ledger,
          "--date",
          "2026-11-01",
        ],
        { cwd: process.cwd(), encoding: "utf8", env, stdio: "pipe" },
      ),
    ).toThrow(/already has a row/);
  });
});
