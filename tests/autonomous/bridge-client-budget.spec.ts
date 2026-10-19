import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveBotCredentialsClient } from "../../src/autonomous/bot-credentials-client.js";
import { resolveCondScoutReplication } from "../../src/autonomous/cond-scout-replication-client.js";
import type { CondScoutSnapshot } from "../../src/autonomous/cond-scout-wire.js";
import { openDecisionDb } from "../../src/autonomous/decision-db.js";
import { resolveDecisionReplication } from "../../src/autonomous/decision-replication-client.js";
import { resolveInsightBridge } from "../../src/autonomous/insight-bridge-client.js";
import { resolveSnapshotReplication } from "../../src/autonomous/snapshot-replication-client.js";

/**
 * The per-fetch budget each bots-side bridge client takes (#5823), the shape #4978 gave the
 * bot-controls client. Prod never passes one and keeps the shared 2s `BRIDGE_REQUEST_TIMEOUT_MS`;
 * a spec running against a real listener in a loaded worker passes `LOADED_SUITE_BRIDGE_BUDGET`.
 *
 * The property: a reply that lands after the budget is due is dropped as a warning, never thrown
 * into the trade loop. The stall is a busy-wait in the handler — a starved event loop made
 * deterministic, so Node runs the overdue abort timer before it reads the reply. 600ms overshoots
 * the 150ms budget passed here and sits well inside the 2s default, so a client that ignored the
 * budget would accept the reply and this spec would see no warning.
 */
const BUDGET = { timeoutMs: 150 } as const;
const STALL_MS = 600;

async function withStalledBridge(run: (base: string) => Promise<void>): Promise<void> {
  const server = createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      const until = Date.now() + STALL_MS;
      while (Date.now() < until) {
        // starve the loop past the client's budget
      }
      res.writeHead(202, { "content-type": "application/json" });
      res.end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    // Under load a client can abort before its request is written, leaving a socket the server
    // never sees go idle, so a bare `close()` waits out the keep-alive past the test timeout.
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/** The warnings a client emitted while `run` was in flight, without printing them. */
async function warningsDuring(run: () => Promise<void>): Promise<string[]> {
  const seen: string[] = [];
  const warn = rstest.spyOn(process, "emitWarning").mockImplementation((warning) => {
    seen.push(String(warning));
  });
  try {
    await run();
  } finally {
    warn.mockRestore();
  }
  return seen;
}

describe("bridge clients honour the budget they are given (#5823)", () => {
  it("the snapshot client drops a reply that outlasts its budget, as a warning", async () => {
    await withStalledBridge(async (base) => {
      const send = resolveSnapshotReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: base },
        "/authored-shadow",
        "authored-shadow",
        () => ({ orders: [] }),
        BUDGET,
      );
      const warnings = await warningsDuring(() => expect(send.send()).resolves.toBeUndefined());
      expect(warnings).toEqual([expect.stringContaining("[authored-shadow] snapshot send failed")]);
    });
  });

  it("the cond-scout client forwards its budget to the shared snapshot send", async () => {
    await withStalledBridge(async (base) => {
      const send = resolveCondScoutReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: base },
        () => ({}) as CondScoutSnapshot,
        BUDGET,
      );
      const warnings = await warningsDuring(() => expect(send.send()).resolves.toBeUndefined());
      expect(warnings).toEqual([expect.stringContaining("[cond-scout] snapshot send failed")]);
    });
  });

  it("the insight client drops a reply that outlasts its budget, as a warning", async () => {
    await withStalledBridge(async (base) => {
      const bridge = resolveInsightBridge({ SKYNET_INSIGHTS_BRIDGE_URL: base }, BUDGET);
      const warnings = await warningsDuring(() =>
        expect(
          bridge.recordInsight({ at: 1, personaId: "sauron", kind: "observation", data: {} }),
        ).resolves.toBeUndefined(),
      );
      expect(warnings).toEqual([expect.stringContaining("[insights-bridge] unreachable")]);
    });
  });

  it("the decision client drops a batch that outlasts its budget, as a warning", async () => {
    const dir = mkdtempSync(join(tmpdir(), "bridge-budget-"));
    const db = openDecisionDb(join(dir, "bots-decisions.db"));
    try {
      db.record({
        at: 1,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
      });
      await withStalledBridge(async (base) => {
        const client = resolveDecisionReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: base },
          () => db,
          BUDGET,
        );
        const warnings = await warningsDuring(() =>
          expect(client.replicate({})).resolves.toBeUndefined(),
        );
        expect(warnings.length).toBeGreaterThan(0);
        for (const warning of warnings) {
          expect(warning).toContain("[decision-replication] sauron unreachable");
        }
      });
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The stalled reply is a 2xx `{}`: a client that ignored the budget would read it and warn
  // "malformed" instead, so the "pull failed" wording is what proves the abort fired.
  it("the credentials client applies nothing when a pull outlasts its budget, as a warning", async () => {
    await withStalledBridge(async (base) => {
      const rotated: string[] = [];
      const client = resolveBotCredentialsClient(
        (id) => {
          rotated.push(id);
          return true;
        },
        { SKYNET_INSIGHTS_BRIDGE_URL: base, SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET: "s" },
        BUDGET,
      );
      const primed: string[] = [];
      const bots = { bots: { sauron: { credentialsVersion: "v1" } } };
      const warnings = await warningsDuring(async () => {
        await expect(client.prime(bots, (id) => primed.push(id))).resolves.toBeUndefined();
        await expect(client.reconcile(bots)).resolves.toBeUndefined();
      });
      expect(primed).toEqual([]);
      expect(rotated).toEqual([]);
      expect(warnings).toEqual([
        expect.stringContaining("[creds] sauron: credential pull failed"),
        expect.stringContaining("[creds] sauron: credential pull failed"),
      ]);
    });
  });
});
