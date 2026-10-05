import type { AlpacaAccount } from "../../src/alpaca/alpaca-trading-client.js";
import { EMPTY_CONTROLS } from "../../src/autonomous/bot-controls.js";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { Bot } from "../../src/bots/bot.js";
import type { Persona } from "../../src/personas/persona.js";
import { optionOpenIntent } from "../../src/playbooks/option-intent.js";
import {
  buildLiveBot,
  seedDailyLossBaseline,
  tradingRoster,
} from "../../src/scripts/autonomous-live-wiring.js";
import {
  BotOptionLevels,
  optionTraderConfig,
  readBootAccounts,
  sweepOrphanOptionOrders,
} from "../../src/scripts/autonomous-option-wiring.js";
import { aContext } from "../support/builders.js";

// Boot wiring for the bots' option plays (#4642 slice 5): one account read per bot feeding the
// daily-loss baseline AND the options level, the level re-read on a rotation (re-applying the
// roster when it changed), expiry hygiene on every bot's persona, and the boot sweep that cancels
// only a bot's own stamped orders.

const stub = (id: string): Persona => ({ id, name: id, thesis: "n/a", decide: () => [] });
const botOf = (id: string, apiKey = `${id}-key`): Bot => ({
  persona: stub(id),
  credentials: { apiKey, apiSecret: "s" },
});
const account = (over: Partial<AlpacaAccount> = {}): AlpacaAccount => ({
  id: "a",
  cash: "1000",
  portfolio_value: "1000",
  status: "ACTIVE",
  ...over,
});
const quiet = () => {
  const lines: string[] = [];
  return { lines, log: (l: string) => lines.push(l), warn: (l: string) => lines.push(l) };
};

describe("readBootAccounts", () => {
  it("reads each bot's account once, a failed read mapping to undefined", async () => {
    const seen: string[] = [];
    const accounts = await readBootAccounts([botOf("sauron"), botOf("banker")], (creds) => {
      seen.push(creds.apiKey);
      return creds.apiKey === "banker-key"
        ? Promise.reject(new Error("401"))
        : Promise.resolve(account({ options_trading_level: "3" }));
    });
    expect(seen).toEqual(["sauron-key", "banker-key"]);
    expect(accounts.get("sauron")?.options_trading_level).toBe("3");
    expect(accounts.has("banker")).toBe(true);
    expect(accounts.get("banker")).toBeUndefined();
  });
});

describe("seedDailyLossBaseline — from the boot accounts", () => {
  it("seeds the fleet's day-open equity, and seeds nothing when any bot's read failed", () => {
    const seeded: number[] = [];
    const safety = new SafetyController();
    safety.seedBaseline = (equity) => seeded.push(equity);
    seedDailyLossBaseline(
      new Map([
        ["a", account({ last_equity: "1000" })],
        ["b", account({ last_equity: "500" })],
      ]),
      safety,
    );
    seedDailyLossBaseline(
      new Map([
        ["a", account({ last_equity: "1000" })],
        ["b", undefined],
      ]),
      safety,
    );
    expect(seeded).toEqual([1500]);
  });
});

describe("BotOptionLevels", () => {
  const base = { maxPositionPct: 0.03 };

  it("puts each bot's level on its own risk config, and leaves it off when unreadable (opens refused)", async () => {
    const out = quiet();
    const levels = new BotOptionLevels(
      (creds) =>
        Promise.resolve(
          account({ options_trading_level: creds.apiKey === "sauron-key" ? 2 : "junk" }),
        ),
      out,
    );
    await levels.readAtBoot([botOf("sauron"), botOf("banker")]);
    expect(levels.risk("sauron", base)).toEqual({ ...base, optionsLevel: 2 });
    expect(levels.risk("banker", base)).toEqual(base);
    expect(out.lines).toEqual([
      "[options] sauron: options level 2",
      "[options] banker: options level unreadable — every option open will be refused",
    ]);
  });

  it("re-reads the level on a rotation and re-applies only that bot's roster when it changed", async () => {
    let level: number | string = 1;
    const levels = new BotOptionLevels(
      () => Promise.resolve(account({ options_trading_level: level })),
      quiet(),
    );
    const rosters = [{ bot: botOf("sauron") }, { bot: botOf("banker") }];
    await levels.readAtBoot(rosters.map((r) => r.bot));
    const swapped: number[] = [];
    levels.follow(rosters, (i) => swapped.push(i));

    await levels.refresh("banker", { apiKey: "new", apiSecret: "s" });
    expect(swapped).toEqual([]); // same level — nothing to re-apply

    level = "3";
    await levels.refresh("banker", { apiKey: "new", apiSecret: "s" });
    expect(swapped).toEqual([1]);
    expect(levels.risk("banker", base).optionsLevel).toBe(3);
  });

  it("keeps the level in force when the re-read fails, and never lets a failed re-apply escape", async () => {
    const out = quiet();
    let fail = false;
    const levels = new BotOptionLevels(
      () =>
        fail
          ? Promise.reject(new Error("503"))
          : Promise.resolve(account({ options_trading_level: 1 })),
      out,
    );
    await levels.readAtBoot([botOf("sauron")]);
    fail = true;
    await levels.refresh("sauron", { apiKey: "new", apiSecret: "s" });
    expect(levels.risk("sauron", base).optionsLevel).toBe(1);

    fail = false;
    const changing = new BotOptionLevels(
      () => Promise.resolve(account({ options_trading_level: 3 })),
      out,
    );
    changing.follow([{ bot: botOf("sauron") }], () => {
      throw new Error("bad roster");
    });
    await expect(
      changing.refresh("sauron", { apiKey: "k", apiSecret: "s" }),
    ).resolves.toBeUndefined();
    expect(out.lines.at(-1)).toBe("[options] sauron: roster re-apply failed — Error: bad roster");
  });
});

