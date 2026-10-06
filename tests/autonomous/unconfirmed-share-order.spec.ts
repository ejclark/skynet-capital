import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AlpacaBrokerAdapter } from "../../src/adapters/alpaca-broker-adapter.js";
import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.js";
import type { Persona } from "../../src/personas/persona.js";
import { aContext } from "../support/builders.js";

/**
 * #4655 end to end: a share order Alpaca takes but never confirms a fill for — queued after hours,
 * or slower than the adapter's poll — through the real adapter into the bots runtime. It must read
 * `working` in the decision log, never count as a fill, and still spend whatever a placed order
 * spends (the cooldown, the scout's day), so the next cycle never sends it a second time.
 */

/** An Alpaca paper account with no holdings, where every order sits at "accepted" — exactly what a
 *  market order placed after the close looks like until the next open. Counts every placement. */
class QueuingAlpaca implements AlpacaTradingTransport {
  readonly placed: string[] = [];
  private readonly open: unknown[] = [];
  get(path: string): Promise<JsonResponse> {
    // The open-order list (#4678): every order here sits at "accepted", so every one is open.
    if (path.startsWith("/v2/orders?")) return Promise.resolve({ status: 200, body: this.open });
    if (path === "/v2/account") {
      return Promise.resolve({
        status: 200,
        body: { id: "a1", cash: "1000000", portfolio_value: "1000000", status: "ACTIVE" },
      });
    }
    if (path === "/v2/positions") return Promise.resolve({ status: 200, body: [] });
    const id = path.replace("/v2/orders/", "");
    return Promise.resolve({
      status: 200,
      body: { id, status: "accepted", filled_qty: "0", filled_avg_price: null },
    });
  }
  post(path: string, body: unknown): Promise<JsonResponse> {
    if (path !== "/v2/orders") return Promise.resolve({ status: 404, body: null });
    const { symbol, side, qty } = body as { symbol: string; side: string; qty: number };
    const id = `o${this.placed.length + 1}`;
    this.placed.push(`${side} ${qty} ${symbol}`);
    const order = { id, symbol, qty: String(qty), side, status: "accepted" };
    this.open.push(order);
    return Promise.resolve({ status: 200, body: order });
  }
  delete(): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
}

const queuingBroker = (transport: QueuingAlpaca): AlpacaBrokerAdapter =>
  new AlpacaBrokerAdapter(new AlpacaTradingClient(transport), { sleep: () => Promise.resolve() });

class AlwaysBuys implements Persona {
  readonly id = "always";
  readonly name = "Always";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [{ symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "test" }];
  }
}

class NeverBuys implements Persona {
  readonly id = "never";
  readonly name = "Never";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [];
  }
}

const RISK = { maxPositionPct: 0.5 };

describe("a share order the broker never confirmed (#4655)", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "unconfirmed-order-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("reads working in the decision log and never counts as a fill", async () => {
    const transport = new QueuingAlpaca();
    const emitted: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker: queuingBroker(transport),
      risk: RISK,
      now: () => 1_000,
      onDecision: (r) => {
        emitted.push(r);
        db.record(r);
      },
    });

    await trader.evaluate(aContext({ NVDA: { last: 100, momentum: 0.05 } }));

    // The emitted record (what the console line and the replication wire carry) names the
    // broker's status; the stored row keeps the status and the order id.
    expect(emitted[0]?.outcomes[0]?.result).toEqual({
      intent: emitted[0]?.outcomes[0]?.intent,
      status: "working",
      reason: "order accepted",
      orderId: "o1",
    });
    const [record] = db.listByPersona("always");
    expect(record?.outcomes[0]).toMatchObject({
      action: "placed",
      result: { status: "working", orderId: "o1" },
    });
    expect(record?.outcomes[0]?.result).not.toHaveProperty("filledQuantity");

    const [cycle] = decisionCyclesView(db.listByPersona("always")).cycles;
    expect(cycle?.outcomes[0]).toMatchObject({
      resultStatus: "working",
      resultLabel: "queued at the broker — no fill confirmed yet",
    });
    expect(cycle?.outcomes[0]).not.toHaveProperty("fill");

    // Placed, but not filled — the funnel and the retrospectives only ever count a confirmed fill.
    expect(db.funnelFor("always")).toMatchObject({ placed: 1, filled: 0, closed: 0 });
    expect(db.listRetrospectives("always")).toEqual([]);
  });

  it("starts the symbol's cooldown, so the next cycle does not send it again", async () => {
    const transport = new QueuingAlpaca();
    let clock = 1_000;
    const decisions: DecisionRecord[] = [];
    const cooldowns: string[] = [];
    const trader = new AutonomousTrader({
      persona: new AlwaysBuys(),
      broker: queuingBroker(transport),
      risk: RISK,
      cooldownMs: 60_000,
      now: () => clock,
      onCooldownSet: (symbol) => cooldowns.push(symbol),
      onDecision: (r) => decisions.push(r),
    });

    await trader.evaluate(aContext({ NVDA: { last: 100, momentum: 0.05 } }));
    clock += 30_000;
    await trader.evaluate(aContext({ NVDA: { last: 100, momentum: 0.05 } }));

    expect(decisions[0]?.outcomes[0]?.result?.status).toBe("working");
    expect(decisions[1]?.outcomes[0]?.action).toBe("cooldown-skipped");
    expect(cooldowns).toEqual(["NVDA"]);
    expect(transport.placed).toEqual(["buy 10 NVDA"]);
  });

  it("spends the scout's staged session, so a queued after-hours pick is sent once", async () => {
    const transport = new QueuingAlpaca();
    const decisions: DecisionRecord[] = [];
    const bots = new InMemoryBroker(1_000_000, [
      { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" },
    ]);
    const safety = new SafetyController();
    const runner = new LiveCycleRunner({
      traders: [
        {
          personaName: "Never",
          broker: bots,
          trader: new AutonomousTrader({ persona: new NeverBuys(), broker: bots, risk: RISK }),
        },
      ],
      safety,
      blockedReason: () => null,
      scout: {
        maxPicks: 1,
        broker: queuingBroker(transport),
        universe: ["NVDA"],
        managedSymbols: new Set(),
        risk: RISK,
        mode: "live",
      },
      onDecision: (r) => {
        decisions.push(r);
        db.record(r);
      },
    });

    // Friday evening, market closed: the pick goes in for Monday's open and sits at "accepted".
    const staged = await runner.stageScout(
      aContext({ NVDA: { last: 100, momentum: 0.05 } }, "2026-10-02T23:00:00Z"),
      "2026-10-05",
    );
    // Saturday's poll and Monday's in-hours cycle: the order is still live at the broker.
    await runner.stageScout(
      aContext({ NVDA: { last: 100, momentum: 0.08 } }, "2026-10-03T12:00:00Z"),
      "2026-10-05",
    );
    await runner.runCycle(
      aContext({ NVDA: { last: 100, momentum: 0.08 } }, "2026-10-05T14:00:00Z"),
    );

    expect(staged).toBe(1);
    expect(transport.placed).toHaveLength(1);
    expect(transport.placed[0]).toMatch(/^buy \d+ NVDA$/);
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.outcomes[0]?.result).toMatchObject({ status: "working" });
    expect(db.listByPersona("beta-scout")[0]?.outcomes[0]?.result?.status).toBe("working");
  });
});
