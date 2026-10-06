import { describe, expect, it } from "@rstest/core";
import { STATUS_OPTIONS } from "../../../scripts/moneypenny/projects.mjs";
import {
  boardIssueNumber,
  boardItemsOrThrow,
  ensureStatusColumns,
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
  it("finds the 2026-10-01 picture: closed cards outside Done, an unlabelled card in Building now", () => {
    const drift = planReconcile({
      items: [card(3818, "Building now"), card(3953, "Building now"), card(4327, "Building now")],
      openIssues: [open(4327, ["ready"])],
    });
    expect(drift).toEqual([
      { number: 3818, have: "Building now", want: "Done" },
      { number: 3953, have: "Building now", want: "Done" },
      { number: 4327, have: "Building now", want: "Ready" },
    ]);
  });

  it("leaves every agreeing card alone", () => {
    expect(
      planReconcile({
        items: [card(1, "Ready"), card(2, "Building now"), card(3, "Backlog"), card(4, "Done")],
        openIssues: [open(1, ["ready"]), open(2, ["in-progress"]), open(3)],
      }),
    ).toEqual([]);
  });

  it("gives a card with no Status yet its column", () => {
    expect(
      planReconcile({ items: [card(7, null)], openIssues: [open(7, ["in-progress"])] }),
    ).toEqual([{ number: 7, have: null, want: "Building now" }]);
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
      items: [card(11, "Building now")],
      openIssues: [open(11, ["in-progress"], { pull_request: {} })],
    });
    expect(drift).toEqual([{ number: 11, have: "Building now", want: "Done" }]);
  });
});

// #4303 (#3959 slice 3), the done-when: "WHEN a member looks for an open ask, the Blocked column
// SHALL list every open needs-eric and needs-info issue." A card is only ever added by the event
// job on a label change; when that run dies (2026-09-30: eight in a row on the rate limit) the
// issue has no card, and a sweep that walks only cards never sees it.
describe("planReconcile: every open ask reaches the Blocked column (#4303)", () => {
  it("adds an open needs-info or needs-eric issue the board has no card for", () => {
    const drift = planReconcile({
      items: [card(1, "Ready")],
      openIssues: [
        open(1, ["ready"]),
        open(20, ["needs-info"]),
        open(21, ["needs-eric"], { body: "> [!IMPORTANT]\n> **Needs from you** — pick one" }),
      ],
    });
    expect(drift).toEqual([
      { number: 20, have: null, want: "Blocked" },
      { number: 21, have: null, want: "Blocked" },
    ]);
  });

  it("leaves uncarded issues outside Blocked to the backfill — the hourly sweep stays cheap", () => {
    expect(
      planReconcile({
        items: [],
        openIssues: [open(30), open(31, ["ready"]), open(32, ["in-progress"])],
      }),
    ).toEqual([]);
  });

  it("holds the decision-callout rule: a needs-eric with no written ask is not an open ask yet", () => {
    expect(
      planReconcile({
        items: [],
        openIssues: [open(40, ["needs-eric"], { body: "no callout", user: { login: "claude" } })],
      }),
    ).toEqual([]);
  });

  it("never adds a ci-failure tracker, whatever it carries", () => {
    expect(
      planReconcile({ items: [], openIssues: [open(50, ["ci-failure", "needs-eric"])] }),
    ).toEqual([]);
  });

  it("does not add a card twice — a carded blocked issue in the right column is quiet", () => {
    expect(
      planReconcile({ items: [card(60, "Blocked")], openIssues: [open(60, ["needs-info"])] }),
    ).toEqual([]);
  });

  it("the sweep syncs the uncarded ask, still on one board read", () => {
    const s = sweep({
      items: [card(1, "Ready")],
      openIssues: [open(1, ["ready"]), open(70, ["needs-info"])],
      syncImpl: () => ({ status: "Blocked" }),
    });
    expect(s.synced).toEqual([70]);
    expect(s.boardReads()).toBe(1);
    expect(s.result.fixed).toEqual([{ number: 70, have: null, want: "Blocked", now: "Blocked" }]);
  });
});

// #3939 slice 4 (#4320), the done-when: "WHEN a built-in workflow and label-derived Status write one
// close event, the board SHALL show one consistent Status." The slice settled on keeping
// projects-sync whole (see statusForIssue()'s block in projects.mjs for the three findings), so what
// has to hold is CONVERGENCE, not exclusivity: whatever value some other writer leaves on a closed
// card — a built-in workflow, a hand-drag in the UI, a half-finished sweep — the next sweep lands on
// exactly one answer and then stops moving it. Idempotence is the half that makes a second writer
// harmless; without it, two writers oscillate.
describe("planReconcile: one consistent Status, whatever else wrote the card (#4320)", () => {
  const STATUSES = ["Backlog", "Ready", "Building now", "Waiting", "Blocked", "Done"];

  it("converges a closed card on Done from every column a second writer could leave it in", () => {
    for (const have of STATUSES) {
      const drift = planReconcile({ items: [card(42, have)], openIssues: [] });
      expect(drift).toEqual(have === "Done" ? [] : [{ number: 42, have, want: "Done" }]);
    }
  });

  it("is idempotent — the sweep that moved a card reports nothing to do on the next run", () => {
    const items = [card(42, "Building now"), card(43, "Blocked")];
    const openIssues = [open(43, ["ready"])];
    const first = planReconcile({ items, openIssues });
    expect(first).toEqual([
      { number: 42, have: "Building now", want: "Done" },
      { number: 43, have: "Blocked", want: "Ready" },
    ]);
    const settled = items.map((item) => ({
      ...item,
      status: first.find((d) => d.number === item.content?.number)?.want ?? item.status,
    }));
    expect(planReconcile({ items: settled, openIssues })).toEqual([]);
  });
});

