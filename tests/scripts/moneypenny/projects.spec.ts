import { describe, expect, it } from "@rstest/core";
import { withRetry } from "../../../scripts/moneypenny/gh.mjs";
import {
  type BoardItem,
  explainMaskedOwnerFailure,
  FIELDS,
  findBoardItem,
  HORIZON_OPTIONS,
  isAlreadyOnBoardError,
  isBacklogCandidate,
  isMaskedOwnerFailure,
  isRetryableProjectsGhError,
  isStartedPlan,
  PRIORITY_OPTIONS,
  resolveBoardItem,
  STATUS_FIELD_OPTIONS,
  STATUS_OPTIONS,
  statusFieldUpdate,
  statusForIssue,
  statusOptionsMatch,
  subIssueCounts,
  viewsToCreate,
} from "../../../scripts/moneypenny/projects.mjs";

// #3818 slice B: the sync rule as a pure decision, so the mapping is proven without ever calling
// GitHub (which this session can't do for Projects anyway — GraphQL is blocked from interactive
// Claude Code sessions; the live `gh project` calls in projects-setup.mjs are only exercised by a
// real Actions run).
describe("moneypenny projects: statusForIssue", () => {
  it("closed always reads Done, even if it would otherwise be Blocked or Building now", () => {
    expect(statusForIssue({ state: "closed", labels: ["needs-eric"], hasOpenLinkedPr: true })).toBe(
      "Done",
    );
  });

  it("needs-eric or needs-info reads Blocked ahead of an open linked PR", () => {
    expect(statusForIssue({ labels: ["needs-eric"], hasOpenLinkedPr: true })).toBe("Blocked");
    expect(statusForIssue({ labels: ["needs-info"] })).toBe("Blocked");
  });

  it("an open linked PR reads Building now ahead of ready", () => {
    expect(statusForIssue({ labels: ["ready"], hasOpenLinkedPr: true })).toBe("Building now");
  });

  // #3960: the label is the in-flight signal — the sync never passes `hasOpenLinkedPr`, and live
  // sessions auto-merge before an open PR could be seen, so without it the column read 0 forever.
  it("the in-progress label reads Building now ahead of ready, with no linked PR needed", () => {
    expect(statusForIssue({ labels: ["feedback", "ready", "in-progress"] })).toBe("Building now");
  });

  // #3913 slice 2: a needs-eric with no "Needs from you" callout is not waiting on Eric yet.
  it("does not read Blocked for a needs-eric whose decision callout is missing", () => {
    expect(statusForIssue({ labels: ["needs-eric"], decisionCalloutMissing: true })).toBe(
      "Backlog",
    );
    expect(statusForIssue({ labels: ["needs-eric", "ready"], decisionCalloutMissing: true })).toBe(
      "Ready",
    );
    expect(
      statusForIssue({ labels: ["needs-eric", "needs-info"], decisionCalloutMissing: true }),
    ).toBe("Blocked");
  });

  it("in-progress still yields to Blocked and to Done", () => {
    expect(statusForIssue({ labels: ["in-progress", "needs-info"] })).toBe("Blocked");
    expect(statusForIssue({ labels: ["in-progress", "needs-eric"] })).toBe("Blocked");
    expect(statusForIssue({ state: "closed", labels: ["in-progress"] })).toBe("Done");
  });

  it("ready with no linked PR reads Ready", () => {
    expect(statusForIssue({ labels: ["ready"] })).toBe("Ready");
  });

  it("an open issue with none of the above reads Backlog", () => {
    expect(statusForIssue({ labels: ["feedback"] })).toBe("Backlog");
    expect(statusForIssue()).toBe("Backlog");
  });
});

describe("moneypenny projects: isBacklogCandidate", () => {
  it("excludes ci-failure trackers — the event-research queue, not product backlog", () => {
    expect(isBacklogCandidate({ labels: ["ci-failure"] })).toBe(false);
    expect(isBacklogCandidate({ labels: ["ci-failure", "enhancement"] })).toBe(false);
  });

  it("admits everything else, including an untagged issue", () => {
    expect(isBacklogCandidate({ labels: ["enhancement", "plan"] })).toBe(true);
    expect(isBacklogCandidate()).toBe(true);
  });
});

