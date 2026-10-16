import {
  buildSubscriptionsSnapshot,
  parseSubscriptionsSnapshot,
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V3,
  type SubscriptionsSnapshotKind,
  subscriptionsVersion,
} from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";

/**
 * A subscription's play target (#5483 slice 3) is observe-only, so it rides the wire and does not
 * join the version: the version answers "is the fleet trading something different now?", and a
 * target that only changes what a bot logs does not. The slice that makes a target change what a
 * bot does adds a kind, as v2 and v3 did.
 */

const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId: "CRWV-WHEEL",
  mode: "standard",
  capitalAllocated: 100_000,
  enabled: true,
  createdAt: "2026-10-16T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
  ...overrides,
});
const target = { weight: 0.7, lean: { min: 0.6, max: 0.8 }, band: { signal: 0.05, gate: 0.1 } };
const AT = Date.parse("2026-10-16T12:00:00.000Z");
const KINDS: SubscriptionsSnapshotKind[] = [
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V3,
];

describe("playTarget on the subscriptions wire", () => {
  it("does not move the version under any kind, so it never swaps a live roster", () => {
    const without: SubscriptionsState = { sauron: [sub()] };
    const withTarget: SubscriptionsState = { sauron: [sub({ playTarget: target })] };
    for (const kind of KINDS) {
      expect(subscriptionsVersion(withTarget, kind)).toBe(subscriptionsVersion(without, kind));
    }
  });

  it("reaches the bots intact: a snapshot with a target parses back to the same target", () => {
    const state: SubscriptionsState = { sauron: [sub({ playTarget: target })] };
    for (const kind of KINDS) {
      const wire = JSON.parse(
        JSON.stringify(buildSubscriptionsSnapshot(state, AT, undefined, kind)),
      );
      const parsed = parseSubscriptionsSnapshot(wire);
      expect(parsed?.accounts.sauron?.[0]?.playTarget).toEqual(target);
    }
  });

  it("is dropped, not fatal, when the target is malformed: the roster still applies", () => {
    const state: SubscriptionsState = { sauron: [sub({ playTarget: target })] };
    const wire = JSON.parse(JSON.stringify(buildSubscriptionsSnapshot(state, AT)));
    wire.accounts.sauron[0].playTarget = { weight: 7 };
    const parsed = parseSubscriptionsSnapshot(wire);
    expect(parsed?.accounts.sauron).toHaveLength(1);
    expect(parsed?.accounts.sauron?.[0]).not.toHaveProperty("playTarget");
  });
});
