import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { rememberPlaybooks } from "../../src/observatory/activity-filter.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";

/**
 * #8397: since #8254 every signed-in member's read of a bot's Activity builds the playbook chip list,
 * which asks the decision store about EVERY order in the ledger — at 180 days about 16k whole decision
 * records per `no-store` request, for every member who opens the tab. The playbook an order was placed
 * under never changes once found, so the server remembers it (`rememberPlaybooks`, wired in
 * `serve-dashboard.ts` as `playbookOfOrder`): the first read pays for the ledger, every later read only
 * for what it has not seen.
 */

const ORDERS = 2000;

const bot = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [],
  activity: [],
};

const fill = (i: number): TradeActivityRecord => ({
  orderId: `o-${i}`,
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  price: 180,
  status: "filled",
  at: new Date(Date.parse("2026-06-01T15:00:00.000Z") + i * 60_000).toISOString(),
  source: "stream",
});

const ledger = Array.from({ length: ORDERS }, (_, i) => fill(i));

/** A decision store that counts its joins; every order was placed by one of two playbooks. */
function countingStore() {
  const store = {
    calls: 0,
    find: (orderId: string) => {
      store.calls += 1;
      const intent: OrderIntent = {
        symbol: "NVDA",
        side: "buy",
        quantity: 1,
        type: "market",
        playbookId: Number(orderId.slice(2)) % 2 === 0 ? "S1-NVDA" : "E1-NVDA",
        reason: "test",
      };
      const record: DecisionRecord = {
        at: Date.parse("2026-06-01T15:00:00.000Z"),
        personaId: "sauron",
        mode: "live",
        rawIntents: [intent],
        guardedIntents: [intent],
        outcomes: [
          {
            intent,
            action: "placed",
            result: { intent, status: "filled", orderId, filledQuantity: 1 },
          },
        ],
      };
      return { record, intent };
    },
  };
  return store;
}

interface Page {
  activity: { orderId: string }[];
  playbooks?: string[];
}

describe("a bot's Activity chip list, remembered across reads (#8397)", () => {
  const read = async (config: DashboardServerConfig, who: string): Promise<Page> => {
    let body = "";
    const res = {
      writeHead: () => res,
      end: (text?: string) => {
        body = text ?? "";
      },
    } as unknown as ServerResponse;
    const path = "/api/desk/sauron/activity";
    await serveDeskJson(res, path, path, config, { email: who, provider: "google", exp: 0 });
    return JSON.parse(body) as Page;
  };

  const configFor = (store: ReturnType<typeof countingStore>) =>
    ({
      hub: { getState: () => ({ generatedAt: "t", participants: [bot], collisions: [] }) },
      auth: {} as never,
      resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
      readTradeActivity: async () => ledger,
      findByOrderId: store.find,
      playbookOfOrder: rememberPlaybooks(store.find, () => "mark-1"),
    }) as unknown as DashboardServerConfig;

  it("asks about only the page's orders once a member's first read has folded the ledger", async () => {
    const store = countingStore();
    const config = configFor(store);
    const first = await read(config, "guest@x");
    expect(first.playbooks).toEqual(["E1-NVDA", "S1-NVDA"]);

    store.calls = 0;
    const second = await read(config, "guest@x");
    expect(second.playbooks).toEqual(["E1-NVDA", "S1-NVDA"]);
    // The page's own decisions are still read whole (30 rows); the chip list asks nothing new.
    expect(store.calls).toBeLessThanOrEqual(second.activity.length * 3);
  });

  it("shares what one viewer's read found with the next viewer's, owner or not", async () => {
    const store = countingStore();
    const config = configFor(store);
    await read(config, "owner@x");
    store.calls = 0;
    const page = await read(config, "guest@x");
    expect(store.calls).toBeLessThanOrEqual(page.activity.length * 3);
  });
});

describe("rememberPlaybooks", () => {
  const intent = (playbookId?: string) => ({ intent: playbookId ? { playbookId } : {} });

  it("keeps a hit for good, a decision that named no playbook included", () => {
    let calls = 0;
    const of = rememberPlaybooks((id) => {
      calls += 1;
      return id === "a" ? intent("S1-NVDA") : intent();
    });
    expect([of("a"), of("a"), of("b"), of("b")]).toEqual([
      "S1-NVDA",
      "S1-NVDA",
      undefined,
      undefined,
    ]);
    expect(calls).toBe(2);
  });

  it("keeps a miss only until the join mark moves, so a late decision is found", async () => {
    let mark = "1";
    let stored = false;
    let calls = 0;
    const of = rememberPlaybooks(
      () => {
        calls += 1;
        return stored ? intent("E1-NVDA") : undefined;
      },
      () => mark,
    );
    expect(of("late")).toBeUndefined();
    await Promise.resolve();
    expect(of("late")).toBeUndefined();
    expect(calls).toBe(1);

    stored = true;
    mark = "2";
    await Promise.resolve();
    expect(of("late")).toBe("E1-NVDA");
    expect(calls).toBe(2);
  });

  it("keeps no miss when no join mark is wired", () => {
    let calls = 0;
    const of = rememberPlaybooks(() => {
      calls += 1;
      return undefined;
    });
    of("x");
    of("x");
    expect(calls).toBe(2);
  });
});
