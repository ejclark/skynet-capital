import { describe, expect, it } from "@rstest/core";
import { peekNext, route, wakeAfter } from "../../../scripts/moneypenny/index.mjs";
import {
  type RestIssue,
  type RestPr,
  syncPrInProgress,
} from "../../../scripts/moneypenny/pr-in-progress.mjs";
import { dispatchScan, endBuild, routeWake, wakeNext } from "../../../scripts/moneypenny/wake.mjs";

// THE NIGHT CHAIN (#5056 slice 2). A build that ends without a merge (a red PR, a held PR, a
// session that stopped short) must not stop the night's work. Measured over Oct 3–9: on the nights
// of Oct 4–5 and 5–6 the in-flight cap was full of `in-progress` labels on builds that had already
// ended, and nothing re-checked the queue until Eric's morning merge ran the stale-label sweep —
// 5.3h and 8.0h with ready work idle. Two causes, each specced below:
//   1. the PR-open sync put `in-progress` back seconds after the session took it off (plan/4469:
//      off 04:45:30Z, back on 04:45:54Z, held 8h), so a finished build kept its slot;
//   2. a slot freeing is not a merge, so nothing woke the queue when one did.
// Every read is injected: no `gh`, no network (admission.spec.ts's header says why that matters).

type Issue = {
  number: number;
  body: string;
  labels: { name: string }[];
  createdAt: string;
};

const ready = (number: number, labels: string[], createdAt = "2026-10-01T00:00:00Z"): Issue => ({
  number,
  body: `**Do it.**\n\n| | |\n|---|---|\n| **Surface** | surface-${number} |\n`,
  labels: ["ready", ...labels].map((name) => ({ name })),
  createdAt,
});

const mode = (position: "halt" | "conserve" | "normal" | "surge") => ({
  position,
  caps: { inFlightCap: 3 },
  until: null,
  reason: `set to ${position}`,
});

/** No plan waiting to continue — injected so nothing reads live GitHub. */
const noContinuation = () => ({
  continuations: { candidates: [], caps: { continuationsPerDay: 3 } },
  inFlight: [],
  mode: mode("normal"),
  now: Date.parse("2026-10-10T00:00:00Z"),
});

/** One wake, as the router runs it after `in-progress` comes off #4469. `leased` are the issues a
 *  live claim lease still holds — a build that ended normally keeps its lease for the TTL. */
function wake({
  queue,
  inFlight = [],
  openPrs = [],
  leased = [],
  position = "normal",
}: {
  queue: Issue[];
  inFlight?: Issue[];
  openPrs?: [number, number][];
  leased?: number[];
  position?: "halt" | "conserve" | "normal" | "surge";
}) {
  let dispatches = 0;
  const result = wakeNext({
    freed: 4469,
    peek: (skip?: number) =>
      peekNext({
        readMode: () => mode(position),
        readReady: () => queue.filter((i) => i.number !== skip),
        readInFlight: () => inFlight,
        readPrIssues: () => new Map(openPrs),
        readPlans: () => [],
        continuation: noContinuation,
      }),
    isHeld: (n: number) => leased.includes(n),
    dispatch: () => {
      dispatches += 1;
    },
  });
  return { result, dispatches };
}

const openIssue = (labels: string[] = []): RestIssue => ({
  state: "open",
  labels: labels.map((name) => ({ name })),
});

/** `syncPrInProgress` over one PR and its named issues, recording every label write. */
function sync(pr: RestPr, event: string, issues: Record<number, RestIssue>, leased: number[] = []) {
  const writes: string[] = [];
  const out = syncPrInProgress(pr.number ?? 0, event, {
    readPr: () => pr,
    readIssueFn: (n: number) => issues[n] ?? { state: "closed" },
    listOpenPrs: () => [],
    isLeased: (n: number) => leased.includes(n),
    setLabel: (n: number, add: boolean) => {
      writes.push(`${add ? "+" : "-"}${n}`);
      return true;
    },
  });
  return { writes, plan: out.plan };
}

describe("a lane build that ended frees its slot — the PR-open sync no longer undoes its last write", () => {
  it("a plan build's own PR does not put in-progress back once the session took it off", () => {
    const pr = {
      number: 4780,
      title: "feat(playbooks): the pair table",
      body: "Part of #4469",
      head: { ref: "plan/4469" },
    };
    const { writes, plan } = sync(pr, "opened", { 4469: openIssue(["plan", "ready"]) });
    expect(writes).toEqual([]);
    expect(plan[0]?.reason).toMatch(/lane build/);
  });

  it("nor a feedback build's, nor any other issue the lane's PR names (a slice's sub-issue)", () => {
    const pr = {
      number: 4790,
      title: "fix(x)",
      body: "Closes #4777\nPart of #4616",
      head: { ref: "feedback/4777" },
    };
    const { writes } = sync(pr, "edited", { 4777: openIssue(["feedback"]), 4616: openIssue() });
    expect(writes).toEqual([]);
  });

  it("a PR from any other path (a live session, /grind, the repair lane) still marks what it names", () => {
    const pr = { number: 4791, title: "fix(y) (#12)", body: "", head: { ref: "fix/12-y" } };
    expect(sync(pr, "opened", { 12: openIssue() }).writes).toEqual(["+12"]);
  });

  it("closing a lane build's PR still takes a label left on it off", () => {
    const pr = {
      number: 4780,
      title: "feat(x)",
      body: "Part of #4469",
      head: { ref: "plan/4469" },
    };
    expect(sync(pr, "closed", { 4469: openIssue(["in-progress"]) }).writes).toEqual(["-4469"]);
  });
});

