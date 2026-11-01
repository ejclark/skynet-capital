import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain .mjs script, no declarations
import { oldestRelevantIndex } from "../../scripts/deploy-lag.mjs";

// "Is `main` actually deployed?" — driven through the real entrypoint, the way every other script
// spec here works, so the argument plumbing is covered too and no `.d.ts` is invented for an
// `.mjs` module. `--explain` feeds the state in as JSON instead of reading GitHub, so this runs
// offline and cannot touch the repo.
//
// PROVENANCE (2026-08-22): the feedback lane built #475, opened PR #492, passed CI and auto-merged
// — and nothing deployed. Native auto-merge lands as the identity that ARMED it, the lane armed it
// with GITHUB_TOKEN, and a GITHUB_TOKEN push starts no workflow runs. `v1.190.0` still pointed at
// 8c65f65 while `main` stood at 4f234c0. No failed job, no red check, no alert anywhere.
// A stranded deploy exits 1 on purpose, so stdout has to be read off the thrown error too.
const run = (state: unknown, ...flags: string[]): string => {
  try {
    return execFileSync("node", ["scripts/deploy-lag.mjs", "--explain", ...flags], {
      input: JSON.stringify(state),
      encoding: "utf8",
    });
  } catch (error) {
    return (error as { stdout?: string }).stdout ?? "";
  }
};

const explain = (state: unknown): { text: string; verdict: Record<string, unknown> } => ({
  text: run(state),
  verdict: JSON.parse(run(state, "--json")),
});

const RELEASED = "8c65f650000000000000000000000000000000cc";
const HEAD = "4f234c00000000000000000000000000000000bb";

/** The two commits that really were stranded, with the identity that really merged them. */
const STRANDED = [
  {
    sha: "942a85a0000000000000000000000000000000aa",
    subject: "docs(research): close out treasury-20y-bond-2026-08-19 (#491)",
    mergedBy: "github-actions[bot]",
  },
  {
    sha: HEAD,
    subject: "feat(observatory): move mission control onto the account desk (#492)",
    mergedBy: "github-actions[bot]",
  },
];

