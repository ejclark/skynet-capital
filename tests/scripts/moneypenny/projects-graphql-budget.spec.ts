import { describe, expect, it } from "@rstest/core";
import { ghGraphqlBudget, ghRateLimit } from "../../../scripts/moneypenny/gh.mjs";
import {
  type BoardItem,
  classifyRateLimitRefusal,
  explainRateLimitExhausted,
  explainThrottled,
  isRateLimitExhausted,
  isRetryableProjectsGhError,
  isRetryableRestError,
  planBoardSweep,
  resolveBoardItem,
  runThroughRateLimit,
  SWEEP_MIN_GRAPHQL_POINTS,
  THROTTLE_BUDGET_FLOOR,
} from "../../../scripts/moneypenny/projects.mjs";
import { createBoardContext, readIssue } from "../../../scripts/moneypenny/projects-sync.mjs";

// #4183 — THE BOARD SYNC'S GRAPHQL BILL. `projects-setup.yml`'s backfill called `syncIssue` once per
// open issue on 2026-09-30, and each call re-read the board's whole item list plus the project and
// its fields. GraphQL prices an `items(first: 100){ … fieldValues(first: 100) }` page at ~100 points
// by node count, so ninety-odd issues spent the token's entire 5,000-point hour in 5m41s — and every
// `sync project status` run behind the sweep failed on the drain until the window rolled over. The
// bystander that filed #4183 is the one these specs are for.
//
// Every assertion below fails on the pre-fix code: the context did not exist, `resolveBoardItem` had
// no cached path, and nothing classified an exhausted quota at all.

describe("moneypenny projects: the board context reads per-run constants once (#4183)", () => {
  const page = (items: BoardItem[]) => ({ items, totalCount: items.length });

  it("reads the item list, the fields and the project once across a whole sweep", () => {
    let itemReads = 0;
    let fieldReads = 0;
    let projectReads = 0;
    const board = createBoardContext({
      readItems: () => {
        itemReads += 1;
        return page([]);
      },
      readFields: () => {
        fieldReads += 1;
        return [];
      },
      readProject: () => {
        projectReads += 1;
        return { id: "PVT_1", number: 2 };
      },
    });

    // What ninety `syncIssue` calls sharing one context do: touch all three reads every time.
    for (let n = 0; n < 90; n++) {
      board.items();
      board.fields();
      board.project();
    }

    expect([itemReads, fieldReads, projectReads]).toEqual([1, 1, 1]);
  });

  it("spends nothing at all until something actually asks for the board", () => {
    let reads = 0;
    createBoardContext({
      readItems: () => {
        reads += 1;
        return page([]);
      },
    });
    // A `ci-failure` tracker is not a backlog candidate and `syncIssue` returns before the board —
    // constructing the context must not have cost a GraphQL point.
    expect(reads).toBe(0);
  });

  it("re-reads only when a caller explicitly asks for a refresh", () => {
    let reads = 0;
    const board = createBoardContext({
      readItems: () => {
        reads += 1;
        return page([]);
      },
    });

    board.items();
    board.items();
    expect(reads).toBe(1);

    board.items({ refresh: true });
    expect(reads).toBe(2);
  });

  it("folds an item this process just added into the cached list, without another read", () => {
    const fresh: BoardItem = { id: "PVTI_new", content: { url: "https://x/issues/1" } };
    let reads = 0;
    const board = createBoardContext({
      readItems: () => {
        reads += 1;
        return page([{ id: "PVTI_old" }]);
      },
    });

    board.items();
    board.noteAdded(fresh);

    expect(board.items().items).toEqual([{ id: "PVTI_old" }, fresh]);
    expect(reads).toBe(1);
  });

  it("ignores a noted add before the list has ever been read — there is no cache to keep honest", () => {
    let reads = 0;
    const board = createBoardContext({
      readItems: () => {
        reads += 1;
        return page([{ id: "PVTI_from_github" }]);
      },
    });

    board.noteAdded({ id: "PVTI_new" });

    expect(board.items().items).toEqual([{ id: "PVTI_from_github" }]);
    expect(reads).toBe(1);
  });
});

