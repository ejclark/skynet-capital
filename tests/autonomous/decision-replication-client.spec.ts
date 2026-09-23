import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { resolveDecisionReplication } from "../../src/autonomous/decision-replication-client.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";

const decision = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: 1,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...over,
});

describe("resolveDecisionReplication", () => {
  it("is a complete no-op when SKYNET_INSIGHTS_BRIDGE_URL is unset", async () => {
    const client = resolveDecisionReplication({}, () => undefined);
    await expect(client.replicate({})).resolves.toBeUndefined();
  });

  it("is a no-op when no local decision store exists yet", async () => {
    const client = resolveDecisionReplication(
      { SKYNET_INSIGHTS_BRIDGE_URL: "http://127.0.0.1:1" },
      () => undefined,
    );
    await expect(client.replicate({})).resolves.toBeUndefined();
  });

  describe("against a real listener", () => {
    // `dir`/`botsDb`/`appDb` are reassigned fresh by `beforeEach` for every test. A closure that
    // reads them BY NAME (rather than capturing the current value) is only safe if it's guaranteed
    // to run before the NEXT `beforeEach` reassigns them — true for a fast test, but not for one
    // whose `client.replicate()` call is still in flight when the test's own timeout fires: JS has
    // no promise cancellation, so that stale call keeps running in the background and its
    // `recordBatch` closure would silently write into the NEXT test's `appDb` instead of its own
    // (found live in CI, 2026-09-23 — a heavier test elsewhere in this file exposed exactly this
    // race). Each test below captures its own `botsDb`/`appDb` into a local `const` up front and
    // uses only that binding, so a straggler can never cross into another test's database.
    let dir: string;
    let botsDb: DecisionDb;
    let appDb: DecisionDb;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "decision-replication-"));
      botsDb = openDecisionDb(join(dir, "bots-decisions.db"));
      appDb = openDecisionDb(join(dir, "app-decisions.db"));
    });
    afterEach(() => {
      botsDb.close();
      appDb.close();
      rmSync(dir, { recursive: true, force: true });
    });

    it("sends every local row above the cursor, and the app stores it", async () => {
      const thisBotsDb = botsDb;
      const thisAppDb = appDb;
      thisBotsDb.record(decision({ at: 1 }));
      thisBotsDb.record(decision({ at: 2 }));
      thisBotsDb.record(decision({ at: 3, personaId: "beta-scout" }));

      const server = createInsightsListener({
        record: () => Promise.resolve(),
        decisions: { recordBatch: (batch) => thisAppDb.recordBatch(batch.records) },
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => thisBotsDb,
        );
        // The ascending leg tracks its own resume point locally and ignores the passed cursor
        // entirely (see the module's own bug note) — with a fresh client it starts at 0, so it
        // sends BOTH rows here, same as the preview leg does unconditionally. Passing a cursor at
        // all is just proving the client accepts (and ignores) whatever shape the app reports.
        await client.replicate({ sauron: 1 });
        expect(thisAppDb.listByPersona("sauron").map((r) => r.at)).toEqual([2, 1]);
        expect(thisAppDb.listByPersona("beta-scout").map((r) => r.at)).toEqual([3]);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("the preview leg lands the newest rows immediately, even with a huge cursor gap (the outage-backlog scenario, #3576)", async () => {
      // Simulates exactly what production hit: a persona with a large chronological backlog the
      // app hasn't seen (cursor far behind), plus fresh rows just produced. Before this fix, the
      // fresh rows would wait behind the ENTIRE backlog, one MAX_DECISION_BATCH-sized ascending
      // step per poll — here, in a single replicate() call, they must already be visible.
      const thisBotsDb = botsDb;
      const thisAppDb = appDb;
      for (let at = 1; at <= 150; at++) thisBotsDb.record(decision({ at }));

      const server = createInsightsListener({
        record: () => Promise.resolve(),
        decisions: { recordBatch: (batch) => thisAppDb.recordBatch(batch.records) },
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => thisBotsDb,
        );
        await client.replicate({ sauron: 0 }); // one poll, cursor at the very start of a 150-row backlog
        // The preview leg: the newest row is visible after ONE poll, not ~2 (150 / MAX_DECISION_BATCH).
        expect(thisAppDb.listByPersona("sauron", { limit: 1 })[0]?.at).toBe(150);
        // The ascending leg, checked in isolation (beforeAt excludes the preview leg's own rows,
        // 131-150, so this can only be satisfied by the ascending leg's own MAX_DECISION_BATCH step).
        expect(thisAppDb.listByPersona("sauron", { beforeAt: 101, limit: 1 })[0]?.at).toBe(100);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }, 15_000); // 150 synchronous writes + two real HTTP round trips — generous headroom under a slow/shared CI runner

    it("keeps draining the ascending backlog even when the app's own cursor already claims it's caught up (found live, 2026-09-23)", async () => {
      // Reproduces the real production bug: once the preview leg's own send lands, the app's
      // decisionsCursor (maxAtAll() over EVERYTHING it has stored) reports back a value at the
      // very end of the store — exactly what `pollutedCursor` simulates here. The buggy client
      // read that straight into the ascending leg's resume point and never sent anything below it
      // again, permanently hiding the backlog. The fixed client must ignore it and keep draining
      // from its own locally-tracked progress regardless of what the app claims.
      const thisBotsDb = botsDb;
      const thisAppDb = appDb;
      for (let at = 1; at <= 250; at++) thisBotsDb.record(decision({ at }));

      const server = createInsightsListener({
        record: () => Promise.resolve(),
        decisions: { recordBatch: (batch) => thisAppDb.recordBatch(batch.records) },
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => thisBotsDb,
        );
        const pollutedCursor = { sauron: 250 }; // the app claiming it already has everything
        await client.replicate(pollutedCursor);
        await client.replicate(pollutedCursor);
        await client.replicate(pollutedCursor);
        // 3 polls × MAX_DECISION_BATCH (100) covers the full 250-row backlog — every row present,
        // not just the newest ones the preview leg would land on its own. `listSince`'s own limit
        // clamps to 100 (decision-db.ts's MAX_PAGE), so reading the full range back takes three
        // chunked calls rather than one call for 250.
        const total =
          thisAppDb.listSince("sauron", 0, 100).length +
          thisAppDb.listSince("sauron", 100, 100).length +
          thisAppDb.listSince("sauron", 200, 100).length;
        expect(total).toBe(250);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }, 15_000); // 250 synchronous writes + up to 6 real HTTP round trips (3 polls × 2 legs)

    it("re-sending the same cursor never duplicates rows on the app side — idempotent resend", async () => {
      const thisBotsDb = botsDb;
      const thisAppDb = appDb;
      thisBotsDb.record(decision({ at: 1 }));
      const server = createInsightsListener({
        record: () => Promise.resolve(),
        decisions: { recordBatch: (batch) => thisAppDb.recordBatch(batch.records) },
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => thisBotsDb,
        );
        await client.replicate({}); // first send
        await client.replicate({}); // a lost-ack resend — same cursor the caller last knew
        expect(thisAppDb.listByPersona("sauron")).toHaveLength(1);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("never throws when the bridge rejects the batch (e.g. no decisions route configured)", async () => {
      const thisBotsDb = botsDb;
      const server = createInsightsListener({ record: () => Promise.resolve() }); // no `decisions`
      thisBotsDb.record(decision({ at: 1 }));
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => thisBotsDb,
        );
        await expect(client.replicate({})).resolves.toBeUndefined();
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("never throws when the bridge URL points at nothing listening", async () => {
      const thisBotsDb = botsDb;
      thisBotsDb.record(decision({ at: 1 }));
      const client = resolveDecisionReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: "http://127.0.0.1:1" },
        () => thisBotsDb,
      );
      await expect(client.replicate({})).resolves.toBeUndefined();
    });
  });
});
