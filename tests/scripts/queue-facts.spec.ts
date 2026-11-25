import { describe, expect, it } from "@rstest/core";
import type { FactsNeed } from "../../scripts/queue-facts.mjs";
import {
  BATCH,
  factsOf,
  factsQuery,
  needOf,
  readQueueFacts,
  restFactsOf,
} from "../../scripts/queue-facts.mjs";
import { liveRows } from "../../scripts/rank.mjs";

// #8289 slice 2: `npm run rank` spent 278 REST calls a run (2 per queued issue) from the one hourly
// allowance every session shares. These pin the replacement: the per-issue facts come from batched
// GraphQL, and rank's own REST spend is the open-issue list alone.

const labeled = (name: string, at: string) => ({ createdAt: at, label: { name } });

describe("queue facts: one issue's node", () => {
  it("takes the NEWEST ready time and only the open issues it blocks", () => {
    const node = {
      timelineItems: {
        nodes: [
          labeled("ready", "2026-10-01T00:00:00Z"),
          labeled("in-progress", "2026-11-20T00:00:00Z"),
          labeled("ready", "2026-11-25T06:02:20Z"),
        ],
      },
      blocking: {
        nodes: [
          { number: 10, state: "OPEN" },
          { number: 11, state: "CLOSED" },
        ],
      },
    };
    expect(factsOf(node)).toEqual({ readyAt: Date.parse("2026-11-25T06:02:20Z"), blocks: [10] });
  });

  it("reads a missing node (a deleted issue) as no facts", () => {
    expect(factsOf(null)).toEqual({ readyAt: null, blocks: [] });
  });
});

describe("queue facts: the batched read", () => {
  it(`asks for ${BATCH} issues per GraphQL document, never one REST read per issue`, () => {
    const numbers = Array.from({ length: BATCH * 2 + 1 }, (_, k) => k + 1);
    const sent: { query: string; vars: unknown }[] = [];
    const facts = readQueueFacts(numbers, {
      repo: "o/r",
      send: (query: string, vars: unknown) => {
        sent.push({ query, vars });
        const repository: Record<string, unknown> = {};
        for (const m of query.matchAll(/i(\d+): issue/g))
          repository[`i${m[1]}`] = {
            timelineItems: { nodes: [labeled("ready", "2026-11-01T00:00:00Z")] },
          };
        return { repository };
      },
    });
    expect(sent.length).toBe(3);
    expect(sent[0]?.vars).toEqual({ owner: "o", name: "r" });
    expect(facts.size).toBe(numbers.length);
    expect(facts.get(BATCH * 2 + 1)?.readyAt).toBe(Date.parse("2026-11-01T00:00:00Z"));
  });

  it("names every issue in the document by an alias GraphQL accepts", () => {
    const q = factsQuery([7, 8289]);
    expect(q).toContain("i7: issue(number: 7)");
    expect(q).toContain("i8289: issue(number: 8289)");
    expect(q).toContain("last: 100");
  });
});

// A Claude Code cloud session's proxy refuses this GraphQL document with a 403 whatever the token
// (docs/vendor/claude-code/cloud-environments.md). GraphQL-only, `rank` exited 1 there.
describe("queue facts: GraphQL refused (a cloud session)", () => {
  const refused = () => {
    throw new Error(
      "Command failed: curl\nGitHub said: This GraphQL query is not enabled for this session",
    );
  };
  const restRead = (reads: string[]) => (path: string) => {
    reads.push(path);
    if (path.endsWith("/events?per_page=100"))
      return [
        { event: "labeled", label: { name: "ready" }, created_at: "2026-11-20T00:00:00Z" },
        { event: "unlabeled", label: { name: "ready" }, created_at: "2026-11-24T00:00:00Z" },
      ];
    return [
      { number: 5, state: "open" },
      { number: 6, state: "closed" },
    ];
  };

  it("reads every issue over REST, two calls each, and says so once", () => {
    const reads: string[] = [];
    const lines: string[] = [];
    const facts = readQueueFacts([1, 2], {
      repo: "o/r",
      send: refused,
      read: restRead(reads),
      log: (l: string) => lines.push(l),
    });
    expect(reads).toEqual([
      "issues/1/events?per_page=100",
      "issues/1/dependencies/blocking",
      "issues/2/events?per_page=100",
      "issues/2/dependencies/blocking",
    ]);
    expect(facts.get(2)).toEqual({ readyAt: Date.parse("2026-11-20T00:00:00Z"), blocks: [5] });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/not enabled for this session.*2 issues over REST/);
  });

  it("keeps the batches GraphQL answered and stops asking it after the first refusal", () => {
    const numbers = Array.from({ length: BATCH * 3 }, (_, k) => k + 1);
    let sends = 0;
    const reads: string[] = [];
    const facts = readQueueFacts(numbers, {
      repo: "o/r",
      send: (query: string) => {
        sends++;
        if (sends > 1) refused();
        const repository: Record<string, unknown> = {};
        for (const m of query.matchAll(/i(\d+): issue/g)) repository[`i${m[1]}`] = {};
        return { repository };
      },
      read: restRead(reads),
      log: () => undefined,
    });
    expect(sends).toBe(2);
    expect(reads).toHaveLength(BATCH * 2 * 2);
    expect(facts.get(1)).toEqual({ readyAt: null, blocks: [] });
    expect(facts.get(BATCH * 3)?.blocks).toEqual([5]);
  });

  it("reads only the facts each issue's row leaves open", () => {
    const reads: string[] = [];
    const need = new Map([
      [1, { ready: true, blocks: false }],
      [2, { ready: false, blocks: true }],
      [3, { ready: false, blocks: false }],
    ]);
    const facts = readQueueFacts([1, 2, 3, 4], {
      repo: "o/r",
      send: refused,
      read: restRead(reads),
      log: () => undefined,
      need: (n: number) => need.get(n),
    });
    expect(reads).toEqual([
      "issues/1/events?per_page=100",
      "issues/2/dependencies/blocking",
      "issues/4/events?per_page=100",
      "issues/4/dependencies/blocking",
    ]);
    expect(facts.get(1)).toEqual({ readyAt: Date.parse("2026-11-20T00:00:00Z"), blocks: [] });
    expect(facts.get(2)).toEqual({ readyAt: null, blocks: [5] });
    expect(facts.get(3)).toEqual({ readyAt: null, blocks: [] });
  });

  it("still throws when REST fails too, so a rank never prints with its facts missing", () => {
    expect(() =>
      restFactsOf(1, () => {
        throw new Error("API rate limit exceeded");
      }),
    ).toThrow(/rate limit/);
  });
});

