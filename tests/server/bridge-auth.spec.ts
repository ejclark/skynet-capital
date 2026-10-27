import { readdirSync, readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { resolveInsightBridge } from "../../src/autonomous/insight-bridge-client.js";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
  type InsightRecord,
  insightsBridgeSecret,
} from "../../src/autonomous/insight-record.js";
import { type BridgeAuth, resolveBridgeAuth } from "../../src/server/bridge-http.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { LOADED_SUITE_BRIDGE_BUDGET } from "../support/bridge-budget.js";

// Bridge auth beyond Fly's private network (#4621): a host that sets SKYNET_INSIGHTS_BRIDGE_SECRET
// on both apps authenticates the bots with it; a host that never set one behaves as before. The
// listener still takes the repo-public literal while a secret is set (expand half of a
// listener-first rollout), and says so once.

const SECRET = "4f1c0e9a-provisioned-on-both-apps";
const record: InsightRecord = { at: 1, personaId: "sauron", kind: "observation", data: {} };

async function withListener(
  bridgeAuth: BridgeAuth,
  run: (base: string, received: InsightRecord[]) => Promise<void>,
): Promise<void> {
  const received: InsightRecord[] = [];
  const server = createInsightsListener({
    bridgeAuth,
    record: (entry) => {
      received.push(entry);
      return Promise.resolve();
    },
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`, received);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function captureWarnings(): { warnings: string[]; restore: () => void } {
  const warnings: string[] = [];
  const spy = rstest.spyOn(process, "emitWarning").mockImplementation((warning) => {
    warnings.push(String(warning));
  });
  return { warnings, restore: () => spy.mockRestore() };
}

describe("insightsBridgeSecret (what the bots send)", () => {
  it("sends the provisioned secret when one is set", () => {
    expect(insightsBridgeSecret({ SKYNET_INSIGHTS_BRIDGE_SECRET: SECRET })).toBe(SECRET);
  });

  it("falls back to the literal when it is unset or empty", () => {
    expect(insightsBridgeSecret({})).toBe(INSIGHTS_BRIDGE_SHARED_SECRET);
    expect(insightsBridgeSecret({ SKYNET_INSIGHTS_BRIDGE_SECRET: "" })).toBe(
      INSIGHTS_BRIDGE_SHARED_SECRET,
    );
  });
});

describe("resolveBridgeAuth (what the dashboard accepts)", () => {
  it("accepts the literal alone when no secret is set", () => {
    expect(resolveBridgeAuth({})).toEqual({
      secret: INSIGHTS_BRIDGE_SHARED_SECRET,
      acceptLegacy: false,
    });
  });

  it("accepts the provisioned secret, and still the literal, once one is set", () => {
    expect(resolveBridgeAuth({ SKYNET_INSIGHTS_BRIDGE_SECRET: SECRET })).toEqual({
      secret: SECRET,
      acceptLegacy: true,
    });
  });
});

describe("the bridge with a provisioned secret", () => {
  const provisioned = { SKYNET_INSIGHTS_BRIDGE_SECRET: SECRET };

  it("delivers when both apps carry the secret, with no warning", async () => {
    const { warnings, restore } = captureWarnings();
    try {
      await withListener(resolveBridgeAuth(provisioned), async (base, received) => {
        const bridge = resolveInsightBridge(
          { ...provisioned, SKYNET_INSIGHTS_BRIDGE_URL: base },
          LOADED_SUITE_BRIDGE_BUDGET,
        );
        await bridge.recordInsight(record);
        expect(received).toEqual([record]);
      });
      expect(warnings).toEqual([]);
    } finally {
      restore();
    }
  });

  it("still delivers from a bots app that has no secret yet, and warns once", async () => {
    const { warnings, restore } = captureWarnings();
    try {
      await withListener(resolveBridgeAuth(provisioned), async (base, received) => {
        const bridge = resolveInsightBridge(
          { SKYNET_INSIGHTS_BRIDGE_URL: base },
          LOADED_SUITE_BRIDGE_BUDGET,
        );
        await bridge.recordInsight(record);
        await bridge.recordInsight(record);
        expect(received).toEqual([record, record]);
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("legacy bridge secret used");
    } finally {
      restore();
    }
  });

  it("refuses a wrong secret on the POST routes and on GET /controls", async () => {
    await withListener(resolveBridgeAuth(provisioned), async (base, received) => {
      const wrong = { [INSIGHTS_BRIDGE_SECRET_HEADER]: "guessed" };
      const post = await fetch(`${base}/insights`, {
        method: "POST",
        headers: wrong,
        body: JSON.stringify(record),
      });
      expect(post.status).toBe(401);
      const poll = await fetch(`${base}/controls`, { headers: wrong });
      expect(poll.status).toBe(401);
      const unauthenticated = await fetch(`${base}/decisions`, { method: "POST", body: "{}" });
      expect(unauthenticated.status).toBe(401);
      expect(received).toEqual([]);
    });
  });

  it("is refused by a dashboard that has no secret yet — so the dashboard gets it first", async () => {
    await withListener(resolveBridgeAuth({}), async (base, received) => {
      const response = await fetch(`${base}/insights`, {
        method: "POST",
        headers: { [INSIGHTS_BRIDGE_SECRET_HEADER]: SECRET },
        body: JSON.stringify(record),
      });
      expect(response.status).toBe(401);
      expect(received).toEqual([]);
    });
  });
});

describe("every bots-side bridge client", () => {
  it("sends insightsBridgeSecret(env), never the literal directly", () => {
    const dir = join(process.cwd(), "src/autonomous");
    const offenders = readdirSync(dir)
      .filter((name) => name.endsWith(".ts") && name !== "insight-record.ts")
      .filter((name) =>
        readFileSync(join(dir, name), "utf8").includes("INSIGHTS_BRIDGE_SHARED_SECRET"),
      );
    expect(offenders).toEqual([]);
  });
});
