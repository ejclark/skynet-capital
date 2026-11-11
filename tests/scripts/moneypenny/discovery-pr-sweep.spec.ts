import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { audit } from "../../../scripts/moneypenny/audit.mjs";
import {
  closeStaleDiscovery,
  DISCOVERY_FLAG_MARKER,
  DISCOVERY_PR_HOURS,
  DISCOVERY_RETAKE_CAP,
  type DiscoveryPr,
  discoveryPrsOrNone,
  discoverySweep,
  discoverySweepIntents,
  flagStaleDiscovery,
  gatherDiscoveryPrs,
  lastFlagSha,
} from "../../../scripts/moneypenny/discovery-pr-sweep.mjs";
import { branchFor, planPass } from "../../../src/domain/discovery-pass.js";
import type { DiscoveryAsk } from "../../../src/domain/discovery-queue.js";

// #7341: the daily discovery lane skips any ask whose `discovery/<slug>` branch is an open PR and
// counts every open `discovery/` head against its research ceiling, with no age limit. A red or
// conflicted discovery PR had no owner, so its member's question sat "In line" forever, and six of
// them (two under conserve) stopped the lane taking anything new.

const NOW = Date.parse("2026-11-10T12:00:00Z");
const HOUR = 36e5;
const at = (ms: number) => new Date(ms).toISOString();
const REPO = { full_name: "ejclark/skynet-capital" };
const LANE = { login: "skynet-envoy[bot]" };

type Check = ReturnType<typeof check>;
const check = (name: string, conclusion: string | null, whenMs: number) => ({
  name,
  status: "completed",
  conclusion,
  completed_at: at(whenMs),
  started_at: at(whenMs - 0.1 * HOUR),
  html_url: `https://github.com/x/actions/runs/1/job/${name}`,
});

interface Row {
  number: number;
  title: string;
  draft: boolean;
  labels: { name: string }[];
  user: { login: string };
  created_at: string;
  updated_at: string;
  merged_at?: string | null;
  head: { ref: string; sha: string; repo: { full_name: string } };
  base: { repo: { full_name: string } };
}
const row = (number: number, ref: string, openedMs: number, over: Partial<Row> = {}): Row => ({
  number,
  title: `docs(research): discovery of ${ref}`,
  draft: false,
  labels: [],
  user: LANE,
  created_at: at(openedMs),
  updated_at: at(openedMs),
  head: { ref, sha: `sha${number}`, repo: REPO },
  base: { repo: REPO },
  ...over,
});

/** A small GitHub: open and closed PRs, each head's checks and mergeable state, and PR comments. */
class World {
  open: Row[] = [];
  closed: Row[] = [];
  checks = new Map<string, Check[]>();
  mergeable = new Map<number, boolean | null>();
  comments = new Map<number, { body: string }[]>();
  calls: string[] = [];
  rest = (path: string): unknown => {
    this.calls.push(path);
    if (path.startsWith("pulls?state=open")) return this.open;
    const closed = /^pulls\?state=closed&head=[^:]+:([^&]+)/.exec(path);
    if (closed) return this.closed.filter((p) => p.head.ref === closed[1]);
    const runs = /^commits\/([^/]+)\/check-runs/.exec(path);
    if (runs) return { check_runs: this.checks.get(runs[1] ?? "") ?? [] };
    const pull = /^pulls\/(\d+)$/.exec(path);
    if (pull) return { mergeable: this.mergeable.get(Number(pull[1])) ?? true };
    const comments = /^issues\/(\d+)\/comments/.exec(path);
    if (comments) return this.comments.get(Number(comments[1])) ?? [];
    throw new Error(`unexpected read: ${path}`);
  };
  add(pr: Row, { red = false, conflicting = false, checkAtMs = Date.parse(pr.created_at) } = {}) {
    this.open.push(pr);
    this.checks.set(pr.head.sha, [check("verify", red ? "failure" : "success", checkAtMs)]);
    this.mergeable.set(pr.number, !conflicting);
  }
  /** What the audit's act stage does with an intent, against this world. */
  apply(i: { kind: string; prNumber?: number; body?: string }, nowMs: number) {
    const pr = this.open.find((p) => p.number === i.prNumber);
    if (!pr) return;
    if (i.kind === "close-stale-discovery") {
      this.open = this.open.filter((p) => p !== pr);
      this.closed.push({ ...pr, merged_at: null });
    }
    if (i.kind === "flag-stale-discovery") {
      this.comments.set(pr.number, [
        ...(this.comments.get(pr.number) ?? []),
        { body: i.body ?? "" },
      ]);
      pr.updated_at = at(nowMs);
    }
  }
}