describe("moneypenny projects: a cached board list answers the common case for free (#4183)", () => {
  const URL = "https://github.com/ejclark/skynet-capital/issues/4183";
  const KNOWN: BoardItem = { id: "PVTI_known", content: { type: "Issue", url: URL } };

  it("never calls item-add or item-list when the cache already holds the item", () => {
    const resolved = resolveBoardItem({
      issueUrl: URL,
      cachedItems: [{ id: "PVTI_other" }, KNOWN],
      addItem: () => {
        throw new Error(
          "item-add must not be called on a cache hit — that mutation is the #4183 bill",
        );
      },
      listItems: () => {
        throw new Error(
          "item-list must not be called on a cache hit — ~100 GraphQL points per page",
        );
      },
    });

    expect(resolved).toEqual({ item: KNOWN, added: false });
  });

  it("falls through to the unchanged add-first path on a cache miss", () => {
    const fresh: BoardItem = { id: "PVTI_fresh", content: { url: URL } };
    const resolved = resolveBoardItem({
      issueUrl: URL,
      cachedItems: [{ id: "PVTI_unrelated", content: { url: "https://x/issues/9" } }],
      addItem: () => fresh,
      listItems: () => {
        throw new Error("a successful add still costs no list read");
      },
    });

    expect(resolved).toEqual({ item: fresh, added: true });
  });

  it("treats a stale cache as a miss, never as a false hit", () => {
    // Matching on `content.url` against a list GitHub really returned is what makes this safe: an
    // item the cache has not heard of simply is not found, and the add path settles it.
    const fresh: BoardItem = { id: "PVTI_fresh", content: { url: URL } };
    expect(
      resolveBoardItem({
        issueUrl: URL,
        cachedItems: [],
        addItem: () => fresh,
        listItems: () => ({ items: [], totalCount: 0 }),
      }),
    ).toEqual({ item: fresh, added: true });
  });
});

describe("moneypenny projects: an exhausted hourly quota, named rather than stack-traced (#4183)", () => {
  const GH_SAID = "GraphQL: API rate limit exceeded for user ID 3472134.\n";

  it("recognises gh's exhaustion message in both tenses GitHub uses", () => {
    expect(isRateLimitExhausted(GH_SAID)).toBe(true);
    expect(
      isRateLimitExhausted("GraphQL: API rate limit already exceeded for user ID 3472134."),
    ).toBe(true);
  });

  it("does not mistake an unrelated gh failure for a quota", () => {
    expect(isRateLimitExhausted("GraphQL: Content already exists in this project")).toBe(false);
    expect(isRateLimitExhausted(undefined)).toBe(false);
  });

  it("stays out of the retry set — six seconds of backoff cannot outwait an hourly window", () => {
    expect(isRetryableProjectsGhError(GH_SAID)).toBe(false);
  });

  it("names the bucket, what is left, and when it comes back", () => {
    const reset = Math.floor(Date.UTC(2026, 8, 30, 13, 23, 0) / 1000);
    const now = Date.UTC(2026, 8, 30, 12, 23, 0);
    const said = explainRateLimitExhausted({
      call: "`gh project field-list`",
      remaining: 0,
      reset,
      now,
    });

    expect(said).toContain("`gh project field-list`");
    expect(said).toContain("0 point(s) left");
    expect(said).toContain("2026-09-30T13:23:00Z");
    expect(said).toContain("60 min");
  });

  it("still reads as an exhausted quota to its own classifier — the abort depends on it", () => {
    // projects-backfill.mjs decides whether to abort the whole sweep by classifying this very
    // message. An explanation its own classifier could not recognise would silently turn the abort
    // back into the fifty-identical-failures grind #4183 produced.
    expect(isRateLimitExhausted(explainRateLimitExhausted({ remaining: 0, reset: 0 }))).toBe(true);
  });

  it("says something useful even when GitHub told us nothing about the reset", () => {
    const said = explainRateLimitExhausted({});
    expect(said).toContain("rolled over");
    expect(said).not.toContain("NaN");
  });
});

describe("moneypenny projects: the free pre-flight on a whole-backlog sweep (#4183)", () => {
  it("goes when the remaining budget clears the floor, and logs what it saw", () => {
    const plan = planBoardSweep({ issueCount: 90, remaining: 4900 });
    expect(plan.ok).toBe(true);
    expect(plan.reason).toContain("4900");
    expect(plan.reason).toContain("90-issue");
  });

  it("refuses a sweep that would die halfway, naming the reset", () => {
    const reset = Math.floor(Date.UTC(2026, 8, 30, 13, 23, 0) / 1000);
    const plan = planBoardSweep({
      issueCount: 90,
      remaining: 12,
      reset,
      now: Date.UTC(2026, 8, 30, 12, 53, 0),
    });

    expect(plan.ok).toBe(false);
    expect(plan.reason).toContain("Only 12 graphql point(s) left");
    expect(plan.reason).toContain("30 min");
  });

  it("treats the floor as inclusive, so the boundary is not a coin flip", () => {
    expect(planBoardSweep({ remaining: SWEEP_MIN_GRAPHQL_POINTS }).ok).toBe(true);
    expect(planBoardSweep({ remaining: SWEEP_MIN_GRAPHQL_POINTS - 1 }).ok).toBe(false);
  });

  it("reads a failed budget read as GO — the pre-flight protects a quota, it is not a second gate", () => {
    expect(planBoardSweep({ issueCount: 90 }).ok).toBe(true);
    expect(planBoardSweep({ remaining: Number.NaN }).ok).toBe(true);
    expect(planBoardSweep({}).reason).toContain("proceeding");
  });
});

