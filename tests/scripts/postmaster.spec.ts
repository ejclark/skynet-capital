import { execFileSync } from "node:child_process";

// The postmaster's routing gate — every branch of scripts/postmaster.mjs `route()` exercised by
// feeding fixture event payloads through `--dry-run --event <fixture>` and asserting the INTENTS
// it prints. This is the coverage the retired workflows never had: their logic lived in `run:`
// blocks where no spec could reach it. Static, no network — the dry run never executes an intent.
//
// The handoff lanes (inbox import, flip button, ready-sweep, executing-stall audit) were retired
// 2026-08-21 — design handoffs live as GitHub issues now (docs/HANDOFFS.md). What remains routed
// here: the event-research sweep, the release-claim escape hatch, and the unclaimed-dispatch audit.
const dryRun = (fixture: string): unknown[] => {
  const out = execFileSync(
    "node",
    ["scripts/postmaster.mjs", "--dry-run", "--event", `tests/fixtures/events/${fixture}`],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  return JSON.parse(out);
};

type Intent = {
  kind: string;
  title?: string;
  label?: { name: string };
  body?: string;
  slug?: string;
  reason?: string;
  issueNumber?: number;
  actor?: string;
};

describe("postmaster routing", () => {
  it("a push with nothing due routes to nothing — the common, correct outcome", () => {
    expect(dryRun("push-nothing-due.json")).toHaveLength(0);
  });

  it("a push queues one issue per never-assessed event, with the right label — interval-elapsed stays with the research lane", () => {
    const intents = dryRun("push-one-due.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("open-issue");
    expect(intents[0]?.title).toBe("[event-research] fomc-2026-12-09");
    expect(intents[0]?.label?.name).toBe("event-research");
  });

  it("dedupes by exact open-issue title, so a re-push while queued does nothing", () => {
    expect(dryRun("push-already-queued.json")).toHaveLength(0);
  });

  it("an issue-label event has no router lane — the feedback claim is a workflow step, never a route", () => {
    // Labels reach the workflow (the feedback lane's claim step reads them there); route() itself
    // must stay silent so a label can never trigger sweep-side work by accident.
    const out = execFileSync(
      "node",
      [
        "-e",
        `import("./scripts/postmaster.mjs").then((m) => {
           const intents = m.route({ eventName: "issues", action: "labeled",
             payload: { label: { name: "feedback" }, issue: { number: 1, title: "x" } } }, {});
           console.log(JSON.stringify(intents));
         });`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(JSON.parse(out)).toEqual([]);
  });

  it("dueForResearch filters out events whose research PR is still open — the per-push dedupe", () => {
    // The event lane rides EVERY push (no cron, by directive — docs/ROUTINES.md). This filter plus
    // the mandated `research/<id>` branch name is what stops back-to-back merges double-researching.
    const out = execFileSync(
      "node",
      [
        "-e",
        `import("./scripts/postmaster.mjs").then((m) => {
           const due = [{ id: "cpi-2026-09-11", reason: "interval-elapsed" },
                        { id: "fomc-2026-12-09", reason: "never-assessed" }];
           const heads = ["research/cpi-2026-09-11", "feedback/42"];
           console.log(JSON.stringify(m.dueForResearch(due, heads).map((e) => e.id)));
         });`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(JSON.parse(out)).toEqual(["fomc-2026-12-09"]);
  });

  it("the release-claim command frees a wedged lease, attributing the dispatching human", () => {
    // The escape hatch for "the build died holding the claim". Dispatch-only by design: the sweep
    // must never release someone else's claim, or the lease stops being a lease.
    const intents = dryRun("dispatch-release-claim.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("release-claim");
    expect(intents[0]?.slug).toBe("brief-horizon");
    expect(intents[0]?.actor).toBe("ejclark");
  });

  it("release-claim without a slug errors rather than guessing which lease to break", () => {
    const intents = dryRun("dispatch-release-claim-no-slug.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("error");
    expect(intents[0]?.reason).toContain("no slug");
  });

  it("the audit flags an unclaimed dispatch past the threshold, never a fresh one", () => {
    const intents = dryRun("audit-stalled.json") as (Intent & { quietDays?: number })[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-stall");
    expect(intents[0]?.issueNumber).toBe(412);
    // jobs-2026-09-04 at 0 quiet days is NOT flagged
    expect(intents.some((i) => i.issueNumber === 414)).toBe(false);
  });

  it("the audit is silent when everything is inside the threshold", () => {
    expect(dryRun("audit-all-fresh.json")).toHaveLength(0);
  });

  it("the audit never re-flags a stall it already labelled — one ping per stall, not per push", () => {
    // The audit rides every push (2026-08-19); the stall-flagged label is its memory. Without this,
    // open receipt issues would each draw a fresh comment on every merge past 2 quiet days.
    const intents = dryRun("audit-already-flagged.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.issueNumber).toBe(413);
  });

  // SILENCE IS THE WORSE FAILURE. #455 sat 41 hours with no receipt, no triage, and no label — the
  // member saw nothing at all. An over-escalation at least tells someone something; a dropped issue
  // teaches a member that filing feedback does nothing.
  it("the audit flags a feedback issue the lane never spoke on, never a fresh one", () => {
    const intents = dryRun("audit-silent-feedback.json") as (Intent & {
      hoursSinceFiled?: number;
    })[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-silent-feedback");
    expect(intents[0]?.issueNumber).toBe(455);
    expect(intents[0]?.body).toContain("needs-info");
    // filed an hour ago — the build session may still be running
    expect(intents.some((i) => i.issueNumber === 456)).toBe(false);
  });

  // #897 (closing #877's deferred slice 3): a ready-flip comment on a plan issue that never got
  // claimed or built is invisible from Eric's side — this is the audit lane that surfaces it.
  it("the audit flags a plan issue whose ready-flip was never claimed, never a fresh one", () => {
    const intents = dryRun("audit-plan-stall.json") as (Intent & { hoursSinceReady?: number })[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-plan-stall");
    expect(intents[0]?.issueNumber).toBe(466);
    expect(intents[0]?.hoursSinceReady).toBe(50);
    expect(intents[0]?.body).toContain("claim/plan-466");
    // ready 3h ago — the trigger may still be running
    expect(intents.some((i) => i.issueNumber === 467)).toBe(false);
  });

  it("issue bodies carry the Claude attribution footer", () => {
    const intents = dryRun("push-one-due.json") as Intent[];

    for (const i of intents) {
      expect(i.body).toContain("_Generated by [Claude Code](https://claude.ai/code)_");
    }
  });
});

// ── the 2026-08-22 automation-gap round ───────────────────────────────────────
// Measured baseline that motivated these: of 7 feedback issues ever filed, 0 went
// filed→built→merged→closed untouched, and 3 (43%) produced no build output at all. Eric's
// definition of done is "member got a real answer, fast" — so silence is the failure to attack.

describe("closing the last mile", () => {
  // #447 shipped in #448 — `Closes #447` on line 1, merged to main, released as v1.181.1 — and the
  // issue is still open. So is #449 via #452. Both PRs were opened AND merged by a bot; the two
  // that did close were human-merged. Rather than chase GitHub's reason, the sweep closes them.
  it("closes a feedback issue whose PR has merged, instead of trusting `Closes #`", () => {
    const intents = dryRun("sweep-shipped-feedback.json") as (Intent & { pr?: number })[];

    expect(intents).toHaveLength(2);
    expect(intents.map((i) => [i.issueNumber, i.pr])).toEqual([
      [447, 448],
      [449, 452],
    ]);
    expect(intents[0]?.kind).toBe("close-shipped");
    expect(intents[0]?.body).toContain("Shipped");
  });

  // 2026-08-28 triage: #510/#706/#707/#720 all had their research docs merged (PRs
  // #695/#727, #721, #715, #712) but stayed open — the sweep only ever swept `feedback`, so
  // `event-research` issues had no last-mile net at all. This is that net.
  it("closes an event-research issue whose PR has merged, same as the feedback lane", () => {
    const intents = dryRun("sweep-shipped-events.json") as (Intent & { pr?: number })[];

    expect(intents).toHaveLength(2);
    expect(intents.map((i) => [i.issueNumber, i.pr])).toEqual([
      [510, 695],
      [706, 712],
    ]);
    expect(intents[0]?.kind).toBe("close-shipped");
    expect(intents[0]?.body).toContain("Shipped");
  });
});

// ── the sweep that could never fire (2026-08-22, #494) ────────────────────────
// #475 shipped in PR #492 and stayed open. The sweep — the net built for exactly that — printed
// `· nothing to do` on a manual scan AND a real push run. The cause was not an under-reporting
// query: `gh issue list --json closedByPullRequestsReferences` returns `{id, number, repository,
// url}` per reference and NO state, so `refs.find((p) => p.state === "MERGED")` compared
// `undefined === "MERGED"` on every reference gh has ever returned. Dead by construction, and
// invisible because an empty result is also the right answer on nearly every push.
const resolve = (issues: unknown, merged: number[], recheck: unknown = {}): unknown => {
  const out = execFileSync(
    "node",
    [
      "-e",
      `import("./scripts/postmaster.mjs").then((m) => {
         const merged = new Set(${JSON.stringify(merged)});
         const recheck = ${JSON.stringify(recheck)};
         const warnings = [];
         const shipped = m.resolveShipped(${JSON.stringify(issues)}, {
           isMerged: (ref) => merged.has(ref.number),
           recheckRefs: (n) => recheck[String(n)] ?? [],
           warn: (msg) => warnings.push(msg),
         });
         console.log(JSON.stringify({ shipped, warnings }));
       });`,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  return JSON.parse(out);
};

describe("resolving which feedback issues have shipped", () => {
  it("names the merged PR for a reference gh returns without a state field — #475's exact shape", () => {
    // Verbatim from `gh issue list --state all --label feedback` on 2026-08-22: a reference object
    // with id/number/repository/url and nothing else. The old filter dropped this on the floor.
    const issues = [
      {
        number: 475,
        title: "Mission control on the account desk",
        closedByPullRequestsReferences: [
          {
            id: "PR_kwDOTh1FlM8AAAABAqx0Zw",
            number: 492,
            repository: { name: "skynet-capital", owner: { login: "ejclark" } },
            url: "https://github.com/ejclark/skynet-capital/pull/492",
          },
        ],
      },
    ];

    expect(resolve(issues, [492])).toEqual({
      shipped: [{ number: 475, title: "Mission control on the account desk", pr: 492 }],
      warnings: [],
    });
  });

  it("leaves an issue alone while its PR is still open — only a merge is a ship", () => {
    const issues = [
      { number: 494, title: "in flight", closedByPullRequestsReferences: [{ number: 500 }] },
    ];

    expect(resolve(issues, [])).toEqual({ shipped: [], warnings: [] });
  });

  it("stays silent and does nothing when no feedback issue has a merged PR", () => {
    const issues = [
      { number: 455, title: "no PR at all", closedByPullRequestsReferences: [] },
      { number: 449, title: "also none" },
    ];

    expect(resolve(issues, [452])).toEqual({ shipped: [], warnings: [] });
  });

  it("re-checks the issue individually before concluding there is nothing to do, and says so", () => {
    // The fallback path: the list query showed nothing, the per-issue read knows better. It runs
    // only for an issue that looked empty, so the everyday quiet push pays for none of it — and
    // the warning is what stops a future under-reporting query passing as an empty queue.
    const issues = [{ number: 447, title: "shipped in #448", closedByPullRequestsReferences: [] }];

    expect(resolve(issues, [448], { 447: [{ number: 448 }] })).toEqual({
      shipped: [{ number: 447, title: "shipped in #448", pr: 448 }],
      warnings: [
        "#447: the list query showed no merged PR, but the per-issue re-check found #448 — the list query is under-reporting",
      ],
    });
  });

  it("honours an explicit MERGED state without spending a lookup, if gh ever returns one", () => {
    const issues = [
      {
        number: 443,
        title: "state included",
        closedByPullRequestsReferences: [{ number: 457, state: "MERGED" }],
      },
    ];

    // `merged` is empty — nothing was looked up, and it still resolved.
    expect(resolve(issues, [])).toEqual({
      shipped: [{ number: 443, title: "state included", pr: 457 }],
      warnings: [],
    });
  });
});

describe("the stall audit sees outcomes, not chatter", () => {
  // THE DEFECT THIS FIXES: the audit keyed on `comments.length === 0`, but the build prompt posts a
  // receipt as step 0 — before the branch and the build. So the likeliest failure of all (receipt
  // posted, session dies at typecheck or PR-open) left exactly one comment and was invisible
  // forever. #475 sat in precisely that state.
  it("flags an issue that got a receipt and then died", () => {
    const intents = dryRun("audit-receipt-then-died.json") as (Intent & {
      hoursSinceFiled?: number;
    })[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-silent-feedback");
    expect(intents[0]?.issueNumber).toBe(475);
  });
});

// THE DEFECT THIS FIXES: `execute()` was a bare `for` loop, so the first throwing intent unwound
// the whole process — every later intent skipped and the step-summary receipt never written. One
// un-permitted `gh issue comment` took the router's own accounting offline across seven
// consecutive pushes and left no record of which intent had failed.
//
// Driven the same way every other branch here is: a real subprocess running the real module, with
// a throwing fake in place of the executor. `runIntents` is pure given that injection, so no
// network and no fixture file are needed.
type Probe = { seen: string[]; errors: string[]; receipt: string[]; failed: number };

const probe = (intents: unknown[], throwOn: string, message: string): Probe =>
  JSON.parse(
    execFileSync(
      "node",
      [
        "-e",
        `import("./scripts/postmaster.mjs").then((m) => {
           const intents = JSON.parse(process.argv[1]);
           const seen = [];
           const errors = [];
           const run = (i) => {
             seen.push(i.kind);
             if (i.kind === process.argv[2]) throw new Error(process.argv[3]);
             return "did " + i.kind;
           };
           const r = m.runIntents(intents, run, (msg) => errors.push(msg));
           console.log(JSON.stringify({ seen, errors, ...r }));
         });`,
        JSON.stringify(intents),
        throwOn,
        message,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  );

describe("intent isolation", () => {
  const threeIntents = [
    { kind: "close-shipped", issueNumber: 546 },
    { kind: "comment", issueNumber: 546 },
    { kind: "flag-stall", issueNumber: 475 },
  ];

  it("carries on past a throwing intent instead of unwinding the run", () => {
    const { seen, receipt, failed } = probe(threeIntents, "comment", "403 (addComment)");

    // The intent AFTER the failure ran — that is the whole point.
    expect(seen).toEqual(["close-shipped", "comment", "flag-stall"]);
    expect(failed).toBe(1);
    expect(receipt).toHaveLength(3);
    expect(receipt[2]).toBe("did flag-stall");
  });

  it("names the failed intent and its reason in the receipt, so the run leaves evidence", () => {
    const { receipt, errors } = probe(
      [{ kind: "comment", issueNumber: 546 }],
      "comment",
      "Resource not accessible by personal access token (addComment)\nsecond line",
    );

    expect(receipt[0]).toContain("comment #546");
    expect(receipt[0]).toContain("Resource not accessible by personal access token");
    // First line only — a receipt is scannable or it is not read.
    expect(receipt[0]).not.toContain("second line");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("comment #546");
  });

  it("still fails the run — isolating the blast radius never launders the result", () => {
    // A write we could not make is a real fault; a green run would be a lie about work that did
    // not happen. Isolation shrinks the blast radius, it never changes the verdict.
    const { failed } = probe(
      [{ kind: "comment", issueNumber: 1 }, { kind: "noop" }],
      "comment",
      "403",
    );
    expect(failed).toBe(1);
  });

  it("reports every intent's result and fails nothing when nothing throws", () => {
    const { receipt, failed } = probe([{ kind: "noop" }, { kind: "noop" }], "never", "unused");
    expect(failed).toBe(0);
    expect(receipt).toEqual(["did noop", "did noop"]);
  });

  it("labels an intent by whatever identifies its target", () => {
    const labels = JSON.parse(
      execFileSync(
        "node",
        [
          "-e",
          `import("./scripts/postmaster.mjs").then((m) => {
             console.log(JSON.stringify(JSON.parse(process.argv[1]).map(m.intentLabel)));
           });`,
          JSON.stringify([
            { kind: "comment", issueNumber: 546 },
            { kind: "open-issue", title: "[event-research] x" },
            { kind: "release-claim", slug: "feedback-1" },
            { kind: "noop" },
          ]),
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      ),
    ) as string[];

    expect(labels).toEqual([
      "comment #546",
      "open-issue `[event-research] x`",
      "release-claim `claim/feedback-1`",
      "noop",
    ]);
  });
});
