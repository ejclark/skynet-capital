import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  CONTRACTS,
  HOMES,
  judgeAlertReach,
  judgeDeploys,
  judgeMachine,
  judgeStamp,
  reportActions,
  whereAmI,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness.mjs";

// #6470. The judges are pure and seeded below; the wiring (what fly and gh are asked, what the
// script does with a bad reply, a hung read, a refused write, and where it writes at all) is driven
// through the real entrypoint against stub binaries that record their arguments, because a spec
// that only exercised the judges caught 0 of 15 deliberate bugs in the probes and the wiring.
//
// Graded blind: tests/scripts/fixtures/fitness-heldout-bugs.json holds 30 deliberate bugs written
// by a pass that never saw this spec; it caught 29 before the seed above the stamp tests was added.
// That list is the regression list now (`node scripts/fitness-audit.mjs --bugs <it> --with ...`,
// the --with files are the ones named below), so a new score needs bugs from a fresh blind pass.
const SCRIPT = resolve("scripts/fitness.mjs");
const REPLAY = resolve("tests/fixtures/fitness/replay-2026-10-22.json");
const WORKFLOW = resolve(".github/workflows/bots-catchup.yml");

const NOW = Date.parse("2026-11-01T06:00:00Z");
const MIN = 60_000;
const standby = { state: "stopped", config: { standbys: ["m1"] } };
const iso = (ms: number) => new Date(ms).toISOString();

const failing = {
  id: "bots-running",
  reads: "Fly",
  reaches: "an issue assigned to the owner",
  status: "fail",
  detail: "machine is stopped",
};

