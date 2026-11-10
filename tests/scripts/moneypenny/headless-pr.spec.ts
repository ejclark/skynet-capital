import { describe, expect, it } from "@rstest/core";
import { audit } from "../../../scripts/moneypenny/audit.mjs";
import {
  gatherHeadless,
  NUDGE_CAP,
  NUDGE_MARKER,
  nudgeHeadless,
  nudgeIntents,
  triedHeads,
} from "../../../scripts/moneypenny/headless-pr.mjs";

// 2026-11-08 (#7112): #7089 was opened at 02:19Z by the Actions job token, so its head got no check
// suite and no check run, and it sat 16h until a close and reopen from a real account ran `verify`.
// The act stage gives such a head one commit from the App identity: update-branch, else an empty
// commit when the branch is current — once per head, never a force push, never a close.

const NOW = Date.parse("2026-11-08T18:20:00Z");
const ago = (h: number) => new Date(NOW - h * 3.6e6).toISOString();

const headless = (over: Record<string, unknown> = {}) => ({
  number: 7089,
  title: "feat(landing): the next part",
  hours: 16,
  why: "no check suite and no required check run on the head for 16h",
  headSha: "a1b2c3d",
  headRef: "feedback/7077",
  triedShas: [] as string[],
  ...over,
});

describe("nudgeIntents — once per head sha", () => {
  it("WHEN no marker names this head, gives it one commit with a marker naming the head", () => {
    const [i] = nudgeIntents([headless()]);
    expect(i?.kind).toBe("nudge-headless");
    expect(i?.prNumber).toBe(7089);
    expect(NUDGE_MARKER.exec(i?.body ?? "")?.[1]).toBe("a1b2c3d");
  });

  it("WHEN a marker already names this head, does nothing: the PR stays in the digest", () => {
    expect(nudgeIntents([headless({ triedShas: ["a1b2c3d"] })])).toEqual([]);
  });

  it("WHEN the head moved since, acts on the new head, up to the cap", () => {
    expect(nudgeIntents([headless({ triedShas: ["old"] })])).toHaveLength(1);
    const full = Array.from({ length: NUDGE_CAP }, (_, n) => `old${n}`);
    expect(nudgeIntents([headless({ triedShas: full })])).toEqual([]);
  });
});

