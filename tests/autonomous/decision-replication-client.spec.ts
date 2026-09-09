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
        await client.replicate({ sauron: 1 }); // app already has sauron@1 — only @2 is new
        expect(appDb.listByPersona("sauron").map((r) => r.at)).toEqual([2]);
        expect(appDb.listByPersona("beta-scout").map((r) => r.at)).toEqual([3]);
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
