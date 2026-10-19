import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import { buildConvictionsWire } from "../../src/autonomous/convictions-wire.js";
import { buildSubscriptionsSnapshot } from "../../src/autonomous/subscriptions-wire.js";
import { convictionsHolder } from "../../src/scripts/autonomous-convictions.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { MemberConvictionStore } from "../../src/server/member-conviction-store.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * THE MEMBERS' CONVICTIONS, ACROSS THE BRIDGE (#5482 slice 6c), over a real socket: the app's file
 * → `GET /controls` → the bots' client → the holder a roster resolves pointers against. Only a view
 * handed over crosses, it resolves on its own accounts only, and it lands BEFORE the subscriptions
 * on the same poll, so a roster built from them already holds it.
 */

const CONTROLS: ControlsState = { bots: {} };
const STAMP = "2026-10-19T15:00:00.000Z";

describe("members' convictions over the bridge", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "skynet-convictions-bridge-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function withApp(
    extra: Parameters<typeof createInsightsListener>[0],
    run: (base: string) => Promise<void>,
  ) {
    const server = createInsightsListener(extra);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      await run(`http://127.0.0.1:${port}`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  it("a draft crosses as nothing; a handed-over view crosses, before the subscriptions, for its own bots", async () => {
    const path = join(dir, "member-convictions.json");
    const draft = aMemberConviction({ id: "a-draft" });
    const handed = aMemberConviction();
    writeFileSync(
      path,
      JSON.stringify({
        ada: [
          { status: "draft", conviction: draft, createdAt: STAMP, updatedAt: STAMP },
          {
            status: "steering",
            conviction: handed,
            accounts: ["futurist"],
            createdAt: STAMP,
            updatedAt: STAMP,
          },
        ],
      }),
    );
    const store = new MemberConvictionStore(path);
    const order: string[] = [];
    await withApp(
      {
        record: () => Promise.resolve(),
        controls: () => CONTROLS,
        subscriptions: () => buildSubscriptionsSnapshot({}, Date.now()),
        convictions: () => buildConvictionsWire(store.handedOver(), Date.now()),
      },
      async (base) => {
        const holder = convictionsHolder(() => undefined);
        const client = resolveBotControls(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          undefined,
          undefined,
          () => order.push("subscriptions"),
          undefined,
          undefined,
          (wire) => {
            order.push("convictions");
            holder.accept(wire);
          },
        );
        await client.fetchOnce();
        expect(order).toEqual(["convictions", "subscriptions"]);
        expect(holder.lookupFor("futurist")(handed.id)).toEqual(handed);
        expect(holder.lookupFor("dragon")(handed.id)).toBeUndefined();
        expect(holder.lookupFor("futurist")(draft.id)).toBeUndefined();
      },
    );
  });

  it("an app that predates the field leaves what the bots had", async () => {
    await withApp({ record: () => Promise.resolve(), controls: () => CONTROLS }, async (base) => {
      const holder = convictionsHolder(() => undefined);
      holder.accept(
        buildConvictionsWire([{ conviction: aMemberConviction(), accounts: ["futurist"] }], 1),
      );
      let fired = 0;
      const client = resolveBotControls(
        { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        () => fired++,
      );
      await client.fetchOnce();
      expect(fired).toBe(0);
      expect(holder.lookupFor("futurist")(aMemberConviction().id)).toBeDefined();
    });
  });

  it("a hook that throws never costs the hooks after it on the same poll", async () => {
    await withApp(
      {
        record: () => Promise.resolve(),
        controls: () => CONTROLS,
        subscriptions: () => buildSubscriptionsSnapshot({}, Date.now()),
        convictions: () => buildConvictionsWire([], Date.now()),
      },
      async (base) => {
        let subscriptions = 0;
        const client = resolveBotControls(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          undefined,
          undefined,
          () => subscriptions++,
          undefined,
          undefined,
          () => {
            throw new Error("boom");
          },
        );
        expect(await client.fetchOnce()).toEqual(CONTROLS);
        expect(subscriptions).toBe(1);
      },
    );
  });

  it("says so when the dashboard sends a set the bots cannot read whole, and keeps the last one", async () => {
    await withApp(
      {
        record: () => Promise.resolve(),
        controls: () => CONTROLS,
        convictions: () =>
          ({ ...buildConvictionsWire([], Date.now()), records: "garbled" }) as never,
      },
      async (base) => {
        const warned: string[] = [];
        const emit = process.emitWarning;
        process.emitWarning = ((line: string) => warned.push(line)) as typeof process.emitWarning;
        try {
          let fired = 0;
          const client = resolveBotControls(
            { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            () => fired++,
          );
          await client.fetchOnce();
          expect(fired).toBe(0);
          expect(warned).toEqual([expect.stringMatching(/did not read whole/)]);
        } finally {
          process.emitWarning = emit;
        }
      },
    );
  });
});