describe("fitness judges", () => {
  it("fails a stopped machine, whatever a standby is doing", () => {
    expect(judgeMachine([standby, { state: "stopped", config: {} }]).status).toBe("fail");
    expect(judgeMachine([standby, { state: "started", config: {} }]).status).toBe("pass");
    expect(judgeMachine([standby]).status).toBe("fail");
  });

  it("passes a stop a person marked", () => {
    const halted = {
      state: "stopped",
      config: { metadata: { "skynet-halt": "eric paused" } },
    };
    expect(judgeMachine([halted]).status).toBe("pass");
  });

  it("fails a stale or unreachable process that still reads as started", () => {
    const fresh = iso(NOW - MIN);
    expect(judgeStamp({ lastControlsPollAt: fresh, bridge: "armed" }, NOW).status).toBe("pass");
    expect(
      judgeStamp({ lastControlsPollAt: iso(NOW - 60 * MIN), bridge: "armed" }, NOW).status,
    ).toBe("fail");
    expect(judgeStamp({ lastControlsPollAt: fresh, bridge: "unreachable" }, NOW).status).toBe(
      "fail",
    );
    expect(judgeStamp({}, NOW).status).toBe("fail");
  });

  it("holds the stamp boundary: five minutes passes, a second more fails", () => {
    const at = (ms: number) =>
      judgeStamp({ lastControlsPollAt: iso(NOW - ms), bridge: "armed" }, NOW);
    expect(at(5 * MIN).status).toBe("pass");
    expect(at(5 * MIN + 1000).status).toBe("fail");
  });

  // The one bug of 30 the blind list got past the spec: a stamp that never polled has a NaN age,
  // which no size compare catches, so an armed bridge alone read as alive.
  it("fails a stamp that never polled, even with the bridge armed", () => {
    const never = judgeStamp({ bridge: "armed" }, NOW);
    expect(never).toEqual({ status: "fail", detail: "the stamp has no controls poll" });
    const garbled = judgeStamp({ lastControlsPollAt: "not a date", bridge: "armed" }, NOW);
    expect(garbled.status).toBe("fail");
  });

  it("reads deploys from what is running, and passes only when both apps are current", () => {
    const current = judgeDeploys({ lagging: false, bots: { known: true, lagging: false } }, NOW);
    expect(current.status).toBe("pass");
    expect(current.detail).toBe("both apps current");
  });

  it("gives a fresh push its deploy minutes, then fails the oldest undeployed commit", () => {
    const after = (ms: number) => judgeDeploys({ lagging: true, since: iso(NOW - ms) }, NOW);
    expect(after(5 * MIN).status).toBe("pass");
    expect(after(5 * MIN).detail).toContain("inside the deploy grace");
    expect(after(20 * MIN).status).toBe("pass");
    // The boundary is the millisecond, not the rounded minute.
    expect(after(20 * MIN + 1000).status).toBe("fail");
    expect(after(21 * MIN).status).toBe("fail");
    expect(after(45 * MIN).detail).toBe("dashboard undeployed 45 min");
  });

  it("cannot age a lag dated ahead of its own clock, which the API has done by an hour", () => {
    const ahead = judgeDeploys({ lagging: true, since: iso(NOW + 60 * MIN) }, NOW);
    expect(ahead.status).toBe("unknown");
    expect(ahead.detail).toBe("the dashboard lag is dated in the future");
  });

  it("judges the bots half by the same rule, not by a run's colour", () => {
    const bots = (ms: number) =>
      judgeDeploys({ lagging: false, bots: { lagging: true, since: iso(NOW - ms) } }, NOW);
    expect(bots(10 * MIN).status).toBe("pass");
    expect(bots(90 * MIN).status).toBe("fail");
    expect(bots(90 * MIN).detail).toBe("bots undeployed 90 min");
  });

  it("treats no evidence as unknown, never as a pass", () => {
    expect(judgeDeploys(null, NOW).status).toBe("unknown");
    // deploy-lag's reason stays out of the detail: an issue carries the contract's words only.
    const blind = judgeDeploys({ known: false, reason: "could not read GitHub state" }, NOW);
    expect(blind).toEqual({ status: "unknown", detail: "cannot read GitHub" });
    // The bots half unreadable is not a pass for the whole, even with the dashboard current.
    const halfBlind = judgeDeploys({ lagging: false, bots: { known: false } }, NOW);
    expect(halfBlind).toEqual({ status: "unknown", detail: "cannot read the bots deploys" });
    // A lag with no date cannot be aged, so it cannot be waved through as young.
    expect(judgeDeploys({ lagging: true }, NOW).status).toBe("unknown");
  });

  it("fails an alarm that can reach nobody, the 10-18 to 11-01 gap", () => {
    const key = "SKYNET_ALERT_EMAIL_API_KEY";
    const from = "SKYNET_ALERT_EMAIL_FROM";
    expect(judgeAlertReach(["OTHER"]).status).toBe("fail");
    expect(judgeAlertReach([key]).detail).toBe(`alerts reach nobody: ${from} not set`);
    expect(judgeAlertReach([key, from]).status).toBe("pass");
  });

  it("knows where it is from the Actions environment, and takes --here as an override", () => {
    expect(whereAmI({}, [])).toBe("session");
    expect(whereAmI({ GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "schedule" }, [])).toBe("clock");
    expect(whereAmI({ GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "workflow_dispatch" }, [])).toBe(
      "clock",
    );
    expect(whereAmI({ GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "push" }, [])).toBe("push");
    expect(whereAmI({}, ["--here", "clock"])).toBe("clock");
    expect(whereAmI({ GITHUB_ACTIONS: "true" }, ["--here", "nowhere"])).toBe("clock");
  });

  it("makes every contract state an outcome, a home, a source, a corrector field, a budget and who hears it", () => {
    expect(new Set(CONTRACTS.map((c: { id: string }) => c.id)).size).toBe(CONTRACTS.length);
    for (const contract of CONTRACTS) {
      expect(contract.mustBeTrue.length).toBeGreaterThan(10);
      expect(HOMES).toContain(contract.home);
      expect(contract.reads.length).toBeGreaterThan(0);
      expect(contract).toHaveProperty("corrector");
      expect(contract.budget.length).toBeGreaterThan(0);
      expect(contract.reaches.length).toBeGreaterThan(0);
      expect(typeof contract.probe).toBe("function");
    }
  });

  it("no longer carries the startup size: config-audit prints that number", () => {
    expect(CONTRACTS.map((c: { id: string }) => c.id)).not.toContain("startup-size");
  });
});