const ask = (kind: DiscoveryAsk["kind"], subject: string): DiscoveryAsk => ({
  id: `${kind}:${subject}`,
  kind,
  subject,
  askedAt: "2026-11-01T10:00:00.000Z",
  askers: ["abcdef0123"],
});

// The lane's own count, as moneypenny-discovery.yml computes `SPENT` from the open heads.
const WORKFLOW = readFileSync(".github/workflows/moneypenny-discovery.yml", "utf8");
const SPENT_FILTER =
  'SPENT=$(jq \'[.[] | select(startswith("research/") or startswith("discovery/"))] | length\' "$HEADS_FILE")';
const spentOf = (heads: string[]) =>
  heads.filter((h) => h.startsWith("research/") || h.startsWith("discovery/")).length;

/**
 * Thirty days of the real loop: each day one audit tick (gather → audit() → acts on the world), then
 * the daily pass (open heads → SPENT → planPass). A taken ask's research lands on the shelf, or
 * opens another red PR when `redAgain` says so. Returns the day each ask was taken and the last
 * day's SPENT.
 */
function simulate(
  world: World,
  queue: DiscoveryAsk[],
  ceiling: number,
  { days = 30, redAgain = (_a: DiscoveryAsk): boolean => false, position = "normal" } = {},
) {
  const shelf = new Set<string>();
  const taken = new Map<string, number[]>();
  let spent = 0;
  let next = 9000;
  for (let day = 0; day < days; day++) {
    const nowMs = NOW + day * 24 * HOUR;
    const candidates = gatherDiscoveryPrs(nowMs, { rest: world.rest });
    const workMode = { mode: { position } } as unknown as NonNullable<
      Parameters<typeof audit>[0]
    >["workMode"];
    for (const i of audit({ discoveryPrs: candidates, workMode })) world.apply(i, nowMs);
    const heads = world.open.map((p) => p.head.ref);
    spent = spentOf(heads);
    const pass = planPass({
      queue,
      ceiling,
      spentByEvents: spent,
      answered: (a) => shelf.has(a.id),
      openHeads: heads,
    });
    for (const t of pass) {
      taken.set(t.id, [...(taken.get(t.id) ?? []), day]);
      const a = queue.find((q) => q.id === t.id) as DiscoveryAsk;
      if (redAgain(a)) world.add(row(next++, t.branch, nowMs + HOUR), { red: true });
      else shelf.add(t.id);
    }
  }
  return { taken, spent, shelf };
}

/** A red discovery PR, opened by the lane 177h before the first day, as #7211's audit found it. */
const stuckWorld = (asks: DiscoveryAsk[], opts: { conflicting?: boolean } = {}) => {
  const world = new World();
  for (const [n, a] of asks.entries()) {
    world.add(row(7300 + n, branchFor(a), NOW - 177 * HOUR), {
      red: !opts.conflicting,
      conflicting: opts.conflicting,
    });
  }
  return world;
};

