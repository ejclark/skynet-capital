import { describe, expect, it } from "@rstest/core";
import { BATCH, factsOf, factsQuery, readQueueFacts } from "../../scripts/queue-facts.mjs";
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
});
