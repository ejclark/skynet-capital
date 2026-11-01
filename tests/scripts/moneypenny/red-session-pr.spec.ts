import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CAPSULE_SLOT,
  capsuleTitle,
  gatherRedSessionPr,
  markerFor,
  RED_ATTEMPT_CAP,
  type RedPrFailure,
  routeRedSessionPr,
  sayOnPr,
} from "../../../scripts/moneypenny/red-session-pr.mjs";
import { LOST_RUNNER } from "../../../scripts/moneypenny/repair.mjs";

// #6605. He spotted a red PR before any lane did 6 times in 184 messages, because builders stop at
// opening one and the repair lane drops every pull_request run. The Pipeline's completion is already
// the event, so what was missing is the decision: attempt a fix, or say in one line why not.

const SHA = "abc1234def5678";
const SHORT = "abc1234";
const NUMBER = 6605;

const run = (over: Record<string, unknown> = {}) => ({
  id: 41400000001,
  name: "Pipeline",
  conclusion: "failure",
  event: "pull_request",
  head_branch: "feat/red-session-pr-owner",
  head_sha: SHA,
  html_url: "https://github.com/ejclark/skynet-capital/actions/runs/41400000001",
  pull_requests: [{ number: NUMBER }],
  ...over,
});

const pr = (over: Record<string, unknown> = {}) => ({
  number: NUMBER,
  title: "feat(moneypenny): a session's red PR gets an owner",
  state: "open",
  draft: false,
  body: "## Summary\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)",
  author_association: "OWNER",
  user: { login: "ejclark", type: "User" },
  labels: [] as { name: string }[],
  base: { ref: "main", repo: { full_name: "ejclark/skynet-capital" } },
  head: {
    ref: "feat/red-session-pr-owner",
    sha: SHA,
    repo: { full_name: "ejclark/skynet-capital" },
  },
  ...over,
});

const verifyRed: RedPrFailure[] = [
  { job: "verify", step: "Typecheck + lint + test (parallel)", logTail: "FAIL tests/x.spec.ts" },
];
const FILES = ["scripts/moneypenny/x.mjs"];
const clear = { dispatch: true, reason: "cleared: work-mode is normal" };

type Deps = Parameters<typeof routeRedSessionPr>[1];
const route = (
  deps: Partial<Deps> = {},
  ctx: { run?: Record<string, unknown>; failures?: RedPrFailure[] } = {},
) =>
  routeRedSessionPr(
    { run: run(ctx.run), defaultBranch: "main", failures: ctx.failures ?? verifyRed },
    { pr: pr(), files: FILES, comments: [], gate: clear, openIssues: [], ...deps },
  );
const only = (deps: Partial<Deps> = {}, ctx: Parameters<typeof route>[1] = {}) => {
  const intents = route(deps, ctx);
  if (intents.length !== 1) throw new Error(`expected one intent, got ${intents.length}`);
  return intents[0] as NonNullable<(typeof intents)[0]>;
};

