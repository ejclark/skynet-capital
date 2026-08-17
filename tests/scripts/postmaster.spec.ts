import { execFileSync } from "node:child_process";

// The postmaster's routing gate — every branch of scripts/postmaster.mjs `route()` exercised by
// feeding fixture event payloads through `--dry-run --event <fixture>` and asserting the INTENTS
// it prints. This is the coverage the four retired workflows never had: their logic lived in
// `run:` blocks where no spec could reach it, and that is exactly where the 2026-08-17 double-fire
// lived. Static, no network — the dry run never executes an intent.
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
  url?: string;
  reason?: string;
  issueNumber?: number;
  actor?: string;
};

describe("postmaster routing", () => {
  it("labelling an issue handoff-inbox yields exactly one import intent", () => {
    const intents = dryRun("issue-labeled-inbox.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("import-zip");
    expect(intents[0]?.slug).toBe("skynet-capital-trailer-debut");
    expect(intents[0]?.url).toContain("/user-attachments/files/12345678/");
  });

  it("the opened half of an opened+labeled pair routes to nothing — the 2026-08-17 double-fire, pinned", () => {
    // Creating an issue that already carries the label emits BOTH `opened` and `labeled`. The old
    // workflow matched both and imported twice. Only the `labeled` event may act.
    const intents = dryRun("issue-opened-with-label.json") as Intent[];

    expect(intents.filter((i) => i.kind === "import-zip")).toHaveLength(0);
  });

  it("a label other than handoff-inbox is a no-op", () => {
    const intents = dryRun("issue-labeled-other.json") as Intent[];

    expect(intents.filter((i) => i.kind === "import-zip")).toHaveLength(0);
    expect(intents.filter((i) => i.kind === "open-issue")).toHaveLength(0);
  });

  it("re-labelling while a PR for the slug is open comments instead of importing twice", () => {
    const intents = dryRun("issue-labeled-retry.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("comment");
    expect(intents[0]?.body).toContain("handoff/trailer-debut");
    expect(intents[0]?.kind).not.toBe("import-zip");
  });

  it("a push with nothing ready and nothing due routes to nothing — draft is inert, as a spec", () => {
    expect(dryRun("push-nothing-ready.json")).toHaveLength(0);
  });

  it("a push queues one issue per ready handoff and per never-assessed event, with the right labels", () => {
    const intents = dryRun("push-one-ready.json") as Intent[];

    expect(intents).toHaveLength(2);
    const [handoff, event] = intents;
    expect(handoff?.kind).toBe("open-issue");
    expect(handoff?.title).toBe("[handoff] brief-horizon");
    expect(handoff?.label?.name).toBe("handoff");
    expect(handoff?.body).toContain("ready` → `executing");
    // interval-elapsed events belong to the daily Routine, not the watcher
    expect(event?.title).toBe("[event-research] fomc-2026-12-09");
    expect(event?.label?.name).toBe("event-research");
  });

  it("dedupes by exact open-issue title, so a re-push while queued does nothing", () => {
    expect(dryRun("push-already-queued.json")).toHaveLength(0);
  });

  it("the flip command flips a draft handoff, attributing the dispatching human", () => {
    const intents = dryRun("dispatch-flip-draft.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flip-handoff");
    expect(intents[0]?.slug).toBe("brief-horizon");
    expect(intents[0]?.actor).toBe("ejclark");
  });

  it("the flip command refuses a handoff that is not draft — the lock stays lockable", () => {
    const intents = dryRun("dispatch-flip-executing.json") as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("error");
    expect(intents[0]?.reason).toContain("executing");
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

  it("the audit flags a quiet executing handoff and an unclaimed dispatch, never a fresh one", () => {
    const intents = dryRun("audit-stalled.json") as (Intent & { quietDays?: number })[];

    expect(intents).toHaveLength(2);
    expect(intents[0]?.kind).toBe("flag-stall");
    expect(intents[0]?.slug).toBe("desk-v2");
    expect(intents[0]?.body).toContain("the lock is only honest while its holder is alive");
    expect(intents[1]?.issueNumber).toBe(412);
    // brief-horizon at 0 quiet days is NOT flagged
    expect(intents.some((i) => i.slug === "brief-horizon")).toBe(false);
  });

  it("the audit is silent when everything is inside the threshold", () => {
    expect(dryRun("audit-all-fresh.json")).toHaveLength(0);
  });

  it("issue bodies carry the Claude attribution footer", () => {
    const intents = dryRun("push-one-ready.json") as Intent[];

    for (const i of intents) {
      expect(i.body).toContain("_Generated by [Claude Code](https://claude.ai/code)_");
    }
  });
});
