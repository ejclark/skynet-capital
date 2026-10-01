import { describe, expect, it } from "@rstest/core";
import {
  boardIssueNumber,
  boardItemsOrThrow,
  planReconcile,
  type ReconcileItem,
  type RestIssue,
  readOpenIssuesWithRetry,
  reconcileBoard,
} from "../../../scripts/moneypenny/projects-reconcile.mjs";
import { createBoardContext } from "../../../scripts/moneypenny/projects-sync.mjs";

// #4393 slice 1, criterion 4 — the board heals itself. On 2026-10-01 In Progress showed four cards
// while zero open issues carried `in-progress` and two of the four were closed: eight event-job
// runs died on the GraphQL rate limit and a closed issue never gets another event. The sweep finds
// every card in the wrong column and re-syncs only those. Driven entirely through injected IO —
// the live script needs PROJECTS_PAT and has not been run from a session (see its header).

const URL = "https://github.com/ejclark/skynet-capital/issues/";
const card = (number: number, status: string | null): ReconcileItem => ({
  id: `PVTI_${number}`,
  content: { type: "Issue", number, url: `${URL}${number}` },
  status,
});
const open = (
  number: number,
  labels: string[] = [],
  extra: Partial<RestIssue> = {},
): RestIssue => ({
  number,
  state: "open",
  labels: labels.map((name) => ({ name })),
  body: "",
  user: { login: "someone" },
  ...extra,
});

describe("planReconcile: which cards sit in the wrong column", () => {
  it("finds the 2026-10-01 picture: closed cards outside Done, an unlabelled card in In Progress", () => {
    const drift = planReconcile({
      items: [card(3818, "In Progress"), card(3953, "In Progress"), card(4327, "In Progress")],
      openIssues: [open(4327, ["ready"])],
    });
    expect(drift).toEqual([
      { number: 3818, have: "In Progress", want: "Done" },
      { number: 3953, have: "In Progress", want: "Done" },
      { number: 4327, have: "In Progress", want: "Ready" },
    ]);
  });

  it("leaves every agreeing card alone", () => {
    expect(
      planReconcile({
        items: [card(1, "Ready"), card(2, "In Progress"), card(3, "Backlog"), card(4, "Done")],
        openIssues: [open(1, ["ready"]), open(2, ["in-progress"]), open(3)],
      }),
    ).toEqual([]);
  });

  it("gives a card with no Status yet its column", () => {
    expect(
      planReconcile({ items: [card(7, null)], openIssues: [open(7, ["in-progress"])] }),
    ).toEqual([{ number: 7, have: null, want: "In Progress" }]);
  });

  it("uses the same Blocked rule as the event job, decision callout included (#3913)", () => {
    const drift = planReconcile({
      items: [card(8, "Backlog"), card(9, "Blocked")],
      openIssues: [
        open(8, ["needs-info"]),
        open(9, ["needs-eric"], { body: "no callout here", user: { login: "claude" } }),
      ],
    });
    expect(drift).toEqual([
      { number: 8, have: "Backlog", want: "Blocked" },
      { number: 9, have: "Blocked", want: "Backlog" },
    ]);
  });

  it("never touches a ci-failure tracker — not backlog, not the sweep's business", () => {
    expect(
      planReconcile({ items: [card(10, "Backlog")], openIssues: [open(10, ["ci-failure"])] }),
    ).toEqual([]);
  });

  it("skips draft items, pull requests and other repos' issues", () => {
    expect(
      planReconcile({
        items: [
          { id: "draft" },
          {
            id: "pr",
            content: {
              type: "PullRequest",
              url: "https://github.com/ejclark/skynet-capital/pull/5",
            },
          },
          {
            id: "other",
            content: { url: "https://github.com/octo/other/issues/6" },
            status: "Ready",
          },
        ],
        openIssues: [],
      }),
    ).toEqual([]);
  });

  it("does not mistake a pull request in the open list for an open issue", () => {
    const drift = planReconcile({
      items: [card(11, "In Progress")],
      openIssues: [open(11, ["in-progress"], { pull_request: {} })],
    });
    expect(drift).toEqual([{ number: 11, have: "In Progress", want: "Done" }]);
  });
});

describe("boardIssueNumber", () => {
  it("reads this repo's issue url and nothing else", () => {
    expect(boardIssueNumber(card(4393, "Ready"))).toBe(4393);
    expect(boardIssueNumber({ id: "x", content: { url: `${URL}12/` } })).toBeNull();
    expect(boardIssueNumber(undefined)).toBeNull();
  });
});

function sweep({
  items,
  openIssues,
  remaining = 4000,
  syncImpl,
  dryRun = false,
}: {
  items: ReconcileItem[];
  openIssues: RestIssue[];
  remaining?: number;
  syncImpl?: (n: number) => { status?: string; skipped?: boolean; reason?: string };
  dryRun?: boolean;
}) {
  let boardReads = 0;
  const synced: number[] = [];
  const lines: string[] = [];
  const board = createBoardContext({
    readItems: () => {
      boardReads += 1;
      return { items, totalCount: items.length };
    },
  });
  const result = reconcileBoard({
    board,
    readOpenIssues: () => openIssues,
    rateLimit: () => ({ remaining, reset: 1_900_000_000 }),
    sync: (n, opts) => {
      synced.push(n);
      opts.board.items(); // what syncIssue's resolveBoardItem does — must hit the cache
      return syncImpl ? syncImpl(n) : { status: "Done" };
    },
    dryRun,
    log: (l) => lines.push(l),
  });
  return { result, synced, lines, boardReads: () => boardReads };
}