// #3914: `sync project status` went red on `main` with one line — `unknown owner type` — 42 minutes
// after the same command succeeded 39 times in the backfill run. Reproduced on gh 2.101.0: a bogus
// GH_TOKEN produces exactly that string from `gh project`, where `gh api graphql` says
// `Bad credentials (HTTP 401)`. gh discards the cause, so withRetry's status-text classifier was
// blind to a transient hiding behind it and gave the call a single attempt.
describe("moneypenny projects: gh's masked owner-lookup failure", () => {
  it("recognizes the masked string, and nothing else", () => {
    expect(isMaskedOwnerFailure("unknown owner type\n")).toBe(true);
    expect(isMaskedOwnerFailure("Unknown owner type")).toBe(true);
    expect(isMaskedOwnerFailure("gh: HTTP 404: Not Found")).toBe(false);
    expect(isMaskedOwnerFailure(undefined)).toBe(false);
  });

  it("treats it as retryable, while still failing fast on a real 4xx", () => {
    expect(isRetryableProjectsGhError("unknown owner type")).toBe(true);
    expect(isRetryableProjectsGhError("gh: HTTP 504: Gateway Timeout")).toBe(true);
    expect(isRetryableProjectsGhError("gh: HTTP 404: Not Found")).toBe(false);
    expect(isRetryableProjectsGhError("Resource not accessible by personal access token")).toBe(
      false,
    );
  });

  it("gives the masked failure all three attempts, where the default classifier gives it one", () => {
    const attemptsUnder = (isTransient?: (text: string) => boolean) => {
      let calls = 0;
      try {
        withRetry(
          () => {
            calls += 1;
            throw Object.assign(
              new Error("Command failed: gh project item-add 2 --owner ejclark"),
              {
                stderr: "unknown owner type\n",
              },
            );
          },
          { isTransient, sleep: () => undefined },
        );
      } catch {
        /* the point is the attempt count, not the throw */
      }
      return calls;
    };
    expect(attemptsUnder(isRetryableProjectsGhError)).toBe(3);
    expect(attemptsUnder(undefined)).toBe(1);
  });
});

