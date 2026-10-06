import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  actionReachableOnPush,
  lintWorkflow,
  unlistedDispatchActor,
  unlistedWatchedActor,
  watchedWorkflows,
} from "../../scripts/workflow-lint.mjs";

// The workflow structure gate. Provenance: on 2026-08-22 an edit left `build-feedback:` defined
// twice in moneypenny-events.yml (formerly postmaster.yml). Loose YAML loaders keep the last duplicate silently — the local check
// passed — while GitHub rejects the file outright, producing a run with ZERO jobs and a red `main`
// with the postmaster (feedback lane, event research, stall audit) dead until a human noticed.
//
// A workflow file is the one kind of source in this repo that CI cannot test by running it, so its
// structure is checked here instead. Three rules, each one an actual state that file was in.
const run = (dir: string): { code: number; stderr: string } => {
  try {
    execFileSync("node", [join(process.cwd(), "scripts/workflow-lint.mjs"), dir], {
      stdio: "pipe",
    });
    return { code: 0, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stderr?: Buffer };
    return { code: e.status ?? -1, stderr: e.stderr?.toString() ?? "" };
  }
};

const withWorkflow = (yaml: string): { code: number; stderr: string } => {
  const dir = mkdtempSync(join(tmpdir(), "wf-lint-"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "sample.yml"), yaml);
  const result = run(dir);
  rmSync(dir, { recursive: true, force: true });
  return result;
};

const SOUND = `name: Sample
on:
  push:
    branches: [main]
jobs:
  route:
    runs-on: ubuntu-latest
    outputs:
      thing: \${{ steps.pick.outputs.thing }}
    steps:
      - uses: actions/checkout@v7
      - id: pick
        run: |
          echo "thing: a duplicate-looking line"
          echo "thing: another one"
          echo "thing=x" >> "$GITHUB_OUTPUT"
  build:
    needs: route
    runs-on: ubuntu-latest
    steps:
      - run: echo \${{ needs.route.outputs.thing }}
`;

describe("workflow structure gate", () => {
  it("passes this repo's real workflows", () => {
    const { code, stderr } = run(".github/workflows");

    expect(stderr).toBe("");
    expect(code).toBe(0);
  });

  it("passes a sound file, including repeated keys inside a shell block scalar", () => {
    // `run: |` holds arbitrary text; lines in it are not structure and must never be flagged.
    expect(withWorkflow(SOUND).code).toBe(0);
  });

  it("fails a duplicated job key — the 2026-08-22 outage, exactly", () => {
    const { code, stderr } = withWorkflow(
      `${SOUND}  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo again\n`,
    );

    expect(code).toBe(1);
    expect(stderr).toContain("duplicate key `build`");
  });

  it("fails a step output reference whose step was deleted", () => {
    const { code, stderr } = withWorkflow(
      SOUND.replace("steps.pick.outputs.thing", "steps.tier.outputs.model"),
    );

    expect(code).toBe(1);
    expect(stderr).toContain("declares no step `tier`");
  });

  it("fails a workflow_run trigger with no workflows list — the 2026-08-22 repeat", () => {
    const { code, stderr } = withWorkflow(
      "name: X\non:\n  workflow_run:\n    types: [completed]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n",
    );

    expect(code).toBe(1);
    expect(stderr).toContain("no `workflows:` list");
  });

  it("passes a workflow_run trigger that names its workflows", () => {
    const { code } = withWorkflow(
      'name: X\non:\n  workflow_run:\n    workflows: ["Pipeline"]\n    types: [completed]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n',
    );

    expect(code).toBe(0);
  });

  it("fails a needs: naming a job that does not exist", () => {
    const { code, stderr } = withWorkflow(SOUND.replace("needs: route", "needs: routte"));

    expect(code).toBe(1);
    expect(stderr).toContain("needs `routte`");
  });
});