describe("a freed build slot wakes the queue — merge or no merge", () => {
  const unlabeled = (name: string, n = 4469) => ({
    eventName: "issues",
    action: "unlabeled",
    payload: { action: "unlabeled", label: { name }, issue: { number: n, labels: [] } },
  });

  it("in-progress coming off an issue routes exactly one wake", () => {
    expect(route(unlabeled("in-progress"))).toEqual([{ kind: "wake-next", issueNumber: 4469 }]);
  });

  it("a claim putting the label on, or another label coming off, wakes nothing", () => {
    expect(routeWake({ ...unlabeled("ready") })).toEqual([]);
    expect(routeWake({ ...unlabeled("in-progress"), action: "labeled" })).toEqual([]);
    expect(routeWake({ ...unlabeled("in-progress"), eventName: "push" })).toEqual([]);
  });

  it("a lane that ended unmerged (its PR still open) dispatches the next ready issue", () => {
    const queue = [ready(4469, ["plan"], "2026-09-01T00:00:00Z"), ready(4616, ["feedback"])];
    const { result, dispatches } = wake({ queue, openPrs: [[4469, 4780]] });
    expect(dispatches).toBe(1);
    expect(result).toMatchObject({ dispatched: true, pick: 4616 });
  });

  it("a lane that merged still dispatches the next", () => {
    const { result, dispatches } = wake({ queue: [ready(4616, ["plan"])] });
    expect(dispatches).toBe(1);
    expect(result.pick).toBe(4616);
  });

  it("an empty or full queue dispatches nothing — no wasted run", () => {
    expect(wake({ queue: [] }).dispatches).toBe(0);
    const full = [ready(1, ["plan"]), ready(2, ["plan"]), ready(3, ["plan"])];
    expect(wake({ queue: [ready(4616, ["plan"])], inFlight: full }).dispatches).toBe(0);
  });

  it("the work spigot's halt still stops everything — a fast-track bug included", () => {
    const queue = [ready(5100, ["feedback", "bug", "fast-track"])];
    const { result, dispatches } = wake({ queue, position: "halt" });
    expect(dispatches).toBe(0);
    expect(result.dispatched).toBe(false);
  });

  it("a bug on fast-track still goes first, ahead of older and higher-ranked work", () => {
    const queue = [
      ready(4437, ["plan", "P1"], "2026-09-01T00:00:00Z"),
      ready(5100, ["feedback", "bug", "fast-track"], "2026-10-10T00:00:00Z"),
    ];
    const { result, dispatches } = wake({ queue });
    expect(dispatches).toBe(1);
    expect(result.pick).toBe(5100);
  });

  it("a build that failed is not retried by its own wake — a failing build cannot loop all night", () => {
    // `--release` freed the lease and the label; #4469 is ready and tops the queue again.
    const queue = [ready(4469, ["plan"], "2026-09-01T00:00:00Z"), ready(4616, ["feedback"])];
    const { result, dispatches } = wake({ queue });
    expect(dispatches).toBe(0);
    expect(result.line).toMatch(/waits for the next merge/);
  });

  it("a build that ended holding its lease steps aside: the wake starts the work behind it", () => {
    const queue = [ready(4469, ["plan"], "2026-09-01T00:00:00Z"), ready(4616, ["feedback"])];
    const { result, dispatches } = wake({ queue, leased: [4469] });
    expect(dispatches).toBe(1);
    expect(result.pick).toBe(4616);
    expect(wake({ queue: [queue[0] as Issue], leased: [4469] }).dispatches).toBe(0);
  });

  it("the router's wake reads the lease under the lane's own slug, and looks past a held pick", () => {
    const queue = [ready(4469, ["plan"], "2026-09-01T00:00:00Z"), ready(4616, ["feedback"])];
    const asked: string[] = [];
    let dispatches = 0;
    const line = wakeAfter(4469, {
      peekDeps: {
        readMode: () => mode("normal"),
        readReady: () => queue,
        readInFlight: () => [],
        readPrIssues: () => new Map(),
        readPlans: () => [],
        continuation: noContinuation,
      },
      claimed: (slug: string) => {
        asked.push(slug);
        return slug === "plan-4469";
      },
      dispatch: () => {
        dispatches += 1;
      },
    });
    expect(asked).toEqual(["plan-4469"]);
    expect(dispatches).toBe(1);
    expect(line).toMatch(/#4616/);
  });

  it("the dispatch is the push pass's own call: the events workflow, as a scan", () => {
    const calls: string[][] = [];
    dispatchScan({ exec: (_cmd: string, args: string[]) => calls.push(args), ref: "main" });
    expect(calls).toEqual([
      ["workflow", "run", "moneypenny-events.yml", "--ref", "main", "-f", "command=scan"],
    ]);
  });
});

describe("--end-build: every ending takes in-progress off; the lease stays", () => {
  it("takes the label off the build's issue, and writes nothing else", () => {
    const writes: string[] = [];
    const line = endBuild("plan-4612", {
      setLabel: (n: number, add: boolean) => {
        writes.push(`${add ? "+" : "-"}${n}`);
        return true;
      },
    });
    expect(writes).toEqual(["-4612"]);
    expect(line).toMatch(/#4612/);
  });

  it("a slug that names no lane build writes nothing", () => {
    const writes: string[] = [];
    endBuild("research-pce", {
      setLabel: (n: number) => {
        writes.push(String(n));
        return true;
      },
    });
    expect(writes).toEqual([]);
  });
});
