import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { SHADOW_ORDERS_KIND } from "../../src/autonomous/authored-shadow-wire.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { Bot } from "../../src/bots/bot.js";
import { DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { authoredRoster } from "../../src/playbooks/authored-play.js";
import { runnableSpecs } from "../../src/playbooks/authored-play-draft.js";
import { playbookIntents } from "../../src/playbooks/playbook.js";
import { authoredShadowWiring } from "../../src/scripts/autonomous-authored-shadow.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { anOrder, aSpec, at, CALENDAR } from "../support/authored-shadow.js";
import { aContext } from "../support/builders.js";

/**
 * A SHADOW TEST RECORDS AND NEVER TRADES (#5457 slice 2) — the same two proofs #5570 gave the dark
 * dip-bounce playbooks: a static one (the code that runs a test cannot reach an order, a guard's
 * verdict on the account, or a broker) and a live one (a real trader cycle with the test running
 * beside it calls `submit` zero times).
 */

const bot: Bot = {
  persona: { id: "futurist", name: "Futurist", thesis: "t", decide: () => [] },
  credentials: { apiKey: "k", apiSecret: "s" },
};

const quiet = { log: () => undefined, warn: () => undefined };

describe("it records and never trades", () => {
  async function liveCycle() {
    const market = aContext({ AMD: { last: 100 } }, at("2026-10-20"));
    const broker = new InMemoryBroker(100_000, Object.values(market.quotes));
    const submit = rstest.spyOn(broker, "submit");
    const trading = tradingRoster(resolveBotRoster(bot, [], []), DEFAULT_RISK_CONFIG);
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: trading.persona,
      broker,
      risk: trading.risk,
      mode: "live",
      now: () => 1_760_000_000_000,
      onDecision: (r) => records.push(r),
    });
    const wiring = authoredShadowWiring(quiet);
    let report: (() => unknown) | undefined;
    const pass = wiring.arm({
      risk: DEFAULT_RISK_CONFIG,
      blockedReason: () => null,
      botsStateDb: undefined,
      publish: (get) => {
        report = get;
      },
      calendar: CALENDAR,
    });
    wiring.accept({ kind: SHADOW_ORDERS_KIND, at: 1, plays: [anOrder()] });
    wiring.observe(["futurist"], [await broker.getPortfolio()]);
    return { market, broker, submit, trading, records, trader, pass, report: () => report?.() };
  }

  it("a live cycle with a would-be buy on the ledger asks the broker for nothing", async () => {
    const { market, broker, submit, records, trader, pass, report } = await liveCycle();
    await trader.evaluate(market);
    pass(market);
    await trader.evaluate(market);
    pass(market);

    expect(submit).not.toHaveBeenCalled();
    for (const record of records) {
      expect(record.rawIntents).toEqual([]);
      expect(record.guardedIntents).toEqual([]);
      expect(record.outcomes).toEqual([]);
    }
    // ...and the test did record the trade: the point of running it.
    expect(report()).toMatchObject({
      plays: [
        { id: "U-futurist-amd-run-up", tradeCount: 1, recent: [{ side: "buy", symbol: "AMD" }] },
      ],
    });
    // The account is as it was.
    expect(await broker.getPortfolio()).toEqual({ cash: 100_000, positions: [] });
  });

  it("changes nothing the bot does: its own decisions are the same with and without a test", async () => {
    const { market, trading, pass } = await liveCycle();
    const decide = () => trading.persona.decide(market, { cash: 100_000, positions: [] });
    const before = decide();
    pass(market);
    expect(decide()).toEqual(before);
  });

  it("a play in its test is on no roster: no door leads from a record to a trade", () => {
    const roster = resolveBotRoster(bot, [], [], authoredRoster(runnableSpecs([]), "futurist"));
    expect(roster.enabled).toEqual([]);
  });

  it("decides exactly what the same play would decide if it ran: same side, same size", async () => {
    const { market, pass, report } = await liveCycle();
    pass(market);
    const [compiled] = authoredRoster([aSpec()], "futurist").plays;
    const real = playbookIntents(
      [{ playbook: compiled as NonNullable<typeof compiled>, mode: "standard" }],
      market,
      { cash: 100_000, positions: [] },
      CALENDAR,
    );
    const entry = (report() as { plays: { recent: { side: string; quantity: number }[] }[] })
      .plays[0]?.recent[0];
    expect(real).toHaveLength(1);
    expect(entry).toMatchObject({ side: real[0]?.side, quantity: real[0]?.quantity });
  });

  it("a failing pass is said and swallowed: it can never stall the cycle that fired it", () => {
    const warned: string[] = [];
    const wiring = authoredShadowWiring({ log: () => undefined, warn: (l) => warned.push(l) });
    const pass = wiring.arm({
      risk: DEFAULT_RISK_CONFIG,
      blockedReason: () => {
        throw new Error("breaker unreadable");
      },
      botsStateDb: undefined,
      calendar: CALENDAR,
    });
    wiring.accept({ kind: SHADOW_ORDERS_KIND, at: 1, plays: [anOrder()] });
    wiring.observe(["futurist"], [{ cash: 100_000, positions: [] }]);
    expect(() => pass(aContext({ AMD: { last: 100 } }, at("2026-10-20")))).not.toThrow();
    expect(warned[0]).toContain("[authored-shadow] pass failed");
  });

  it("orders that arrive before the runner exists are kept and applied when it does", () => {
    const wiring = authoredShadowWiring(quiet);
    wiring.accept({ kind: SHADOW_ORDERS_KIND, at: 1, plays: [anOrder()] });
    let report: (() => { plays: readonly unknown[] }) | undefined;
    wiring.arm({
      risk: DEFAULT_RISK_CONFIG,
      blockedReason: () => null,
      botsStateDb: undefined,
      publish: (get) => {
        report = get;
      },
    });
    expect(report?.().plays).toHaveLength(1);
  });
});