describe("reconcileBoard: the sweep", () => {
  it("re-syncs only the drifted cards, reading the board once for the whole run (#4183)", () => {
    const s = sweep({
      items: [card(1, "In Progress"), card(2, "Ready"), card(3, "In Progress")],
      openIssues: [open(2, ["ready"])],
    });
    expect(s.synced).toEqual([1, 3]);
    expect(s.boardReads()).toBe(1);
    expect(s.result.fixed.map((f) => f.number)).toEqual([1, 3]);
  });

  it("refuses to start below the GraphQL floor, and reads the board not at all", () => {
    const s = sweep({ items: [card(1, "In Progress")], openIssues: [], remaining: 40 });
    expect(s.result.started).toBe(false);
    expect(s.synced).toEqual([]);
    expect(s.boardReads()).toBe(0);
    expect(s.lines[0]).toContain("refusing to start");
  });

  it("aborts at the first exhausted-quota failure instead of grinding on", () => {
    const s = sweep({
      items: [card(1, "In Progress"), card(2, "In Progress"), card(3, "In Progress")],
      openIssues: [],
      syncImpl: (n) => {
        if (n === 2) throw new Error("GraphQL: API rate limit exceeded for user ID 1");
        return { status: "Done" };
      },
    });
    expect(s.synced).toEqual([1, 2]);
    expect(s.result.aborted).toBe(true);
    expect(s.result.failed).toEqual([
      { number: 2, message: "GraphQL: API rate limit exceeded for user ID 1" },
    ]);
  });

  it("records an ordinary failure and carries on to the next card", () => {
    const s = sweep({
      items: [card(1, "In Progress"), card(2, "In Progress")],
      openIssues: [],
      syncImpl: (n) => {
        if (n === 1) throw new Error("curl: (22) The requested URL returned error: 404");
        return { status: "Done" };
      },
    });
    expect(s.synced).toEqual([1, 2]);
    expect(s.result.aborted).toBe(false);
    expect(s.result.failed.map((f) => f.number)).toEqual([1]);
  });

  it("writes nothing on a dry run, but says what it would move", () => {
    const s = sweep({ items: [card(1, "In Progress")], openIssues: [], dryRun: true });
    expect(s.synced).toEqual([]);
    expect(s.lines).toContain('#1: would move "In Progress" → "Done"');
  });

  it("writes nothing on a board that already agrees", () => {
    const s = sweep({ items: [card(1, "Ready")], openIssues: [open(1, ["ready"])] });
    expect(s.synced).toEqual([]);
    expect(s.result.drift).toEqual([]);
  });
});

// #4182 — THE SWEEP'S ONE REST READ HAD NO SECOND CHANCE. `ghRestAll` shells to curl, whose 5xx
// wording the shared transient classifier never matched (the reason `readIssue` had to be wrapped),
// and it throws rather than return a truncated list — so one 502 on page 2 ended the whole hourly
// run. 12 of the 2026-09-30 backfill's 20 failures were GitHub 5xx. Curl strings verbatim from
// curl 8.5 against a local 502/403.
describe("readOpenIssuesWithRetry: the open-issue read rides out a GitHub 5xx", () => {
  const curlFail = (code: number) =>
    Object.assign(new Error("Command failed: curl"), {
      stderr: `curl: (22) The requested URL returned error: ${code}`,
    });

  it("retries a 502 with backoff and returns the issues", () => {
    const waits: number[] = [];
    let calls = 0;
    const issues = readOpenIssuesWithRetry({
      read: (path) => {
        calls += 1;
        expect(path).toBe("issues?state=open");
        if (calls < 3) throw curlFail(502);
        return [open(1, ["ready"])];
      },
      sleep: (ms) => waits.push(ms),
    });

    expect(issues.map((i) => i.number)).toEqual([1]);
    expect(waits).toEqual([2000, 4000]);
  });

  it("is bounded — a 5xx that persists fails the run after three tries", () => {
    let calls = 0;
    expect(() =>
      readOpenIssuesWithRetry({
        read: () => {
          calls += 1;
          throw curlFail(504);
        },
        sleep: () => undefined,
      }),
    ).toThrow("Command failed: curl");
    expect(calls).toBe(3);
  });

  it("fails a rate-limited read at once — an hourly window does not reopen in six seconds", () => {
    const waits: number[] = [];
    let calls = 0;
    expect(() =>
      readOpenIssuesWithRetry({
        read: () => {
          calls += 1;
          throw curlFail(403);
        },
        sleep: (ms) => waits.push(ms),
      }),
    ).toThrow();
    expect([calls, waits.length]).toEqual([1, 0]);
  });
});

// `resolveBoardItem` already treats a truncated page as fatal for ONE issue (#3954). A whole-board
// sweep shrugging at it is worse: it reports the cards it could not see as agreeing — "600 item(s),
// 0 in the wrong column", green, while the rest of the board drifts (#2968's rule, one level up).
describe("boardItemsOrThrow: a truncated board page is fatal, not a quiet pass", () => {
  it("refuses a page GitHub counted higher than it returned, naming the knob to turn", () => {
    expect(() =>
      boardItemsOrThrow({ items: () => ({ items: [card(1, "Ready")], totalCount: 600 }) }),
    ).toThrow(/ITEM_LIST_LIMIT/);
  });

  it("passes a complete page straight through", () => {
    const items = [card(1, "Ready"), card(2, "Done")];
    expect(boardItemsOrThrow({ items: () => ({ items, totalCount: 2 }) })).toEqual(items);
  });

  it("treats a page with no count at all as complete, rather than inventing a failure", () => {
    expect(boardItemsOrThrow({ items: () => ({ items: [card(1, "Ready")] }) })).toEqual([
      card(1, "Ready"),
    ]);
    expect(boardItemsOrThrow({ items: () => ({}) })).toEqual([]);
  });
});