describe("boardIssueNumber", () => {
  it("reads this repo's issue url and nothing else", () => {
    expect(boardIssueNumber(card(4393, "Ready"))).toBe(4393);
    expect(boardIssueNumber({ id: "x", content: { url: `${URL}12/` } })).toBeNull();
    expect(boardIssueNumber(undefined)).toBeNull();
  });
});

const statusField = (names: readonly string[]) => ({
  id: "F_status",
  name: "Status",
  options: names.map((name) => ({ id: `O_${name}`, name })),
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
    readFields: () => [statusField(STATUS_OPTIONS)],
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
      items: [card(1, "Building now"), card(2, "Ready"), card(3, "Building now")],
      openIssues: [open(2, ["ready"])],
    });
    expect(s.synced).toEqual([1, 3]);
    expect(s.boardReads()).toBe(1);
    expect(s.result.fixed.map((f) => f.number)).toEqual([1, 3]);
  });

  it("refuses to start below the GraphQL floor, and reads the board not at all", () => {
    const s = sweep({ items: [card(1, "Building now")], openIssues: [], remaining: 40 });
    expect(s.result.started).toBe(false);
    expect(s.synced).toEqual([]);
    expect(s.boardReads()).toBe(0);
    expect(s.lines[0]).toContain("refusing to start");
  });

  it("aborts at the first exhausted-quota failure instead of grinding on", () => {
    const s = sweep({
      items: [card(1, "Building now"), card(2, "Building now"), card(3, "Building now")],
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
      items: [card(1, "Building now"), card(2, "Building now")],
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
    const s = sweep({ items: [card(1, "Building now")], openIssues: [], dryRun: true });
    expect(s.synced).toEqual([]);
    expect(s.lines).toContain('#1: would move "Building now" → "Done"');
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

// #4393 slice 4 — the columns before the cards. The merge that changes projects.mjs's option list
// is a push to main, so the sweep it triggers renames In Progress → Building now and adds Waiting
// on the live field, keeping ids so no card moves, and only then plans the cards against it.
describe("ensureStatusColumns: the live field follows projects.mjs", () => {
  const OLD = ["Backlog", "Ready", "In Progress", "Blocked", "Done"];
  const setup = (names: readonly string[]) => {
    let fieldReads = 0;
    let current = names;
    const writes: Array<{ fieldId: string; options: Array<{ id?: string; name: string }> }> = [];
    const board = createBoardContext({
      readItems: () => ({ items: [], totalCount: 0 }),
      readFields: () => {
        fieldReads += 1;
        return [statusField(current)];
      },
    });
    const write = (fieldId: string, options: Array<{ id?: string; name: string }>) => {
      writes.push({ fieldId, options });
      current = options.map((o) => o.name);
    };
    return { board, write, writes, fieldReads: () => fieldReads };
  };

  it("renames and adds in place on an old board, then plans against the new columns", () => {
    const s = setup(OLD);
    const lines: string[] = [];
    const columns = ensureStatusColumns({
      board: s.board,
      write: s.write,
      log: (l) => lines.push(l),
    });
    expect(s.writes).toHaveLength(1);
    expect(s.writes[0]?.fieldId).toBe("F_status");
    expect(s.writes[0]?.options.find((o) => o.name === "Building now")?.id).toBe("O_In Progress");
    expect(s.writes[0]?.options.find((o) => o.name === "Waiting")?.id).toBeUndefined();
    expect(columns).toEqual(STATUS_OPTIONS);
    expect(s.fieldReads()).toBe(2); // the read, then one refresh after the write
    expect(lines[0]).toContain("Status field: changed");
  });

  it("writes nothing on a board that already matches", () => {
    const s = setup(STATUS_OPTIONS);
    expect(ensureStatusColumns({ board: s.board, write: s.write, log: () => undefined })).toEqual(
      STATUS_OPTIONS,
    );
    expect(s.writes).toEqual([]);
  });

  it("a dry run says what it would change and plans against the board as it is", () => {
    const s = setup(OLD);
    const lines: string[] = [];
    const columns = ensureStatusColumns({
      board: s.board,
      write: s.write,
      dryRun: true,
      log: (l) => lines.push(l),
    });
    expect(s.writes).toEqual([]);
    expect(columns).toEqual(OLD);
    expect(lines[0]).toContain("would change");
  });

  it("fails loudly on a board with no Status field rather than planning against nothing", () => {
    const board = createBoardContext({ readFields: () => [] });
    expect(() =>
      ensureStatusColumns({ board, write: () => undefined, log: () => undefined }),
    ).toThrow(/Status/);
  });

  it("an old board's cards are not churned: the building card stays put under its old name", () => {
    const drift = planReconcile({
      items: [card(5, "In Progress"), card(6, "Ready")],
      openIssues: [open(5, ["in-progress"]), open(6, ["plan", "ready", "next-slice"])],
      columns: OLD,
    });
    expect(drift).toEqual([]);
  });

  it("on the new board, a started idle plan moves from Ready to Waiting", () => {
    const drift = planReconcile({
      items: [card(6, "Ready"), card(7, "Ready")],
      openIssues: [
        open(6, ["plan", "ready", "next-slice"]),
        open(7, ["plan", "ready"], { sub_issues_summary: { total: 3, completed: 1 } }),
      ],
    });
    expect(drift).toEqual([
      { number: 6, have: "Ready", want: "Waiting" },
      { number: 7, have: "Ready", want: "Waiting" },
    ]);
  });
});
