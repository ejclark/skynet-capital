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
  PRIORITY_OPTIONS,
  resolveBoardItem,
  STATUS_FIELD_OPTIONS,
  STATUS_OPTIONS,
  statusForIssue,
  statusOptionsMatch,
} from "../../../scripts/moneypenny/projects.mjs";

// #3818 slice B: the sync rule as a pure decision, so the mapping is proven without ever calling
// GitHub (which this session can't do for Projects anyway — GraphQL is blocked from interactive
// Claude Code sessions; the live `gh project` calls in projects-setup.mjs are only exercised by a
// real Actions run).
describe("moneypenny projects: statusForIssue", () => {
  it("closed always reads Done, even if it would otherwise be Blocked or In Progress", () => {
    expect(statusForIssue({ state: "closed", labels: ["needs-eric"], hasOpenLinkedPr: true })).toBe(
      "Done",
    );
  });

  it("needs-eric or needs-info reads Blocked ahead of an open linked PR", () => {
    expect(statusForIssue({ labels: ["needs-eric"], hasOpenLinkedPr: true })).toBe("Blocked");
    expect(statusForIssue({ labels: ["needs-info"] })).toBe("Blocked");
  });

  it("an open linked PR reads In Progress ahead of ready", () => {
    expect(statusForIssue({ labels: ["ready"], hasOpenLinkedPr: true })).toBe("In Progress");
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

describe("moneypenny projects: field/option constants", () => {
  it("Status carries the five kanban columns, in column order", () => {
    expect(STATUS_OPTIONS).toEqual(["Backlog", "Ready", "In Progress", "Blocked", "Done"]);
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
  it("matches the same five names in any order", () => {
    expect(statusOptionsMatch(["Done", "Backlog", "Blocked", "Ready", "In Progress"])).toBe(true);
  });

  it("does not match GitHub's own default Status options (Todo/In Progress/Done)", () => {
    expect(statusOptionsMatch(["Todo", "In Progress", "Done"])).toBe(false);
  });

  it("does not match a superset or a subset of the five", () => {
    expect(
      statusOptionsMatch(["Backlog", "Ready", "In Progress", "Blocked", "Done", "Extra"]),
    ).toBe(false);
    expect(statusOptionsMatch(["Backlog", "Ready"])).toBe(false);
  });

  it("does not match nothing", () => {
    expect(statusOptionsMatch()).toBe(false);
    expect(statusOptionsMatch([])).toBe(false);
  });

  it("STATUS_FIELD_OPTIONS carries the same five names STATUS_OPTIONS does, each with a color", () => {
    expect(STATUS_FIELD_OPTIONS.map((o) => o.name)).toEqual(STATUS_OPTIONS);
    for (const option of STATUS_FIELD_OPTIONS) {
      expect(typeof option.color).toBe("string");
      expect(option.color.length).toBeGreaterThan(0);
    }
  });
});
