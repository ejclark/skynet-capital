import {
  buildSubscriptionsSnapshot,
  parseSubscriptionsSnapshot,
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V5,
  subscriptionsVersion,
} from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";

/**
 * `subscriptions.v5` (#6954 slice 5c, the expand step): the owner's below-bar floor joins the
 * version. The bots read v4 and v5; the app still sends v4 until this has deployed.
 *  - WHEN a v5 snapshot carries an owner's floor, the bots SHALL apply it only if its version names it.
 *  - WHEN a v4 snapshot carries one, the bots SHALL apply the roster without it: v4 never vouched.
 *  - WHERE no subscription sets a floor, the v5 version SHALL equal the v4 one, so the app's switch
 *    swaps no live roster.
 */

const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 100_000,
  enabled: true,
  createdAt: "2026-11-07T00:00:00.000Z",
  updatedAt: "2026-11-07T00:00:00.000Z",
  ...overrides,
});
const AT = Date.parse("2026-11-07T12:00:00.000Z");
const V5 = SUBSCRIPTIONS_SNAPSHOT_KIND_V5;

/** What a v5 app will send: the snapshot as built, under v5's kind and version. */
const sentV5 = (state: SubscriptionsState) =>
  JSON.parse(
    JSON.stringify({
      ...buildSubscriptionsSnapshot(state, AT),
      kind: V5,
      version: subscriptionsVersion(state, V5),
    }),
  );
const sentV4 = (state: SubscriptionsState) =>
  JSON.parse(JSON.stringify(buildSubscriptionsSnapshot(state, AT)));

const FLOORED: SubscriptionsState = { sauron: [sub({ belowBarFloorPct: 0.005 })] };

describe("the owner's floor on subscriptions.v5", () => {
  it("reaches the bots under v5, with its kind", () => {
    const parsed = parseSubscriptionsSnapshot(sentV5(FLOORED));
    expect(parsed?.kind).toBe(V5);
    expect(parsed?.accounts.sauron?.[0]?.belowBarFloorPct).toBe(0.005);
  });

  it("moves the v5 version, so a changed floor swaps the live roster", () => {
    const base = subscriptionsVersion({ sauron: [sub()] }, V5);
    expect(subscriptionsVersion(FLOORED, V5)).not.toBe(base);
    expect(subscriptionsVersion({ sauron: [sub({ belowBarFloorPct: 0.004 })] }, V5)).not.toBe(
      subscriptionsVersion(FLOORED, V5),
    );
  });

  it("is refused whole when the version does not name the floor it carries", () => {
    const forged = { ...sentV5(FLOORED), version: subscriptionsVersion({ sauron: [sub()] }, V5) };
    expect(parseSubscriptionsSnapshot(forged)).toBeUndefined();
  });

  it("hashes a state with no floor exactly as v4 does", () => {
    const state: SubscriptionsState = { sauron: [sub(), sub({ playbookId: "G1-GOOG" })] };
    expect(subscriptionsVersion(state, V5)).toBe(subscriptionsVersion(state));
  });
});

describe("a v4 snapshot never applies a floor", () => {
  it("applies the roster with the floor taken off", () => {
    const parsed = parseSubscriptionsSnapshot(sentV4(FLOORED));
    expect(parsed?.kind).toBe(SUBSCRIPTIONS_SNAPSHOT_KIND);
    expect(parsed?.accounts.sauron).toHaveLength(1);
    expect(parsed?.accounts.sauron?.[0]).not.toHaveProperty("belowBarFloorPct");
  });

  it("is still the kind the app sends", () => {
    expect(buildSubscriptionsSnapshot(FLOORED, AT).kind).toBe("subscriptions.v4");
  });
});

describe("a garbled floor", () => {
  it.each([0, -0.01, 1.5, "0.005", null, Number.NaN])(
    "drops the subscription (%s) rather than reading it as the larger house floor",
    (bad) => {
      const raw = sentV5({ sauron: [sub()] });
      raw.accounts.sauron[0].belowBarFloorPct = bad;
      // The record no longer parses, so the version (over what parsed) cannot reproduce: the
      // whole snapshot reads as "not reported" and the roster in force stays.
      expect(parseSubscriptionsSnapshot(raw)).toBeUndefined();
    },
  );
});
