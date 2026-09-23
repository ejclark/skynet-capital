import {
  createSubscriptionSync,
  type SubscriptionSyncBot,
} from "../../src/autonomous/subscription-sync.js";
import {
  buildSubscriptionsSnapshot,
  type SubscriptionsSnapshot,
} from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";

/**
 * The swap (issue #3595): a snapshot arriving on the poll rebuilds each bot's roster in the
 * already-running process. What is specified here is when a swap happens AT ALL — a flapping or
 * rewinding bridge must not be able to churn a live fleet's roster, and a bot that has heard
 * nothing must never be reported as trading a version.
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
const snapshot = (state: SubscriptionsState, at = AT): SubscriptionsSnapshot =>
  buildSubscriptionsSnapshot(state, at);

/** A recording stand-in for one live bot's `applySubscriptions` seam. */
function recorder(personaId: string): {
  bot: SubscriptionSyncBot;
  applied: (readonly PlaybookSubscription[])[];
} {
  const applied: (readonly PlaybookSubscription[])[] = [];
  return {
    applied,
    bot: { personaId, applySubscriptions: (subs) => applied.push(subs) },
  };
}

describe("createSubscriptionSync", () => {
  it("reports no version at all until a snapshot lands", () => {
    const sync = createSubscriptionSync({ bots: [] });
    expect(sync.version()).toBeUndefined();
    expect(sync.inForceAt()).toBeUndefined();
  });

  it("applies each account's own subscriptions to its own bot", () => {
    const sauron = recorder("sauron");
    const banker = recorder("banker");
    const sync = createSubscriptionSync({ bots: [sauron.bot, banker.bot] });

    const snap = snapshot({ sauron: [sub()], banker: [sub({ accountId: "banker" })] });
    expect(sync.accept(snap)).toBe("applied");

    expect(sauron.applied).toEqual([[sub()]]);
    expect(banker.applied).toEqual([[sub({ accountId: "banker" })]]);
    expect(sync.version()).toBe(snap.version);
    expect(sync.inForceAt()).toBe(AT);
  });

  it("hands a bot with no subscriptions an empty set — it trades the house roster only", () => {
    const banker = recorder("banker");
    const sync = createSubscriptionSync({ bots: [banker.bot] });
    sync.accept(snapshot({ sauron: [sub()] }));
    expect(banker.applied).toEqual([[]]);
  });

  it("applies an unsubscribe — the roster shrinks, it does not go stale", () => {
    const sauron = recorder("sauron");
    const sync = createSubscriptionSync({ bots: [sauron.bot] });
    sync.accept(snapshot({ sauron: [sub()] }, AT));
    expect(sync.accept(snapshot({}, AT + 30_000))).toBe("applied");
    expect(sauron.applied).toEqual([[sub()], []]);
  });

  it("is a free no-op when nothing changed between two polls", () => {
    const sauron = recorder("sauron");
    const applied: string[] = [];
    const sync = createSubscriptionSync({
      bots: [sauron.bot],
      onApplied: (version) => applied.push(version),
    });
    sync.accept(snapshot({ sauron: [sub()] }, AT));
    expect(sync.accept(snapshot({ sauron: [sub()] }, AT + 30_000))).toBe("unchanged");
    expect(sauron.applied).toHaveLength(1);
    expect(applied).toHaveLength(1);
  });

  it("advances the clock on an unchanged snapshot, so the next real change is not read as stale", () => {
    const sauron = recorder("sauron");
    const sync = createSubscriptionSync({ bots: [sauron.bot] });
    sync.accept(snapshot({ sauron: [sub()] }, AT));
    sync.accept(snapshot({ sauron: [sub()] }, AT + 60_000));
    expect(sync.inForceAt()).toBe(AT + 60_000);
    expect(sync.accept(snapshot({ sauron: [sub({ enabled: false })] }, AT + 90_000))).toBe(
      "applied",
    );
  });

  it("refuses a snapshot older than the one in force — a rollback must not rewind a live roster", () => {
    const sauron = recorder("sauron");
    const stale: { version: string; at: number; inForceAt: number }[] = [];
    const sync = createSubscriptionSync({
      bots: [sauron.bot],
      onStale: (version, at, inForceAt) => stale.push({ version, at, inForceAt }),
    });
    const current = snapshot({ sauron: [sub()] }, AT);
    sync.accept(current);

    const older = snapshot({ sauron: [sub({ capitalAllocated: 100 })] }, AT - 60_000);
    expect(sync.accept(older)).toBe("stale");
    expect(sauron.applied).toEqual([[sub()]]); // untouched
    expect(sync.version()).toBe(current.version);
    expect(sync.inForceAt()).toBe(AT);
    expect(stale).toEqual([{ version: older.version, at: AT - 60_000, inForceAt: AT }]);
  });

  it("keeps going when one bot's rebuild throws, and reports which one", () => {
    const healthy = recorder("banker");
    const errors: string[] = [];
    const sync = createSubscriptionSync({
      bots: [
        {
          personaId: "sauron",
          applySubscriptions: () => {
            throw new Error("roster rebuild blew up");
          },
        },
        healthy.bot,
      ],
      onApplyError: (personaId) => errors.push(personaId),
    });

    expect(sync.accept(snapshot({ sauron: [sub()] }))).toBe("applied");
    expect(errors).toEqual(["sauron"]);
    expect(healthy.applied).toEqual([[]]);
  });
});
