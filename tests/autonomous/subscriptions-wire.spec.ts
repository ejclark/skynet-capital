import {
  buildSubscriptionsSnapshot,
  parseSubscriptionsSnapshot,
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
  subscriptionsVersion,
} from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";

/**
 * The Playbook Store snapshot that rides the `/controls` poll (issue #3595). Two properties carry
 * the weight:
 *
 *  - the VERSION answers "is the fleet trading something different now?" — so it must move on a
 *    real allocation/toggle change and must NOT move on a rewrite, a reorder, or a timestamp;
 *  - the PARSE never yields a partial roster. A bot trading fewer subscriptions than the version
 *    it reports is worse than a bot that heard nothing at all, so anything short of a payload
 *    whose claimed version reproduces from its own contents reads as "not reported".
 */

const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 5_000,
  enabled: true,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
  ...overrides,
});

const AT = Date.parse("2026-09-23T12:00:00.000Z");

describe("subscriptionsVersion", () => {
  it("is stable across a rewrite that changed nothing", () => {
    const state: SubscriptionsState = { sauron: [sub()] };
    expect(subscriptionsVersion(state)).toBe(subscriptionsVersion({ sauron: [sub()] }));
  });

  it("ignores account order, subscription order, and symbol-filter order", () => {
    const a: SubscriptionsState = {
      sauron: [
        sub({ playbookId: "S1-NVDA", symbols: ["NVDA", "AVGO"] }),
        sub({ playbookId: "G1-GOOG" }),
      ],
      banker: [sub({ accountId: "banker", playbookId: "G1-GOOG" })],
    };
    const b: SubscriptionsState = {
      banker: [sub({ accountId: "banker", playbookId: "G1-GOOG" })],
      sauron: [
        sub({ playbookId: "G1-GOOG" }),
        sub({ playbookId: "S1-NVDA", symbols: ["AVGO", "NVDA"] }),
      ],
    };
    expect(subscriptionsVersion(a)).toBe(subscriptionsVersion(b));
  });

  it("ignores timestamps — a toggle flipped off and back on is the same roster", () => {
    expect(subscriptionsVersion({ sauron: [sub()] })).toBe(
      subscriptionsVersion({ sauron: [sub({ updatedAt: "2026-09-23T09:30:00.000Z" })] }),
    );
  });

  it("moves for every change that changes what the bot trades", () => {
    const base = subscriptionsVersion({ sauron: [sub()] });
    const changes: Partial<PlaybookSubscription>[] = [
      { enabled: false },
      { mode: "aggressive" },
      { capitalAllocated: 7_500 },
      { symbols: ["NVDA"] },
      { compoundAllocation: true },
      { playbookId: "G1-GOOG" },
    ];
    for (const change of changes) {
      expect(subscriptionsVersion({ sauron: [sub(change)] })).not.toBe(base);
    }
    // ...and for an unsubscribe, which is the case a "max updatedAt" version would have missed.
    expect(subscriptionsVersion({})).not.toBe(base);
  });

  it("distinguishes which ACCOUNT holds a subscription", () => {
    expect(subscriptionsVersion({ sauron: [sub()] })).not.toBe(
      subscriptionsVersion({ banker: [sub({ accountId: "banker" })] }),
    );
  });
});

describe("the snapshot round trip", () => {
  it("survives JSON, the way it crosses the bridge", () => {
    const state: SubscriptionsState = { sauron: [sub()], banker: [sub({ accountId: "banker" })] };
    const snapshot = buildSubscriptionsSnapshot(state, AT);
    const parsed = parseSubscriptionsSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(parsed).toEqual(snapshot);
    expect(parsed?.kind).toBe(SUBSCRIPTIONS_SNAPSHOT_KIND);
  });

  it("carries an EMPTY store as a real snapshot — 'nobody subscribed' is not 'not reported'", () => {
    const parsed = parseSubscriptionsSnapshot(
      JSON.parse(JSON.stringify(buildSubscriptionsSnapshot({}, AT))),
    );
    expect(parsed?.accounts).toEqual({});
    expect(parsed?.version).toBe(subscriptionsVersion({}));
  });
});

