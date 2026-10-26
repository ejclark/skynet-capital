import { describe, expect, it } from "@rstest/core";
import {
  boardItemsOrThrow,
  planReconcile,
} from "../../../scripts/moneypenny/projects-reconcile.mjs";
import { readBoardItemsFromGh } from "../../../scripts/moneypenny/projects-sync.mjs";

// #4760 — THE SWEEP'S BOARD READ COSTS ~1 POINT PER 100 CARDS, NOT ~310 A SWEEP.
//
// `gh project item-list` asked for every field value under every card, and board-sync.yml runs the
// sweep on every push to main — 47 of 143 sweeps were refused on 2026-10-19/20 with Eric's GraphQL
// hour at 0, and every per-issue sync behind them skipped. The reader now asks one connection for
// each card's id, url and Status, and logs the points GitHub charged. Every assertion below fails on
// the pre-fix code: `readBoardItemsFromGh` did not exist, and the read shelled `gh project item-list`.

const URL = (n: number) => `https://github.com/ejclark/skynet-capital/issues/${n}`;
const card = (
  n: number,
  status: string | null = "Backlog",
  over: Record<string, unknown> = {},
) => ({
  id: `PVTI_${n}`,
  isArchived: false,
  content: { __typename: "Issue", url: URL(n) },
  status: status ? { name: status } : null,
  ...over,
});
const page = (
  nodes: unknown[],
  { totalCount = nodes.length, next = null as string | null, cost = 1, remaining = 4999 } = {},
) =>
  JSON.stringify({
    data: {
      user: {
        projectV2: {
          items: { totalCount, pageInfo: { hasNextPage: !!next, endCursor: next }, nodes },
        },
      },
      rateLimit: { cost, remaining, resetAt: "2026-10-26T13:00:00Z" },
    },
  });
const quiet = () => undefined;

describe("moneypenny projects: the sweep's whole-board read (#4760)", () => {
  it("asks one GraphQL query for url and Status only — never `gh project item-list`", () => {
    const calls: string[][] = [];
    readBoardItemsFromGh({
      log: quiet,
      gh: (a: string[]) => {
        calls.push(a);
        return page([card(1)]);
      },
    });

    expect(calls).toHaveLength(1);
    const argv = calls[0] ?? [];
    const flat = argv.join(" ");
    expect(argv.slice(0, 2)).toEqual(["api", "graphql"]);
    expect(argv).not.toContain("project");
    expect(argv).not.toContain("item-list");
    expect(flat).toContain("user(login:$owner){ projectV2(number:$project)");
    expect(flat).toContain("items(first:100, after:$after)");
    expect(flat).toContain('fieldValueByName(name:"Status")');
    expect(flat).not.toContain("fieldValues");
    expect(flat).toContain("rateLimit{ cost remaining resetAt }");
    expect(argv).toContain("owner=ejclark");
    expect(argv).toContain("project=2");
    expect(flat).not.toContain("after=");
  });

  it("shapes each card like an item-list row, so every consumer reads it unchanged", () => {
    const board = readBoardItemsFromGh({
      log: quiet,
      gh: () =>
        page([
          card(4760, "Building"),
          card(12, null),
          card(13, "Done", { content: { __typename: "DraftIssue" } }),
          card(14, "Done", { content: null }),
        ]),
    });

    expect(board).toEqual({
      totalCount: 4,
      items: [
        { id: "PVTI_4760", status: "Building", content: { type: "Issue", url: URL(4760) } },
        { id: "PVTI_12", content: { type: "Issue", url: URL(12) } },
        { id: "PVTI_13", status: "Done", content: { type: "DraftIssue" } },
        { id: "PVTI_14", status: "Done", content: null },
      ],
    });
    // The sweep's own reader: a card with no Status reads as `have: null`, the same as before.
    const drift = planReconcile({ items: board.items, openIssues: [] });
    expect(drift).toEqual([
      { number: 12, have: null, want: "Done" },
      { number: 4760, have: "Building", want: "Done" },
    ]);
  });

  it("follows the cursor across pages and logs the points GitHub charged for all of them", () => {
    const calls: string[][] = [];
    const lines: string[] = [];
    const pages = [
      page([card(1), card(2)], { totalCount: 3, next: "CUR_1", remaining: 4999 }),
      page([card(3)], { totalCount: 3, remaining: 4998 }),
    ];
    const board = readBoardItemsFromGh({
      log: (l: string) => lines.push(l),
      gh: (a: string[]) => {
        calls.push(a);
        return pages[calls.length - 1] ?? "";
      },
    });

    expect(board.items.map((i: { id: string }) => i.id)).toEqual(["PVTI_1", "PVTI_2", "PVTI_3"]);
    expect(board.totalCount).toBe(3);
    expect(calls[1]).toContain("after=CUR_1");
    expect(lines).toEqual([
      "board read: 3 item(s) in 2 page(s), 2 graphql point(s) spent, 4998 left (#4760)",
    ]);
  });

  it("drops archived cards from the list AND the count, so they never read as truncation", () => {
    const board = readBoardItemsFromGh({
      log: quiet,
      gh: () => page([card(1), card(2, "Done", { isArchived: true })], { totalCount: 2 }),
    });
    expect(board).toEqual({
      items: [{ id: "PVTI_1", status: "Backlog", content: { type: "Issue", url: URL(1) } }],
      totalCount: 1,
    });
    expect(() => boardItemsOrThrow({ items: () => board })).not.toThrow();
  });

  it("stops at the page cap with the count intact, so the sweep refuses a half board", () => {
    let n = 0;
    const board = readBoardItemsFromGh({
      log: quiet,
      maxPages: 2,
      gh: () => {
        n += 1;
        return page([card(n)], { totalCount: 5, next: `CUR_${n}` });
      },
    });
    expect(n).toBe(2);
    expect(board.items).toHaveLength(2);
    expect(board.totalCount).toBe(5);
    expect(() => boardItemsOrThrow({ items: () => board })).toThrow("truncated board");
  });

  it("fails loudly when the token cannot see the project — never an empty, agreeing board", () => {
    const blind = JSON.stringify({ data: { user: { projectV2: null } } });
    expect(() => readBoardItemsFromGh({ log: quiet, gh: () => blind })).toThrow(
      "project #2 not found under ejclark",
    );
    expect(() => readBoardItemsFromGh({ log: quiet, gh: () => "" })).toThrow("not found");
  });
});
