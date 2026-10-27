import {
  type ClosedWithRemainder,
  executeRelay,
  finalSliceBy,
  gatherRelayDeps,
  notRelayableReason,
  RELAY_CAP,
  RELAY_FROM,
  REMAINDER_LABELS,
  relayLabels,
  relayTitle,
  routeRelay,
  type TimelineRow,
} from "../../../scripts/moneypenny/relay.mjs";

/** `ensureLabel`'s stand-in: these specs assert the `gh` calls, not the label upsert. */
const noUpsert = () => {
  /* nothing to provision in a spec */
};

/** The one intent a single-issue case must produce — an assertion, so `noUncheckedIndexedAccess`
 *  does not make every field read below a `?.` that would pass on an empty result. */
const only = <T>(intents: readonly T[]): T => {
  if (intents.length !== 1) throw new Error(`expected exactly one intent, got ${intents.length}`);
  return intents[0] as T;
};

// THE RELAY (#3818 slice 4, #4287). A sliced build writes its remainder onto the issue and marks it
// `next-slice`; every automated puller reads OPEN issues, so the moment that issue closes the
// remainder is invisible while still reading as "captured". 24 closed issues were in exactly that
// state on 2026-10-02. The relay carries each one to a fresh Backlog issue and takes the remainder
// label off the source, which is also what makes the sweep idempotent.
//
// Nothing here touches GitHub or the clock: `routeRelay` is pure and `executeRelay`'s two side
// effects are injected.

const closed = (over: Partial<ClosedWithRemainder> = {}): ClosedWithRemainder => ({
  number: 3595,
  title: "Carry Playbook Store subscriptions to the bots app",
  labels: ["bug", "released", "feedback", "next-slice"],
  closedAt: "2026-10-05T12:00:00Z",
  stateReason: "completed",
  state: "closed",
  ...over,
});

describe("relay — which dropped remainders get carried", () => {
  it("relays a closed issue that still carries next-slice", () => {
    const intent = only(routeRelay({ closedWithRemainder: [closed()] }));

    expect(intent.kind).toBe("relay-remainder");
    expect(intent.source).toBe(3595);
    expect(intent.title).toBe(
      relayTitle(3595, "Carry Playbook Store subscriptions to the bots app"),
    );
    expect(intent.clearLabels).toEqual(["next-slice"]);
  });

  it("relays a needs-session remainder too — it names who may pick it up, not that anyone did", () => {
    const intents = routeRelay({
      closedWithRemainder: [closed({ labels: ["enhancement", "needs-session"] })],
    });

    expect(only(intents).clearLabels).toEqual(["needs-session"]);
    expect(REMAINDER_LABELS).toContain("needs-session");
  });

  it("ignores a closed issue with no remainder label — nothing was dropped", () => {
    const issue = closed({ labels: ["feedback", "released"] });

    expect(notRelayableReason(issue)).toMatch(/carries no remainder label/);
    expect(routeRelay({ closedWithRemainder: [issue] })).toEqual([]);
  });

  it("ignores an open issue — its remainder is already pullable", () => {
    const issue = closed({ state: "open", closedAt: null });

    expect(notRelayableReason(issue)).toMatch(/still open/);
    expect(routeRelay({ closedWithRemainder: [issue] })).toEqual([]);
  });

  it("never overturns a decision: a `not planned` close is not a dropped remainder", () => {
    const issue = closed({ stateReason: "not_planned" });

    expect(notRelayableReason(issue)).toMatch(/not planned/);
    expect(routeRelay({ closedWithRemainder: [issue] })).toEqual([]);
  });
});

describe("relay — the watermark keeps the historical backlog off the board", () => {
  const historical = closed({ number: 716, closedAt: "2026-08-28T09:00:00Z" });

  it("leaves a close from before the watermark alone on the push path", () => {
    expect(notRelayableReason(historical)).toContain(RELAY_FROM);
    expect(routeRelay({ closedWithRemainder: [historical] })).toEqual([]);
  });

  it("carries it once --backfill says so", () => {
    expect(notRelayableReason(historical, { backfill: true })).toBeNull();
    expect(routeRelay({ closedWithRemainder: [historical], backfill: true })).toHaveLength(1);
  });

  it("reads the watermark as a date, so the day it lands is included", () => {
    const sameDay = closed({ closedAt: `${RELAY_FROM}T00:30:00Z` });

    expect(notRelayableReason(sameDay)).toBeNull();
  });
});

describe("relay — rate and dedupe", () => {
  const many = [1, 2, 3, 4, 5].map((i) =>
    closed({ number: 100 + i, closedAt: `2026-10-0${i + 2}T00:00:00Z` }),
  );

  it("files at most RELAY_CAP a tick, oldest close first", () => {
    const intents = routeRelay({ closedWithRemainder: many });

    expect(RELAY_CAP).toBe(3);
    expect(intents.map((i) => i.source)).toEqual([101, 102, 103]);
  });

  it("deferral is not dropping — a later tick takes the rest", () => {
    const intents = routeRelay({ closedWithRemainder: many.slice(3) });

    expect(intents.map((i) => i.source)).toEqual([104, 105]);
  });

  it("never files a second relay while the first is open", () => {
    const issue = closed();
    const open = [relayTitle(issue.number, issue.title)];

    expect(routeRelay({ closedWithRemainder: [issue], openIssueTitles: open })).toEqual([]);
  });

  it("relays one issue once even when both remainder labels queries return it", () => {
    const issue = closed({
      labels: ["feedback", "next-slice", "needs-session"],
    });
    const intents = routeRelay({ closedWithRemainder: [issue, issue] });

    expect(only(intents).clearLabels).toEqual(["next-slice", "needs-session"]);
  });
});

