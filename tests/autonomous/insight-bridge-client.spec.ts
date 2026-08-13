import type { AddressInfo } from "node:net";
import { resolveInsightBridge } from "../../src/autonomous/insight-bridge-client.js";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
  type InsightRecord,
} from "../../src/autonomous/insight-record.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";

const record: InsightRecord = {
  at: 1,
  personaId: "day-trader",
  kind: "observation",
  data: { symbol: "NVDA" },
};

describe("resolveInsightBridge", () => {
  it("is a complete no-op when SKYNET_INSIGHTS_BRIDGE_URL is unset", async () => {
    const bridge = resolveInsightBridge({});
    await expect(bridge.recordInsight(record)).resolves.toBeUndefined();
  });

  it("sends a correctly-authenticated POST the real listener accepts", async () => {
    const received: InsightRecord[] = [];
    const server = createInsightsListener({
      record: (entry) => {
        received.push(entry);
        return Promise.resolve();
      },
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const bridge = resolveInsightBridge({
        SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}`,
      });
      await bridge.recordInsight(record);
      expect(received).toEqual([record]);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("sends the shared-secret header the listener requires", async () => {
    let capturedHeader: string | null = null;
    // A tiny raw server standing in for the listener, just to inspect the header the client sent.
    const { createServer } = await import("node:http");
    const server = createServer((req, res) => {
      capturedHeader = (req.headers[INSIGHTS_BRIDGE_SECRET_HEADER] as string) ?? null;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const bridge = resolveInsightBridge({
        SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}`,
      });
      await bridge.recordInsight(record);
      expect(capturedHeader).toBe(INSIGHTS_BRIDGE_SHARED_SECRET);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("never throws when the bridge URL points at nothing listening", async () => {
    const bridge = resolveInsightBridge({ SKYNET_INSIGHTS_BRIDGE_URL: "http://127.0.0.1:1" });
    await expect(bridge.recordInsight(record)).resolves.toBeUndefined();
  });

  it("never throws when the configured host cannot resolve", async () => {
    const bridge = resolveInsightBridge({
      SKYNET_INSIGHTS_BRIDGE_URL: "http://this-host-does-not-exist.invalid:8788",
    });
    await expect(bridge.recordInsight(record)).resolves.toBeUndefined();
  });

  it("never throws when the listener rejects the write (e.g. a 502 from a store failure)", async () => {
    const server = createInsightsListener({
      record: () => Promise.reject(new Error("disk full")),
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const bridge = resolveInsightBridge({
        SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}`,
      });
      await expect(bridge.recordInsight(record)).resolves.toBeUndefined();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