describe("fitness reporting", () => {
  const issue = {
    number: 7,
    title: "[fitness] bots-running",
    body: "**What failed:** machine is stopped.",
    lastComment: "",
  };

  it("opens one issue for a new failure", () => {
    expect(reportActions([failing], [])).toEqual([{ kind: "open", result: failing }]);
  });

  it("stays quiet about a failure it already reported", () => {
    expect(reportActions([failing], [issue])).toEqual([]);
  });

  it("comments once when a standing failure changes its cause", () => {
    const changed = { ...failing, detail: "no primary machine" };
    expect(reportActions([changed], [issue])).toEqual([
      { kind: "comment", number: 7, result: changed },
    ]);
    expect(
      reportActions([changed], [{ ...issue, lastComment: "it changed: no primary machine." }]),
    ).toEqual([]);
  });

  it("ignores a running number: a stale stamp is one failure, not one per tick", () => {
    const stale = (min: number) => ({
      ...failing,
      id: "bots-responsive",
      detail: `last controls poll ${min} min ago`,
    });
    const open = {
      ...issue,
      title: "[fitness] bots-responsive",
      body: "last controls poll 10 min ago",
    };
    expect(reportActions([stale(25)], [open])).toEqual([]);
    const commented = {
      ...open,
      body: "",
      lastComment: "it changed: last controls poll 40 min ago.",
    };
    expect(reportActions([stale(25)], [commented])).toEqual([]);
    // Eight ticks of the same stale stamp through the judge: one open, no comments.
    const lastPoll = NOW - 10 * MIN;
    const tally = simulate(
      Array.from({ length: 8 }, (_, tick) => ({
        ...failing,
        id: "bots-responsive",
        ...judgeStamp(
          { lastControlsPollAt: iso(lastPoll), bridge: "armed" },
          NOW + tick * 15 * MIN,
        ),
      })),
    );
    expect(tally).toEqual({ opens: 1, comments: 0, closes: 0 });
  });

  it("closes the issue when the check passes", () => {
    const ok = { ...failing, status: "pass", detail: "started" };
    expect(reportActions([ok], [issue])).toEqual([{ kind: "close", number: 7, result: ok }]);
    expect(reportActions([ok], [])).toEqual([]);
  });

  it("leaves a contract's own issue alone on an unknown, which proves neither health nor failure", () => {
    const blind = { ...failing, status: "unknown", detail: "cannot read Fly" };
    expect(
      reportActions([blind], [issue]).filter((a: { kind: string }) => a.kind !== "open-blind"),
    ).toEqual([]);
  });

  it("files nothing for a contract that reaches the session, whatever it says", () => {
    const memory = {
      ...failing,
      id: "memory-has-history",
      reads: "this machine",
      reaches: "the session",
    };
    expect(reportActions([memory], [])).toEqual([]);
    expect(reportActions([{ ...memory, status: "unknown" }], [])).toEqual([]);
  });

  it("never acts on not-here: a contract away from home is placed, not judged", () => {
    const away = {
      ...failing,
      status: "not-here",
      detail: "runs in the clock, and this is the session",
    };
    expect(reportActions([away], [issue])).toEqual([]);
    expect(reportActions([away], [])).toEqual([]);
  });

  it("opens one quiet issue per source nobody could read, not one per contract", () => {
    const blind = (id: string, detail = "cannot read Fly") => ({
      ...failing,
      id,
      status: "unknown",
      detail,
    });
    const tick = [
      blind("bots-running"),
      blind("bots-responsive", "cannot read the health stamp"),
      {
        ...failing,
        id: "main-deploys",
        reads: "GitHub",
        status: "pass",
        detail: "both apps current",
      },
      blind("alerts-reach-owner"),
    ];
    const actions = reportActions(tick, []);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "open-blind", source: "Fly" });
    expect(actions[0].results.map((r: { id: string }) => r.id)).toEqual([
      "bots-running",
      "bots-responsive",
      "alerts-reach-owner",
    ]);
    // Already open: nothing more, not even a comment. Its age is the signal.
    const open = { number: 12, title: "[fitness] cannot read Fly", body: "", lastComment: "" };
    expect(reportActions(tick, [open])).toEqual([]);
  });

  it("closes the blind issue once the source reads again, and only then", () => {
    const open = { number: 12, title: "[fitness] cannot read Fly", body: "", lastComment: "" };
    const readable = { ...failing, status: "pass", detail: "started" };
    expect(reportActions([readable], [open])).toEqual([
      { kind: "close-blind", number: 12, source: "Fly" },
    ]);
    // One contract still blind on that source keeps it open.
    const half = {
      ...failing,
      id: "alerts-reach-owner",
      status: "unknown",
      detail: "cannot read Fly",
    };
    expect(reportActions([readable, half], [open])).toEqual([]);
    // Nobody at home read the source this tick: it stays, because nothing was learned.
    const away = {
      ...failing,
      status: "not-here",
      detail: "runs in the clock, and this is the session",
    };
    expect(reportActions([away], [open])).toEqual([]);
  });

  // The 10-22 bots outage replayed on the clock's real tick times (228 ticks, 57 push runs, from
  // tests/fixtures/fitness/replay-2026-10-22.json). A run's success stands in for the dashboard
  // deploy job, as the study's simulation did. The unchanged script posted 70 comments over this
  // outage, one per change of its "N failed in a row" streak; the target is one per failure state.
  // The history holds two: a green run at 10-25 02:10 healed the first, and 02:16 broke it again.
  it("replays the 10-22 outage at the real tick times with one issue per failure state and no comment storm", () => {
    const { ticks, runs } = JSON.parse(readFileSync(REPLAY, "utf8")) as {
      ticks: string[];
      runs: Run[];
    };
    const verdicts = ticks.map((tick) => ({
      tick,
      lag: lagAt(runs, Date.parse(tick)),
      ...judgeDeploys(lagAt(runs, Date.parse(tick)), Date.parse(tick)),
    }));
    const tally = simulate(
      verdicts.map((v) => ({ ...failing, id: "main-deploys", reads: "GitHub", ...v })),
    );
    expect(tally).toEqual({ opens: 2, comments: 0, closes: 1 });
    // Detected within the grace plus one tick gap of the oldest undeployed commit landing.
    const firstRed = verdicts.find((v) => v.status === "fail");
    expect(firstRed).toBeDefined();
    const detectMs = Date.parse(firstRed?.tick ?? "") - Date.parse(firstRed?.lag.since ?? "");
    expect(detectMs).toBeLessThan(60 * MIN);
  });
});

