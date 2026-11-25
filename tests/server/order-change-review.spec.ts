import { AlpacaApiError } from "../../src/alpaca/alpaca-api-error.js";
import type { AlpacaOrder, AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { Session } from "../../src/server/auth/session.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  mayGrow,
  orderActionRefusal,
  replaceRefusal,
  reviewOrderChange,
} from "../../src/server/order-change-review.js";

/**
 * The change re-check between "Send change" on a working order and the broker's PATCH: the
 * identity gate (`orderActionRefusal`), the broker-error sentence (`replaceRefusal`), and the
 * re-review of the order as changed (`reviewOrderChange`). The governing principle — a change that
 * only shrinks an order is never refused — is pinned from several angles below.
 */

const ann: Session = { email: "ann@example.com", provider: "github", exp: 9_999_999_999_999 };

const configWith = (overrides: Record<string, unknown> = {}): DashboardServerConfig =>
  ({
    tradingEnabled: true,
    auth: {},
    resolveOwnerIds: (email: string) => (email === ann.email ? ["ann-1"] : []),
    ...overrides,
  }) as unknown as DashboardServerConfig;

const anOrder = (overrides: Partial<AlpacaOrder> = {}): AlpacaOrder => ({
  id: "ord-1",
  symbol: "QQQ",
  qty: "10",
  side: "buy",
  status: "new",
  type: "limit",
  limit_price: "400",
  ...overrides,
});

const aBrokerPosition = (symbol: string, qty: number, price = 100) => ({
  symbol,
  qty: String(qty),
  avg_entry_price: String(price),
  market_value: String(qty * price),
  lastday_price: String(price),
});

interface BrokerFakes {
  order?: AlpacaOrder | Error;
  cash?: string;
  positions?: ReturnType<typeof aBrokerPosition>[];
  accountError?: Error;
}

/** A trading client that records which reads it served, so a skipped read is observable. */
function fakeBroker(fakes: BrokerFakes = {}) {
  const reads: string[] = [];
  const client = {
    getOrder: () => {
      reads.push("order");
      const order = fakes.order ?? anOrder();
      return order instanceof Error ? Promise.reject(order) : Promise.resolve(order);
    },
    getAccount: () => {
      reads.push("account");
      return fakes.accountError
        ? Promise.reject(fakes.accountError)
        : Promise.resolve({ id: "ann", cash: fakes.cash ?? "100000", status: "ACTIVE" });
    },
    getPositions: () => {
      reads.push("positions");
      return Promise.resolve(fakes.positions ?? []);
    },
  } as unknown as AlpacaTradingClient;
  return { client, reads };
}

const change = (extra: Record<string, unknown> = {}) => ({
  participantId: "ann-1",
  orderId: "ord-1",
  ...extra,
});

describe("orderActionRefusal — submit's identity gate for cancel and replace", () => {
  describe("when trading is switched off for the deployment", () => {
    it("refuses first, even for the owner of the account", () => {
      const config = configWith({ tradingEnabled: false });
      expect(orderActionRefusal("ann-1", config, ann)).toBe(
        "Trading is switched off for this deployment.",
      );
    });
  });

  describe("when no sign-in is configured (open mode)", () => {
    it("refuses everyone, so no caller can change or cancel any account's orders", () => {
      const config = configWith({ auth: undefined });
      expect(orderActionRefusal("ann-1", config, ann)).toBe("You can only trade your own account.");
      expect(orderActionRefusal("ann-1", config, undefined)).toBe(
        "You can only trade your own account.",
      );
    });
  });

  describe("when sign-in is configured", () => {
    it("lets a session act on an account it owns", () => {
      expect(orderActionRefusal("ann-1", configWith(), ann)).toBeUndefined();
    });

    it("refuses an account the session does not own", () => {
      expect(orderActionRefusal("bob-1", configWith(), ann)).toBe(
        "You can only trade your own account.",
      );
    });

    it("refuses a request with no session at all", () => {
      expect(orderActionRefusal("ann-1", configWith(), undefined)).toBe(
        "You can only trade your own account.",
      );
    });

    it("lets a session that owns several accounts act on any of them", () => {
      const config = configWith({ resolveOwnerIds: () => ["ann-1", "ann-bot"] });
      expect(orderActionRefusal("ann-bot", config, ann)).toBeUndefined();
    });
  });
});

