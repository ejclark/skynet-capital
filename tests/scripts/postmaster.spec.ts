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

  it("issue bodies carry the Claude attribution footer", () => {
    const intents = dryRun("push-one-due.json") as Intent[];

    for (const i of intents) {
      expect(i.body).toContain("_Generated by [Claude Code](https://claude.ai/code)_");
    }
  });
});
