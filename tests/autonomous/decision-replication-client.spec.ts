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
      botsDb.record(decision({ at: 1 }));
      botsDb.record(decision({ at: 2 }));
      botsDb.record(decision({ at: 3, personaId: "beta-scout" }));

      const server = createInsightsListener({
        record: () => Promise.resolve(),
        decisions: { recordBatch: (batch) => appDb.recordBatch(batch.records) },
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => botsDb,
        );
        await client.replicate({ sauron: 1 }); // ascending leg: only @2 is new above cursor 1
        // The preview leg (unconditional, cursor-independent) also lands @1 — both rows this
        // small a store fit inside LIVE_PREVIEW_BATCH, so it re-sends everything it has, harmlessly.
        expect(appDb.listByPersona("sauron").map((r) => r.at)).toEqual([2, 1]);
        expect(appDb.listByPersona("beta-scout").map((r) => r.at)).toEqual([3]);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("the preview leg lands the newest rows immediately, even with a huge cursor gap (the outage-backlog scenario, #3576)", async () => {
      // Simulates exactly what production hit: a persona with a large chronological backlog the
      // app hasn't seen (cursor far behind), plus fresh rows just produced. Before this fix, the
      // fresh rows would wait behind the ENTIRE backlog, one MAX_DECISION_BATCH-sized ascending
      // step per poll — here, in a single replicate() call, they must already be visible.
      for (let at = 1; at <= 150; at++) botsDb.record(decision({ at }));

      const server = createInsightsListener({
        record: () => Promise.resolve(),
        decisions: { recordBatch: (batch) => appDb.recordBatch(batch.records) },
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => botsDb,
        );
        await client.replicate({ sauron: 0 }); // one poll, cursor at the very start of a 150-row backlog
        // The preview leg: the newest row is visible after ONE poll, not ~2 (150 / MAX_DECISION_BATCH).
        expect(appDb.listByPersona("sauron", { limit: 1 })[0]?.at).toBe(150);
        // The ascending leg, checked in isolation (beforeAt excludes the preview leg's own rows,
        // 131-150, so this can only be satisfied by the ascending leg's own MAX_DECISION_BATCH step).
        expect(appDb.listByPersona("sauron", { beforeAt: 101, limit: 1 })[0]?.at).toBe(100);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("re-sending the same cursor never duplicates rows on the app side — idempotent resend", async () => {
      botsDb.record(decision({ at: 1 }));
      const server = createInsightsListener({
        record: () => Promise.resolve(),
        decisions: { recordBatch: (batch) => appDb.recordBatch(batch.records) },
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => botsDb,
        );
        await client.replicate({}); // first send
        await client.replicate({}); // a lost-ack resend — same cursor the caller last knew
        expect(appDb.listByPersona("sauron")).toHaveLength(1);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("never throws when the bridge rejects the batch (e.g. no decisions route configured)", async () => {
      const server = createInsightsListener({ record: () => Promise.resolve() }); // no `decisions`
      botsDb.record(decision({ at: 1 }));
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const { port } = server.address() as AddressInfo;
      try {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
          () => botsDb,
        );
        await expect(client.replicate({})).resolves.toBeUndefined();
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("never throws when the bridge URL points at nothing listening", async () => {
      botsDb.record(decision({ at: 1 }));
      const client = resolveDecisionReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: "http://127.0.0.1:1" },
        () => botsDb,
      );
      await expect(client.replicate({})).resolves.toBeUndefined();
    });
  });
});