describe("replaceRefusal — only the broker's own sentence reaches the member", () => {
  describe("when the broker says the order is gone (404)", () => {
    it("says the order is no longer on the broker", () => {
      expect(replaceRefusal(new AlpacaApiError(404, { message: "order not found" }))).toBe(
        "That order isn't on the broker any more.",
      );
    });
  });

  describe("when the broker rejects the change (422 or 403)", () => {
    it("relays the broker's reason", () => {
      expect(replaceRefusal(new AlpacaApiError(422, { message: "limit price too far" }))).toBe(
        "The broker couldn't change this order: limit price too far",
      );
      expect(replaceRefusal(new AlpacaApiError(403, { message: "not allowed" }))).toBe(
        "The broker couldn't change this order: not allowed",
      );
    });

    it("ends the sentence cleanly when the broker gave no usable reason", () => {
      expect(replaceRefusal(new AlpacaApiError(422, {}))).toBe(
        "The broker couldn't change this order.",
      );
      expect(replaceRefusal(new AlpacaApiError(403, null))).toBe(
        "The broker couldn't change this order.",
      );
      expect(replaceRefusal(new AlpacaApiError(422, { message: "" }))).toBe(
        "The broker couldn't change this order.",
      );
    });
  });

  describe("when the broker fails some other way", () => {
    it("relays the reason when there is one", () => {
      expect(replaceRefusal(new AlpacaApiError(500, { message: "upstream hiccup" }))).toBe(
        "The broker refused the change: upstream hiccup",
      );
    });

    it("falls back to a fixed line when there is none", () => {
      expect(replaceRefusal(new AlpacaApiError(500, { message: 42 }))).toBe(
        "The broker refused the change.",
      );
      expect(replaceRefusal(new AlpacaApiError(502, null))).toBe("The broker refused the change.");
    });
  });

  describe("when the failure is not the broker's (a transport throw)", () => {
    it("collapses to a fixed line that carries no internals", () => {
      const refusal = replaceRefusal(new Error("connect ECONNREFUSED 10.0.0.7:443"));
      expect(refusal).toBe("Couldn't reach the broker to change this order. Try again shortly.");
      expect(refusal).not.toContain("10.0.0.7");
      expect(replaceRefusal("a bare string")).toBe(refusal);
    });
  });
});

describe("mayGrow — could this change raise what the order commits?", () => {
  describe("when the quantity rises", () => {
    it("says yes for a buy and for a sell", () => {
      expect(mayGrow(anOrder(), { ...change(), quantity: 11 })).toBe(true);
      expect(mayGrow(anOrder({ side: "sell" }), { ...change(), quantity: 11 })).toBe(true);
    });
  });

  describe("when the quantity falls or stays", () => {
    it("says no for a sell, whatever the price does", () => {
      const sell = anOrder({ side: "sell" });
      expect(mayGrow(sell, { ...change(), quantity: 5 })).toBe(false);
      expect(mayGrow(sell, { ...change(), limitPrice: 999 })).toBe(false);
    });

    it("says no for a buy at a lower limit", () => {
      expect(mayGrow(anOrder(), { ...change(), limitPrice: 390 })).toBe(false);
      expect(mayGrow(anOrder(), { ...change(), quantity: 5 })).toBe(false);
    });
  });

  describe("when a buy's price rises", () => {
    it("says yes for a higher limit", () => {
      expect(mayGrow(anOrder(), { ...change(), limitPrice: 410 })).toBe(true);
    });

    it("says yes for a higher stop trigger on a stop order", () => {
      const stop = anOrder({ type: "stop", limit_price: null, stop_price: "50" });
      expect(mayGrow(stop, { ...change(), stopPrice: 55 })).toBe(true);
      expect(mayGrow(stop, { ...change(), stopPrice: 45 })).toBe(false);
    });
  });

  describe("when the order commits no known price (a queued market buy)", () => {
    it("cannot rule growth out, so it says yes", () => {
      const market = anOrder({ type: "market", limit_price: null, stop_price: null });
      expect(mayGrow(market, { ...change(), quantity: 10 })).toBe(true);
    });
  });
});