describe("relay — what the new issue carries", () => {
  it("inherits the parent's kind labels and never ready, in-progress or a parking label", () => {
    const labels = ["enhancement", "plan", "ready", "in-progress", "needs-eric", "next-slice"];

    expect(relayLabels(labels)).toEqual(["enhancement", "plan"]);
  });

  it("falls back to enhancement so a relay is never unlabelled", () => {
    expect(relayLabels(["next-slice"])).toEqual(["enhancement"]);
  });

  it("points at the source rather than restating a remainder nobody pinned the shape of", () => {
    const intent = only(routeRelay({ closedWithRemainder: [closed()] }));

    expect(intent.body).toContain("The remainder of #3595 was never built");
    expect(intent.body).toContain("Done when:");
    expect(intent.body).toContain("Picture: waived");
    expect(intent.body).toContain("In Backlog on purpose");
  });

  it("receipts the source with why the remainder label is coming off", () => {
    const intent = only(routeRelay({ closedWithRemainder: [closed()] }));

    expect(intent.sourceComment).toContain("Remainder relayed");
    expect(intent.sourceComment).toContain("`next-slice`");
  });
});

describe("relay — the three writes, in the order that makes a retry safe", () => {
  it("files the issue, receipts the source, then clears the label last", () => {
    const calls: string[][] = [];
    const run = (_cmd: string, args: readonly string[]) => {
      calls.push([...args]);
      return "https://github.com/ejclark/skynet-capital/issues/9001";
    };
    const intent = only(routeRelay({ closedWithRemainder: [closed()] }));

    const line = executeRelay(intent, { run, ensure: noUpsert });

    expect(calls.map((a) => a.slice(0, 2))).toEqual([
      ["issue", "create"],
      ["issue", "comment"],
      ["issue", "edit"],
    ]);
    expect(calls[2]).toContain("--remove-label");
    expect(calls[2]).toContain("next-slice");
    expect(line).toContain("relayed #3595");
    expect(line).toContain("9001");
  });

  it("puts the relay's url in the source's receipt, so the link survives the label removal", () => {
    const url = "https://github.com/ejclark/skynet-capital/issues/9002";
    const bodies: string[] = [];
    const run = (_cmd: string, args: readonly string[]) => {
      const at = args.indexOf("--body");
      if (at >= 0) bodies.push(String(args[at + 1]));
      return url;
    };
    const intent = only(routeRelay({ closedWithRemainder: [closed()] }));

    executeRelay(intent, { run, ensure: noUpsert });

    expect(bodies[1]).toContain(url);
  });
});

describe("relay — reading the closed queue", () => {
  it("asks once per remainder label and folds the two answers into one row per issue", () => {
    const asked: string[] = [];
    const read = (path: string) => {
      asked.push(path);
      return path.includes("next-slice")
        ? [
            {
              number: 3595,
              title: "a",
              labels: [{ name: "next-slice" }],
              closed_at: "x",
            },
          ]
        : [
            {
              number: 3595,
              title: "a",
              labels: [{ name: "needs-session" }],
              closed_at: "x",
            },
          ];
    };

    const rows = gatherRelayDeps({ read });

    expect(asked.filter((p) => p.includes("state=closed"))).toHaveLength(REMAINDER_LABELS.length);
    expect(rows).toHaveLength(1);
  });

  it("skips pull requests, which REST returns from the issues endpoint", () => {
    const read = () => [
      { number: 1, title: "a pr", labels: [], pull_request: { url: "…" } },
      { number: 2, title: "an issue", labels: [{ name: "next-slice" }] },
    ];

    expect(gatherRelayDeps({ read, labels: ["next-slice"] }).map((r) => r.number)).toEqual([2]);
  });

  // #5354 (2026-10-14): one curl 500 on this read took a whole `route` tick down (run 38496303201).
  it("reads through a GitHub 500, in curl's own words, on the next try", () => {
    let calls = 0;
    const read = () => {
      calls += 1;
      if (calls === 1)
        throw Object.assign(new Error("Command failed: curl"), {
          stderr: "curl: (22) The requested URL returned error: 500\n",
        });
      return [{ number: 2, title: "an issue", labels: [{ name: "next-slice" }] }];
    };
    const sleep = () => {
      /* no backoff in a spec */
    };

    expect(gatherRelayDeps({ read, labels: ["next-slice"], sleep }).map((r) => r.number)).toEqual([
      2,
    ]);
    expect(calls).toBe(2);
  });

  it("still fails closed on a 4xx, at once", () => {
    let calls = 0;
    const read = () => {
      calls += 1;
      throw Object.assign(new Error("Command failed: curl"), {
        stderr: "curl: (22) The requested URL returned error: 404\n",
      });
    };

    expect(() => gatherRelayDeps({ read, labels: ["next-slice"] })).toThrow(/Command failed/);
    expect(calls).toBe(1);
  });
});