// #4213 — THE BUDGET WE READ WAS NOT THE BUDGET GITHUB ENFORCES. A burst of ~29 `issues` events on
// 2026-09-30 (18:07:50Z–18:09:54Z) fanned out that many concurrent `sync project status` jobs at one
// PAT; from 18:08:02Z every one died on `API rate limit exceeded` while printing "the hourly budget
// is spent … 4998 point(s) left" — the two halves of that sentence came from two sources, and the
// REST one cannot move. Measured against a live token seconds apart: GraphQL's own `rateLimit` said
// used 8 / remaining 4992, REST's `resources.graphql` said used 1 / remaining 4999.
describe("moneypenny projects: the GraphQL budget, read from GraphQL (#4213)", () => {
  const graphqlSaid = (node: unknown) => () => JSON.stringify(node);

  it("parses GitHub's rateLimit node and hands back REST's epoch-seconds shape", () => {
    const budget = ghGraphqlBudget({
      run: graphqlSaid({ limit: 5000, remaining: 4992, resetAt: "2026-09-30T19:09:16Z" }),
    });

    expect(budget).toEqual({
      limit: 5000,
      remaining: 4992,
      reset: Math.floor(Date.UTC(2026, 8, 30, 19, 9, 16) / 1000),
    });
  });

  it("reads as unknown rather than throwing when the probe fails — never a second way to fail", () => {
    expect(
      ghGraphqlBudget({
        run: () => {
          throw new Error("Command failed: gh api graphql");
        },
      }),
    ).toEqual({});
    expect(ghGraphqlBudget({ run: graphqlSaid(null) })).toEqual({});
    expect(ghGraphqlBudget({ run: () => "not json" })).toEqual({});
  });

  it("overlays the authoritative graphql budget over REST's stale mirror, keeping core", () => {
    const resources = ghRateLimit({
      readRest: () => ({
        resources: {
          core: { limit: 5000, remaining: 4987, reset: 1 },
          graphql: { limit: 5000, remaining: 4999, reset: 1 },
        },
      }),
      readGraphql: () => ({ limit: 5000, remaining: 4992, reset: 2 }),
    });

    // The whole incident in one assertion: 4999 is the number that lied, 4992 is the one GitHub
    // was enforcing. `core` still comes from REST, which reports it correctly.
    expect(resources.graphql).toEqual({ limit: 5000, remaining: 4992, reset: 2 });
    expect(resources.core?.remaining).toBe(4987);
  });

  it("keeps REST's answer when the GraphQL probe could not answer", () => {
    const resources = ghRateLimit({
      readRest: () => ({ resources: { graphql: { remaining: 4999 } } }),
      readGraphql: () => ({}),
    });
    expect(resources.graphql?.remaining).toBe(4999);
  });

  it("survives a REST read that throws — every caller runs this inside an error handler", () => {
    const resources = ghRateLimit({
      readRest: () => {
        throw new Error("curl: (22) The requested URL returned error: 403");
      },
      readGraphql: () => ({ remaining: 4992 }),
    });
    expect(resources.graphql?.remaining).toBe(4992);
  });
});

