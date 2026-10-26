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
 * conviction's words and day leave the fingerprint. One bit stays: an inline copy with no pointer
 * is one the app's poll could not move onto a view, and its pair runs exits-only. Expand first: the
 * bots read v4 from this build, and the app keeps sending v3 until they are live.
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

  it("moves when an unmoved inline copy is there, never for its words or day", () => {
    const plain = v4({ sauron: [sub()] });
    const inline = v4({ sauron: [sub({ conviction })] });
    expect(inline).not.toBe(plain);
    expect(
      v4({ sauron: [sub({ conviction: { reason: "other words", checkOn: "2027-04-30" } })] }),
    ).toBe(inline);
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
    const relabelled = wire(
      { sauron: [sub({ ...pointed, conviction })] },
      SUBSCRIPTIONS_SNAPSHOT_KIND_V3,
    );
    expect(parseSubscriptionsSnapshot({ ...relabelled, kind: V4 })).toBeUndefined();
  });

  it("runs a pair whose inline copy never moved exits-only, off the parsed snapshot", () => {
    const parsed = parseSubscriptionsSnapshot(wire({ sauron: [sub({ conviction })] }));
    const roster = subscriptionRoster(parsed?.accounts.sauron ?? []);
    expect(roster.enabled.map((e) => [e.playbook.id, e.exitsOnly])).toEqual([["CRWV-WHEEL", true]]);
    expect(roster.steeringRefused).toEqual(["CRWV-WHEEL: its conviction is not on a view yet"]);
  });
});