type Run = { sha: string; createdAt: string; updatedAt: string; conclusion: string };

/** deploy-lag's shape rebuilt from push runs at one moment: a run's success stands in for the deploy job. */
function lagAt(runs: Run[], now: number) {
  const seen = runs.filter((r) => Date.parse(r.createdAt) <= now);
  const head = seen.at(-1);
  const released = [...seen]
    .reverse()
    .find((r) => r.conclusion === "success" && Date.parse(r.updatedAt) <= now);
  const stranded = released
    ? seen.filter((r) => Date.parse(r.createdAt) > Date.parse(released.createdAt))
    : [];
  const lagging = Boolean(head && released && head.sha !== released.sha);
  return { lagging, since: stranded[0]?.createdAt, bots: { known: true, lagging: false } };
}

/** Feed one contract's results tick by tick through reportActions, playing GitHub's part. */
function simulate(ticks: { id: string; detail: string }[]) {
  const tally = { opens: 0, comments: 0, closes: 0 };
  let issue: { number: number; title: string; body: string; lastComment: string } | null = null;
  for (const r of ticks) {
    for (const a of reportActions([r], issue ? [issue] : [])) {
      if (a.kind === "open") {
        tally.opens++;
        issue = {
          number: 1,
          title: `[fitness] ${r.id}`,
          body: `**What failed:** ${r.detail}.`,
          lastComment: "",
        };
      }
      if (a.kind === "comment" && issue) {
        tally.comments++;
        issue.lastComment = `Still failing, and it changed: ${r.detail}.`;
      }
      if (a.kind === "close") {
        tally.closes++;
        issue = null;
      }
    }
  }
  return tally;
}