describe("moneypenny projects: a throttled burst is not a spent hour (#4213)", () => {
  const GH_SAID = "GraphQL: API rate limit exceeded for user ID 3472134.\n";
  const refusal = () =>
    Object.assign(new Error("Command failed: gh project item-list"), { stderr: GH_SAID });

  it("calls a healthy budget a throttle and an empty one a spent hour", () => {
    expect(classifyRateLimitRefusal({ remaining: 4998 })).toBe("throttled");
    expect(classifyRateLimitRefusal({ remaining: THROTTLE_BUDGET_FLOOR })).toBe("throttled");
    expect(classifyRateLimitRefusal({ remaining: THROTTLE_BUDGET_FLOOR - 1 })).toBe("spent");
    expect(classifyRateLimitRefusal({ remaining: 0 })).toBe("spent");
  });

  it("calls an unreadable budget spent — no retry invented on no evidence", () => {
    expect(classifyRateLimitRefusal({})).toBe("spent");
    expect(classifyRateLimitRefusal({ remaining: Number.NaN })).toBe("spent");
  });

  it("rides out a burst that clears, instead of failing the run", () => {
    // The incident itself: 4998 points left and GitHub refusing anyway. Pre-fix this threw.
    const waits: number[] = [];
    let calls = 0;
    const out = runThroughRateLimit({
      call: "`gh project item-list`",
      run: () => {
        calls += 1;
        if (calls < 3) throw refusal();
        return "[]";
      },
      firstError: refusal(),
      readBudget: () => ({ graphql: { remaining: 4998, reset: 0 } }),
      sleep: (ms: number) => waits.push(ms),
    });

    expect(out).toBe("[]");
    expect(waits).toEqual([60_000, 120_000]);
  });

  it("fails a genuinely spent hour at once, spending no runner minutes on it", () => {
    const waits: number[] = [];
    expect(() =>
      runThroughRateLimit({
        call: "`gh project field-list`",
        run: () => {
          throw new Error("a spent hour must never be retried");
        },
        firstError: refusal(),
        readBudget: () => ({ graphql: { remaining: 3, reset: 0 } }),
        sleep: (ms: number) => waits.push(ms),
      }),
    ).toThrow("hourly GraphQL budget is spent");
    expect(waits).toEqual([]);
  });

  it("is bounded — a throttle that never clears ends in a sentence, not a stack trace", () => {
    let calls = 0;
    expect(() =>
      runThroughRateLimit({
        call: "`gh project item-list`",
        run: () => {
          calls += 1;
          throw refusal();
        },
        firstError: refusal(),
        readBudget: () => ({ graphql: { remaining: 4998 } }),
        sleep: () => undefined,
      }),
    ).toThrow("burst being throttled");
    expect(calls).toBe(3);
  });

  it("still reads as a rate limit to its own classifier — the sweep's abort depends on it", () => {
    // Same round trip `explainRateLimitExhausted` is held to: projects-backfill.mjs aborts a whole
    // sweep by classifying the message it caught, and a three-minute throttle should abort one too.
    expect(isRateLimitExhausted(explainThrottled({ remaining: 4998 }))).toBe(true);
  });

  it("names the number that makes the burst diagnosis falsifiable", () => {
    const said = explainThrottled({ call: "`gh project item-list`", remaining: 4998 });
    expect(said).toContain("`gh project item-list`");
    expect(said).toContain("4998 point(s)");
    expect(said).toContain("3 attempts across 180s");
    expect(explainThrottled({})).toContain("an unknown amount");
  });
});

// #4182 — THE ISSUE READ GETS THE SAME BACKOFF THE BOARD CALLS ALREADY HAVE. 12 of the 2026-09-30
// backfill's 20 failures were GitHub 5xx. `syncIssue`'s REST read goes through curl, which words a
// 502 as `returned error: 502` — a form the shared transient classifier never matched, so that read
// got one attempt. The curl strings below are verbatim from curl 8.5 against a local 502/504/403.
describe("moneypenny projects: the issue read retries GitHub's 5xx, never a rate limit (#4182)", () => {
  const curlFail = (code: number) =>
    Object.assign(new Error("Command failed: curl"), {
      stderr: `curl: (22) The requested URL returned error: ${code}`,
    });

  it("recognises curl's own 5xx wording as retryable", () => {
    expect(isRetryableRestError("curl: (22) The requested URL returned error: 502")).toBe(true);
    expect(isRetryableRestError("curl: (22) The requested URL returned error: 504")).toBe(true);
    expect(isRetryableRestError("HTTP 503: Service Unavailable")).toBe(true);
  });

  it("does not retry a 4xx — a rate-limit 403/429 or a missing issue only repeats", () => {
    expect(isRetryableRestError("curl: (22) The requested URL returned error: 403")).toBe(false);
    expect(isRetryableRestError("curl: (22) The requested URL returned error: 429")).toBe(false);
    expect(isRetryableRestError("curl: (22) The requested URL returned error: 404")).toBe(false);
    expect(isRetryableRestError("API rate limit exceeded for user ID 3472134")).toBe(false);
  });

  it("rides out a 502 with backoff and returns the issue", () => {
    const waits: number[] = [];
    let calls = 0;
    const issue = readIssue("4182", {
      read: (path) => {
        calls += 1;
        expect(path).toBe("issues/4182");
        if (calls < 3) throw curlFail(502);
        return { number: 4182, state: "open" };
      },
      sleep: (ms) => waits.push(ms),
    });

    expect(issue).toEqual({ number: 4182, state: "open" });
    expect(calls).toBe(3);
    expect(waits).toEqual([2000, 4000]);
  });

  it("is bounded — a 5xx that persists fails the issue after three tries", () => {
    let calls = 0;
    expect(() =>
      readIssue("4182", {
        read: () => {
          calls += 1;
          throw curlFail(504);
        },
        sleep: () => undefined,
      }),
    ).toThrow("Command failed: curl");
    expect(calls).toBe(3);
  });

  it("fails a rate-limited read at once, spending nothing on a window that is hourly", () => {
    let calls = 0;
    const waits: number[] = [];
    expect(() =>
      readIssue("4182", {
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
