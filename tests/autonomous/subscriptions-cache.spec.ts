import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openBotsStateDb } from "../../src/autonomous/bots-state-db.js";
import { createSubscriptionSync } from "../../src/autonomous/subscription-sync.js";
import {
  acceptAndKeep,
  applyBootSubscriptions,
  subscriptionsCache,
} from "../../src/autonomous/subscriptions-cache.js";
import { buildSubscriptionsSnapshot } from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { aSubscription } from "../support/builders.js";

/**
 * Review of #4642 slice 10, finding 15: a bots restart while the dashboard is unreachable traded an
 * empty subscription list — Sauron's buys refused "not from a subscribed playbook" while the Store
 * showed him subscribed. The last snapshot the bots applied is now kept on the volume and traded at
 * such a boot, until the dashboard answers.
 */
const SAURON_ON = { sauron: [aSubscription("sauron", "SAURON")] };
const snapshot = (at: number, accounts = SAURON_ON) => buildSubscriptionsSnapshot(accounts, at);

function fleet() {
  const applied: (readonly PlaybookSubscription[])[] = [];
  const sync = createSubscriptionSync({
    bots: [{ personaId: "sauron", applySubscriptions: (subs) => applied.push(subs) }],
  });
  return { sync, applied };
}

describe("the last subscriptions the bots applied, kept on the volume", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "subscriptions-cache-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("a boot without the dashboard trades what the last run applied, and says so", () => {
    const path = join(dir, "bots-state.db");
    const before = openBotsStateDb(path);
    const lastRun = fleet();
    acceptAndKeep(lastRun.sync, subscriptionsCache(before), snapshot(1_000));
    before.close();

    const after = openBotsStateDb(path);
    const boot = fleet();
    const warn = rstest.fn();
    applyBootSubscriptions(boot.sync, subscriptionsCache(after), undefined, { warn });
    expect(boot.applied).toEqual([SAURON_ON.sauron]);
    expect(warn.mock.calls[0]?.[0]).toContain("trading the last ones received");
    after.close();
  });

  it("the dashboard's own snapshot wins at boot, is kept, and a newer one still applies over a kept one", () => {
    const db = openBotsStateDb(join(dir, "bots-state.db"));
    const cache = subscriptionsCache(db);
    const boot = fleet();
    applyBootSubscriptions(boot.sync, cache, snapshot(2_000), { warn: rstest.fn() });
    expect(cache.restore()?.at).toBe(2_000);
    const paused = { sauron: [aSubscription("sauron", "SAURON", { enabled: false })] };
    expect(acceptAndKeep(boot.sync, cache, snapshot(3_000, paused))).toBe("applied");
    expect(boot.applied.at(-1)).toEqual(paused.sauron);
    expect(cache.restore()?.at).toBe(3_000);
    db.close();
  });

  it("with nothing fetched and nothing kept, says plainly that no bot opens until the dashboard answers", () => {
    const boot = fleet();
    const warn = rstest.fn();
    applyBootSubscriptions(boot.sync, subscriptionsCache(undefined), undefined, { warn });
    expect(boot.applied).toEqual([]);
    expect(warn.mock.calls[0]?.[0]).toContain("no bot opens a position until it answers");
  });

  it("a kept snapshot that no longer reads whole restores nothing, never a guess", () => {
    const cache = subscriptionsCache({
      loadSubscriptions: () => ({ kind: "subscriptions.v1", at: 1, version: "nope", accounts: {} }),
      saveSubscriptions: () => undefined,
    });
    expect(cache.restore()).toBeUndefined();
    const throwing = subscriptionsCache({
      loadSubscriptions: () => {
        throw new Error("disk");
      },
      saveSubscriptions: () => {
        throw new Error("disk");
      },
    });
    expect(throwing.restore()).toBeUndefined();
    expect(() => throwing.keep(snapshot(1))).not.toThrow();
  });
});