// ---- wiring: the real entrypoint against stub fly and gh ------------------------------------------

// Each reply is tied to the app it belongs to, so a probe asking the wrong app reads nothing.
const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/fly-calls"
[[ -f "$S/fly-dead" ]] && { echo "Error: token expired" >&2; exit 1; }
app() { [[ "$*" == *"-a $1"* ]] || { echo "Error: app not found" >&2; exit 1; }; }
case "$1 $2" in
  "machine list") app "skynet-capital-bots --json" "$@"
    if [[ -f "$S/machines-first" ]]; then cat "$S/machines-first"; rm "$S/machines-first"; else cat "$S/machines"; fi ;;
  "machine exec") app "skynet-capital-bots --timeout" "$@"; [[ -f "$S/exec-hang" ]] && sleep 5; cat "$S/stamp" ;;
  "secrets list") app "skynet-capital --json" "$@"; cat "$S/secrets" ;;
esac
`;

// deploy-lag's gh api calls land here too, so the main-deploys contract is driven end to end.
const STUB_GH = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/gh-calls"
case "$1 $2" in
  "issue list") cat "$S/issues" ;;
  "issue create") [[ -f "$S/gh-refuse" ]] && { echo "HTTP 502" >&2; exit 1; }; echo "https://github.com/x/y/issues/99" ;;
  "issue comment"|"issue close") ;;
  api*)
    case "$2" in
      *commits/main) cat "$S/api-head" ;;
      *pipeline.yml/runs*) cat "$S/api-runs" ;;
      *compare/*) cat "$S/api-compare" ;;
      *) [[ "$2" =~ runs/([0-9]+)/jobs ]] && cat "$S/api-jobs-\${BASH_REMATCH[1]}" ;;
    esac ;;
esac
exit 0
`;

const HEAD = "aaaaaaa0000000000000000000000000000000aa";
const NEXT = "bbbbbbb0000000000000000000000000000000bb";
const landed = `{"jobs":[{"name":"release · deploy","conclusion":"success"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"success"},{"name":"Smoke test the bots release","conclusion":"success"}]}]}`;
const skipped = `{"jobs":[{"name":"release · deploy","conclusion":"failure"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"skipped"}]}]}`;

type World = {
  machine?: string;
  machines?: string;
  stampAgeMs?: number;
  secrets?: string[];
  deploy?: "current" | "young" | "late" | "unreadable";
  issues?: unknown[];
  memoryHistory?: boolean | "none";
};