describe("reviewOrderChange — the order as changed, against the live account", () => {
  describe("when the order cannot be read", () => {
    it("answers the broker's sentence instead of throwing", async () => {
      const { client } = fakeBroker({ order: new AlpacaApiError(404, { message: "gone" }) });
      expect(await reviewOrderChange(client, change({ quantity: 5 }), configWith(), ann)).toEqual([
        "That order isn't on the broker any more.",
      ]);
    });

    it("collapses a transport failure to the fixed line", async () => {
      const { client } = fakeBroker({ order: new Error("socket hang up") });
      expect(await reviewOrderChange(client, change(), configWith(), ann)).toEqual([
        "Couldn't reach the broker to change this order. Try again shortly.",
      ]);
    });
  });

  describe("when the order is an options order", () => {
    it("passes an OCC-symbol order on the identity gate alone, without reading the account", async () => {
      const { client, reads } = fakeBroker({
        order: anOrder({ symbol: "AAPL260116C00200000", qty: "1", limit_price: "2.5" }),
        cash: "1",
      });
      expect(
        await reviewOrderChange(client, change({ quantity: 50, limitPrice: 9 }), configWith(), ann),
      ).toEqual([]);
      expect(reads).toEqual(["order"]);
    });

    it("passes a multi-leg parent the same way", async () => {
      const { client, reads } = fakeBroker({
        order: anOrder({ order_class: "mleg", symbol: "", qty: "1" }),
      });
      expect(await reviewOrderChange(client, change({ quantity: 9 }), configWith(), ann)).toEqual(
        [],
      );
      expect(reads).toEqual(["order"]);
    });
  });

  describe("when the change only shrinks the order", () => {
    it("is never refused, and never reads the account", async () => {
      const { client, reads } = fakeBroker({ cash: "0" });
      expect(
        await reviewOrderChange(
          client,
          change({ quantity: 5, limitPrice: 350 }),
          configWith(),
          ann,
        ),
      ).toEqual([]);
      expect(reads).toEqual(["order"]);
    });

    it("is not stopped by a locked ladder rung", async () => {
      const progression = {
        view: async () => ({ wheels: true, unlocked: new Set(), ladderGate: "first-message" }),
      };
      const { client } = fakeBroker();
      expect(
        await reviewOrderChange(
          client,
          change({ limitPrice: 300 }),
          configWith({ progression }),
          ann,
        ),
      ).toEqual([]);
    });
  });

  describe("when a working sell is raised", () => {
    const sell = anOrder({ symbol: "AAPL", side: "sell", qty: "5", limit_price: "200" });

    it("refuses a quantity past the shares held", async () => {
      const { client } = fakeBroker({ order: sell, positions: [aBrokerPosition("AAPL", 8)] });
      const refusals = await reviewOrderChange(client, change({ quantity: 10 }), configWith(), ann);
      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain("You hold 8 shares");
      expect(refusals[0]).toContain("short");
    });

    it("refuses when the account holds none of the symbol", async () => {
      const { client } = fakeBroker({ order: sell, positions: [aBrokerPosition("MSFT", 50)] });
      expect(await reviewOrderChange(client, change({ quantity: 6 }), configWith(), ann)).toEqual([
        "You don't hold this symbol — this account doesn't open short positions.",
      ]);
    });

    it("passes a quantity up to exactly the shares held", async () => {
      const { client } = fakeBroker({ order: sell, positions: [aBrokerPosition("AAPL", 8)] });
      expect(await reviewOrderChange(client, change({ quantity: 8 }), configWith(), ann)).toEqual(
        [],
      );
    });

    it("matches the held symbol whatever the case the broker echoes", async () => {
      const lower = anOrder({ symbol: "aapl", side: "sell", qty: "5", limit_price: "200" });
      const { client } = fakeBroker({ order: lower, positions: [aBrokerPosition("AAPL", 8)] });
      expect(await reviewOrderChange(client, change({ quantity: 7 }), configWith(), ann)).toEqual(
        [],
      );
    });
  });

  describe("when a working buy is raised", () => {
    it("refuses a limit raise whose cost exceeds the cash on hand", async () => {
      // 10 shares at 450 = 4,500 against 4,400 of cash.
      const { client } = fakeBroker({ cash: "4400" });
      const refusals = await reviewOrderChange(
        client,
        change({ limitPrice: 450 }),
        configWith(),
        ann,
      );
      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain("more than your available cash");
    });

    it("passes a raise the cash covers", async () => {
      const { client } = fakeBroker({ cash: "5000" });
      expect(
        await reviewOrderChange(client, change({ limitPrice: 450 }), configWith(), ann),
      ).toEqual([]);
    });

    it("costs a larger quantity at the new price", async () => {
      // 20 shares at 400 = 8,000 against 7,000.
      const { client } = fakeBroker({ cash: "7000" });
      const refusals = await reviewOrderChange(client, change({ quantity: 20 }), configWith(), ann);
      expect(refusals[0]).toContain("more than your available cash");
    });

    it("bounds by cash alone, not cash plus what the old order reserved", async () => {
      // The old order is 4,000; cash is 4,100; the new order is 4,500 — refused, not "4,100 + 4,000".
      const { client } = fakeBroker({ cash: "4100" });
      const refusals = await reviewOrderChange(
        client,
        change({ limitPrice: 450 }),
        configWith(),
        ann,
      );
      expect(refusals).toHaveLength(1);
    });

    it("prices a stop order off its stop trigger", async () => {
      const stop = anOrder({ type: "stop", limit_price: null, stop_price: "50", qty: "10" });
      const { client } = fakeBroker({ order: stop, cash: "540" });
      const refusals = await reviewOrderChange(
        client,
        change({ stopPrice: 60 }),
        configWith(),
        ann,
      );
      expect(refusals[0]).toContain("more than your available cash");
    });

    it("prices a queued market buy off the held mark", async () => {
      const market = anOrder({ type: "market", limit_price: null, qty: "10", symbol: "QQQ" });
      // Held at a 100 mark; 30 shares cost 3,000 against 500 of cash.
      const { client } = fakeBroker({
        order: market,
        cash: "500",
        positions: [aBrokerPosition("QQQ", 4, 100)],
      });
      const refusals = await reviewOrderChange(client, change({ quantity: 30 }), configWith(), ann);
      expect(refusals[0]).toContain("more than your available cash");
    });

    it("lets a raised quantity through when no price is known (the broker settles it)", async () => {
      const market = anOrder({ type: "market", limit_price: null, qty: "10", symbol: "QQQ" });
      const { client } = fakeBroker({ order: market, cash: "1" });
      expect(await reviewOrderChange(client, change({ quantity: 30 }), configWith(), ann)).toEqual(
        [],
      );
    });

    it("passes a change that might have grown but commits no more than before", async () => {
      // A market buy with no known price: growth cannot be ruled out, so the account is read,
      // but the order commits no more than it did.
      const market = anOrder({ type: "market", limit_price: null, symbol: "QQQ" });
      const { client, reads } = fakeBroker({ order: market, cash: "1" });
      expect(await reviewOrderChange(client, change({ quantity: 10 }), configWith(), ann)).toEqual(
        [],
      );
      expect(reads).toContain("account");
    });
  });

  describe("when the live account cannot be read", () => {
    it("refuses with a fixed sentence that carries no internals", async () => {
      const { client } = fakeBroker({ accountError: new Error("proxy banner 10.1.1.1") });
      const refusals = await reviewOrderChange(
        client,
        change({ limitPrice: 450 }),
        configWith(),
        ann,
      );
      expect(refusals).toEqual([
        "Couldn't read the account to check this order. Try again shortly.",
      ]);
    });
  });

  describe("when the change grows the order and the ladder rung is locked", () => {
    const wheelsOn = {
      view: async () => ({ wheels: true, unlocked: new Set(), ladderGate: "first-message" }),
    };

    it("answers the rung lock in place of the cash refusals", async () => {
      const { client } = fakeBroker({ cash: "1" });
      const refusals = await reviewOrderChange(
        client,
        change({ limitPrice: 450 }),
        configWith({ progression: wheelsOn }),
        ann,
      );
      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain("Training wheels are on");
      expect(refusals[0]).toContain("Nothing was sent.");
    });

    it("locks a growing sell the same way", async () => {
      const sell = anOrder({ symbol: "AAPL", side: "sell", qty: "5", limit_price: "200" });
      const { client } = fakeBroker({ order: sell, positions: [aBrokerPosition("AAPL", 50)] });
      const refusals = await reviewOrderChange(
        client,
        change({ quantity: 8 }),
        configWith({ progression: wheelsOn }),
        ann,
      );
      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toContain("Nothing was sent.");
    });

    it("lets a valid growth through once the member's rung is open", async () => {
      const open = {
        view: async () => ({ wheels: true, unlocked: new Set(["101", "102"]) }),
      };
      const { client } = fakeBroker({ cash: "100000" });
      expect(
        await reviewOrderChange(
          client,
          change({ limitPrice: 450 }),
          configWith({ progression: open }),
          ann,
        ),
      ).toEqual([]);
    });
  });

  describe("when the change grows the order and nothing refuses it", () => {
    it("answers an empty list, so the change may go to the broker", async () => {
      const { client } = fakeBroker({ cash: "100000" });
      expect(
        await reviewOrderChange(
          client,
          change({ quantity: 12, limitPrice: 405 }),
          configWith(),
          ann,
        ),
      ).toEqual([]);
    });
  });
});