describe("no path from a shadow test to a broker", () => {
  const files = [
    "src/playbooks/authored-shadow.ts",
    "src/autonomous/authored-shadow-wire.ts",
    "src/autonomous/authored-shadow-runner.ts",
    "src/scripts/autonomous-authored-shadow.ts",
  ];
  const code = (path: string): string =>
    readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
      .join("\n");
  const imports = (path: string): { specifier: string; typeOnly: boolean }[] =>
    [...code(path).matchAll(/^(import|export)(\s+type)?\s[^;]*?from\s+"([^"]+)"/gm)].map((m) => ({
      specifier: m[3] ?? "",
      typeOnly: m[2] !== undefined,
    }));

  /** Every module a file can run, following value imports only (a type import is erased). */
  function reachable(entry: string): Set<string> {
    const seen = new Set<string>();
    const walk = (file: string): void => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const { specifier, typeOnly } of imports(file)) {
        if (typeOnly || !specifier.startsWith(".")) continue;
        const target = normalize(join(dirname(file), specifier.replace(/\.js$/, ".ts")));
        if (existsSync(target)) walk(target);
      }
    };
    walk(entry);
    return seen;
  }

  /** The places an order is built into a trader's decision, queued, or sent: the trader, the live
   *  cycle, the broker port and every adapter behind it, the desk and its tickets. (`trading/option-
   *  symbols` is the contract-name parser the guards read; it builds nothing.) */
  const orderPath =
    /(^|\/)(adapters|alpaca|ports|server)\/|trading\/(order-ticket|option-ticket)|autonomous-trader|live-cycle|bots\/|with-playbooks/;

  it.each(files)("%s names no order, broker or submit", (path) => {
    expect(code(path)).not.toMatch(/OrderIntent|BrokerPort|\.submit\(|placeOrder|\.post\(/);
  });

  it.each(files)("%s can run no module on the order path", (path) => {
    const reached = [...reachable(path)].filter((file) => orderPath.test(file));
    expect(reached, `${path} reaches ${reached.join(", ")}`).toEqual([]);
  });

  it("the runner returns nothing a trader could read: a pass answers void", () => {
    const source = code("src/autonomous/authored-shadow-runner.ts");
    expect(source).toMatch(/runPass\(context: MarketContext\): void/);
  });
});