// Rule 6, added 2026-08-29 (#894, following #889/#890 — a same-day, three-PR pipeline patch chain).
// `arm-auto-merge` ran `node scripts/envelope-scan.mjs`, which imports the `typescript`
// devDependency transitively, with no `npm ci` step ahead of it in the job — the script crashed
// before printing anything, and the JSON parse downstream failed the job outright instead of
// correctly reporting "this diff is protected, skip." This is the class of bug workflow-lint exists
// to catch mechanically, since a workflow file cannot be run to find out before it merges.
describe("workflow lint — missing dependency install before a repo script", () => {
  const MISSING_INSTALL = `name: Sample
on:
  push:
    branches: [main]
jobs:
  arm-auto-merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: node scripts/needs-deps.mjs
`;

  const WITH_INSTALL = MISSING_INSTALL.replace(
    "      - run: node scripts/needs-deps.mjs\n",
    "      - run: npm ci\n      - run: node scripts/needs-deps.mjs\n",
  );

  const NO_DEPS_SCRIPT = MISSING_INSTALL.replace("scripts/needs-deps.mjs", "scripts/no-deps.mjs");

  it("fails a job that runs a deps-needing script with no earlier npm ci — the #890 shape", () => {
    const problems = lintWorkflow("sample.yml", MISSING_INSTALL, [], () => true);

    expect(problems.some((p) => p.includes("node_modules") && p.includes("see #890"))).toBe(true);
  });

  it("passes once npm ci runs earlier in the same job", () => {
    expect(lintWorkflow("sample.yml", WITH_INSTALL, [], () => true)).toEqual([]);
  });

  it("passes a script whose import graph needs nothing installed", () => {
    expect(lintWorkflow("sample.yml", NO_DEPS_SCRIPT, [], () => false)).toEqual([]);
  });

  // Degrade honestly (#3769 row 1): a script rule 6 cannot read is UNKNOWN, a problem — not a pass.
  it("fails as UNKNOWN when a workflow runs a script whose import graph cannot be read", () => {
    const { code, stderr } = withWorkflow(
      MISSING_INSTALL.replace("scripts/needs-deps.mjs", "scripts/no-such-script-3769.mjs"),
    );
    expect(code).toBe(1);
    expect(stderr).toContain("scripts/no-such-script-3769.mjs");
    expect(stderr).toContain("UNKNOWN (rule 6, #890)");
  });

  it("holds for the real workflows in this repo (real script import graphs)", () => {
    expect(() =>
      execFileSync("node", ["scripts/workflow-lint.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});

// Rule 7, added 2026-09-05 (#894) — the third incident of the same-day #889→#890→#892 chain, and
// the one rule 6 did not cover. #889 shipped `pipeline.yml`'s `arm-auto-merge` job gated on
// `!contains(github.event.pull_request.labels.*.name, 'hold-merge')` while nothing provisioned
// `hold-merge`; #892 had to add it afterwards. Nothing fails in that state — the condition simply
// never matches, so the documented escape hatch (hold a green PR for a taste call) did not exist for
// anyone who reached for it. Silent, exactly like rules 5 and 6.
describe("workflow lint — a label the vocabulary does not register", () => {
  // The pre-#892 shape, reconstructed: the real condition from `pipeline.yml`, against a vocabulary
  // that does not yet carry the label it names.
  const HOLD_MERGE = `name: Sample
on:
  pull_request:
    types: [opened]
jobs:
  arm-auto-merge:
    if: \${{ !contains(github.event.pull_request.labels.*.name, 'hold-merge') }}
    runs-on: ubuntu-latest
    steps:
      - run: echo arm
`;

  it("fails a label reference the registry does not carry — the #892 shape", () => {
    const problems = lintWorkflow("sample.yml", HOLD_MERGE, [], () => false, ["needs-eric"]);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("`hold-merge`");
    expect(problems[0]).toContain("see #892");
  });

  it("passes once the registry carries it", () => {
    expect(lintWorkflow("sample.yml", HOLD_MERGE, [], () => false, ["hold-merge"])).toEqual([]);
  });

  it("catches the event-filter and gh-CLI forms too", () => {
    const yaml = `name: Sample
on:
  issues:
    types: [labeled]
jobs:
  claim:
    if: github.event.label.name == 'feedbck'
    runs-on: ubuntu-latest
    steps:
      - run: gh issue edit 1 --add-label needs-inf
`;
    const problems = lintWorkflow("sample.yml", yaml, [], () => false, ["feedback", "needs-info"]);

    expect(problems.map((p) => p.match(/`([a-z-]+)`/)?.[1]).sort()).toEqual([
      "feedbck",
      "needs-inf",
    ]);
  });

  it("never guesses at a label built from a shell variable", () => {
    // `--add-label "$LABEL"` is indirection this rule deliberately skips: a false negative costs
    // nothing, a false positive reddens a correct pipeline.
    const yaml = `name: Sample
on:
  push:
    branches: [main]
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - run: gh issue edit 1 --add-label "$LABEL"
`;

    expect(lintWorkflow("sample.yml", yaml, [], () => false, [])).toEqual([]);
  });

  it("holds for the real workflows against the real label registry", () => {
    expect(() =>
      execFileSync("node", ["scripts/workflow-lint.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});

// Rule 5, added 2026-08-22 with the prompt shims. The AI lanes now read their instructions from
// `.github/prompts/*.md` rather than inline YAML — which keeps the envelope tunable without a
// carve-out merge, but makes a wrong path silent: the workflow parses, the run starts, and a live
// session works with no orders. Cheap to check, so it is checked.
describe("workflow lint — prompt shims", () => {
  const withPrompts = (yaml: string, prompts: string[]): { code: number; stderr: string } => {
    const dir = mkdtempSync(join(tmpdir(), "wf-prompts-"));
    const workflows = join(dir, "workflows");
    mkdirSync(join(dir, "prompts"), { recursive: true });
    mkdirSync(workflows, { recursive: true });
    writeFileSync(join(workflows, "sample.yml"), yaml);
    for (const p of prompts) writeFileSync(join(dir, "prompts", p), "# stub\n");
    const result = run(workflows);
    rmSync(dir, { recursive: true, force: true });
    return result;
  };

  // Triggered on `issues`, not `push`, so rule 9 has nothing to say about it — a push-triggered
  // claude-code-action job is its own (real) problem, and this fixture is about prompt shims.
  const SHIM = `name: Sample
on:
  issues:
    types: [labeled]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Read \`.github/prompts/feedback-build.md\` in this repo and follow it exactly.
`;

  it("flags a shim pointing at a prompt file that does not exist", () => {
    const { code, stderr } = withPrompts(SHIM, ["other.md"]);

    expect(code).toBe(1);
    expect(stderr).toContain("feedback-build.md");
    expect(stderr).toContain("no instructions");
  });

  it("passes a shim whose prompt file exists", () => {
    expect(withPrompts(SHIM, ["feedback-build.md"]).code).toBe(0);
  });

  it("holds for the real workflows in this repo", () => {
    expect(() =>
      execFileSync("node", ["scripts/workflow-lint.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });

  // Degrade honestly (#3769 row 1): a missing prompts directory is optional (rule 5 then flags any
  // referenced shim), but the run says it looked and found none rather than passing in silence.
  it("names a missing prompts directory as a note, and still passes a shim-free file", () => {
    const dir = mkdtempSync(join(tmpdir(), "wf-noprompts-"));
    const workflows = join(dir, "workflows");
    mkdirSync(workflows, { recursive: true });
    writeFileSync(join(workflows, "sample.yml"), SOUND);
    const out = execFileSync(
      "node",
      [join(process.cwd(), "scripts/workflow-lint.mjs"), workflows],
      {
        encoding: "utf8",
      },
    );
    rmSync(dir, { recursive: true, force: true });
    expect(out).toContain("· workflow-lint: no prompts directory at");
    expect(out).toContain("structurally sound");
  });
});

// #3735 merged while labelled `hold-merge`: the arm job's `if:` reads labels from the event
// payload, a snapshot taken before `ship.sh --hold` applied the label (docs/LESSONS.md). The job
// now re-reads the LIVE labels before arming; this pins that the arm step still depends on it.
describe("arm-auto-merge — a hold applied after the triggering event still holds", () => {
  const pipeline = readFileSync(".github/workflows/pipeline.yml", "utf8");
  const job = pipeline.slice(
    pipeline.indexOf("\n  arm-auto-merge:"),
    pipeline.indexOf("\n  deploy:"),
  );

  it("reads the PR's labels from the API at run time, not only from the event payload", () => {
    expect(job).toMatch(
      /id: hold[\s\S]*issues\/\$\{\{ github\.event\.pull_request\.number \}\}\/labels/,
    );
    expect(job).toContain("grep -qx 'hold-merge'");
  });

  // 2026-09-30 (found by #4169): `e2e` is skipped on a docs-only PR, and a job whose `needs:` include
  // a skipped job is itself skipped unless its `if:` calls a status function. Without `!cancelled()`
  // the `needs.e2e.result == 'skipped'` branch never ran, so no docs PR was ever armed.
  it("still evaluates its condition when integration tests were skipped", () => {
    const condition = job.slice(job.indexOf("if: >-"), job.indexOf("runs-on:"));
    expect(condition).toContain("!cancelled()");
    expect(condition).toContain("needs.e2e.result == 'skipped'");
  });

  // #4351 (2026-09-30): a burst of issue writes spent the App's budget; both API calls 403'd and
  // two green PRs sat unarmed. Every call the job makes waits out a rate limit instead of failing.
  it("routes every GitHub call through the rate-limit retry helper", () => {
    expect(job).toContain("- name: Rate-limit retry helper");
    const calls =
      job.match(/(?:\$\(|^\s+)(?:"\$RUNNER_TEMP\/gh-retry\.sh" )?gh (?:api|pr merge)[^\n]*/gm) ??
      [];
    const outsideHelper = calls.filter((c) => !c.includes("rate_limit"));
    expect(outsideHelper.length).toBeGreaterThanOrEqual(3);
    for (const call of outsideHelper) expect(call).toContain('"$RUNNER_TEMP/gh-retry.sh" gh');
  });

  it("arms only when that live read said unheld", () => {
    const arm = job.slice(job.indexOf("- name: Arm auto-merge"));
    expect(arm).toContain("steps.hold.outputs.held == 'false'");
    expect(job.indexOf("id: hold")).toBeLessThan(job.indexOf("- name: Arm auto-merge"));
  });

  // #4477 (2026-10-02): the allowlist omitted `edited`, which `types:` carries and `ship.sh` fires
  // on purpose as #4168's recovery path. Because pull_request runs cancel in progress per branch,
  // an `edited` seconds after `opened` kills the `opened` run — so the one run that completed was
  // the one action that could not arm, and PR #4449 sat green and unarmed for 29 hours. The drift
  // is invisible by inspection (two lists 250 lines apart), so this pins them together rather than
  // just fixing the one word. An action may be left out only by naming it here, deliberately.
  it("can arm on every pull_request action this workflow triggers on", () => {
    const typeList = pipeline.match(/^\s*types:\s*\[([^\]]+)\]/m)?.[1];
    expect(typeList).toBeDefined();
    const triggered = (typeList ?? "").split(",").map((t) => t.trim());
    expect(triggered).toContain("edited");

    const condition = job.slice(job.indexOf("if: >-"), job.indexOf("runs-on:"));
    const allowList = condition.match(/fromJSON\('(\[[^']+\])'\)/)?.[1];
    expect(allowList).toBeDefined();
    const allowed = JSON.parse(allowList ?? "[]") as string[];

    // Actions that reach this job and must NOT arm. Empty today; an entry here is a decision with
    // a reason, which is the whole point — a silent omission is what #4477 was.
    const deliberatelyUnarmable: string[] = [];

    for (const action of triggered) {
      if (deliberatelyUnarmable.includes(action)) continue;
      expect(allowed).toContain(action);
    }
  });
});

// #4211 (slice 6 of #4056): `integration tests` is a required check, and GitHub counts a SKIPPED
// required check as a pass. A draft skips both suites, so the promotion to ready must run them
// again — or the stale `skipped` is the last word and the PR merges untested (PR #322's shape).
describe("pipeline — a draft promoted to ready runs both required suites", () => {
  const pipeline = readFileSync(".github/workflows/pipeline.yml", "utf8");
  const jobIf = (id: string, next: string) => {
    const job = pipeline.slice(pipeline.indexOf(`\n  ${id}:`), pipeline.indexOf(`\n  ${next}:`));
    return job.slice(job.indexOf("if:"), job.indexOf("runs-on:"));
  };

  it("triggers on ready_for_review", () => {
    const typeList = pipeline.match(/^\s*types:\s*\[([^\]]+)\]/m)?.[1] ?? "";
    expect(typeList.split(",").map((t) => t.trim())).toContain("ready_for_review");
  });

  it("gates verify and integration tests on draft state, never on which action fired", () => {
    for (const condition of [jobIf("verify", "e2e"), jobIf("e2e", "arm-auto-merge")]) {
      expect(condition).toContain("github.event.pull_request.draft == false");
      expect(condition).not.toContain("github.event.action");
    }
  });
});

// Rule 8 (#2292): a self re-dispatch signed by one bot, landing on a claude-code-action job that
// allow-lists another. Event research died in ~3s per leg for ~41h on exactly this drift.
describe("workflow lint — a self-dispatch actor a dispatch-reachable job does not allow", () => {
  const selfDispatching = (
    token: string,
    allowed: string | null,
    gate = "github.event_name == 'workflow_dispatch'",
  ) => `name: Loop
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  route:
    runs-on: ubuntu-latest
    steps:
      - id: app-token
        uses: ./.github/actions/app-token
      - name: Re-dispatch
        env:
          GH_TOKEN: \${{ ${token} }}
        run: gh workflow run loop.yml -f command=scan
  build:
    needs: route
    # comment lines never count as the gate
    if: ${gate}
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: hi${allowed === null ? "" : `\n          allowed_bots: "${allowed}"`}
`;

  it("fails the #2292 shape: App-token dispatch, github-actions-only allow-list", () => {
    const problems = unlistedDispatchActor(
      "loop.yml",
      selfDispatching("steps.app-token.outputs.token", "github-actions"),
    );
    expect(problems).toEqual([{ job: "build", actor: "skynet-envoy" }]);
  });

  it("fails a GITHUB_TOKEN dispatch into a job with no allow-list at all", () => {
    expect(
      unlistedDispatchActor("loop.yml", selfDispatching("secrets.GITHUB_TOKEN", null)),
    ).toEqual([{ job: "build", actor: "github-actions" }]);
  });

  it("passes once the allow-list names the dispatching actor", () => {
    expect(
      unlistedDispatchActor(
        "loop.yml",
        selfDispatching("steps.app-token.outputs.token", "github-actions,skynet-envoy"),
      ),
    ).toEqual([]);
  });

  it("reports an unreadable token as UNKNOWN, never a pass", () => {
    expect(unlistedDispatchActor("loop.yml", selfDispatching("secrets.SOME_PAT", "*"))).toEqual([
      { job: "build", actor: null },
    ]);
  });

  it("fails a gate that admits the dispatch without naming it (build-plan, run 36800601479)", () => {
    const loop = selfDispatching(
      "steps.app-token.outputs.token",
      null,
      "github.event_name != 'push'",
    );
    expect(unlistedDispatchActor("loop.yml", loop)).toEqual([
      { job: "build", actor: "skynet-envoy" },
    ]);
  });

  it("ignores a job pinned to another event", () => {
    const loop = selfDispatching(
      "steps.app-token.outputs.token",
      null,
      "github.event_name == 'issues'",
    );
    expect(unlistedDispatchActor("loop.yml", loop)).toEqual([]);
  });

  it("ignores a dispatch aimed at a different workflow file", () => {
    const other = selfDispatching("steps.app-token.outputs.token", "github-actions");
    expect(unlistedDispatchActor("elsewhere.yml", other)).toEqual([]);
  });

  // Reachability is the question rule 9 asks of `push` (run 36802272261 died on the gap a
  // substring test left): no `if:` admits every trigger, and any one `||` branch is a way in.
  it("fails a job with no `if:` at all — every trigger reaches it", () => {
    const loop = selfDispatching("steps.app-token.outputs.token", null).replace(
      /^ {4}if: .*\n/m,
      "",
    );
    expect(unlistedDispatchActor("loop.yml", loop)).toEqual([
      { job: "build", actor: "skynet-envoy" },
    ]);
  });

  it("fails an `||` with one branch a dispatch can enter", () => {
    const loop = selfDispatching(
      "steps.app-token.outputs.token",
      null,
      "github.event_name == 'issues' || needs.route.outputs.x != ''",
    );
    expect(unlistedDispatchActor("loop.yml", loop)).toEqual([
      { job: "build", actor: "skynet-envoy" },
    ]);
  });

  // The live gate: whatever the fixtures prove, the real file is what runs.
  it("holds for the real workflows in this repo", () => {
    for (const f of readdirSync(".github/workflows")) {
      expect(unlistedDispatchActor(f, readFileSync(join(".github/workflows", f), "utf8"))).toEqual(
        [],
      );
    }
  });
});

// Rule 8's second half: a `workflow_run` run inherits the watched run's actor. Repair job
// 107889665923 died in 3s on "non-human actor: skynet-envoy" — the watched lane's own re-dispatch.
describe("workflow lint — a workflow_run watcher refusing the watched run's inherited actor", () => {
  const watcher = (allowed: string) => `name: Repair
on:
  workflow_run:
    workflows:
      ["Loop", ".github/workflows/loop.yml"]
    types: [completed]
jobs:
  repair:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          allowed_bots: "${allowed}"
`;
  const actors = new Map([["Loop", ["skynet-envoy"]]]);

  it("reads the watched names, path forms included", () => {
    expect(watchedWorkflows(watcher("x"))).toEqual(["Loop", ".github/workflows/loop.yml"]);
  });

  it("fails a watcher that does not admit the actor the watched workflow dispatches as", () => {
    expect(unlistedWatchedActor(watcher("github-actions,claude"), actors)).toEqual([
      { job: "repair", actor: "skynet-envoy" },
    ]);
  });

  it("passes once the watcher names it", () => {
    expect(unlistedWatchedActor(watcher("github-actions,claude,skynet-envoy"), actors)).toEqual([]);
  });

  it("says nothing about a watched workflow that never re-dispatches itself", () => {
    expect(unlistedWatchedActor(watcher("github-actions"), new Map())).toEqual([]);
  });
});

// Rule 9 (#4359). `claude-code-action@v1` rejects `push` as an event type outright — "Action
// failed with error: Unsupported event type: push" — so a job that invokes it from a push run
// cannot succeed for any prompt, any token, any model. moneypenny-events.yml has known this since
// 2026-08-20 for the event-research lane (which re-dispatches itself as a `workflow_dispatch`) but
// nothing checked the OTHER build lanes: #4165 wired the retry sweep onto `push`, the sweep claimed
// plan #784 in the push run, and `build plan issue` went red on every merge to `main` in ~17s.
//
// The reachability question is exactly "can this job's `if:` be true on a push?", so these specs
// pin the expression shapes that answer it — including the `||` case, where one unguarded operand
// is enough to re-open the hole.
describe("workflow lint — claude-code-action reachable on a `push` event", () => {
  const lane = (jobIf: string) => `name: Events
on:
  push:
    branches: [main]
  issues:
    types: [labeled]
  workflow_dispatch:
jobs:
  build:
    needs: route
    if: ${jobIf}
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: build it
`;

  it("fails the #4359 shape: a build lane gated only on an upstream output", () => {
    expect(actionReachableOnPush(lane("needs.route.outputs.plan_issue != ''"))).toEqual(["build"]);
  });

  it("fails a job with no `if:` at all", () => {
    expect(actionReachableOnPush(lane("").replace(/^ {4}if: *$\n/m, ""))).toEqual(["build"]);
  });

  it("passes the guard the fix applied — an explicit `!= 'push'`", () => {
    expect(
      actionReachableOnPush(lane("github.event_name != 'push' && needs.route.outputs.x != ''")),
    ).toEqual([]);
  });

  it("passes a positively-gated lane, the shape `build-events` already used", () => {
    expect(
      actionReachableOnPush(
        lane("github.event_name == 'workflow_dispatch' && inputs.command == 'scan'"),
      ),
    ).toEqual([]);
  });

  it("passes a block-scalar `if:` spanning lines", () => {
    const yaml = lane("PLACEHOLDER").replace(
      "    if: PLACEHOLDER",
      `    if: >-
      github.event_name == 'workflow_dispatch' &&
      needs.route.outputs.due_events != '' && needs.route.outputs.due_events != '[]'`,
    );
    expect(actionReachableOnPush(yaml)).toEqual([]);
  });

  // The `||` trap: every operand is a way in on its own, so all of them have to rule push out.
  it("passes an `||` where every branch names a non-push event", () => {
    expect(
      actionReachableOnPush(
        lane(
          "(github.event_name == 'issues' && github.event.action == 'labeled') || github.event_name == 'issue_comment'",
        ),
      ),
    ).toEqual([]);
  });

  it("fails an `||` with one unguarded branch", () => {
    expect(
      actionReachableOnPush(
        lane("github.event_name == 'issues' || needs.route.outputs.plan_issue != ''"),
      ),
    ).toEqual(["build"]);
  });

  it("fails an `||` that names push itself", () => {
    expect(
      actionReachableOnPush(
        lane("github.event_name == 'push' || github.event_name == 'workflow_dispatch'"),
      ),
    ).toEqual(["build"]);
  });

  it("says nothing about a workflow that has no push trigger", () => {
    expect(
      actionReachableOnPush(lane("needs.route.outputs.x != ''").replace(/ {2}push:\n.*\n/, "")),
    ).toEqual([]);
  });

  // A job that only TALKS about the action in a comment is not invoking it — `route` carries three
  // such comments, including the re-dispatch step that exists to work around this very rule.
  it("reads `uses:`, never a comment mentioning the action", () => {
    const talker = `name: Events
on:
  push:
    branches: [main]
jobs:
  route:
    runs-on: ubuntu-latest
    steps:
      # claude-code-action cannot see \`push\`, so re-dispatch as a workflow_dispatch instead
      - name: Re-dispatch for work claude-code-action can't do under \`push\`
        run: gh workflow run events.yml -f command=scan
`;
    expect(actionReachableOnPush(talker)).toEqual([]);
  });

  // The live gate: whatever the fixtures prove, the real file is what runs.
  it("holds for the real workflows in this repo", () => {
    for (const f of readdirSync(".github/workflows")) {
      expect(actionReachableOnPush(readFileSync(join(".github/workflows", f), "utf8"))).toEqual([]);
    }
  });
});

// #4430 sat clean and unarmed: the arm job's two-dot `git diff base head` also listed what landed
// on main after the PR branched (#4425's Dockerfile/fly.toml), so the envelope step called a
// scripts-only PR protected and skipped the arm with a green job. Three dots = the PR's own diff.
describe("pipeline — PR diffs are the PR's own changes (three-dot)", () => {
  const pipeline = readFileSync(".github/workflows/pipeline.yml", "utf8");
  const range =
    /git diff --name-only "?\$\{\{ github\.event\.pull_request\.base\.sha \}\}(\.\.\.|"? "?)\$\{\{ github\.event\.pull_request\.head\.sha \}\}/g;

  it("every base..head diff in pipeline.yml uses the merge-base range", () => {
    const seps = [...pipeline.matchAll(range)].map((m) => m[1]);
    expect(seps.length).toBeGreaterThanOrEqual(2);
    expect(seps.every((sep) => sep === "...")).toBe(true);
  });

  it("the envelope step fails closed and says why it did not arm", () => {
    const step = pipeline.slice(pipeline.indexOf("name: Is the diff protected?"));
    const body = step.slice(0, step.indexOf("- name:", 10));
    expect(body).toContain("SCAN=$(node scripts/envelope-scan.mjs");
    expect(body).toContain("jq -er");
    expect(body).toContain("::notice::not arming");
  });
});