/** A stub world. Healthy by default: machine started, fresh stamp, secrets set, deploys current. */
function fixture(world: World = {}) {
  const stub = mkdtempSync(join(tmpdir(), "fitness-"));
  const now = Date.now();
  writeFileSync(
    join(stub, "machines"),
    world.machines ??
      `[{"id":"standby1","state":"stopped","config":{"standbys":["m1"]}},{"id":"m1","state":"${world.machine ?? "started"}","config":{"env":{"GIT_SHA":"${HEAD}"}}}]`,
  );
  writeFileSync(
    join(stub, "stamp"),
    JSON.stringify({ lastControlsPollAt: iso(now - (world.stampAgeMs ?? MIN)), bridge: "armed" }),
  );
  const secrets = world.secrets ?? ["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"];
  writeFileSync(join(stub, "secrets"), JSON.stringify(secrets.map((name) => ({ Name: name }))));
  writeFileSync(join(stub, "issues"), JSON.stringify(world.issues ?? []));
  const deploy = world.deploy ?? "current";
  if (deploy !== "unreadable") {
    const head = deploy === "current" ? HEAD : NEXT;
    writeFileSync(join(stub, "api-head"), JSON.stringify({ sha: head }));
    const runs =
      deploy === "current"
        ? [{ id: 1, head_sha: HEAD }]
        : [
            { id: 2, head_sha: NEXT },
            { id: 1, head_sha: HEAD },
          ];
    writeFileSync(join(stub, "api-runs"), JSON.stringify({ workflow_runs: runs }));
    writeFileSync(join(stub, "api-jobs-1"), landed);
    writeFileSync(join(stub, "api-jobs-2"), skipped);
    const since = iso(now - (deploy === "late" ? 45 : 5) * MIN);
    writeFileSync(
      join(stub, "api-compare"),
      JSON.stringify({
        commits: [
          {
            sha: NEXT,
            commit: { message: "docs: x", committer: { date: since } },
            author: { login: "ejclark" },
          },
        ],
        files: [{ filename: "docs/IDEAS.md" }],
      }),
    );
  }
  // A home with one memory folder, versioned or bare, for the session contract.
  const memory = join(stub, "home", ".claude", "projects", "p", "memory");
  if (world.memoryHistory !== "none") {
    mkdirSync(memory, { recursive: true });
    writeFileSync(join(memory, "MEMORY.md"), "# memory\n");
    if (world.memoryHistory !== false) mkdirSync(join(memory, ".git"));
  } else mkdirSync(join(stub, "home"), { recursive: true });
  for (const [name, body] of [
    ["fly", STUB_FLY],
    ["gh", STUB_GH],
  ] as const) {
    writeFileSync(join(stub, name), body);
    chmodSync(join(stub, name), 0o755);
  }
  return stub;
}

function run(stub: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      STUB: stub,
      FLY_BIN: join(stub, "fly"),
      GH_BIN: join(stub, "gh"),
      PATH: `${stub}:${process.env.PATH}`,
      HOME: join(stub, "home"),
      FITNESS_RETRY_MS: "0",
      FITNESS_SPAWN_MS: "10000",
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "schedule",
      ...env,
    },
  });
}

const calls = (stub: string, bin: string) =>
  existsSync(join(stub, `${bin}-calls`)) ? readFileSync(join(stub, `${bin}-calls`), "utf8") : "";
const lines = (text: string, needle: string) =>
  text.split("\n").filter((l) => l.includes(needle)).length;
// The JSON sits between ::warning:: lines above it and report lines below it.
type Result = { status: string; detail: string; home: string };
const results = (res: ReturnType<typeof run>) => {
  const list = JSON.parse(
    res.stdout.slice(res.stdout.indexOf("\n[") + 1, res.stdout.lastIndexOf("\n]") + 2),
  ) as (Result & { id: string })[];
  return (id: string): Result => {
    const r = list.find((x) => x.id === id);
    if (!r) throw new Error(`no result for ${id}: ${res.stdout}${res.stderr}`);
    return r;
  };
};