describe("parseSubscriptionsSnapshot refuses anything it cannot fully reproduce", () => {
  const good = JSON.parse(
    JSON.stringify(buildSubscriptionsSnapshot({ sauron: [sub()] }, AT)),
  ) as Record<string, unknown>;

  it("reads an absent or non-object field as not reported", () => {
    for (const value of [undefined, null, "", 0, [], "subscriptions"]) {
      expect(parseSubscriptionsSnapshot(value)).toBeUndefined();
    }
  });

  it("refuses an unknown kind rather than reinterpreting it", () => {
    expect(parseSubscriptionsSnapshot({ ...good, kind: "subscriptions.v3" })).toBeUndefined();
    expect(parseSubscriptionsSnapshot({ ...good, kind: undefined })).toBeUndefined();
  });

  it("refuses a missing or unusable stamp — staleness ordering depends on it", () => {
    for (const at of [undefined, 0, -1, Number.NaN, "2026-09-23", null]) {
      expect(parseSubscriptionsSnapshot({ ...good, at })).toBeUndefined();
    }
  });

  it("refuses a malformed version", () => {
    for (const version of [undefined, "", "not-a-hash", "ABCDEF0123456789", "0123456789abcde"]) {
      expect(parseSubscriptionsSnapshot({ ...good, version })).toBeUndefined();
    }
  });

  it("refuses a payload whose contents do not reproduce its own version", () => {
    // The exact shape a lenient parse would otherwise wave through: the app sent two
    // subscriptions, one arrives malformed, the lenient parse drops it, and the bot would trade
    // LESS than the version it is reporting.
    const both = JSON.parse(
      JSON.stringify(
        buildSubscriptionsSnapshot({ sauron: [sub(), sub({ playbookId: "G1-GOOG" })] }, AT),
      ),
    ) as Record<string, unknown>;
    const dropped = {
      ...both,
      accounts: { sauron: [sub(), { ...sub({ playbookId: "G1-GOOG" }), mode: "reckless" }] },
    };
    expect(parseSubscriptionsSnapshot(dropped)).toBeUndefined();
    // Same refusal for a straight edit of the payload under an unchanged version.
    expect(
      parseSubscriptionsSnapshot({ ...good, accounts: { sauron: [sub({ capitalAllocated: 1 })] } }),
    ).toBeUndefined();
  });

  it("drops an over-large payload in full rather than truncating it", () => {
    const manyAccounts = Object.fromEntries(
      Array.from({ length: 65 }, (_, i) => [`bot-${i}`, [sub({ accountId: `bot-${i}` })]]),
    );
    expect(
      parseSubscriptionsSnapshot({
        ...good,
        version: subscriptionsVersion(manyAccounts),
        accounts: manyAccounts,
      }),
    ).toBeUndefined();

    const manySubs = Array.from({ length: 65 }, (_, i) => sub({ playbookId: `P-${i}` }));
    expect(
      parseSubscriptionsSnapshot({
        ...good,
        version: subscriptionsVersion({ sauron: manySubs }),
        accounts: { sauron: manySubs },
      }),
    ).toBeUndefined();
  });
});

describe("carried, not behavioral on v1 (#4469 slice 3c part 1)", () => {
  const conviction = { reason: "Eric's call", checkOn: "2027-01-29" };
  const allocations = {
    sauron: { wheel: { capitalAllocated: 75_000, updatedAt: "2026-10-07T00:00:00.000Z" } },
  };

  it("the version does not move for a conviction, a newer build's field, or the allocations", () => {
    const plain = buildSubscriptionsSnapshot({ sauron: [sub()] }, AT);
    const carried = buildSubscriptionsSnapshot(
      { sauron: [{ ...sub({ conviction }), window: { from: "D-20" } } as PlaybookSubscription] },
      AT,
      allocations,
    );
    expect(carried.version).toBe(plain.version);
  });

  it("a conviction (on v2) and the allocations survive the bridge to the bots", () => {
    const snapshot = buildSubscriptionsSnapshot(
      { sauron: [sub({ conviction })] },
      AT,
      allocations,
      SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
    );
    const parsed = parseSubscriptionsSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(parsed?.accounts.sauron?.[0]?.conviction).toEqual(conviction);
    expect(parsed?.allocations).toEqual(allocations);
  });

  it("leaves the allocations off a snapshot that has none — the wire is unchanged for today's store", () => {
    expect(buildSubscriptionsSnapshot({ sauron: [sub()] }, AT, {})).not.toHaveProperty(
      "allocations",
    );
  });

  it("garbled allocations never sink a snapshot: the roster still applies, the allocations drop", () => {
    const snapshot = {
      ...buildSubscriptionsSnapshot({ sauron: [sub()] }, AT),
      allocations: "junk",
    };
    const parsed = parseSubscriptionsSnapshot(snapshot);
    expect(parsed?.accounts).toEqual({ sauron: [sub()] });
    expect(parsed).not.toHaveProperty("allocations");
  });
});