describe("queue facts: which REST reads a list row needs", () => {
  const row = (labels: string[], blocking?: number) => ({
    labels: labels.map((name) => ({ name })),
    ...(blocking === undefined
      ? {}
      : { issue_dependencies_summary: { blocking, total_blocking: blocking } }),
  });

  it("asks for a ready time only when the issue is labeled ready", () => {
    expect(needOf(row(["feedback", "ready"], 0)).ready).toBe(true);
    expect(needOf(row(["feedback"], 0)).ready).toBe(false);
  });

  it("asks for the blocking list only when the summary counts one, or has no summary", () => {
    expect(needOf(row(["feedback"], 2)).blocks).toBe(true);
    expect(needOf(row(["feedback"], 0)).blocks).toBe(false);
    expect(needOf(row(["feedback"])).blocks).toBe(true);
  });
});

describe("rank's live read", () => {
  const issue = (number: number, labels: string[]) => ({
    number,
    title: `#${number}`,
    body: "",
    created_at: "2026-11-01T00:00:00Z",
    labels: labels.map((name) => ({ name })),
  });

  it("reads facts only for queued issues, once, and keeps blocks to open issues", () => {
    const asked: number[][] = [];
    const rows = liveRows({
      now: Date.parse("2026-11-25T12:00:00Z"),
      listOpen: () => [
        issue(1, ["feedback", "ready"]),
        issue(2, ["feedback", "ready", "needs-eric"]),
        issue(3, ["feedback", "ready"]),
        { ...issue(4, []), pull_request: {} },
      ],
      readFacts: (numbers: number[]) => {
        asked.push(numbers);
        return new Map([
          [1, { readyAt: Date.parse("2026-11-25T10:00:00Z"), blocks: [3, 99] }],
          [3, { readyAt: null, blocks: [] }],
        ]);
      },
    });
    expect(asked).toEqual([[1, 3]]);
    const one = rows.find((r: { number: number }) => r.number === 1);
    expect(one?.readyHours).toBe(2);
    expect(one?.why).toBe("unblocks #3");
  });

  // The cloud path end to end: GraphQL refused, REST answers from the same fixtures as before. 140
  // queued issues used to cost 280 reads; now only the ready one and the blocking one are read.
  it("where GraphQL is refused, reads only the ready issue's events and the blocker's list", () => {
    const reads: string[] = [];
    const quiet = Array.from({ length: 140 }, (_, k) => ({
      ...issue(100 + k, ["feedback"]),
      issue_dependencies_summary: { blocking: 0 },
    }));
    const rows = liveRows({
      now: Date.parse("2026-11-25T12:00:00Z"),
      listOpen: () => [
        { ...issue(1, ["feedback", "ready"]), issue_dependencies_summary: { blocking: 0 } },
        { ...issue(2, ["bottleneck"]), issue_dependencies_summary: { blocking: 1 } },
        { ...issue(3, ["plan", "ready"]), sub_issues_summary: { total: 2, completed: 1 } },
        ...quiet,
      ],
      readFacts: (numbers: number[], opts: { need: (n: number) => FactsNeed }) =>
        readQueueFacts(numbers, {
          repo: "o/r",
          send: () => {
            throw new Error("This GraphQL query is not enabled for this session");
          },
          read: (path: string) => {
            reads.push(path);
            if (path === "issues/1/events?per_page=100")
              return [
                { event: "labeled", label: { name: "ready" }, created_at: "2026-11-25T10:00:00Z" },
              ];
            if (path === "issues/2/dependencies/blocking") return [{ number: 1, state: "open" }];
            return [];
          },
          log: () => undefined,
          ...opts,
        }),
    });
    expect(reads).toEqual(["issues/1/events?per_page=100", "issues/2/dependencies/blocking"]);
    expect(rows.find((r: { number: number }) => r.number === 1)?.readyHours).toBe(2);
    expect(rows.find((r: { number: number }) => r.number === 2)?.why).toBe("unblocks #1");
    expect(rows.some((r: { number: number }) => r.number === 3)).toBe(false);
  });
});
