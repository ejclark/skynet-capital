import {
  buildSubscriptionsSnapshot,
  parseSubscriptionsSnapshot,
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V3,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V4,
  type SubscriptionsSnapshotKind,
  subscriptionsVersion,
} from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { subscriptionRoster } from "../../src/subscriptions/subscription-roster.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";

/**
 * `subscriptions.v4` (#5482 contract piece 4): the bots read pointers only, so an inline
 * conviction's words and day left the fingerprint. Its one bit (an unmoved copy is there) is always
 * false since the last contract piece removed the inline field, which is what every live
 * subscription already hashed to.
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

const AT = Date.parse("2026-10-23T12:00:00.000Z");
const V4 = SUBSCRIPTIONS_SNAPSHOT_KIND_V4;
const conviction = { reason: "Eric's call", checkOn: "2027-01-29" };
/** A subscription as an old build wrote it, inline copy and all — never a shape this build makes. */
const withInline = (over: Partial<PlaybookSubscription> = {}) =>
  ({ ...sub(over), conviction }) as PlaybookSubscription;
const pointed = { convictionId: "ai-dip-2026-10" };
const v4 = (state: SubscriptionsState) => subscriptionsVersion(state, V4);
const wire = (state: SubscriptionsState, kind: SubscriptionsSnapshotKind = V4) =>
  JSON.parse(JSON.stringify(buildSubscriptionsSnapshot(state, AT, undefined, kind)));

describe("subscriptions.v4 — pointers only on the wire", () => {
  it("moves for a pointer, and for a different one", () => {
    const plain = v4({ sauron: [sub()] });
    const held = v4({ sauron: [sub(pointed)] });
    expect(held).not.toBe(plain);
    expect(v4({ sauron: [sub({ convictionId: "another-view" })] })).not.toBe(held);
  });

  it("is the version it always was for a subscription with no inline copy (the live shape)", () => {
    // Pinned from the build before the inline field went: the bit hashed false for every
    // subscription once the live count read zero copies (#6046), so no live roster re-versions.
    expect(v4({ sauron: [sub(pointed)] })).toBe("f6811519c4812eb2");
    expect(v4({ sauron: [sub()] })).toBe("f50bc8d01901c4a6");
  });

  it("drops an inline copy an old build sent, so the pair reads as unpointed", () => {
    const parsed = parseSubscriptionsSnapshot(wire({ sauron: [withInline()] }));
    expect(parsed?.accounts.sauron?.[0]).not.toHaveProperty("conviction");
  });

  it("still moves for every v1 field", () => {
    const base = v4({ sauron: [sub(pointed)] });
    expect(v4({ sauron: [sub({ ...pointed, enabled: false })] })).not.toBe(base);
    expect(v4({ sauron: [sub({ ...pointed, capitalAllocated: 6_000 })] })).not.toBe(base);
  });

  it("round trips as v4, the pointer intact", () => {
    const parsed = parseSubscriptionsSnapshot(wire({ sauron: [sub(pointed)] }));
    expect(parsed?.kind).toBe(V4);
    expect(parsed?.accounts.sauron?.[0]?.convictionId).toBe("ai-dip-2026-10");
  });

  it("refuses a v4 snapshot whose version does not reproduce from its contents", () => {
    const sent = wire({ sauron: [sub(pointed)] });
    const forged = {
      ...sent,
      version: subscriptionsVersion(sent.accounts, SUBSCRIPTIONS_SNAPSHOT_KIND),
    };
    expect(parseSubscriptionsSnapshot(forged)).toBeUndefined();
    // A v3 fingerprint is not a v4 one, so a kind relabelled in flight is refused too.
    const relabelled = wire({ sauron: [sub(pointed)] }, SUBSCRIPTIONS_SNAPSHOT_KIND_V3);
    expect(parseSubscriptionsSnapshot({ ...relabelled, kind: V4 })).toBeUndefined();
  });

  it("runs a ◆ pair with no pointer exits-only, inline copy or not, off the parsed snapshot", () => {
    const parsed = parseSubscriptionsSnapshot(wire({ sauron: [withInline()] }));
    const roster = subscriptionRoster(parsed?.accounts.sauron ?? []);
    expect(roster.enabled.map((e) => [e.playbook.id, e.exitsOnly])).toEqual([["CRWV-WHEEL", true]]);
    expect(roster.steeringRefused).toEqual(["CRWV-WHEEL: its conviction is not on a view yet"]);
  });
});