// #6014 (2026-10-26): #6012 merged "Closes #5214" at 10:01:41, GitHub closed #5214 a second later,
// and the relay filed "[relay] #5214 remainder" — for the remainder #6012 had just built. The
// fixtures below are that timeline's shape, trimmed the way `gatherRelayDeps` trims it.
describe("relay — a remainder the closing PR built", () => {
  const prRef = (over: { body?: string; mergedAt?: string | null; at?: string } = {}) =>
    ({
      event: "cross-referenced",
      created_at: over.at ?? "2026-10-26T10:00:52Z",
      source: {
        issue: {
          number: 6012,
          body: over.body ?? "## Summary\n\n- Closes #5214 — slice 2, the 8 `.claude/` files.",
          pull_request: {
            merged_at: over.mergedAt === undefined ? "2026-10-26T10:01:41Z" : over.mergedAt,
          },
        },
      },
    }) satisfies TimelineRow;
  const comment = (at: string, body: string): TimelineRow => ({
    event: "commented",
    created_at: at,
    body,
  });
  const issue5214 = (timeline: TimelineRow[], closedAt = "2026-10-26T10:01:42Z") =>
    closed({
      number: 5214,
      labels: ["enhancement", "next-slice"],
      closedAt,
      timeline,
    });
  const pickup = comment(
    "2026-10-26T09:46:00Z",
    "🛠 **Live session picking up slice 2** — the remaining 8 files.",
  );

  it("does not relay when a merged PR that closes the issue closed it (#5214 / #6012)", () => {
    const issue = issue5214([
      pickup,
      prRef(),
      { event: "closed", created_at: "2026-10-26T10:01:42Z" },
    ]);

    expect(finalSliceBy(issue)).toBe(6012);
    expect(notRelayableReason(issue)).toMatch(/closed by #6012/);
    expect(routeRelay({ closedWithRemainder: [issue] })).toEqual([]);
  });

  it("relays a plain manual close that still carries the label", () => {
    const issue = issue5214([pickup, { event: "closed", created_at: "2026-10-26T10:01:42Z" }]);

    expect(finalSliceBy(issue)).toBeNull();
    expect(only(routeRelay({ closedWithRemainder: [issue] })).source).toBe(5214);
  });

  it("relays when a comment after the closing PR opened says what remains", () => {
    const issue = issue5214([
      prRef(),
      comment("2026-10-26T10:05:00Z", "Slice 1 shipped in #6012. Remaining: the stop-limit leg."),
    ]);

    expect(finalSliceBy(issue)).toBeNull();
    expect(only(routeRelay({ closedWithRemainder: [issue] })).source).toBe(5214);
  });

  // #6214 (2026-10-26), the true relay: #6210 superseded #6208, carried its "Closes #6080", and
  // said in its own body what was still left.
  it("relays when the closing PR's own body names a next slice", () => {
    const issue = issue5214([
      prRef({
        body: "- Closes #5214 · supersedes #6208\n- Next slice (from #6208): discard a partial reply.",
      }),
    ]);

    expect(finalSliceBy(issue)).toBeNull();
    expect(only(routeRelay({ closedWithRemainder: [issue] })).source).toBe(5214);
  });

  it("relays when the PR only says Part of — an early slice never closes the issue", () => {
    const issue = issue5214([prRef({ body: "- Part of #5214 — slice 1." })]);

    expect(routeRelay({ closedWithRemainder: [issue] })).toHaveLength(1);
  });

  it("relays when the PR never merged, or merged long before a later manual close", () => {
    const unmerged = issue5214([prRef({ mergedAt: null })]);
    const stale = issue5214([prRef()], "2026-10-27T09:00:00Z");

    expect(finalSliceBy(unmerged)).toBeNull();
    expect(finalSliceBy(stale)).toBeNull();
  });

  it("reads the timeline only for an issue every cheaper rule would relay", () => {
    const asked: string[] = [];
    const read = (path: string) => {
      asked.push(path);
      if (path.includes("/timeline")) return [prRef()];
      return [
        {
          number: 5214,
          title: "a",
          labels: [{ name: "next-slice" }],
          closed_at: "2026-10-26T10:01:42Z",
          state_reason: "completed",
        },
        {
          number: 716,
          title: "old",
          labels: [{ name: "next-slice" }],
          closed_at: "2026-09-01T00:00:00Z",
          state_reason: "completed",
        },
      ];
    };

    const rows = gatherRelayDeps({ read, labels: ["next-slice"] });

    expect(asked).toEqual(["issues?state=closed&labels=next-slice", "issues/5214/timeline"]);
    expect(routeRelay({ closedWithRemainder: rows })).toEqual([]);
  });
});
