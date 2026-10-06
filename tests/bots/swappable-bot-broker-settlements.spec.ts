import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { UnsettledOrder } from "../../src/autonomous/decision-db-settlements.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { Bot } from "../../src/bots/bot.js";
import { SwappableBotBroker } from "../../src/bots/swappable-bot-broker.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import {
  RESUME_WINDOW_MS,
  resumeWorkingOrders,
  settlementSink,
} from "../../src/scripts/autonomous-settlement-wiring.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * Restarts (#4650): the orders a run left `working` live only in memory, so a deploy used to forget
 * them — and a fill the broker made while no process watched never reached its decision. At boot the
 * decision store hands each bot's unsettled orders back to its settle loop, which reports what they
 * became exactly as it would have without the restart.
 */

const PUT = "CRWV261106P00085000";
const CID = "sk1-sauron-CRWV-k9x2-0";
const NOW = Date.parse("2026-10-08T13:35:00.000Z");
const persona: Persona = { id: "sauron", name: "Sauron", thesis: "n/a", decide: () => [] };
const bot: Bot = { persona, credentials: { apiKey: "KEY", apiSecret: "secret" } };

/** Answers by `METHOD path` (query dropped); anything unscripted is a 404. */
function fakeFetch(routes: Record<string, unknown>) {
  const seen: string[] = [];
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${new URL(String(url)).pathname}`;
    seen.push(key);
    const body = routes[key];
    return {
      status: body === undefined ? 404 : 200,
      text: async () => JSON.stringify(body ?? { message: "not found" }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fetchFn, seen };
}

async function withFetch<T>(fetchFn: typeof fetch, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = fetchFn;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

const placedWorking = (
  at: number,
  personaId: string,
  intent: OrderIntent,
  orderId: string,
): DecisionRecord => ({
  at,
  personaId,
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [{ intent, action: "placed", result: { intent, status: "working", orderId } }],
});

const queuedBuy: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "staged for the open",
};

describe("orders left working survive a restart", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "settlements-restart-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("WHEN a working order was pending at shutdown, it is still settled after boot — and only once", async () => {
    const yesterday = NOW - 20 * 3_600_000;
    db.record(
      placedWorking(yesterday, "sauron", { ...anOptionIntent(), clientOrderId: CID }, "opt-1"),
    );
    db.record(placedWorking(yesterday + 1, "beta-scout", queuedBuy, "sh-1"));
    const { fetchFn, seen } = fakeFetch({
      "GET /v2/orders/opt-1": {
        id: "opt-1",
        symbol: PUT,
        qty: "1",
        side: "sell",
        status: "filled",
        filled_qty: "1",
        filled_avg_price: "2.05",
        client_order_id: CID,
      },
      "GET /v2/orders/sh-1": {
        id: "sh-1",
        symbol: "NVDA",
        qty: "10",
        side: "buy",
        status: "filled",
        filled_qty: "10",
        filled_avg_price: "100.25",
      },
    });

    await withFetch(fetchFn, async () => {
      // A fresh process: nothing in memory, only the store.
      const broker = new SwappableBotBroker(bot, { onSettled: settlementSink(db, quiet) });
      resumeWorkingOrders(new Map([["sauron", broker]]), db, {
        scoutHost: "sauron",
        now: NOW,
        logger: quiet,
      });
      expect([...(await broker.settle())]).toEqual([]);
      await broker.settle();
    });

    const results = [...db.listByPersona("sauron"), ...db.listByPersona("beta-scout")].map(
      (r) => r.outcomes[0]?.result,
    );
    expect(results).toMatchObject([
      { status: "filled", filledQuantity: 1, filledPrice: 2.05 },
      { status: "filled", filledQuantity: 10, filledPrice: 100.25 },
    ]);
    // Each read once: the second settle had nothing left to ask about.
    expect(seen.filter((s) => s.startsWith("GET /v2/orders/"))).toEqual([
      "GET /v2/orders/sh-1",
      "GET /v2/orders/opt-1",
    ]);
    expect(db.unsettledOrders("sauron", 0)).toEqual([]);
    expect(db.recentSettlements()).toHaveLength(2);
  });
});

const quiet = { log: () => undefined, warn: () => undefined };

describe("resumeWorkingOrders", () => {
  const order = (symbol: string): UnsettledOrder => ({ orderId: symbol, symbol, option: false });

  it("hands each bot its own orders, and the beta scout's to the account it trades on", () => {
    const handed = new Map<string, UnsettledOrder[]>();
    const broker = (id: string) => ({
      resume: (orders: readonly UnsettledOrder[]) =>
        handed.set(id, [...(handed.get(id) ?? []), ...orders]),
    });
    const asked: [string, number][] = [];
    resumeWorkingOrders(
      new Map([
        ["sauron", broker("sauron")],
        ["daytrader", broker("daytrader")],
      ]),
      {
        unsettledOrders: (personaId, since) => {
          asked.push([personaId, since]);
          return personaId === "daytrader" ? [] : [order(personaId)];
        },
      },
      { scoutHost: "sauron", now: NOW, logger: quiet },
    );
    expect(asked).toEqual([
      ["sauron", NOW - RESUME_WINDOW_MS],
      ["daytrader", NOW - RESUME_WINDOW_MS],
      ["beta-scout", NOW - RESUME_WINDOW_MS],
    ]);
    expect(handed).toEqual(new Map([["sauron", [order("sauron"), order("beta-scout")]]]));
  });

  it("is dark with no store, and a failed read costs only that bot's resume", () => {
    const resumed: string[] = [];
    const brokers = new Map([
      ["sauron", { resume: () => resumed.push("sauron") }],
      ["daytrader", { resume: () => resumed.push("daytrader") }],
    ]);
    resumeWorkingOrders(brokers, undefined, { logger: quiet });
    resumeWorkingOrders(
      brokers,
      {
        unsettledOrders: (personaId) => {
          if (personaId === "sauron") throw new Error("disk");
          return [order("NVDA")];
        },
      },
      { logger: quiet },
    );
    expect(resumed).toEqual(["daytrader"]);
  });
});

describe("settlementSink", () => {
  it("is dark with no store, and never throws when the write fails", () => {
    expect(settlementSink(undefined)).toBeUndefined();
    const warnings: string[] = [];
    const sink = settlementSink(
      {
        recordSettlements: () => {
          throw new Error("SQLITE_BUSY");
        },
      },
      { log: () => undefined, warn: (line) => warnings.push(line) },
    );
    expect(() =>
      sink?.({
        orderId: "o",
        status: "filled",
        filledQuantity: 1,
        settledAt: "2026-10-08T13:35:00Z",
      }),
    ).not.toThrow();
    expect(warnings[0]).toContain("settlement write failed");
  });
});
