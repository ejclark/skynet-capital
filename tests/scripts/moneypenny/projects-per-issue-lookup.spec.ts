import { describe, expect, it } from "@rstest/core";
import {
  type BoardItem,
  boardItemsFromProjectItems,
} from "../../../scripts/moneypenny/projects.mjs";
import {
  createBoardContext,
  readIssueItemsFromGh,
} from "../../../scripts/moneypenny/projects-sync.mjs";

// #4439 — A ONE-ISSUE SYNC THAT READ THE WHOLE BOARD SPENT THE HOUR IN TWELVE EVENTS.
//
// `sync project status` runs once per `issues` event on Eric's PAT, and asked "is this issue already
// an item?" by listing every item on the board — ~400 GraphQL points by node count. Measured on the
// 2026-10-01 window opening 05:41:57Z: 12 `issues` runs went through, and the 13th found 44 of 5,000
// points left at 06:25:56Z and failed `main` (issue #4439). #4183 had already taken the board read
// off the per-issue path INSIDE one process; nothing helped a job whose whole run is one issue.
//
// The fix asks the issue, not the board: an Issue's own `projectItems` connection, ~1 point. Every
// assertion below fails on the pre-fix code — `boardItemsFromProjectItems` and `itemsFor` did not
// exist, and `syncIssue` reached straight for `board.items()`.

const URL = "https://github.com/ejclark/skynet-capital/issues/4290";
const ISSUE = { number: 4290, html_url: URL };

describe("moneypenny projects: one issue's board item, from the issue's own projectItems (#4439)", () => {
  it("picks the item on OUR project and shapes it like an item-list row", () => {
    expect(
      boardItemsFromProjectItems({
        nodes: [
          { id: "PVTI_other_project", project: { number: 7 } },
          { id: "PVTI_ours", project: { number: 2 } },
        ],
        projectNumber: 2,
        issueUrl: URL,
      }),
    ).toEqual([{ id: "PVTI_ours", content: { type: "Issue", url: URL } }]);
  });

  it("reads as a miss when the issue is on no project of ours — the add path settles it", () => {
    expect(
      boardItemsFromProjectItems({
        nodes: [{ id: "PVTI_other_project", project: { number: 7 } }],
        projectNumber: 2,
        issueUrl: URL,
      }),
    ).toEqual([]);
    expect(boardItemsFromProjectItems({ nodes: [], projectNumber: 2, issueUrl: URL })).toEqual([]);
    expect(boardItemsFromProjectItems()).toEqual([]);
  });

  it("never invents an item out of a node with no id", () => {
    expect(
      boardItemsFromProjectItems({
        nodes: [null, undefined, { project: { number: 2 } }],
        projectNumber: 2,
        issueUrl: URL,
      }),
    ).toEqual([]);
  });
});

describe("moneypenny projects: the events lane stops paying for the whole board (#4439)", () => {
  const found: BoardItem[] = [{ id: "PVTI_ours", content: { type: "Issue", url: URL } }];
  const page = (items: BoardItem[]) => ({ items, totalCount: items.length });

  it("asks GitHub about the issue alone, and never lists the board", () => {
    let issueLookups = 0;
    const board = createBoardContext({
      readItems: () => {
        throw new Error(
          "item-list must not run for a one-issue sync — ~400 points is the #4439 bug",
        );
      },
      readIssueItems: (issue) => {
        issueLookups += 1;
        expect(issue).toEqual(ISSUE);
        return found;
      },
    });

    expect(board.itemsFor(ISSUE)).toEqual(found);
    expect(issueLookups).toBe(1);
  });

  it("prefers a board list the caller already holds — a sweep pays for one page, not per issue", () => {
    let issueLookups = 0;
    const board = createBoardContext({
      readItems: () => page([{ id: "PVTI_from_the_sweep", content: { url: URL } }]),
      readIssueItems: () => {
        issueLookups += 1;
        return found;
      },
    });

    board.items(); // what projects-backfill.mjs / projects-reconcile.mjs do up front
    expect(board.itemsFor(ISSUE)).toEqual([{ id: "PVTI_from_the_sweep", content: { url: URL } }]);
    expect(issueLookups).toBe(0);
  });

  it("falls back to the whole-board read when the lookup fails — no new way to fail main", () => {
    const lines: string[] = [];
    let boardReads = 0;
    const board = createBoardContext({
      readItems: () => {
        boardReads += 1;
        return page([{ id: "PVTI_from_the_board", content: { url: URL } }]);
      },
      readIssueItems: () => {
        throw Object.assign(new Error("Command failed: gh api graphql"), {
          stderr: "GraphQL: Resource not accessible by personal access token\n",
        });
      },
      log: (line) => lines.push(line),
    });

    expect(board.itemsFor(ISSUE)).toEqual([{ id: "PVTI_from_the_board", content: { url: URL } }]);
    expect(boardReads).toBe(1);
    expect(lines.join(" ")).toContain("falling back to the whole-board read");
  });

  it("lets an exhausted quota through — a board read cannot succeed where this just didn't", () => {
    const board = createBoardContext({
      readItems: () => {
        throw new Error("a spent hour must not be answered with another ~400-point read");
      },
      readIssueItems: () => {
        throw new Error(
          '`gh api graphql` hit "API rate limit exceeded" — this token\'s hourly GraphQL budget is spent',
        );
      },
      log: () => undefined,
    });

    expect(() => board.itemsFor(ISSUE)).toThrow("API rate limit exceeded");
  });
});

describe("moneypenny projects: the GraphQL read, and the false miss it refuses to hand back (#4439)", () => {
  const ok = (nodes: unknown[]) =>
    JSON.stringify({
      data: {
        projectOwner: { projectV2: { id: "PVT_board" } },
        repository: { issue: { projectItems: { nodes } } },
      },
    });

  it("asks about this issue and about the project's visibility in one call", () => {
    let argv: string[] = [];
    readIssueItemsFromGh(ISSUE, {
      gh: (a: string[]) => {
        argv = a;
        return ok([]);
      },
    });

    const flat = argv.join(" ");
    expect(argv.slice(0, 2)).toEqual(["api", "graphql"]);
    expect(flat).toContain("projectItems(first:20,includeArchived:false)");
    expect(flat).toContain("projectOwner: user(login:$projectOwner)");
    expect(flat).toContain("number=4290");
    expect(flat).toContain("project=2");
  });

  it("hands back the item GitHub named, shaped like an item-list row", () => {
    expect(
      readIssueItemsFromGh(ISSUE, {
        gh: () => ok([{ id: "PVTI_ours", project: { number: 2 } }]),
      }),
    ).toEqual([{ id: "PVTI_ours", content: { type: "Issue", url: URL } }]);
  });

  it("trusts an empty list only because the project answered — a genuine not-on-the-board", () => {
    expect(readIssueItemsFromGh(ISSUE, { gh: () => ok([]) })).toEqual([]);
  });

  it("refuses to read an empty list from a token blind to the project — that is a FALSE miss", () => {
    // The outcome this guard exists to prevent is worse than the bug it is part of fixing: a false
    // miss sends every sync through item-add → "Content already exists" → three whole-board reads.
    const blind = JSON.stringify({
      data: {
        projectOwner: { projectV2: null },
        repository: { issue: { projectItems: { nodes: [] } } },
      },
    });
    expect(() => readIssueItemsFromGh(ISSUE, { gh: () => blind })).toThrow("false miss");
    expect(() => readIssueItemsFromGh(ISSUE, { gh: () => "" })).toThrow("false miss");
  });
});