describe("triedHeads", () => {
  it("reads every marker's sha", () => {
    const body = (sha: string) => `x <!-- moneypenny:headless sha=${sha} --> y`;
    expect(triedHeads([{ body: body("a") }, { body: "chatter" }, { body: body("b") }])).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("nudgeHeadless — comment first, then one App-identity commit", () => {
  const intent = () => {
    const [i] = nudgeIntents([headless()]);
    if (!i) throw new Error("expected an intent");
    return i;
  };
  const refuse = (stderr: string) => Object.assign(new Error("gh failed"), { stderr });

  it("posts the marker, then PUTs update-branch pinned to the head it read", () => {
    const calls: string[][] = [];
    const out = nudgeHeadless(intent(), {
      run: (_c, args) => {
        calls.push(args);
        return "";
      },
    });
    expect(calls[0]?.slice(0, 2)).toEqual(["pr", "comment"]);
    expect(calls[1]).toContain("PUT");
    expect(calls[1]?.join(" ")).toContain("pulls/7089/update-branch");
    expect(calls[1]).toContain("expected_head_sha=a1b2c3d");
    expect(calls).toHaveLength(2);
    expect(out).toContain("gave #7089 a new head");
  });

  it("WHEN the branch is already current, puts a same-tree commit on the head instead", () => {
    const calls: string[][] = [];
    nudgeHeadless(intent(), {
      log: () => undefined,
      run: (_c, args) => {
        calls.push(args);
        if (args.join(" ").includes("update-branch")) {
          throw refuse("gh: There are no new commits on the base branch. (HTTP 422)");
        }
        if (args.includes(".tree.sha")) return "tree123";
        if (args.includes(".sha")) return "new456";
        return "";
      },
    });
    const flat = calls.map((a) => a.join(" "));
    expect(flat.some((c) => c.includes("POST repos/{owner}/{repo}/git/commits"))).toBe(true);
    expect(flat.some((c) => c.includes("parents[]=a1b2c3d"))).toBe(true);
    const move = flat.find((c) => c.includes("PATCH"));
    expect(move).toContain("refs/heads/feedback/7077");
    expect(move).toContain("sha=new456");
    expect(flat.some((c) => /force|close/.test(c))).toBe(false);
  });

  it("does not read an unrelated refusal that says 'up to date' as the branch being current", () => {
    const calls: string[][] = [];
    nudgeHeadless(intent(), {
      log: () => undefined,
      run: (_c, args) => {
        calls.push(args);
        if (args.join(" ").includes("update-branch"))
          throw refuse("ruleset: keep up-to-date (HTTP 422)");
        return "";
      },
    });
    expect(calls).toHaveLength(2);
  });

  it("WHEN GitHub refuses for any other reason, reports it and does not throw", () => {
    const logs: string[] = [];
    const calls: string[][] = [];
    const out = nudgeHeadless(intent(), {
      log: (l) => logs.push(l),
      run: (_c, args) => {
        calls.push(args);
        if (args.join(" ").includes("update-branch")) throw refuse("merge conflict (HTTP 422)");
        return "";
      },
    });
    expect(out).toContain("could not give #7089 a new head");
    expect(logs[0]).toContain("merge conflict");
    expect(calls).toHaveLength(2); // the marker and the one refused try: no empty commit after it
  });
});

describe("gatherHeadless — the #7089 head, read through REST", () => {
  // The open list, then the per-PR reads judgePr needs. #7089: 0 runs, 0 suites, opened 16h before.
  const open = (over: Record<string, unknown> = {}) => ({
    number: 7089,
    title: "feat(landing): the next part",
    draft: false,
    auto_merge: null,
    labels: [],
    created_at: ago(16),
    base: { ref: "main", repo: { full_name: "ejclark/skynet-capital" } },
    head: { sha: "a1b2c3d", ref: "feedback/7077", repo: { full_name: "ejclark/skynet-capital" } },
    body: "",
    ...over,
  });
  const restFor =
    (listed: Record<string, unknown>[], runs: unknown[] = [], comments: unknown[] = []) =>
    (path: string): unknown => {
      if (path.startsWith("pulls?state=open")) return listed;
      if (path.includes("/check-runs")) return { check_runs: runs };
      if (path.includes("/check-suites")) return { check_suites: [] };
      if (path.startsWith("commits/")) return { commit: { committer: { date: ago(16) } } };
      if (/^pulls\/\d+\/files/.test(path)) return [{ filename: "app/src/landing.tsx" }];
      if (/^pulls\/\d+$/.test(path)) return { ...listed[0], mergeable_state: "clean" };
      if (path.startsWith("issues/")) return comments;
      throw new Error(`unexpected read ${path}`);
    };

  it("names #7089 with what the act needs", () => {
    const [c] = gatherHeadless(NOW, { rest: restFor([open()]) });
    expect(c?.number).toBe(7089);
    expect(c?.headSha).toBe("a1b2c3d");
    expect(c?.headRef).toBe("feedback/7077");
    expect(c?.triedShas).toEqual([]);
  });

  it("reads the markers already on the PR", () => {
    const marker = [{ body: "<!-- moneypenny:headless sha=a1b2c3d -->" }];
    const [c] = gatherHeadless(NOW, { rest: restFor([open()], [], marker) });
    expect(c?.triedShas).toEqual(["a1b2c3d"]);
  });

  it("skips a PR that is young, armed, held, a draft, not into main, or from a fork", () => {
    for (const over of [
      { created_at: ago(0.2) },
      { auto_merge: { enabled_by: {} } },
      { labels: [{ name: "hold-merge" }] },
      { draft: true },
      { base: { ref: "platter/x", repo: { full_name: "ejclark/skynet-capital" } } },
      { head: { sha: "a1b2c3d", ref: "fix-x", repo: { full_name: "someone/fork" } } },
    ]) {
      expect(gatherHeadless(NOW, { rest: restFor([open(over)]) })).toEqual([]);
    }
  });

  it("costs a healthy PR one read: its check runs carry verify", () => {
    const reads: string[] = [];
    const rest = restFor([open()], [{ name: "verify", status: "in_progress", conclusion: null }]);
    const out = gatherHeadless(NOW, {
      rest: (p: string) => {
        reads.push(p);
        return rest(p);
      },
    });
    expect(out).toEqual([]);
    expect(reads.filter((p) => !p.startsWith("pulls?state=open"))).toHaveLength(1);
  });
});

describe("audit — the headless deps feed the intent list", () => {
  it("emits nudge-headless from deps.headless", () => {
    const intents = audit({ headless: [headless()] });
    expect(intents.map((i: { kind: string }) => i.kind)).toContain("nudge-headless");
  });

  it("emits nothing while the work spigot is at halt", () => {
    const workMode = { trackingIssue: 1, title: null, mode: { position: "halt" } };
    const intents = audit({ headless: [headless()], workMode } as unknown as Parameters<
      typeof audit
    >[0]);
    expect(intents.map((i: { kind: string }) => i.kind)).not.toContain("nudge-headless");
  });
});
