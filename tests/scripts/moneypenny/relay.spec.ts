import {
  type ClosedWithRemainder,
  executeRelay,
  gatherRelayDeps,
  notRelayableReason,
  RELAY_CAP,
  RELAY_FROM,
  REMAINDER_LABELS,
  relayLabels,
  relayTitle,
  routeRelay,
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
    const issue = closed({ labels: ["feedback", "next-slice", "needs-session"] });
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
        ? [{ number: 3595, title: "a", labels: [{ name: "next-slice" }], closed_at: "x" }]
        : [{ number: 3595, title: "a", labels: [{ name: "needs-session" }], closed_at: "x" }];
    };

    const rows = gatherRelayDeps({ read });

    expect(asked).toHaveLength(REMAINDER_LABELS.length);
    expect(asked[0]).toContain("state=closed");
    expect(rows).toHaveLength(1);
  });

  it("skips pull requests, which REST returns from the issues endpoint", () => {
    const read = () => [
      { number: 1, title: "a pr", labels: [], pull_request: { url: "…" } },
      { number: 2, title: "an issue", labels: [{ name: "next-slice" }] },
    ];

    expect(gatherRelayDeps({ read, labels: ["next-slice"] }).map((r) => r.number)).toEqual([2]);
  });
});