describe("the repro (#7341): 30 daily passes behind a stale discovery PR", () => {
  it("still reads SPENT the way the workflow computes it", () => {
    expect(WORKFLOW).toContain(SPENT_FILTER);
  });

  it("retakes one stale red PR's ask on the next pass, and the spent count goes to 0", () => {
    const pltr = ask("name", "PLTR");
    const world = stuckWorld([pltr]);
    const { taken, spent } = simulate(world, [pltr, ask("sector", "Energy")], 6);
    expect(taken.get("name:PLTR")).toEqual([0]);
    expect(taken.get("sector:Energy")).toEqual([0]);
    expect(spent).toBe(0);
    expect(world.closed.map((p) => p.number)).toEqual([7300]);
  });

  const stuck = ["PLTR", "AMD", "TSLA", "MSFT", "AAPL", "GOOG"].map((s) => ask("name", s));
  for (const [position, ceiling] of [
    ["normal", 6],
    ["conserve", 2],
  ] as const) {
    it(`takes a fresh ask behind ${ceiling} stale red PRs at ${position} (researchPerTick ${ceiling})`, () => {
      const blockers = stuck.slice(0, ceiling);
      const world = stuckWorld(blockers);
      const energy = ask("sector", "Energy");
      const { taken, shelf } = simulate(world, [...blockers, energy], ceiling, { position });
      expect(taken.has("sector:Energy")).toBe(true);
      for (const b of blockers) expect(shelf.has(b.id)).toBe(true);
      expect(world.open).toEqual([]);
    });
  }

  it("retakes the ask of a PR that conflicted and stalled", () => {
    const pltr = ask("name", "PLTR");
    const world = stuckWorld([pltr], { conflicting: true });
    const { taken } = simulate(world, [pltr], 6);
    expect(taken.get("name:PLTR")).toEqual([0]);
  });

  it("control: a healthy PR opened an hour ago still blocks its ask and counts against the ceiling", () => {
    const pltr = ask("name", "PLTR");
    const world = new World();
    world.add(row(7400, branchFor(pltr), NOW - HOUR));
    const { taken, spent } = simulate(world, [pltr, ask("sector", "Energy")], 1, { days: 1 });
    expect(taken.has("name:PLTR")).toBe(false);
    expect(taken.has("sector:Energy")).toBe(false);
    expect(spent).toBe(1);
  });

  it("control: a green PR past the window is the merge's to land, never closed", () => {
    const pltr = ask("name", "PLTR");
    const world = new World();
    world.add(row(7401, branchFor(pltr), NOW - 177 * HOUR));
    simulate(world, [pltr], 6);
    expect(world.closed).toEqual([]);
  });

  it(`stops retaking after ${DISCOVERY_RETAKE_CAP} closes, and flags the third red PR once`, () => {
    const pltr = ask("name", "PLTR");
    const world = stuckWorld([pltr]);
    const { taken } = simulate(world, [pltr], 6, { redAgain: () => true });
    // Day 0 retakes the first; each retaken PR is closed once it has sat red past the window.
    expect(taken.get("name:PLTR")).toHaveLength(DISCOVERY_RETAKE_CAP);
    expect(world.closed).toHaveLength(DISCOVERY_RETAKE_CAP);
    const [last] = world.open;
    expect(world.comments.get(last?.number ?? 0)).toHaveLength(1);
  });

  it("acts on nothing under halt", () => {
    const pltr = ask("name", "PLTR");
    const world = stuckWorld([pltr]);
    simulate(world, [pltr], 0, { position: "halt" });
    expect(world.closed).toEqual([]);
  });
});

const candidate = (over: Partial<DiscoveryPr> = {}): DiscoveryPr => ({
  number: 7300,
  title: "docs(research): discovery of PLTR",
  slug: "name-pltr",
  branch: "discovery/name-pltr",
  hours: 177,
  headSha: "sha7300",
  red: { name: "verify", url: "https://x/verify" },
  conflicting: false,
  priorCloses: 0,
  flaggedSha: null,
  ...over,
});

describe("discoverySweepIntents", () => {
  it("closes a red PR, naming the check and that the next pass researches it again", () => {
    const [i] = discoverySweepIntents([candidate()]);
    expect(i).toMatchObject({ kind: "close-stale-discovery", prNumber: 7300, slug: "name-pltr" });
    expect(i?.body).toContain("`verify` failed");
    expect(i?.body).toContain("next daily pass researches `name-pltr` again");
    expect(i?.body).toContain("git fetch origin pull/7300/head");
  });

  it("closes a conflicting PR", () => {
    const [i] = discoverySweepIntents([candidate({ red: null, conflicting: true })]);
    expect(i?.kind).toBe("close-stale-discovery");
    expect(i?.body).toContain("conflicts with `main`");
  });

  it("leaves a healthy one alone", () => {
    expect(discoverySweepIntents([candidate({ red: null })])).toEqual([]);
  });

  it("flags instead of closing past the retake cap, once per head", () => {
    const capped = candidate({ priorCloses: DISCOVERY_RETAKE_CAP });
    const [flag] = discoverySweepIntents([capped]);
    expect(flag?.kind).toBe("flag-stale-discovery");
    expect(DISCOVERY_FLAG_MARKER.exec(flag?.body ?? "")?.[1]).toBe("sha7300");
    expect(lastFlagSha([{ body: flag?.body }])).toBe("sha7300");
    expect(discoverySweepIntents([{ ...capped, flaggedSha: "sha7300" }])).toEqual([]);
    expect(discoverySweepIntents([{ ...capped, flaggedSha: "older" }])).toHaveLength(1);
  });

  it("does nothing on a failed read or under halt", () => {
    expect(discoverySweep(null)).toEqual([]);
    expect(discoverySweep([candidate()], true)).toEqual([]);
  });
});