describe("moneypenny projects: explainMaskedOwnerFailure", () => {
  it("names the credential when a direct GraphQL probe also gets 401'd", () => {
    const out = explainMaskedOwnerFailure({ ok: false, text: "gh: Bad credentials (HTTP 401)" });
    expect(out).toMatch(/PROJECTS_PAT/);
    expect(out).toMatch(/project.*scope/);
    expect(out).toMatch(/Bad credentials/);
  });

  it("clears the credential and calls it GitHub-side when the probe succeeds", () => {
    const out = explainMaskedOwnerFailure({ ok: true, text: '{"data":{"viewer":{"login":"x"}}}' });
    expect(out).toMatch(/credential is good/);
    expect(out).toMatch(/re-run/);
  });

  it("says transient when the probe hit a 5xx too", () => {
    expect(explainMaskedOwnerFailure({ text: "HTTP 502 Bad Gateway" })).toMatch(/transient/);
  });

  it("quotes whatever the probe said rather than inventing a cause, even with no probe at all", () => {
    expect(explainMaskedOwnerFailure({ text: "something new from GitHub" })).toMatch(
      /something new from GitHub/,
    );
    expect(explainMaskedOwnerFailure()).toMatch(/\(nothing\)/);
  });

  it("always leads with the masked string, so a log search for it lands on the explanation", () => {
    for (const probe of [{ ok: true }, { ok: false, text: "HTTP 401" }, undefined]) {
      expect(explainMaskedOwnerFailure(probe)).toMatch(/^`gh project` failed with `unknown owner/);
    }
  });
});

// #3954: `sync project status` went red on `main` because `gh project item-add` is not idempotent —
// the second `issues` event on an issue already on the board answers
// `GraphQL: Content already exists in this project`, and the add is only there to learn the item id.
describe("moneypenny projects: an issue already on the board", () => {
  const URL = "https://github.com/ejclark/skynet-capital/issues/3953";
  const EXISTING: BoardItem = { id: "PVTI_existing", content: { type: "Issue", url: URL } };
  const alreadyExists = () => {
    throw Object.assign(new Error("Command failed: gh project item-add 2 --owner ejclark"), {
      stderr: "GraphQL: Content already exists in this project (addProjectV2ItemById)\n",
    });
  };

  it("recognizes the already-exists failure, and nothing else", () => {
    expect(isAlreadyOnBoardError("GraphQL: Content already exists in this project")).toBe(true);
    expect(isAlreadyOnBoardError("unknown owner type")).toBe(false);
    expect(isAlreadyOnBoardError(undefined)).toBe(false);
  });

  it("never retries it — three attempts at a permanent failure is three failures", () => {
    expect(isRetryableProjectsGhError("Content already exists in this project")).toBe(false);
  });

  it("matches the board item on content URL, not on a bare number or a draft item", () => {
    expect(findBoardItem([{ id: "PVTI_draft" }, EXISTING], URL)).toBe(EXISTING);
    expect(findBoardItem([EXISTING], "https://github.com/ejclark/skynet-capital/issues/1")).toBe(
      undefined,
    );
    expect(findBoardItem([EXISTING], undefined)).toBe(undefined);
  });

  it("reads the existing item's id back out of item-list instead of failing the job", () => {
    const resolved = resolveBoardItem({
      issueUrl: URL,
      addItem: alreadyExists,
      listItems: () => ({ items: [EXISTING], totalCount: 1 }),
    });
    expect(resolved).toEqual({ item: EXISTING, added: false });
  });

  it("still reports `added` for an issue that really was new to the board", () => {
    const fresh: BoardItem = { id: "PVTI_new", content: { url: URL } };
    expect(
      resolveBoardItem({
        issueUrl: URL,
        addItem: () => fresh,
        listItems: () => {
          throw new Error("item-list must not be called when the add succeeds");
        },
      }),
    ).toEqual({ item: fresh, added: true });
  });

  it("passes any other add failure straight through, untouched — only this one string is benign", () => {
    const masked = Object.assign(new Error("Command failed: gh project item-add"), {
      stderr: "unknown owner type\n",
    });
    let thrown: unknown;
    try {
      resolveBoardItem({
        issueUrl: URL,
        addItem: () => {
          throw masked;
        },
        listItems: () => {
          throw new Error("item-list must not be called for an unrelated failure");
        },
      });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBe(masked);
  });

  it("fails closed and names truncation when the item list stopped short of the board", () => {
    expect(() =>
      resolveBoardItem({
        issueUrl: URL,
        addItem: alreadyExists,
        listItems: () => ({ items: [{ id: "PVTI_other" }], totalCount: 40 }),
        sleep: () => undefined,
      }),
    ).toThrow(/truncated/);
  });

  it("fails closed and names the archived case when a complete list still lacks the item", () => {
    expect(() =>
      resolveBoardItem({
        issueUrl: URL,
        addItem: alreadyExists,
        listItems: () => ({ items: [], totalCount: 0 }),
        sleep: () => undefined,
      }),
    ).toThrow(/archived/);
  });
});

// #3979: the same failure came back wearing the other half of the race. Filing #3977 applied three
// labels in one second, moneypenny-events.yml keys concurrency by label name (#716), so three
// `sync project status` runs raced — and the sibling that lost the add read an `item-list` that did
// not yet carry the item the winner had just committed. Two of three runs passed; one threw the
// fail-closed "archived" error at a board that was merely two seconds behind itself.
describe("moneypenny projects: a board that reads stale right after a sibling's add", () => {
  const URL = "https://github.com/ejclark/skynet-capital/issues/3977";
  const ADDED: BoardItem = { id: "PVTI_added", content: { type: "Issue", url: URL } };
  const alreadyExists = () => {
    throw Object.assign(new Error("Command failed: gh project item-add 2 --owner ejclark"), {
      stderr: "GraphQL: Content already exists in this project (addProjectV2ItemById)\n",
    });
  };

  it("re-reads the board and finds the item a lagging first read missed", () => {
    const pages = [
      { items: [{ id: "PVTI_other" }], totalCount: 1 },
      { items: [{ id: "PVTI_other" }, ADDED], totalCount: 2 },
    ];
    const slept: number[] = [];

    const resolved = resolveBoardItem({
      issueUrl: URL,
      addItem: alreadyExists,
      listItems: () => pages.shift() ?? { items: [], totalCount: 0 },
      sleep: (ms) => slept.push(ms),
    });

    expect(resolved).toEqual({ item: ADDED, added: false });
    expect(slept).toEqual([2000]); // backed off once before the second read, never sooner
  });

  it("backs off exponentially and spends every attempt before failing closed", () => {
    const slept: number[] = [];
    let reads = 0;

    expect(() =>
      resolveBoardItem({
        issueUrl: URL,
        addItem: alreadyExists,
        listItems: () => {
          reads += 1;
          return { items: [], totalCount: 0 };
        },
        sleep: (ms) => slept.push(ms),
      }),
    ).toThrow(/after 3 reads/);
    expect(reads).toBe(3);
    expect(slept).toEqual([2000, 4000]);
  });

  it("never re-reads a truncated page — a short list stays short however long you wait", () => {
    let reads = 0;
    expect(() =>
      resolveBoardItem({
        issueUrl: URL,
        addItem: alreadyExists,
        listItems: () => {
          reads += 1;
          return { items: [{ id: "PVTI_other" }], totalCount: 40 };
        },
        sleep: () => undefined,
      }),
    ).toThrow(/truncated/);
    expect(reads).toBe(1);
  });

  it("still never calls item-list at all when the add itself succeeds", () => {
    const fresh: BoardItem = { id: "PVTI_new", content: { url: URL } };
    expect(
      resolveBoardItem({
        issueUrl: URL,
        addItem: () => fresh,
        listItems: () => {
          throw new Error("item-list must not be called when the add succeeds");
        },
        sleep: () => {
          throw new Error("a successful add must never sleep");
        },
      }),
    ).toEqual({ item: fresh, added: true });
  });
});

// #4393 slice 4, criterion 5 — a started plan nobody is building reads Waiting. "Started" is a
// closed sub-issue OR `next-slice` (most plans here slice by PR, not by sub-issue).
describe("moneypenny projects: the Waiting column (#4393 criterion 5)", () => {
  const plan = (labels: string[], total = 0, completed = 0) => ({
    labels: ["plan", ...labels],
    subIssues: { total, completed },
  });

  it("WHEN a plan has a closed and an open sub-issue and no in-progress, it reads Waiting", () => {
    expect(statusForIssue(plan(["ready"], 3, 1))).toBe("Waiting");
    expect(statusForIssue(plan([], 11, 6))).toBe("Waiting");
  });

  it("a plan the lane shipped a slice of (next-slice) reads Waiting with no sub-issues at all", () => {
    expect(statusForIssue(plan(["ready", "next-slice"]))).toBe("Waiting");
  });

  it("being built wins: the same plan with in-progress reads Building now", () => {
    expect(statusForIssue(plan(["ready", "in-progress"], 3, 1))).toBe("Building now");
  });

  it("blocked wins: a started plan waiting on Eric reads Blocked, not Waiting", () => {
    expect(statusForIssue(plan(["needs-eric"], 3, 1))).toBe("Blocked");
  });

  it("a fresh plan (no closed sub-issue, no next-slice) is never Waiting", () => {
    expect(statusForIssue(plan(["ready"], 4, 0))).toBe("Ready");
    expect(statusForIssue(plan([], 0, 0))).toBe("Backlog");
  });

  it("a plan with every sub-issue closed and no next-slice is finished, not Waiting", () => {
    expect(statusForIssue(plan([], 8, 8))).toBe("Backlog");
  });

  it("only plans wait — a feedback issue with sub-issues reads by its labels", () => {
    expect(
      statusForIssue({ labels: ["feedback", "ready"], subIssues: { total: 2, completed: 1 } }),
    ).toBe("Ready");
  });

  it("isStartedPlan and subIssueCounts read GitHub's own summary shape", () => {
    expect(subIssueCounts({ sub_issues_summary: { total: 5, completed: 2 } })).toEqual({
      total: 5,
      completed: 2,
    });
    expect(subIssueCounts({})).toEqual({ total: 0, completed: 0 });
    expect(isStartedPlan({ labels: ["plan"], subIssues: { completed: 1 } })).toBe(true);
    expect(isStartedPlan({ labels: ["plan", "next-slice"] })).toBe(true);
    expect(isStartedPlan({ labels: ["plan"] })).toBe(false);
    expect(isStartedPlan({ labels: ["feedback", "next-slice"] })).toBe(false);
  });
});

// The window between this rule merging and the sweep renaming the live field: a sync must never ask
// for a column the board does not carry yet (that write throws and reddens `main`).
describe("moneypenny projects: statusForIssue against an older board (columns)", () => {
  const OLD = ["Backlog", "Ready", "In Progress", "Blocked", "Done"];

  it("writes the building column under its old name until the rename lands", () => {
    expect(statusForIssue({ labels: ["in-progress"], columns: OLD })).toBe("In Progress");
  });

  it("falls back to the column a plan would read without Waiting", () => {
    expect(statusForIssue({ labels: ["plan", "ready", "next-slice"], columns: OLD })).toBe("Ready");
  });
});

describe("moneypenny projects: field/option constants", () => {
  it("Status carries the six kanban columns, in column order (#4393 slice 4)", () => {
    expect(STATUS_OPTIONS).toEqual([
      "Backlog",
      "Ready",
      "Building now",
      "Waiting",
      "Blocked",
      "Done",
    ]);
  });

  it("Priority and Horizon are the backlog-sort and roadmap-group option sets", () => {
    expect(PRIORITY_OPTIONS).toEqual(["P0", "P1", "P2", "P3"]);
    expect(HORIZON_OPTIONS).toEqual(["Now", "Next", "Later"]);
  });

  it("FIELDS names every field the setup script must create, each with its data type", () => {
    const byName = new Map(FIELDS.map((f) => [f.name, f]));
    expect(byName.get("Status")?.dataType).toBe("SINGLE_SELECT");
    expect(byName.get("Priority")?.dataType).toBe("SINGLE_SELECT");
    expect(byName.get("Horizon")?.dataType).toBe("SINGLE_SELECT");
    expect(byName.get("Target date")?.dataType).toBe("DATE");
    expect(byName.get("Target date")?.options).toBeUndefined();
  });
});

describe("moneypenny projects: statusOptionsMatch", () => {
  it("matches the same six names in any order", () => {
    expect(
      statusOptionsMatch(["Done", "Waiting", "Backlog", "Blocked", "Ready", "Building now"]),
    ).toBe(true);
  });

  it("does not match the board as it stood before #4393 slice 4", () => {
    expect(statusOptionsMatch(["Backlog", "Ready", "In Progress", "Blocked", "Done"])).toBe(false);
  });

  it("does not match GitHub's own default Status options (Todo/In Progress/Done)", () => {
    expect(statusOptionsMatch(["Todo", "In Progress", "Done"])).toBe(false);
  });

  it("does not match a superset or a subset of the six", () => {
    expect(statusOptionsMatch([...STATUS_OPTIONS, "Extra"])).toBe(false);
    expect(statusOptionsMatch(["Backlog", "Ready"])).toBe(false);
  });

  it("does not match nothing", () => {
    expect(statusOptionsMatch()).toBe(false);
    expect(statusOptionsMatch([])).toBe(false);
  });

  it("STATUS_FIELD_OPTIONS carries the same names STATUS_OPTIONS does, each with a color", () => {
    expect(STATUS_FIELD_OPTIONS.map((o) => o.name)).toEqual(STATUS_OPTIONS);
    for (const option of STATUS_FIELD_OPTIONS) {
      expect(typeof option.color).toBe("string");
      expect(option.color.length).toBeGreaterThan(0);
    }
  });
});

// #4393 slice 4, criterion 9 — the rename must move no card. `updateProjectV2Field` replaces the
// whole option list; an option sent WITH its old id is renamed in place, one sent without is new.
describe("moneypenny projects: statusFieldUpdate", () => {
  const live = [
    { id: "o-backlog", name: "Backlog" },
    { id: "o-ready", name: "Ready" },
    { id: "o-progress", name: "In Progress" },
    { id: "o-blocked", name: "Blocked" },
    { id: "o-done", name: "Done" },
  ];

  it("renames In Progress to Building now on the SAME option id, and adds Waiting without one", () => {
    const update = statusFieldUpdate(live);
    expect(update?.map((o) => [o.name, o.id])).toEqual([
      ["Backlog", "o-backlog"],
      ["Ready", "o-ready"],
      ["Building now", "o-progress"],
      ["Waiting", undefined],
      ["Blocked", "o-blocked"],
      ["Done", "o-done"],
    ]);
    for (const option of update ?? []) expect(typeof option.color).toBe("string");
  });

  it("returns null once the board already matches — the sweep's every-push check writes nothing", () => {
    const now = STATUS_OPTIONS.map((name, k) => ({ id: `o${k}`, name }));
    expect(statusFieldUpdate(now)).toBeNull();
  });

  it("keeps an option already named Building now over a stray In Progress", () => {
    const both = [...live, { id: "o-building", name: "Building now" }];
    expect(statusFieldUpdate(both)?.find((o) => o.name === "Building now")?.id).toBe("o-building");
  });

  it("fixes GitHub's own Todo/In Progress/Done default, keeping the ids it can", () => {
    const update = statusFieldUpdate([
      { id: "t", name: "Todo" },
      { id: "p", name: "In Progress" },
      { id: "d", name: "Done" },
    ]);
    expect(update?.map((o) => o.name)).toEqual(STATUS_OPTIONS);
    expect(update?.find((o) => o.name === "Building now")?.id).toBe("p");
    expect(update?.find((o) => o.name === "Done")?.id).toBe("d");
    expect(update?.some((o) => o.id === "t")).toBe(false);
  });
});

describe("moneypenny projects: viewsToCreate", () => {
  const ids = { Status: 1, Priority: 2, Horizon: 3, "Target date": 4 };

  it("builds a kanban on Status, a Priority-sorted backlog and a dateless Horizon roadmap", () => {
    const [flow, backlog, roadmap] = viewsToCreate([], ids);
    expect([flow?.name, backlog?.name, roadmap?.name]).toEqual(["Flow", "Backlog", "Roadmap"]);
    expect(flow?.body).toMatchObject({ layout: "board", vertical_group_by: [1] });
    expect(backlog?.body).toMatchObject({ layout: "table", sort_by: [[2, "asc"]] });
    expect(roadmap?.body).toMatchObject({
      layout: "board",
      vertical_group_by: [3],
      group_by: [2],
    });
  });

  it("skips views that already exist by name", () => {
    const names = viewsToCreate(["Flow", "Backlog", "View 1"], ids).map((v) => v.name);
    expect(names).toEqual(["Roadmap"]);
  });

  it("fails loudly when a field the views need is missing", () => {
    expect(() => viewsToCreate([], { Status: 1 })).toThrow(/not found/);
  });
});