describe("fitness wiring", () => {
  it("reads every clock contract from the real things, with the arguments the apps need", () => {
    const stub = fixture();
    const res = run(stub, ["--json"]);
    expect(res.status).toBe(0);
    const r = results(res);
    expect(r("bots-running")).toMatchObject({ status: "pass", detail: "started" });
    expect(r("bots-responsive").status).toBe("pass");
    expect(r("main-deploys")).toMatchObject({ status: "pass", detail: "both apps current" });
    expect(r("alerts-reach-owner").status).toBe("pass");
    expect(r("memory-has-history")).toMatchObject({ status: "not-here", home: "session" });
    const fly = calls(stub, "fly");
    expect(fly).toContain("machine list -a skynet-capital-bots --json");
    expect(fly).toContain(
      "machine exec m1 cat /data/health.json -a skynet-capital-bots --timeout 30",
    );
    expect(fly).toContain("secrets list -a skynet-capital --json");
    expect(fly).not.toContain("exec standby1");
    expect(calls(stub, "gh")).toContain("api repos/{owner}/{repo}/commits/main");
  });

  it("runs only the session contract in a session, and reads nothing from Fly there", () => {
    const versioned = run(fixture(), ["--json"], { GITHUB_ACTIONS: "" });
    expect(versioned.status).toBe(0);
    const r = results(versioned);
    expect(r("memory-has-history")).toMatchObject({
      status: "pass",
      detail: "1 folder(s) versioned",
    });
    for (const id of ["bots-running", "bots-responsive", "main-deploys", "alerts-reach-owner"]) {
      expect(r(id).status).toBe("not-here");
      expect(r(id).detail).toBe("runs in the clock, and this is the session");
    }
    const bare = fixture({ memoryHistory: false });
    const red = run(bare, ["--json"], { GITHUB_ACTIONS: "" });
    expect(red.status).toBe(1);
    expect(results(red)("memory-has-history").status).toBe("fail");
    expect(calls(bare, "fly")).toBe("");
    const none = run(fixture({ memoryHistory: "none" }), ["--json"], { GITHUB_ACTIONS: "" });
    expect(results(none)("memory-has-history").status).toBe("unknown");
  });

  it("lets a session read the clock's contracts with --here, without writing", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--here", "clock", "--report"], { GITHUB_ACTIONS: "" });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      "fitness: would open [fitness] bots-running (not on CI, so nothing is written)",
    );
    expect(calls(stub, "gh")).toContain(
      "issue list --state open --label bug --json number,title,body,comments --limit 200",
    );
    expect(calls(stub, "gh")).not.toContain("issue create");
  });

  it("keeps reporting the others when one reply is malformed, and exits red for the crash", () => {
    const stub = fixture({ machines: '{"not":"a list"}' });
    const res = run(stub, ["--json"]);
    expect(res.status).toBe(1);
    const r = results(res);
    expect(r("bots-running")).toMatchObject({ status: "unknown", detail: "the probe crashed" });
    expect(r("main-deploys").status).toBe("pass");
    expect(r("alerts-reach-owner").status).toBe("pass");
    expect(res.stdout).toContain("::warning::fitness: bots-running probe crashed");
    // A blip is read twice before it counts: two contracts list machines, each twice.
    expect(lines(calls(stub, "fly"), "machine list")).toBe(4);
    // A crash on the first read is still a crash when the retry reads clean: the run stays red
    // so the malformed reply is seen, while the contract itself reports what the retry found.
    const once = fixture();
    writeFileSync(join(once, "machines-first"), '{"not":"a list"}');
    const recovered = run(once, ["--json"]);
    expect(recovered.status).toBe(1);
    expect(results(recovered)("bots-running").status).toBe("pass");
    expect(recovered.stdout).toContain("::warning::fitness: bots-running probe crashed");
  });

  it("reports a dead Fly as unknown with the cause kept, and opens one unassigned issue for it", () => {
    const stub = fixture();
    writeFileSync(join(stub, "fly-dead"), "");
    const res = run(stub, ["--json", "--report"]);
    expect(res.status).toBe(0);
    const r = results(res);
    for (const id of ["bots-running", "bots-responsive", "alerts-reach-owner"]) {
      expect(r(id).status).toBe("unknown");
    }
    expect(r("main-deploys").status).toBe("pass");
    expect(res.stdout).toContain("::warning::fitness: bots-running cannot read Fly");
    expect(res.stdout).toContain("exited 1: Error: token expired");
    const gh = calls(stub, "gh");
    expect(lines(gh, "issue create")).toBe(1);
    expect(gh).toContain("issue create --title [fitness] cannot read Fly --label bug --body");
    expect(gh).not.toContain("--assignee");
    expect(gh).not.toContain("[fitness] bots-running");
    expect(res.stdout).toContain("fitness: open-blind [fitness] cannot read Fly");
  });

  it("closes the blind issue once Fly reads again", () => {
    const stub = fixture({
      issues: [{ number: 12, title: "[fitness] cannot read Fly", body: "", comments: [] }],
    });
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).toContain("issue close 12 --comment Fly can be read again.");
  });

  it("gives a hung read a deadline so it costs one contract, not the tick", () => {
    const stub = fixture();
    writeFileSync(join(stub, "exec-hang"), "");
    const started = Date.now();
    const res = run(stub, ["--json"], { FITNESS_SPAWN_MS: "300" });
    expect(Date.now() - started).toBeLessThan(4000);
    const r = results(res);
    expect(r("bots-responsive")).toMatchObject({
      status: "unknown",
      detail: "cannot read the health stamp",
    });
    expect(r("bots-running").status).toBe("pass");
    expect(res.stdout).toContain("timed out after 300 ms");
  });

  it("judges main-deploys through deploy-lag: a young push passes, an old one fails, no read is unknown", () => {
    const young = results(run(fixture({ deploy: "young" }), ["--json"]))("main-deploys");
    expect(young.status).toBe("pass");
    expect(young.detail).toContain("inside the deploy grace");
    const late = results(run(fixture({ deploy: "late" }), ["--json"]))("main-deploys");
    expect(late).toMatchObject({ status: "fail", detail: "dashboard undeployed 45 min" });
    const blind = results(run(fixture({ deploy: "unreadable" }), ["--json"]))("main-deploys");
    expect(blind.status).toBe("unknown");
    expect(blind.detail).toContain("cannot read GitHub");
  });

  it("opens a failing contract's issue on the clock, assigned to the owner, and exits 0 under --report", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("FAIL     bots-running: machine is stopped");
    expect(res.stdout).toContain("fitness: open [fitness] bots-running");
    const gh = calls(stub, "gh");
    expect(gh).toContain(
      "issue create --title [fitness] bots-running --label bug --assignee ejclark --body",
    );
    expect(gh).toContain("**What failed:** machine is stopped.");
    expect(lines(gh, "issue create")).toBe(1);
    // Without --report the failure is the exit code.
    expect(run(fixture({ machine: "stopped" }), []).status).toBe(1);
  });

  it("comments on a changed cause and closes on a pass, through gh", () => {
    const open = {
      number: 7,
      title: "[fitness] bots-running",
      body: "**What failed:** machine is stopped.",
      comments: [],
    };
    const changed = fixture({ machines: "[]", issues: [open] });
    run(changed, ["--report"]);
    expect(calls(changed, "gh")).toContain(
      "issue comment 7 --body Still failing, and it changed: no primary machine.",
    );
    const same = fixture({ machine: "stopped", issues: [open] });
    run(same, ["--report"]);
    expect(calls(same, "gh")).not.toContain("issue comment");
    // What was last said is the last comment: an older comment naming today's cause is history.
    const talked = {
      ...open,
      comments: [
        { body: "Still failing, and it changed: no primary machine." },
        { body: "Still failing, and it changed: machine is stopped." },
      ],
    };
    const back = fixture({ machines: "[]", issues: [talked] });
    run(back, ["--report"]);
    expect(calls(back, "gh")).toContain("issue comment 7 --body");
    const healed = fixture({ issues: [open] });
    run(healed, ["--report"]);
    expect(calls(healed, "gh")).toContain("issue close 7 --comment Passing again: started.");
  });

  it("prints a refused write and still exits 0, because the next tick retries it", () => {
    const stub = fixture({ machine: "stopped" });
    writeFileSync(join(stub, "gh-refuse"), "");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("fitness: COULD NOT open [fitness] bots-running");
    expect(res.stdout).toContain("HTTP 502");
  });

  it("reports nothing, with a warning, when the issue list is not a list", () => {
    const stub = fixture({ machine: "stopped" });
    writeFileSync(join(stub, "issues"), "{}");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      "::warning::fitness: cannot read GitHub issues, so nothing was reported",
    );
    expect(res.stdout).toContain("not a list");
    expect(calls(stub, "gh")).not.toContain("issue create");
  });

  (existsSync(WORKFLOW) ? it : it.skip)("has a clock runner that really invokes the script", () => {
    expect(readFileSync(WORKFLOW, "utf8")).toContain("node scripts/fitness.mjs --report");
  });
});
