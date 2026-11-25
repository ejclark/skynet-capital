import { describe, expect, it } from "@rstest/core";
import { classify } from "../../scripts/delivery-score.mjs";
import { BATCH, eventsOf, eventsQuery, readIssueEvents } from "../../scripts/issue-events.mjs";

// delivery-score's per-issue events read, batched into GraphQL (#8289 slice 2): a bare run spent
// 363 REST calls on `issues/<n>/events`, one per scored issue. These pin the two promises the cut
// rests on: the batched read hands `classify` events in the shape it already reads (so the score
// is the same), and a refused batch still gets its events over REST, never an empty history.

const at = (d: number) => new Date(Date.parse("2026-09-01T00:00:00Z") + d * 864e5).toISOString();

/** One issue's history as GraphQL returns it, and the same history as REST's events page. */
const gqlNode = {
  timelineItems: {
    nodes: [
      { __typename: "LabeledEvent", createdAt: at(0), label: { name: "feedback" } },
      { __typename: "LabeledEvent", createdAt: at(1), label: { name: "ready" } },
      { __typename: "ReopenedEvent", createdAt: at(5) },
      { __typename: "LabeledEvent", createdAt: at(6), label: { name: "needs-info" } },
    ],
  },
};
const restEvents = [
  { event: "labeled", label: { name: "feedback" }, created_at: at(0) },
  { event: "subscribed", created_at: at(0) },
  { event: "labeled", label: { name: "ready" }, created_at: at(1) },
  { event: "closed", created_at: at(4) },
  { event: "reopened", created_at: at(5) },
  { event: "labeled", label: { name: "needs-info" }, created_at: at(6) },
];

describe("issue events: the batched GraphQL read", () => {
  it("asks each issue for its label and reopen events only, aliased by number", () => {
    const q = eventsQuery([12, 345]);
    expect(q).toContain("i12: issue(number: 12)");
    expect(q).toContain("i345: issue(number: 345)");
    expect(q).toContain("itemTypes: [LABELED_EVENT, REOPENED_EVENT], first: 100");
    expect(q).toContain("query($owner: String!, $name: String!)");
  });

  it("hands back REST's shape, so classify scores both reads the same", () => {
    expect(eventsOf(gqlNode)).toEqual([
      { event: "labeled", label: { name: "feedback" }, created_at: at(0) },
      { event: "labeled", label: { name: "ready" }, created_at: at(1) },
      { event: "reopened", created_at: at(5) },
      { event: "labeled", label: { name: "needs-info" }, created_at: at(6) },
    ]);
    const issue = { number: 500, state: "closed", state_reason: "completed" };
    const prs = [
      {
        number: 1,
        title: "feat(x): build it",
        body: "Closes #500.",
        head: "",
        state: "closed",
        created_at: at(2),
        merged_at: at(3),
      },
    ];
    const now = Date.parse(at(30));
    const viaGraphql = classify({ issue, events: eventsOf(gqlNode), prs, now });
    const viaRest = classify({ issue, events: restEvents, prs, now });
    expect(viaGraphql).toEqual(viaRest);
    expect(viaGraphql?.outcome).toBe("REWORKED");
    expect(viaGraphql?.reasons).toEqual(["reopened", "needs-info after build"]);
  });

  it("reads a missing node as no events", () => {
    expect(eventsOf(undefined)).toEqual([]);
    expect(eventsOf({ timelineItems: { nodes: [null, { __typename: "Other" }] } })).toEqual([]);
  });

  it("spends one GraphQL read per batch and no REST at all", () => {
    const numbers = Array.from({ length: 120 }, (_, i) => 7000 + i);
    const sent: string[] = [];
    const rest: string[] = [];
    const lines: string[] = [];
    const events = readIssueEvents(numbers, {
      repo: "o/r",
      send: (query: string, vars: Record<string, unknown>) => {
        expect(vars).toEqual({ owner: "o", name: "r" });
        sent.push(query);
        const nums = [...query.matchAll(/i(\d+): issue/g)].map((m) => Number(m[1]));
        return { repository: Object.fromEntries(nums.map((n) => [`i${n}`, gqlNode])) };
      },
      read: (path: string) => {
        rest.push(path);
        return [];
      },
      log: (line: string) => lines.push(line),
    });
    expect(sent).toHaveLength(Math.ceil(120 / BATCH));
    expect(rest).toEqual([]);
    expect(lines).toEqual([]);
    expect(events.size).toBe(120);
    expect(events.get(7119)).toEqual(eventsOf(gqlNode));
  });

  it("reads only a refused batch over REST, one issue at a time, and says so once", () => {
    const numbers = Array.from({ length: BATCH + 2 }, (_, i) => 1 + i);
    let calls = 0;
    const rest: string[] = [];
    const lines: string[] = [];
    const events = readIssueEvents(numbers, {
      repo: "o/r",
      send: () => {
        calls += 1;
        if (calls === 1)
          throw new Error("curl: (22) 403\nThis GraphQL query is not enabled for this session");
        return { repository: { [`i${BATCH + 1}`]: gqlNode, [`i${BATCH + 2}`]: gqlNode } };
      },
      read: (path: string) => {
        rest.push(path);
        return restEvents;
      },
      log: (line: string) => lines.push(line),
    });
    expect(rest).toHaveLength(BATCH);
    expect(rest[0]).toBe("issues/1/events?per_page=100");
    expect(events.get(1)).toEqual(restEvents);
    expect(events.get(BATCH + 1)).toEqual(eventsOf(gqlNode));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain(`GraphQL refused ${BATCH} issues' event reads`);
    expect(lines[0]).toContain("not enabled for this session");
  });

  it("throws when REST fails too, so a score never prints with events missing", () => {
    expect(() =>
      readIssueEvents([9], {
        repo: "o/r",
        send: () => {
          throw new Error("403");
        },
        read: () => {
          throw new Error("rate limited");
        },
        log: () => undefined,
      }),
    ).toThrow("rate limited");
  });
});
