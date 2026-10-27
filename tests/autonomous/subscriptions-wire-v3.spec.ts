import {
  buildSubscriptionsSnapshot,
  parseSubscriptionsSnapshot,
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V3,
  subscriptionsVersion,
} from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";

/**
 * `subscriptions.v3` (#5482 slice 2): a subscription's pointer at a conviction record joins the
 * fingerprint. Expand first, as v2 did: the bots read v3 from this build, the app keeps sending v2,
 * and a version that never named the pointer never applies it.
 */

const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId: "CRWV-WHEEL",
  mode: "standard",
  capitalAllocated: 5_000,
  enabled: true,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
  ...overrides,
});

const AT = Date.parse("2026-10-16T12:00:00.000Z");
const V2 = SUBSCRIPTIONS_SNAPSHOT_KIND_V2;
const V3 = SUBSCRIPTIONS_SNAPSHOT_KIND_V3;
const pointed = { convictionId: "ai-dip-2026-10" };
const v3 = (state: SubscriptionsState) => subscriptionsVersion(state, V3);
const roundTrip = (kind: typeof V2 | typeof V3 | typeof SUBSCRIPTIONS_SNAPSHOT_KIND) =>
  parseSubscriptionsSnapshot(
    JSON.parse(
      JSON.stringify(buildSubscriptionsSnapshot({ sauron: [sub(pointed)] }, AT, undefined, kind)),
    ),
  );

describe("subscriptions.v3 — the conviction pointer joins the fingerprint", () => {
  it("moves for a pointer, and for a different one", () => {
    const plain = v3({ sauron: [sub()] });
    const held = v3({ sauron: [sub(pointed)] });
    expect(held).not.toBe(plain);
    expect(v3({ sauron: [sub({ convictionId: "another-view" })] })).not.toBe(held);
  });

  it("still moves for every v1 field (v2's own term is frozen since the inline field retired)", () => {
    const base = v3({ sauron: [sub(pointed)] });
    expect(v3({ sauron: [sub({ ...pointed, enabled: false })] })).not.toBe(base);
    expect(v3({ sauron: [sub({ ...pointed, mode: "aggressive" })] })).not.toBe(base);
  });

  it("leaves v2's version alone: a pointer never moves it", () => {
    expect(subscriptionsVersion({ sauron: [sub(pointed)] }, V2)).toBe(
      subscriptionsVersion({ sauron: [sub()] }, V2),
    );
  });

  it("round trips as v3, pointer intact", () => {
    const parsed = roundTrip(V3);
    expect(parsed?.kind).toBe(V3);
    expect(parsed?.accounts.sauron?.[0]?.convictionId).toBe("ai-dip-2026-10");
  });

  it("drops the pointer a v2 or v1 snapshot carries", () => {
    for (const kind of [V2, SUBSCRIPTIONS_SNAPSHOT_KIND] as const) {
      const parsed = roundTrip(kind);
      expect(parsed?.kind).toBe(kind);
      expect(parsed?.accounts.sauron?.[0]).not.toHaveProperty("convictionId");
    }
  });

  it("refuses a v3 payload whose version was computed the v2 way", () => {
    const state = { sauron: [sub(pointed)] };
    const snapshot = {
      ...buildSubscriptionsSnapshot(state, AT, undefined, V3),
      version: subscriptionsVersion(state, V2),
    };
    expect(parseSubscriptionsSnapshot(JSON.parse(JSON.stringify(snapshot)))).toBeUndefined();
  });

  it("refuses a kind it does not know", () => {
    const snapshot = { ...buildSubscriptionsSnapshot({ sauron: [sub()] }, AT), kind: "s.v9" };
    expect(parseSubscriptionsSnapshot(snapshot)).toBeUndefined();
  });
});
