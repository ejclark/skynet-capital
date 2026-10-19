import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildShadowOrders, type ShadowReport } from "../../src/autonomous/authored-shadow-wire.js";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import { openBotsStateDb } from "../../src/autonomous/bots-state-db.js";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "../../src/autonomous/insight-record.js";
import { resolveSnapshotReplication } from "../../src/autonomous/snapshot-replication-client.js";
import { DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { authoredShadowWiring } from "../../src/scripts/autonomous-authored-shadow.js";
import { bridgeReplication } from "../../src/scripts/autonomous-bridge-replication.js";
import { AuthoredPlayStore } from "../../src/server/authored-play-store.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { aSpec, at, CALENDAR } from "../support/authored-shadow.js";
import { LOADED_SUITE_BRIDGE_BUDGET } from "../support/bridge-budget.js";
import { aContext } from "../support/builders.js";

/**
 * THE SHADOW TEST, ACROSS THE WHOLE BRIDGE (#5457 slice 2), over a real socket: a member's draft in
 * the app's store → folded into `GET /controls` → read by the bots' client → run by the pass → the
 * report posted back to `/authored-shadow` → what the member's row would show. Each half worked in
 * its own unit; this is the proof that they connect, and that a bots restart keeps the ledger.
 */

const CONTROLS: ControlsState = { bots: {} };
const quiet = { log: () => undefined, warn: () => undefined };

describe("the shadow test, end to end", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "skynet-shadow-bridge-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function withApp(
    store: AuthoredPlayStore | undefined,
    onReport: (r: ShadowReport) => void,
    run: (base: string) => Promise<void>,
  ): Promise<void> {
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      controls: () => CONTROLS,
      ...(store ? { authoredShadowOrders: () => buildShadowOrders(store.load(), Date.now()) } : {}),
      authoredShadow: { accept: onReport },
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      await run(`http://127.0.0.1:${port}`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  it("carries a draft into its test, the bots' would-be trade back, and a restart loses nothing", async () => {
    const store = new AuthoredPlayStore(join(dir, "authored-plays.json"));
    store.save("member-a", "AMD run-up", aSpec());
    const reports: ShadowReport[] = [];
    const dbPath = join(dir, "bots.db");

    await withApp(
      store,
      (r) => reports.push(r),
      async (base) => {
        const env = { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv;
        const db = openBotsStateDb(dbPath);
        const wiring = authoredShadowWiring(quiet);
        const client = resolveBotControls(
          env,
          undefined,
          undefined,
          undefined,
          (orders) => wiring.accept(orders),
          undefined,
          LOADED_SUITE_BRIDGE_BUDGET,
        );
        let publish: (() => ShadowReport) | undefined;
        const pass = wiring.arm({
          risk: DEFAULT_RISK_CONFIG,
          blockedReason: () => null,
          botsStateDb: db,
          publish: (get) => {
            publish = get;
          },
          calendar: CALENDAR,
        });
        const send = resolveSnapshotReplication(env, "/authored-shadow", "authored-shadow", () =>
          publish?.(),
        );
        wiring.observe(["futurist"], [{ cash: 100_000, positions: [] }]);

        // A draft is not in its test: the poll carries an empty set and nothing is watched.
        await client.fetchOnce();
        pass(aContext({ AMD: { last: 100 } }, at("2026-10-20")));
        await send.send();
        expect(reports.at(-1)?.plays).toEqual([]);

        // The member starts the test; one poll later the bots have it and the next pass records.
        store.setShadow("member-a", "U-futurist-amd-run-up", true);
        await client.fetchOnce();
        pass(aContext({ AMD: { last: 100 } }, at("2026-10-20")));
        await send.send();
        expect(reports.at(-1)?.plays[0]).toMatchObject({
          id: "U-futurist-amd-run-up",
          state: "watching",
          sessions: 1,
          tradeCount: 1,
          recent: [{ side: "buy", symbol: "AMD", quantity: 19 }],
        });
        db.close();

        // The bots restart: a fresh process opens the same volume and the same ledger is there
        // before any poll has landed.
        const reopened = openBotsStateDb(dbPath);
        const again = authoredShadowWiring(quiet);
        let after: (() => ShadowReport) | undefined;
        again.arm({
          risk: DEFAULT_RISK_CONFIG,
          blockedReason: () => null,
          botsStateDb: reopened,
          publish: (get) => {
            after = get;
          },
          calendar: CALENDAR,
        });
        expect(after?.().plays[0]).toMatchObject({ tradeCount: 1, sessions: 1 });
        reopened.close();

        // The member takes the play out of its test; the next poll drops the ledger.
        store.setShadow("member-a", "U-futurist-amd-run-up", false);
        await client.fetchOnce();
        await send.send();
        expect(reports.at(-1)?.plays).toEqual([]);
      },
    );
  });

  it("an app that predates the field leaves the bots' tests as they were", async () => {
    await withApp(
      undefined,
      () => undefined,
      async (base) => {
        const got: unknown[] = [];
        const client = resolveBotControls(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          undefined,
          undefined,
          undefined,
          (orders) => got.push(orders),
          undefined,
          LOADED_SUITE_BRIDGE_BUDGET,
        );
        await client.fetchOnce();
        expect(got).toEqual([]);
      },
    );
  });

  it("refuses a report that is unauthenticated or malformed, and 404s when not wired", async () => {
    const got: ShadowReport[] = [];
    await withApp(
      undefined,
      (r) => got.push(r),
      async (base) => {
        const post = (body: unknown, auth = true) =>
          fetch(`${base}/authored-shadow`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(auth ? { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET } : {}),
            },
            body: JSON.stringify(body),
          });
        expect((await post({ kind: "authored-shadow.v1", at: 1, plays: [] }, false)).status).toBe(
          401,
        );
        expect((await post({ kind: "nope" })).status).toBe(400);
        expect(
          (await post({ kind: "authored-shadow.v1", at: 1, plays: [{ id: "x" }] })).status,
        ).toBe(400);
        expect((await post({ kind: "authored-shadow.v1", at: 1, plays: [] })).status).toBe(200);
      },
    );
    expect(got).toHaveLength(1);

    const bare = createInsightsListener({ record: () => Promise.resolve() });
    await new Promise<void>((resolve) => bare.listen(0, resolve));
    const { port } = bare.address() as AddressInfo;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/authored-shadow`, {
        method: "POST",
        headers: { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET },
        body: "{}",
      });
      expect(res.status).toBe(404);
    } finally {
      await new Promise<void>((resolve) => bare.close(() => resolve()));
    }
  });

  it("the sender is dark without a bridge URL and sends nothing while there is no report", async () => {
    let reads = 0;
    await resolveSnapshotReplication({}, "/authored-shadow", "authored-shadow", () => {
      reads++;
      return { kind: "x" };
    }).send();
    expect(reads).toBe(0);
  });

  it("rides the bots' /controls poll: the poll hook posts the report once the runner is armed", async () => {
    const got: ShadowReport[] = [];
    await withApp(
      undefined,
      (r) => got.push(r),
      async (base) => {
        const replication = bridgeReplication(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          () => undefined,
        );
        replication.onPoll({});
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(got).toEqual([]); // nothing registered yet: nothing sent

        replication.publishAuthoredShadow(() => ({
          kind: "authored-shadow.v1",
          at: 7,
          plays: [],
        }));
        replication.onPoll({});
        for (let i = 0; i < 40 && got.length === 0; i++) {
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        expect(got[0]).toMatchObject({ at: 7 });
      },
    );
  });
});
