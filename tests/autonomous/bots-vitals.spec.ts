import type { AddressInfo } from "node:net";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import { openBotsHealthFile } from "../../src/autonomous/bots-health-file.js";
import {
  type BotsVitals,
  CONTROLS_BOT_VITALS_HEADER,
  controlsPollVitalsHeaders,
  MAX_VITALS_BOTS,
  parseControlsPollVitals,
} from "../../src/autonomous/bots-vitals-wire.js";
import type { ControlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { LOADED_SUITE_BRIDGE_BUDGET } from "../support/bridge-budget.js";

/**
 * #4220 (slice 1 of #1307): the bots process's pulse reaches the dashboard on the `/controls` poll
 * it already makes. The property worth proving is the done-when itself — after a poll completes,
 * the next one (≤ 30s later) carries sha · booted at · bridge · last poll · last tick · last eval ·
 * last order to the app — plus the fail-closed reads: anything malformed is "no vitals", never a
 * partial pulse that would read as health nobody asserted.
 */

const SHA = "9a1b2c3d4e5f60000000000000000000000000ab";

async function withReportingBridge(
  run: (base: string, reports: ControlsPollReport[]) => Promise<void>,
): Promise<void> {
  const reports: ControlsPollReport[] = [];
  const server = createInsightsListener({
    record: () => Promise.resolve(),
    controls: () => ({ bots: {} }),
    onControlsPoll: (report) => reports.push(report),
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`, reports);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const at = (iso: string) => Date.parse(iso);
const placed = [{ action: "placed" }];
const observed = [{ action: "observed" }];

describe("bots vitals on the controls poll (#4220)", () => {
  it("WHEN a controls poll completes, the next poll carries the full pulse to the dashboard", async () => {
    await withReportingBridge(async (base, reports) => {
      let nowIso = "2026-11-24T14:30:00.000Z";
      const health = openBotsHealthFile(undefined, SHA, () => new Date(nowIso));
      // Wired exactly as bootMissionControl wires it: the poll hook stamps, the client reads.
      const controls = resolveBotControls(
        { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
        () => health.controlsFetched(),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        LOADED_SUITE_BRIDGE_BUDGET,
      );
      controls.reportVitals(() => health.vitals());

      await controls.fetchOnce(); // the boot fetch: no bridge verdict yet, so no vitals
      health.boot(controls.enabled);
      expect(reports[0]?.vitals).toBeUndefined();

      nowIso = "2026-11-24T14:30:05.000Z";
      health.ticked();
      health.decided({ at: at("2026-11-24T14:30:06.000Z"), personaId: "sauron", outcomes: placed });
      health.decided({ at: at("2026-11-24T14:30:07.000Z"), personaId: "banker", outcomes: [] });
      nowIso = "2026-11-24T14:30:30.000Z";
      await controls.fetchOnce(); // the next poll, one interval later

      expect(reports[1]?.vitals).toEqual({
        gitSha: SHA,
        bootedAt: "2026-11-24T14:30:00.000Z",
        bridge: "armed",
        lastControlsPollAt: "2026-11-24T14:30:00.000Z",
        lastTickAt: "2026-11-24T14:30:05.000Z",
        lastEvalAt: "2026-11-24T14:30:07.000Z",
        lastOrderAt: "2026-11-24T14:30:06.000Z",
        bots: [
          { id: "banker", lastEvalAt: "2026-11-24T14:30:07.000Z", lastOrderAt: null },
          {
            id: "sauron",
            lastEvalAt: "2026-11-24T14:30:06.000Z",
            lastOrderAt: "2026-11-24T14:30:06.000Z",
          },
        ],
      } satisfies BotsVitals);
    });
  });

  it("never fails the poll when the vitals source throws — it just sends none", async () => {
    await withReportingBridge(async (base, reports) => {
      const controls = resolveBotControls(
        { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        LOADED_SUITE_BRIDGE_BUDGET,
      );
      controls.reportVitals(() => {
        throw new Error("source broke");
      });
      expect(await controls.fetchOnce()).toEqual({ bots: {} });
      expect(reports).toEqual([{}]);
    });
  });

  it("is a safe no-op on the disabled client", () => {
    const client = resolveBotControls({} as NodeJS.ProcessEnv);
    expect(() => client.reportVitals(() => undefined)).not.toThrow();
  });
});

describe("the health record's pulse", () => {
  it("keeps a bot's last order when later cycles only watch", () => {
    const health = openBotsHealthFile(undefined, null);
    health.boot(true);
    health.decided({ at: at("2026-11-24T14:00:00Z"), personaId: "sauron", outcomes: placed });
    health.decided({ at: at("2026-11-24T14:05:00Z"), personaId: "sauron", outcomes: observed });
    expect(health.vitals()?.bots).toEqual([
      {
        id: "sauron",
        lastEvalAt: "2026-11-24T14:05:00.000Z",
        lastOrderAt: "2026-11-24T14:00:00.000Z",
      },
    ]);
  });

  it("never moves a mark backwards when a late record arrives out of order", () => {
    const health = openBotsHealthFile(undefined, null);
    health.boot(true);
    health.decided({ at: at("2026-11-24T14:05:00Z"), personaId: "sauron", outcomes: placed });
    health.decided({ at: at("2026-11-24T14:00:00Z"), personaId: "sauron", outcomes: placed });
    expect(health.vitals()).toMatchObject({
      lastEvalAt: "2026-11-24T14:05:00.000Z",
      lastOrderAt: "2026-11-24T14:05:00.000Z",
    });
  });

  it("reports nothing until the boot verdict is in, and an honest empty pulse after", () => {
    const health = openBotsHealthFile(undefined, null, () => new Date("2026-11-24T14:00:00Z"));
    expect(health.vitals()).toBeUndefined();
    health.boot(false);
    expect(health.vitals()).toEqual({
      gitSha: null,
      bootedAt: "2026-11-24T14:00:00.000Z",
      bridge: "unset",
      lastControlsPollAt: null,
      lastTickAt: null,
      lastEvalAt: null,
      lastOrderAt: null,
      bots: [],
    });
  });

  it("keeps the most recently evaluated bots when the roster passes the cap, so it still reads", () => {
    const health = openBotsHealthFile(undefined, null);
    health.boot(true);
    for (let i = 0; i <= MAX_VITALS_BOTS; i += 1) {
      health.decided({ at: 1_000 + i, personaId: `bot-${i}`, outcomes: [] });
    }
    const vitals = health.vitals();
    expect(vitals?.bots).toHaveLength(MAX_VITALS_BOTS);
    expect(vitals?.bots.map((b) => b.id)).not.toContain("bot-0"); // the stalest one drops
    expect(parseControlsPollVitals(controlsPollVitalsHeaders(vitals))).toEqual(vitals);
  });
});

describe("parseControlsPollVitals — fail-closed", () => {
  const good: BotsVitals = {
    gitSha: SHA,
    bootedAt: "2026-11-24T14:00:00.000Z",
    bridge: "armed",
    lastControlsPollAt: "2026-11-24T14:00:30.000Z",
    lastTickAt: null,
    lastEvalAt: null,
    lastOrderAt: null,
    bots: [{ id: "sauron", lastEvalAt: null, lastOrderAt: null }],
  };
  const encode = (value: unknown) => ({
    [CONTROLS_BOT_VITALS_HEADER]: Buffer.from(JSON.stringify(value), "utf8").toString("base64"),
  });

  it("round-trips a clean pulse", () => {
    expect(parseControlsPollVitals(controlsPollVitalsHeaders(good))).toEqual(good);
  });

  it("sends a GIT_SHA that is not a sha as unknown, keeping the rest of the pulse", () => {
    const parsed = parseControlsPollVitals(controlsPollVitalsHeaders({ ...good, gitSha: "v1.2" }));
    expect(parsed).toEqual({ ...good, gitSha: null });
  });

  it("drops any field it does not know, so nothing beyond status can ride along", () => {
    const parsed = parseControlsPollVitals(
      encode({ ...good, secret: "sk-live", bots: [{ ...good.bots[0], accountId: "PA123" }] }),
    );
    expect(parsed).toEqual(good);
  });

  it.each([
    ["no header", {}],
    ["garbled base64", { [CONTROLS_BOT_VITALS_HEADER]: "%%%" }],
    ["a sha that is not a sha", encode({ ...good, gitSha: "main; rm -rf" })],
    ["an unknown bridge verdict", encode({ ...good, bridge: "fine" })],
    ["a timestamp that is not a date", encode({ ...good, lastTickAt: "yesterday-ish" })],
    ["no booted-at", encode({ ...good, bootedAt: null })],
    ["a bot with no id", encode({ ...good, bots: [{ lastEvalAt: null, lastOrderAt: null }] })],
    [
      "more bots than the cap",
      encode({
        ...good,
        bots: Array.from({ length: MAX_VITALS_BOTS + 1 }, (_, i) => ({
          id: `b${i}`,
          lastEvalAt: null,
          lastOrderAt: null,
        })),
      }),
    ],
  ])("reads %s as no vitals at all", (_label, headers) => {
    expect(parseControlsPollVitals(headers as NodeJS.Dict<string>)).toBeUndefined();
  });
});
