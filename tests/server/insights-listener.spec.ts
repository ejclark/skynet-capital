import type { AddressInfo } from "node:net";
import type { InsightRecord } from "../../src/autonomous/insight-record.js";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "../../src/autonomous/insight-record.js";
import {
  createInsightsListener,
  resolveInsightsBridgePort,
} from "../../src/server/insights-listener.js";

const valid: InsightRecord = {
  at: 1,
  personaId: "day-trader",
  kind: "observation",
  data: { symbol: "NVDA" },
};

/** A store stub that never fails and captures what it was handed. */
function capturingRecorder(): {
  record: (entry: InsightRecord) => Promise<void>;
  received: InsightRecord[];
} {
  const received: InsightRecord[] = [];
  return {
    record: (entry) => {
      received.push(entry);
      return Promise.resolve();
    },
    received,
  };
}

/** A store stub standing in for a backing-store failure (e.g. a full disk). */
const throwingRecorder = (): Promise<void> => Promise.reject(new Error("disk full"));

async function withListener(
  record: (entry: InsightRecord) => Promise<void>,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createInsightsListener({ record });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const post = (base: string, body: unknown, opts: { auth?: boolean; raw?: string } = {}) => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.auth !== false) {
    headers[INSIGHTS_BRIDGE_SECRET_HEADER] = INSIGHTS_BRIDGE_SHARED_SECRET;
  }
  return fetch(`${base}/insights`, {
    method: "POST",
    headers,
    body: opts.raw ?? JSON.stringify(body),
  });
};

describe("insights listener", () => {
  it("accepts a valid, authenticated record and hands it to the store", async () => {
    const { record, received } = capturingRecorder();
    await withListener(record, async (base) => {
      const res = await post(base, valid);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(received).toEqual([valid]);
    });
  });

  it("rejects a request with no auth header", async () => {
    await withListener(capturingRecorder().record, async (base) => {
      const res = await post(base, valid, { auth: false });
      expect(res.status).toBe(401);
    });
  });

  it("rejects a request with the wrong shared secret", async () => {
    await withListener(capturingRecorder().record, async (base) => {
      const res = await fetch(`${base}/insights`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [INSIGHTS_BRIDGE_SECRET_HEADER]: "wrong-secret",
        },
        body: JSON.stringify(valid),
      });
      expect(res.status).toBe(401);
    });
  });

  it("rejects malformed JSON without crashing the listener", async () => {
    await withListener(capturingRecorder().record, async (base) => {
      const res = await post(base, undefined, { raw: "{not json" });
      expect(res.status).toBe(400);
      // the listener must still be alive for the next request
      const followUp = await post(base, valid);
      expect(followUp.status).toBe(200);
    });
  });

  it.each([
    ["missing personaId", { at: 1, kind: "observation", data: {} }],
    ["missing kind", { at: 1, personaId: "day-trader", data: {} }],
    ["data as an array", { ...valid, data: [] }],
    ["a bare string", "hello"],
    ["a number", 42],
    ["null", null],
  ])("rejects a structurally invalid record: %s", async (_label, body) => {
    await withListener(capturingRecorder().record, async (base) => {
      const res = await post(base, body);
      expect(res.status).toBe(400);
    });
  });

  it("rejects an oversized body without crashing the listener", async () => {
    await withListener(capturingRecorder().record, async (base) => {
      const huge = { ...valid, data: { blob: "x".repeat(64 * 1024) } };
      const res = await post(base, huge);
      expect(res.status).toBe(413);
      const followUp = await post(base, valid);
      expect(followUp.status).toBe(200);
    });
  });

  it("404s an unknown path", async () => {
    await withListener(capturingRecorder().record, async (base) => {
      const res = await fetch(`${base}/not-insights`, { method: "POST" });
      expect(res.status).toBe(404);
    });
  });

  it("405s a non-POST method", async () => {
    await withListener(capturingRecorder().record, async (base) => {
      const res = await fetch(`${base}/insights`, { method: "GET" });
      expect(res.status).toBe(405);
    });
  });

  it("returns 502 (not a crash) when the backing store write throws, and stays alive after", async () => {
    await withListener(throwingRecorder, async (base) => {
      const res = await post(base, valid);
      expect(res.status).toBe(502);
    });
    const { record, received } = capturingRecorder();
    await withListener(record, async (base) => {
      expect((await post(base, valid)).status).toBe(200);
      expect(received).toEqual([valid]);
    });
  });
});

describe("resolveInsightsBridgePort", () => {
  it("defaults to 8788", () => {
    expect(resolveInsightsBridgePort({})).toBe(8788);
  });

  it("honors SKYNET_INSIGHTS_BRIDGE_PORT", () => {
    expect(resolveInsightsBridgePort({ SKYNET_INSIGHTS_BRIDGE_PORT: "9999" })).toBe(9999);
  });

  it("falls back to the default on junk input", () => {
    expect(resolveInsightsBridgePort({ SKYNET_INSIGHTS_BRIDGE_PORT: "nope" })).toBe(8788);
  });
});