/**
 * `subscriptions.v2` (#4469 slice 3c part 2): the one wire change that adds a behavioral field.
 * The criterion this holds: only the added field moves the version.
 */
describe("subscriptions.v2 — the conviction joins the fingerprint, once", () => {
  const conviction = { reason: "Eric's call", checkOn: "2027-01-29" };
  const V2 = SUBSCRIPTIONS_SNAPSHOT_KIND_V2;
  const v2 = (state: SubscriptionsState) => subscriptionsVersion(state, V2);

  it("moves for a conviction, and for a changed reason or check date", () => {
    const plain = v2({ sauron: [sub()] });
    const held = v2({ sauron: [sub({ conviction })] });
    expect(held).not.toBe(plain);
    expect(
      v2({ sauron: [sub({ conviction: { ...conviction, checkOn: "2027-02-26" } })] }),
    ).not.toBe(held);
    expect(v2({ sauron: [sub({ conviction: { ...conviction, reason: "new view" } })] })).not.toBe(
      held,
    );
  });

  it("moves for nothing else new: timestamps, a newer build's field and allocations still do not", () => {
    const base = buildSubscriptionsSnapshot({ sauron: [sub({ conviction })] }, AT, undefined, V2);
    const carried = buildSubscriptionsSnapshot(
      {
        sauron: [
          {
            ...sub({ conviction, updatedAt: "2026-10-09T09:30:00.000Z" }),
            window: { from: "D-20" },
          } as PlaybookSubscription,
        ],
      },
      AT + 60_000,
      { sauron: { wheel: { capitalAllocated: 75_000, updatedAt: "2026-10-09T00:00:00.000Z" } } },
      V2,
    );
    expect(carried.version).toBe(base.version);
  });

  it("every v1 field still moves it", () => {
    const base = v2({ sauron: [sub()] });
    for (const change of [
      { mode: "aggressive" as const },
      { capitalAllocated: 6_000 },
      { enabled: false },
      { symbols: ["NVDA"] },
      { compoundAllocation: true },
    ]) {
      expect(v2({ sauron: [sub(change)] })).not.toBe(base);
    }
  });

  it("round trips as v2, conviction intact", () => {
    const snapshot = buildSubscriptionsSnapshot(
      { sauron: [sub({ conviction })] },
      AT,
      undefined,
      V2,
    );
    const parsed = parseSubscriptionsSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(parsed?.kind).toBe(V2);
    expect(parsed?.accounts.sauron?.[0]?.conviction).toEqual(conviction);
  });

  it("is read from this build on, while the app still sends v1 — expand first", () => {
    expect(buildSubscriptionsSnapshot({ sauron: [sub()] }, AT).kind).toBe(
      SUBSCRIPTIONS_SNAPSHOT_KIND,
    );
  });

  it("drops a conviction a v1 snapshot carries — its version never vouched for it", () => {
    const snapshot = buildSubscriptionsSnapshot({ sauron: [sub({ conviction })] }, AT);
    const parsed = parseSubscriptionsSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(parsed?.kind).toBe(SUBSCRIPTIONS_SNAPSHOT_KIND);
    expect(parsed?.accounts.sauron?.[0]).not.toHaveProperty("conviction");
  });

  it("refuses a v2 payload whose version was computed the v1 way", () => {
    const snapshot = {
      ...buildSubscriptionsSnapshot({ sauron: [sub({ conviction })] }, AT, undefined, V2),
      version: subscriptionsVersion({ sauron: [sub({ conviction })] }),
    };
    expect(parseSubscriptionsSnapshot(JSON.parse(JSON.stringify(snapshot)))).toBeUndefined();
  });
});