describe("sweepOrphanOptionOrders", () => {
  it("sweeps every bot, says what it canceled, and never fails boot", async () => {
    const out = quiet();
    await sweepOrphanOptionOrders(
      new Map([
        ["sauron", { sweepOrphanOptionOrders: () => Promise.resolve(["sk1-sauron-CRWV-x-0"]) }],
        ["banker", { sweepOrphanOptionOrders: () => Promise.reject(new Error("503")) }],
        ["quiet", { sweepOrphanOptionOrders: () => Promise.resolve([]) }],
      ]),
      out,
    );
    expect(out.lines).toEqual([
      "[options] sauron: canceled 1 option order(s) left open by an earlier run: sk1-sauron-CRWV-x-0",
      "[options] banker: orphan order sweep failed (non-fatal): Error: 503",
    ]);
  });
});

describe("the trading roster and the live bot", () => {
  it("wraps every bot's persona in expiry hygiene, even with no option playbook subscribed", () => {
    const { persona } = tradingRoster(
      { bot: botOf("sauron"), subscriptions: [], enabled: [] },
      { maxPositionPct: 0.03 },
    );
    expect(persona.optionDemand).toBeDefined();
    expect(
      persona.decide(aContext({ AAPL: { last: 100 } }), { cash: 1000, positions: [] }),
    ).toEqual([]);
  });

  it("hands the trader its broker as option market and tracker, 10 minutes apart per underlying", () => {
    const broker = { marker: true } as never;
    expect(optionTraderConfig(broker)).toEqual({
      optionMarket: broker,
      optionOrders: broker,
      optionCooldownMs: 600_000,
    });
  });

  it("in observe mode, reads option quotes through the bot's broker and sends NOTHING", async () => {
    const PUT = "CRWV261106P00085000";
    const methods: string[] = [];
    // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
    const fetchFn = (async (url: string | URL, init?: RequestInit) => {
      const path = new URL(String(url)).pathname;
      methods.push(`${init?.method ?? "GET"} ${path}`);
      const body =
        path === "/v2/account"
          ? account({ options_trading_level: 1 })
          : path === "/v1beta1/options/snapshots"
            ? {
                snapshots: {
                  [PUT]: { latestQuote: { bp: 2, ap: 2.2, t: new Date().toISOString() } },
                },
              }
            : [];
      return { status: 200, text: async () => JSON.stringify(body) } as unknown as Response;
    }) as unknown as typeof fetch;
    const persona: Persona = {
      ...stub("sauron"),
      optionDemand: () => ({ chains: [], contracts: [PUT] }),
      decide: (ctx) => {
        const quote = ctx.options?.contracts[PUT];
        const intent =
          quote &&
          optionOpenIntent({
            underlying: "CRWV",
            structure: "cash-secured-put",
            legs: [{ occSymbol: PUT, side: "sell" }],
            limitPrice: 2.1,
            band: { low: 2, high: 2.2, at: new Date().toISOString() },
            reason: "test",
          });
        return intent ? [intent] : [];
      },
    };
    const records: DecisionRecord[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const live = buildLiveBot(botOf("sauron"), {
        mode: "observe",
        trading: { persona, risk: { maxPositionPct: 0.03, optionsLevel: 1 } },
        blockedReason: () => null,
        safety: new SafetyController(),
        onDecision: (r) => records.push(r),
        hardcore: new Set(),
        controls: resolveBotControls({} as NodeJS.ProcessEnv),
        bootControls: EMPTY_CONTROLS,
      });
      await live.trader.evaluate(aContext({ CRWV: { last: 92 } }, new Date().toISOString()));
    } finally {
      globalThis.fetch = original;
    }
    expect(methods).toContain("GET /v1beta1/options/snapshots");
    expect(methods.filter((m) => !m.startsWith("GET "))).toEqual([]);
    expect(methods.some((m) => m.startsWith("GET /v2/orders"))).toBe(false); // no settle in observe
    expect(records[0]?.rawIntents).toHaveLength(1);
  });
});