describe("gatherDiscoveryPrs", () => {
  const old = NOW - (DISCOVERY_PR_HOURS + 1) * HOUR;

  it("reads only the lane's own, undrafted, unheld discovery PRs untouched past the window", () => {
    const world = new World();
    world.add(row(1, "discovery/name-pltr", old), { red: true });
    world.add(row(2, "research/some-event", old), { red: true });
    world.add(row(3, "discovery/name-amd", old, { user: { login: "ejclark" } }), { red: true });
    world.add(row(4, "discovery/name-tsla", old, { draft: true }), { red: true });
    world.add(row(5, "discovery/name-msft", old, { labels: [{ name: "hold-merge" }] }), {
      red: true,
    });
    world.add(row(6, "discovery/name-aapl", old, { updated_at: at(NOW - HOUR) }), { red: true });
    world.add(
      row(7, "discovery/name-goog", old, {
        head: { ref: "discovery/name-goog", sha: "sha7", repo: { full_name: "fork/skynet" } },
      }),
      { red: true },
    );
    expect(gatherDiscoveryPrs(NOW, { rest: world.rest }).map((c) => c.number)).toEqual([1]);
  });

  it("reads mergeable only for a PR that is not red, and counts only unmerged closes", () => {
    const world = new World();
    world.add(row(1, "discovery/name-pltr", old), { red: true });
    world.closed.push(
      { ...row(10, "discovery/name-pltr", old), merged_at: null },
      { ...row(11, "discovery/name-pltr", old), merged_at: at(old) },
      { ...row(12, "discovery/name-amd", old), merged_at: null },
    );
    const [c] = gatherDiscoveryPrs(NOW, { rest: world.rest });
    expect(c).toMatchObject({ red: { name: "verify" }, conflicting: false, priorCloses: 1 });
    expect(world.calls).not.toContain("pulls/1");
  });

  it("costs a healthy PR its checks and mergeable reads, and nothing more", () => {
    const world = new World();
    world.add(row(1, "discovery/name-pltr", old));
    const [c] = gatherDiscoveryPrs(NOW, { rest: world.rest });
    expect(c).toMatchObject({ red: null, conflicting: false, priorCloses: 0 });
    expect(world.calls.some((p) => p.startsWith("pulls?state=closed"))).toBe(false);
  });

  it("is soft on failure, so one failed read costs this sweep and not the audit", () => {
    const lines: string[] = [];
    const rest = () => {
      throw new Error("502 Bad Gateway");
    };
    expect(discoveryPrsOrNone(NOW, { rest, log: (l) => lines.push(l) })).toBeNull();
    expect(lines[0]).toContain("discovery PR sweep skipped");
  });
});

describe("the acts", () => {
  it("closes the PR before deleting its branch", () => {
    const calls: string[][] = [];
    const [i] = discoverySweepIntents([candidate()]);
    if (i?.kind !== "close-stale-discovery") throw new Error("expected a close");
    closeStaleDiscovery(i, {
      run: (_c, args) => {
        calls.push(args);
        return "";
      },
    });
    expect(calls[0]?.slice(0, 3)).toEqual(["pr", "close", "7300"]);
    expect(calls[1]).toEqual([
      "api",
      "-X",
      "DELETE",
      "repos/{owner}/{repo}/git/refs/heads/discovery/name-pltr",
    ]);
  });

  it("flags with one comment", () => {
    const calls: string[][] = [];
    const [i] = discoverySweepIntents([candidate({ priorCloses: DISCOVERY_RETAKE_CAP })]);
    if (i?.kind !== "flag-stale-discovery") throw new Error("expected a flag");
    flagStaleDiscovery(i, {
      run: (_c, args) => {
        calls.push(args);
        return "";
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.slice(0, 3)).toEqual(["pr", "comment", "7300"]);
  });

  it("are wired into the audit's act table and its reads", () => {
    const index = readFileSync("scripts/moneypenny/index.mjs", "utf8");
    expect(index).toContain('"close-stale-discovery": (i) => closeStaleDiscovery(i)');
    expect(index).toContain('"flag-stale-discovery": (i) => flagStaleDiscovery(i)');
    expect(readFileSync("scripts/moneypenny/audit.mjs", "utf8")).toContain(
      "discoveryPrs: discoveryPrsOrNone(nowMs)",
    );
  });
});