describe("deploy lag", () => {
  it("says nothing is wrong when main is the released commit", () => {
    const { text, verdict } = explain({ head: RELEASED, released: RELEASED });

    expect(verdict.lagging).toBe(false);
    expect(verdict.behind).toBe(0);
    expect(text).toContain("deploy is current");
  });

  it("catches the outage: main ahead, every commit merged by a silent token", () => {
    const { text, verdict } = explain({ head: HEAD, released: RELEASED, stranded: STRANDED });

    expect(verdict.lagging).toBe(true);
    expect(verdict.behind).toBe(2);
    expect(verdict.cause).toBe("silent-merge");
    expect(text).toContain("2 commit(s) ahead");
    expect(text).toContain("the deploy never fired");
  });

  it("names each stranded commit and who merged it", () => {
    const { text } = explain({ head: HEAD, released: RELEASED, stranded: STRANDED });

    expect(text).toContain("mission control");
    expect(text).toContain("merged by github-actions[bot]");
  });

  // The familiar cause must not be assumed. A human-merged commit that never deployed means the
  // deploy job RAN AND FAILED — a different fault with a different fix — and a detector that
  // answers "silent merge" to both would send the next reader down the wrong path.
  it("refuses to blame the token when a human merged the stranded commit", () => {
    const { text, verdict } = explain({
      head: "deadbeef",
      released: RELEASED,
      stranded: [{ sha: "deadbeef", subject: "fix: something", mergedBy: "ejclark" }],
    });

    expect(verdict.cause).toBe("unknown");
    expect(text).toContain("deploy job failed");
  });

  it("treats a mixed set as unknown — one human merge rules the token out", () => {
    const { verdict } = explain({
      head: "abc1234",
      released: RELEASED,
      stranded: [...STRANDED, { sha: "abc1234", subject: "fix: x", mergedBy: "ejclark" }],
    });

    expect(verdict.cause).toBe("unknown");
  });

  // THE FALSE POSITIVE THIS SCRIPT SHIPPED WITH, caught an hour later on the repo's own state.
  // The first cut baselined against `releases/latest`, but semantic-release makes no release for a
  // `docs:`/`chore:`/`test:` commit — so `main` sits legitimately ahead of the newest tag every time
  // one merges, and the check exited 1 on a healthy repo (`ac3cafa`, a docs commit that had already
  // deployed). The baseline is now the last SUCCESSFUL DEPLOY, which is the thing whose absence this
  // script exists to notice. A detector that cries wolf is worse than no detector.
  it("says nothing when a docs commit deployed but cut no release", () => {
    const deployed = "ac3cafa0000000000000000000000000000000dd";
    const { text, verdict } = explain({ head: deployed, released: deployed });

    expect(verdict.lagging).toBe(false);
    expect(text).toContain("deploy is current");
  });

  it("cannot decide without both ends of the comparison", () => {
    expect(explain({ head: "abc" }).verdict.lagging).toBe(false);
    expect(explain({ released: "abc" }).verdict.lagging).toBe(false);
    expect(explain({}).verdict.lagging).toBe(false);
  });

  // Exit status is the interface a CI step or a shell check reads. A lagging deploy must be a
  // failure, not a cheerful line in a log nobody scrolls to.
  it("exits non-zero when the deploy is stranded, and zero when it is current", () => {
    expect(() =>
      execFileSync("node", ["scripts/deploy-lag.mjs", "--explain"], {
        input: JSON.stringify({ head: HEAD, released: RELEASED, stranded: STRANDED }),
        stdio: "pipe",
      }),
    ).toThrow();

    expect(() =>
      execFileSync("node", ["scripts/deploy-lag.mjs", "--explain"], {
        input: JSON.stringify({ head: RELEASED, released: RELEASED }),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  // The bots app's half, post deploy-split: skynet-capital-bots deploys selectively, so "behind
  // main" is healthy until the commits since its last REAL deploy include a bot-relevant one.
  describe("bots app lag (deploy split)", () => {
    const current = { head: HEAD, released: HEAD };

    it("stays silent on pre-split state — fixtures without bots fields keep their exact output", () => {
      const { text, verdict } = explain(current);
      expect(text).not.toContain("bots app");
      expect(verdict.bots).toBeUndefined();
    });

    it("calls docs-only drift healthy — that is the split working as designed", () => {
      const { text, verdict } = explain({
        ...current,
        botsReleased: RELEASED,
        botsChanged: ["docs/IDEAS.md", "docs/research/x.md"],
      });
      expect((verdict.bots as { lagging: boolean }).lagging).toBe(false);
      expect(text).toContain("bots app is current");
    });

    it("flags bot-relevant commits past the last bots deploy, and exits 1", () => {
      const state = {
        ...current,
        botsReleased: RELEASED,
        botsChanged: ["src/domain/types.ts", "docs/IDEAS.md"],
      };
      const { text, verdict } = explain(state);
      expect((verdict.bots as { lagging: boolean }).lagging).toBe(true);
      expect(text).toContain("bots app is STALE");
      expect(text).toContain("force_bots_deploy");
      expect(() =>
        execFileSync("node", ["scripts/deploy-lag.mjs", "--explain"], {
          input: JSON.stringify(state),
          stdio: "pipe",
        }),
      ).toThrow();
    });

    it("calls a window of only rolled-back releases STALE, not 'never deployed' (#5955)", () => {
      const r = explain({ ...current, botsReleased: "", botsChanged: [], botsRolledBack: 12 });
      expect(r.text).toContain("bots app is STALE — the last 12 bots release(s) all failed smoke");
      expect(r.verdict.bots).toMatchObject({ known: true, baseline: false, lagging: true });
    });

    it("calls a window of failed deploys STALE, and counts them beside the rolled-back ones", () => {
      const failed = explain({
        ...current,
        botsReleased: "",
        botsChanged: [],
        botsFailed: 3,
        botsRolledBack: 2,
        botsSince: "2026-10-22T16:44:52Z",
      });
      expect(failed.text).toContain(
        "bots app is STALE — the last 5 bots release(s) all failed: 3 at the deploy, 2 at smoke",
      );
      expect(failed.verdict.bots).toMatchObject({
        known: true,
        baseline: false,
        lagging: true,
        since: "2026-10-22T16:44:52Z",
      });
    });

    it("reports no-baseline and unknown as themselves, never as an alarm", () => {
      const none = explain({ ...current, botsReleased: "", botsChanged: [] });
      expect(none.text).toContain("no deploy baseline in the runs read");
      expect(none.text).toContain("state unknown");
      expect(none.text).not.toContain("bots app is current");
      const unknown = explain({ ...current, botsReleased: undefined, botsChanged: undefined });
      // JSON.stringify drops undefined keys, so this exercises the true absent-field path.
      expect(unknown.text).not.toContain("bots app");
    });
  });
});

// Degrade honestly (#3769 row 1): a missing input is a named state, never a quiet "current".
describe("deploy lag — missing inputs", () => {
  const dir = mkdtempSync(join(tmpdir(), "deploy-lag-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const cli = (args: string[], opts: { input?: string; path?: string } = {}) =>
    spawnSync(process.execPath, ["scripts/deploy-lag.mjs", ...args], {
      encoding: "utf8",
      input: opts.input ?? "",
      env: { ...process.env, ...(opts.path ? { PATH: opts.path } : {}) },
    });

  it("--explain with nothing on stdin is UNKNOWN at exit 2, not a current deploy", () => {
    const r = cli(["--explain"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("deploy-lag: UNKNOWN — --explain read no state on stdin");
    expect(r.stdout).not.toContain("deploy is current");
  });

  it("--json keeps its exit-0 contract and carries the unknown as a field", () => {
    const r = cli(["--explain", "--json"]);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ known: false });
  });

  it("an unreadable GitHub (no gh on PATH) is UNKNOWN at exit 2, not a stack trace at exit 1", () => {
    const empty = join(dir, "empty");
    mkdirSync(empty);
    const r = cli([], { path: empty });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("deploy-lag: UNKNOWN — could not read GitHub state");
  });

  it("names the fallback when the job scan fails — bots state UNKNOWN, dashboard still judged", () => {
    const bin = join(dir, "bin");
    mkdirSync(bin);
    const fake = join(bin, "gh");
    writeFileSync(
      fake,
      [
        "#!/bin/sh",
        'case "$*" in',
        `  *commits/main*) echo '{"sha":"${HEAD}"}' ;;`,
        `  *status=success*) echo '{"workflow_runs":[{"head_sha":"${HEAD}"}]}' ;;`,
        '  *pipeline.yml/runs*) echo "HTTP 502" >&2; exit 1 ;;',
        "  *) exit 1 ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(fake, 0o755);
    const r = cli([], { path: bin });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("deploy is current");
    expect(r.stdout).toContain("bots app: state unknown");
    expect(r.stderr).toContain("· job scan failed");
    expect(r.stderr).toContain("bots state UNKNOWN");
  });

  // #5955: 16 bots releases failed smoke and rolled back while this read "bots app is current".
  it("never takes a bots release whose smoke failed, or is still running, as the baseline", () => {
    const bin = join(dir, "bin-smoke");
    mkdirSync(bin);
    const bots = (smoke: string) =>
      `{"name":"release · deploy","conclusion":"success"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"success"},{"name":"Smoke test the bots release","conclusion":"${smoke}"}]}`;
    writeFileSync(
      join(bin, "gh"),
      [
        "#!/bin/sh",
        'case "$*" in',
        `  *commits/main*) echo '{"sha":"${HEAD}"}' ;;`,
        `  *pipeline.yml/runs*) echo '{"workflow_runs":[{"id":3,"head_sha":"${HEAD}"},{"id":2,"head_sha":"${HEAD}"},{"id":1,"head_sha":"${RELEASED}"}]}' ;;`,
        `  *runs/3/jobs*) echo '{"jobs":[${bots("null").replace('"null"', "null")}]}' ;;`,
        `  *runs/2/jobs*) echo '{"jobs":[${bots("failure")}]}' ;;`,
        `  *runs/1/jobs*) echo '{"jobs":[${bots("success")}]}' ;;`,
        `  *compare/${RELEASED}...${HEAD}*) echo '{"files":[{"filename":"src/autonomous/run.ts"}]}' ;;`,
        "  *) exit 1 ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(join(bin, "gh"), 0o755);
    const r = cli([], { path: bin });
    expect(r.stdout).toContain("deploy is current");
    expect(r.stdout).toContain(`since its last deploy (${RELEASED.slice(0, 7)})`);
    expect(r.stdout).not.toContain("bots app is current");
    expect(r.stderr).toContain(
      "1 newer bots release(s) failed smoke and rolled back (latest 4f234c0)",
    );
  });
});

// #6470: scripts/fitness.mjs judges a lag by how long its oldest undeployed commit has waited, so
// each half dates its lag. The bots half finds that commit by halving over prefix compares.
describe("deploy lag — when it began", () => {
  const dir = mkdtempSync(join(tmpdir(), "deploy-lag-since-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const cli = (args: string[], path: string) =>
    spawnSync(process.execPath, ["scripts/deploy-lag.mjs", ...args], {
      encoding: "utf8",
      env: { ...process.env, PATH: path },
    });

  it("dates the dashboard lag from the oldest stranded commit, whatever order they arrive in", () => {
    const { verdict } = explain({
      head: HEAD,
      released: RELEASED,
      stranded: [
        { ...STRANDED[1], committedAt: "2026-10-22T18:00:00Z" },
        { ...STRANDED[0], committedAt: "2026-10-22T17:10:00Z" },
      ],
    });
    expect(verdict.since).toBe("2026-10-22T17:10:00Z");
    expect(explain({ head: RELEASED, released: RELEASED }).verdict.since).toBeUndefined();
    // Undated stranded commits give no date: the reader must say unknown, not young.
    expect(
      explain({ head: HEAD, released: RELEASED, stranded: STRANDED }).verdict.since,
    ).toBeUndefined();
  });

  it("dates the bots lag only when it is lagging, including a window of rolled-back releases", () => {
    const current = { head: HEAD, released: HEAD };
    const stale = explain({
      ...current,
      botsReleased: RELEASED,
      botsChanged: ["src/domain/types.ts"],
      botsSince: "2026-10-22T17:10:00Z",
    });
    expect(stale.verdict.bots).toMatchObject({ lagging: true, since: "2026-10-22T17:10:00Z" });
    const fine = explain({
      ...current,
      botsReleased: RELEASED,
      botsChanged: ["docs/IDEAS.md"],
      botsSince: "2026-10-22T17:10:00Z",
    });
    expect((fine.verdict.bots as { since?: string }).since).toBeUndefined();
    const dark = explain({
      ...current,
      botsReleased: "",
      botsChanged: [],
      botsRolledBack: 3,
      botsSince: "2026-10-22T16:44:52Z",
    });
    expect(dark.verdict.bots).toMatchObject({ lagging: true, since: "2026-10-22T16:44:52Z" });
  });

  it("halves to the oldest commit that made the range bot-relevant", () => {
    const first = (n: number, from: number) => oldestRelevantIndex(n, (i: number) => i >= from);
    expect(first(5, 2)).toBe(2);
    expect(first(5, 0)).toBe(0);
    expect(first(5, 4)).toBe(4);
    expect(first(1, 0)).toBe(0);
  });

  // Live wiring: three commits past the last bots deploy, the middle one touching the runtime.
  // The prefix compares say: up to c1 docs only, up to c2 and up to c3 bot-relevant.
  it("reads the bots lag date through prefix compares, about log2(n) of them", () => {
    const bin = join(dir, "bin-since");
    mkdirSync(bin);
    const c = (n: number, date: string) =>
      `{"sha":"c${n}","commit":{"message":"x","committer":{"date":"${date}"}},"author":{"login":"ejclark"}}`;
    const commits = `[${c(1, "2026-10-22T17:00:00Z")},${c(2, "2026-10-22T17:10:00Z")},${c(3, "2026-10-22T17:20:00Z")}]`;
    const landed = `{"jobs":[{"name":"release · deploy","conclusion":"success"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"success"},{"name":"Smoke test the bots release","conclusion":"success"}]}]}`;
    writeFileSync(
      join(bin, "gh"),
      [
        "#!/bin/sh",
        `echo "$*" >> "${bin}/calls"`,
        'case "$*" in',
        `  *commits/main*) echo '{"sha":"c3"}' ;;`,
        `  *pipeline.yml/runs*) echo '{"workflow_runs":[{"id":1,"head_sha":"${RELEASED}","created_at":"2026-10-22T16:00:00Z"}]}' ;;`,
        `  *runs/1/jobs*) echo '${landed}' ;;`,
        `  *compare/*...c1) echo '{"commits":${commits},"files":[{"filename":"docs/IDEAS.md"}]}' ;;`,
        `  *compare/*) echo '{"commits":${commits},"files":[{"filename":"docs/IDEAS.md"},{"filename":"src/domain/types.ts"}]}' ;;`,
        "  *) exit 1 ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(join(bin, "gh"), 0o755);
    const r = cli(["--json"], `${bin}:${process.env.PATH}`);
    expect(r.status).toBe(0);
    const verdict = JSON.parse(r.stdout);
    expect(verdict.bots).toMatchObject({ lagging: true, since: "2026-10-22T17:10:00Z" });
    expect(verdict.since).toBe("2026-10-22T17:00:00Z");
    const compares = readFileSync(join(bin, "calls"), "utf8")
      .split("\n")
      .filter((l) => l.includes("compare/"));
    // One for the range, one for the dashboard's stranded list, and at most two prefix reads.
    expect(compares.length).toBeLessThanOrEqual(4);
  });
});

// Post-merge audit, 2026-11-01: which runs the bots baseline is read from. Replies come from files,
// so a run list can be as long as the real one, whose 40 runs are about 700KB.
describe("deploy lag — which runs it reads", () => {
  const dir = mkdtempSync(join(tmpdir(), "deploy-lag-runs-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const bots = (deploy: string, smoke?: string) =>
    JSON.stringify({
      jobs: [
        { name: "release · deploy", conclusion: "success" },
        {
          name: "release · deploy bots",
          steps: [
            { name: "Deploy bots", conclusion: deploy },
            ...(smoke ? [{ name: "Smoke test the bots release", conclusion: smoke }] : []),
          ],
        },
      ],
    });
  type Run = { event?: string; sha?: string; jobs: string; at?: string };

  /** A gh stub over these runs, newest first. Only a request for the window's width is answered. */
  function read(name: string, runs: Run[], { pad = 0 } = {}) {
    const bin = join(dir, name);
    mkdirSync(bin);
    const rows = runs.map((run, i) => ({
      id: i + 1,
      event: run.event ?? "push",
      head_sha: run.sha ?? (i === 0 ? HEAD : `old${i}`),
      created_at: run.at ?? "2026-11-01T06:00:00Z",
      padding: "x".repeat(pad),
    }));
    writeFileSync(join(bin, "runs-all"), JSON.stringify({ workflow_runs: rows }));
    writeFileSync(
      join(bin, "runs-push"),
      JSON.stringify({ workflow_runs: rows.filter((r) => r.event === "push") }),
    );
    runs.forEach((run, i) => {
      writeFileSync(join(bin, `jobs-${i + 1}`), run.jobs);
    });
    writeFileSync(
      join(bin, "gh"),
      [
        "#!/usr/bin/env bash",
        'case "$*" in',
        `  *commits/main*) echo '{"sha":"${HEAD}"}' ;;`,
        `  *pipeline.yml/runs*per_page=40*) if [[ "$*" == *event=push* ]]; then cat "${bin}/runs-push"; else cat "${bin}/runs-all"; fi ;;`,
        '  *pipeline.yml/runs*) echo "HTTP 400: wrong width" >&2; exit 1 ;;',
        `  *compare/*) echo '{"commits":[{"sha":"${HEAD}","commit":{"message":"x","committer":{"date":"2026-11-01T06:37:38Z"}},"author":{"login":"ejclark"}}],"files":[{"filename":"scripts/fitness.mjs"}]}' ;;`,
        `  *) [[ "$*" =~ runs/([0-9]+)/jobs ]] && cat "${bin}/jobs-\${BASH_REMATCH[1]}" ;;`,
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(join(bin, "gh"), 0o755);
    const res = spawnSync(process.execPath, ["scripts/deploy-lag.mjs", "--json"], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });
    return { ...res, verdict: JSON.parse(res.stdout) };
  }

  it("takes a landing by catch-up's dispatch as the bots baseline, not only a push's", () => {
    const { verdict } = read("dispatch", [
      { event: "workflow_dispatch", jobs: bots("success", "success") },
      { jobs: bots("skipped") },
      { sha: RELEASED, jobs: bots("success", "success") },
    ]);
    expect(verdict.bots).toEqual({ known: true, baseline: true, lagging: false });
  });

  it("does not take a dispatch that failed, or rolled back, as a landing", () => {
    for (const [name, dispatched] of [
      ["dispatch-failed", bots("failure")],
      ["dispatch-rolled", bots("success", "failure")],
    ] as const) {
      const { verdict } = read(name, [
        { event: "workflow_dispatch", jobs: dispatched },
        { sha: RELEASED, jobs: bots("success", "success") },
      ]);
      expect(verdict.bots).toMatchObject({ baseline: true, lagging: true });
    }
  });

  // The longest stretch of pushes touching no bots path from 2026-08-27 to 11-01 was 30, and the job
  // reads stop at the first landing, so a healthy tick spends nothing on the wider window.
  it("finds a landing further back than a burst of pushes that never touch the bots", () => {
    const quiet = Array.from({ length: 35 }, () => ({ jobs: bots("skipped") }));
    const { verdict } = read("deep", [
      ...quiet,
      { sha: RELEASED, jobs: bots("success", "success") },
    ]);
    expect(verdict.bots).toMatchObject({ known: true, baseline: true });
  });

  it("reads a reply past node's default output limit rather than going blind on it", () => {
    const quiet = Array.from({ length: 40 }, () => ({ jobs: bots("skipped") }));
    const { verdict, stderr } = read("large", quiet, { pad: 40_000 });
    expect(stderr).not.toContain("job scan failed");
    expect(verdict.bots.known).toBe(true);
  });

  it("calls a window of failed deploys lagging, dated from the oldest failure it read", () => {
    const failed = (at: string) => ({ jobs: bots("failure"), at });
    const { verdict } = read("outage", [
      { jobs: bots("skipped"), at: "2026-11-01T09:00:00Z" },
      failed("2026-11-01T08:00:00Z"),
      failed("2026-11-01T07:00:00Z"),
    ]);
    expect(verdict.bots).toEqual({
      known: true,
      baseline: false,
      lagging: true,
      reason: "the last 2 bots release(s) all failed: 2 at the deploy, 0 at smoke",
      since: "2026-11-01T07:00:00Z",
    });
  });

  it("does not count a cancelled deploy as a failed one", () => {
    const { verdict } = read("cancelled", [{ jobs: bots("cancelled") }]);
    expect(verdict.bots).toEqual({ known: true, baseline: false, lagging: false });
  });

  it("says no baseline when every run read skipped the bots deploy", () => {
    const { verdict } = read("skips", [{ jobs: bots("skipped") }, { jobs: bots("skipped") }]);
    expect(verdict.bots).toEqual({ known: true, baseline: false, lagging: false });
  });
});