describe("a session's PR goes red on a check that holds it", () => {
  it("files one capsule that dispatches the repair session, and says so on the PR", () => {
    const intent = only();
    expect(intent.type).toBe("open-issue");
    expect(intent.title).toBe(capsuleTitle(NUMBER));
    expect(intent.labels).toEqual(["ci-failure"]);
    expect(intent.dispatch).toBe(true);
    expect(intent.sayOnPr?.number).toBe(NUMBER);
    expect(intent.sayOnPr?.body).toContain(CAPSULE_SLOT);
    expect(intent.sayOnPr?.body).toContain(markerFor(SHA, true));
  });

  it("gives the session the PR, its branch, its files and the failing step", () => {
    const body = only({ files: ["a.ts", "b.ts"] }).body ?? "";
    expect(body).toContain(`| **PR** | #${NUMBER} |`);
    expect(body).toContain("`feat/red-session-pr-owner`");
    expect(body).toContain(SHORT);
    expect(body).toContain("- `a.ts`");
    expect(body).toContain("FAIL tests/x.spec.ts");
    expect(body).toContain("| **Failing step** | Typecheck + lint + test (parallel) |");
  });

  it("says plainly that a failure outside those files is not this PR's to change", () => {
    expect(only().body).toMatch(/outside these files.*say so on #6605/i);
  });

  it("writes a capsule the issue linter accepts", () => {
    const intent = only();
    const dir = mkdtempSync(join(tmpdir(), "red-session-body-"));
    const file = join(dir, "body.md");
    writeFileSync(file, intent.body ?? "");
    try {
      execFileSync("node", ["scripts/issue-lint.mjs", "--title", intent.title ?? "", file], {
        encoding: "utf8",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("counts integration tests and the stability budget as red, since both hold the PR", () => {
    for (const job of ["integration tests", "stability budget"]) {
      const intent = only({}, { failures: [{ job, step: "Budget run" }] });
      expect(intent.type).toBe("open-issue");
      expect(intent.sayOnPr?.body).toContain(`\`${job}\``);
    }
  });

  it("is one capsule when two checks fail in one run, and names them both", () => {
    const failures = [...verifyRed, { job: "integration tests", step: "Build app/" }];
    const intent = only({}, { failures });
    expect(intent.sayOnPr?.body).toContain("`verify`");
    expect(intent.sayOnPr?.body).toContain("`integration tests`");
  });

  it("leaves a failure in a job that holds nothing alone", () => {
    expect(route({}, { failures: [{ job: "arm auto-merge", step: "Arm" }] })).toEqual([]);
  });
});

describe("the bars — it never reaches for what is not its own", () => {
  it("does not touch a hold-merge PR: no capsule, no line", () => {
    const intent = only({ pr: pr({ labels: [{ name: "hold-merge" }] }) });
    expect(intent.type).toBe("skip");
    expect(intent.sayOnPr).toBeUndefined();
  });

  it.each([
    [
      "a lane session's PR, which red-lane-pr.mjs owns",
      { user: { login: "skynet-envoy[bot]", type: "Bot" }, author_association: "CONTRIBUTOR" },
    ],
    [
      "dependabot's",
      { user: { login: "dependabot[bot]", type: "Bot" }, author_association: "NONE" },
    ],
    ["a stranger's", { user: { login: "someone", type: "User" }, author_association: "NONE" }],
    ["a person's own, without the session's footer", { body: "Hand-written." }],
    ["a draft, where verify does not run", { draft: true }],
    ["a closed one", { state: "closed" }],
    ["one aimed at another branch", { base: { ref: "platter/2026-11-01" } }],
    ["a fork's", { head: { ref: "x", sha: SHA, repo: { full_name: "someone/fork" } } }],
  ])("leaves %s alone", (_name, over) => {
    expect(only({ pr: pr(over) }).type).toBe("skip");
  });

  it("speaks to nothing when a newer push has replaced the head that failed", () => {
    const moved = pr({ head: { ...pr().head, sha: "fff0000" } });
    expect(only({ pr: moved }).type).toBe("skip");
  });

  it("files nothing that could arm a merge: no intent carries a merge or auto-merge step", () => {
    expect(JSON.stringify(route())).not.toMatch(/"type":"(merge|arm)|auto_merge/);
  });

  it("does nothing for a run that is not a failed Pipeline run on a PR", () => {
    expect(route({}, { run: { conclusion: "success" } })).toEqual([]);
    expect(route({}, { run: { name: "Fly logs" } })).toEqual([]);
    expect(route({}, { run: { event: "push" } })).toEqual([]);
    expect(routeRedSessionPr({ run: run(), failures: verifyRed }, {})).toEqual([]);
  });
});

describe("when it cannot attempt, one line says why", () => {
  /** The line itself: anything but one line on this PR, with no capsule, is a failure here. */
  const says = (intent: ReturnType<typeof only>) => {
    if (intent.type !== "say-on-pr" || intent.number !== NUMBER || intent.title) {
      throw new Error(`expected one line on #${NUMBER}, got ${JSON.stringify(intent)}`);
    }
    return intent.body ?? "";
  };

  it.each([
    ["Set up job"],
    ["Run actions/checkout@abc"],
    ["Restore npm cache"],
    ["Install dependencies"],
    [`Typecheck + lint + test (parallel)${LOST_RUNNER}`],
  ])("says a failure at `%s` is outside this PR's diff, and changes nothing", (step) => {
    const body = says(only({}, { failures: [{ job: "verify", step }] }));
    expect(body).toMatch(/outside this PR's own changes/);
    expect(body).toContain(markerFor(SHA, false));
  });

  it("says the same when GitHub never gave the run a runner", () => {
    const failures = [
      { job: "(no runner was ever assigned)", step: "GitHub never assigned a runner" },
    ];
    expect(says(only({}, { failures }))).toMatch(/outside this PR's own changes/);
  });

  it("attempts an install failure when the PR changed the dependencies", () => {
    const intent = only(
      { files: ["package-lock.json"] },
      { failures: [{ job: "verify", step: "Install dependencies" }] },
    );
    expect(intent.type).toBe("open-issue");
  });

  it("attempts when one red check is outside the diff and another is not", () => {
    const failures = [
      { job: "verify", step: "Set up job" },
      { job: "integration tests", step: "Build app/ and run the e2e suite" },
    ];
    const intent = only({}, { failures });
    expect(intent.type).toBe("open-issue");
    expect(intent.body).toContain("| **Job** | `integration tests` |");
  });

  it("does not send a session at a PR that changes a protected path", () => {
    const rules = [{ pattern: ".github/workflows/**", why: "x" }];
    const files = [".github/workflows/pipeline.yml", "a.ts"];
    const body = says(only({ files, rules }));
    expect(body).toContain("`.github/workflows/pipeline.yml`");
    expect(body).not.toContain("a.ts");
  });

  it("says so when the work dial or the spend breaker refuses", () => {
    const gate = { dispatch: false, reason: "refused: work-mode is halt" };
    expect(says(only({ gate }))).toContain("work-mode is halt");
  });

  it("refuses when the gate was not read: an unknown budget is not a budget", () => {
    expect(says(only({ gate: undefined }))).toMatch(/could not be read/);
  });

  it(`gives one PR ${RED_ATTEMPT_CAP} session, then says the rest instead of spending another`, () => {
    const comments = [
      { body: markerFor("older", true), user: { type: "Bot" }, author_association: "NONE" },
    ];
    const body = says(only({ comments }));
    expect(body).toMatch(/already had its repair session/);
    expect(body).toContain(markerFor(SHA, false));
  });

  it("counts an open capsule as the attempt, when its line on the PR was lost", () => {
    const openIssues = [{ number: 700, title: capsuleTitle(NUMBER) }];
    expect(says(only({ openIssues }))).toContain("#700");
  });
});

describe("it speaks once per head", () => {
  const spoke = (sha: string, attempted: boolean) => ({
    body: markerFor(sha, attempted),
    user: { type: "Bot" },
    author_association: "NONE",
  });

  it("stays quiet on a re-run of a head it has already spoken about", () => {
    expect(only({ comments: [spoke(SHA, false)] }).type).toBe("skip");
    expect(only({ comments: [spoke(SHA, true)] }).type).toBe("skip");
  });

  it("does not take a marker from a stranger's comment, in a public repo", () => {
    const forged = { ...spoke(SHA, true), user: { type: "User" }, author_association: "NONE" };
    expect(only({ comments: [forged] }).type).toBe("open-issue");
  });

  it("still attempts when an earlier head only got a why-not line", () => {
    expect(only({ comments: [spoke("older", false)] }).type).toBe("open-issue");
  });
});

describe("gatherRedSessionPr — reads only what the decision can use", () => {
  const fake = (routes: Record<string, unknown> = {}, { gate = () => clear as unknown } = {}) => {
    const calls: string[] = [];
    const rest = (path: string) => {
      calls.push(path);
      const hit = Object.entries(routes).find(([k]) => path.startsWith(k));
      if (!hit) throw new Error(`unexpected read: ${path}`);
      return hit[1];
    };
    return {
      calls,
      gather: (r: Record<string, unknown>, failures: RedPrFailure[] = verifyRed) =>
        gatherRedSessionPr(run(r), failures, { rest, gate: gate as never, rules: [] }),
    };
  };
  const readable = {
    [`pulls/${NUMBER}/files`]: FILES.map((filename) => ({ filename })),
    [`issues/${NUMBER}/comments`]: [],
    [`pulls/${NUMBER}`]: pr(),
  };

  it("reads the PR, its files, its comments and the gate for a session's red PR", () => {
    const { gather } = fake(readable);
    const got = gather({});
    expect(got.pr?.number).toBe(NUMBER);
    expect(got.files).toEqual(FILES);
    expect(got.comments).toEqual([]);
    expect(got.gate).toEqual(clear);
  });

  it("reads nothing at all for a run that is not a red PR's", () => {
    const { calls, gather } = fake();
    expect(gather({ name: "Fly logs" })).toEqual({});
    expect(gather({}, [{ job: "arm auto-merge" }])).toEqual({});
    expect(calls).toEqual([]);
  });

  it("stops at the PR when the PR is not a session's, so a lane's red costs one read", () => {
    const { calls, gather } = fake({
      [`pulls/${NUMBER}`]: pr({ user: { login: "skynet-envoy[bot]", type: "Bot" } }),
    });
    expect(gather({}).files).toBeUndefined();
    expect(calls).toEqual([`pulls/${NUMBER}`]);
  });

  it("finds the PR from the head commit when the run did not carry its number", () => {
    const { gather, calls } = fake({
      [`commits/${SHA}/pulls`]: [{ number: NUMBER, state: "open" }],
      ...readable,
    });
    expect(gather({ pull_requests: [] }).pr?.number).toBe(NUMBER);
    expect(calls[0]).toBe(`commits/${SHA}/pulls`);
  });

  it("turns a gate that throws into a refusal rather than a dead triage", () => {
    const { gather } = fake(readable, {
      gate: () => {
        throw new Error("malformed work-mode.json");
      },
    });
    const got = gather({});
    expect(got.gate?.dispatch).toBe(false);
    expect(got.gate?.reason).toContain("malformed work-mode.json");
  });
});

describe("the act", () => {
  it("posts over the issues comments endpoint, which takes a PR number", () => {
    const calls: string[][] = [];
    sayOnPr(NUMBER, "the line", {
      run: (_cmd, args) => {
        calls.push(args);
        return "";
      },
    });
    expect(calls[0]).toEqual([
      "api",
      "-X",
      "POST",
      `repos/{owner}/{repo}/issues/${NUMBER}/comments`,
      "-f",
      "body=the line",
    ]);
  });
});

describe("repair.mjs routes a pull_request run here", () => {
  const dryRun = (payload: object) => {
    const dir = mkdtempSync(join(tmpdir(), "red-session-payload-"));
    const file = join(dir, "event.json");
    writeFileSync(file, JSON.stringify(payload));
    try {
      return JSON.parse(
        execFileSync("node", ["scripts/moneypenny/repair.mjs", "--dry-run", "--event", file], {
          encoding: "utf8",
        }),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it("through a fixture's PR, and files the capsule the lane already dispatches from", () => {
    const [intent] = dryRun({
      repository: { default_branch: "main" },
      workflow_run: run(),
      failures: verifyRed,
      deps: { pr: pr(), files: FILES, comments: [], gate: clear, openIssues: [] },
    });
    expect(intent.type).toBe("open-issue");
    expect(intent.dispatch).toBe(true);
  });

  it("still ignores a red PR run it was told nothing about", () => {
    expect(
      dryRun({
        repository: { default_branch: "main" },
        workflow_run: run(),
        failures: verifyRed,
        deps: { openIssues: [] },
      }),
    ).toEqual([]);
  });
});
