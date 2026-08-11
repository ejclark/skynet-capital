import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import { guardAccountCollisions } from "../../src/bots/account-guard.js";
import type { Bot } from "../../src/bots/bot.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

class FakeTransport implements AlpacaTradingTransport {
  constructor(private readonly response: JsonResponse) {}
  get(): Promise<JsonResponse> {
    return Promise.resolve(this.response);
  }
  post(): Promise<JsonResponse> {
    return Promise.resolve(this.response);
  }
}

function botFor(id: string): Bot {
  return {
    persona: { id, name: id, thesis: "", decide: () => [] },
    credentials: { apiKey: `key-${id}`, apiSecret: `secret-${id}` },
  };
}

const clientFor = (accountId: string) =>
  new AlpacaTradingClient(
    new FakeTransport({
      status: 200,
      body: { id: accountId, cash: "0", portfolio_value: "0", status: "ACTIVE" },
    }),
  );

describe("guardAccountCollisions", () => {
  it("passes every bot through when each resolves to its own account", async () => {
    const bots = [botFor("sauron"), botFor("day-trader")];
    const accounts: Record<string, string> = { sauron: "acct-1", "day-trader": "acct-2" };

    const result = await guardAccountCollisions(bots, (bot) =>
      clientFor(accounts[bot.persona.id] as string),
    );

    expect(result.safe.map((b) => b.persona.id)).toEqual(["sauron", "day-trader"]);
    expect(result.collisions).toEqual([]);
  });

  it("refuses both bots when their credentials resolve to the same account", async () => {
    // The exact incident this guards against: a regenerated key pasted into the wrong slot
    // means one bot's credentials now silently point at another bot's account.
    const bots = [botFor("sauron"), botFor("day-trader")];

    const result = await guardAccountCollisions(bots, () => clientFor("acct-1"));

    expect(result.safe).toEqual([]);
    expect(result.collisions).toEqual([{ accountId: "acct-1", ids: ["sauron", "day-trader"] }]);
  });

  it("leaves an unreachable bot's credentials alone — that's a different, already-loud failure", async () => {
    const bots = [botFor("sauron"), botFor("day-trader")];
    const failing = new AlpacaTradingClient(
      new FakeTransport({ status: 401, body: { message: "bad key" } }),
    );

    const result = await guardAccountCollisions(bots, (bot) =>
      bot.persona.id === "day-trader" ? failing : clientFor("acct-1"),
    );

    // day-trader's read failed, so it carries no confirmed accountId — no collision to report,
    // and it is NOT excluded by this guard (its own credential check surfaces that separately).
    expect(result.safe.map((b) => b.persona.id)).toEqual(["sauron", "day-trader"]);
    expect(result.collisions).toEqual([]);
  });

  it("passes a single bot through with no other account to collide with", async () => {
    const bots = [botFor("sauron")];
    const result = await guardAccountCollisions(bots, () => clientFor("acct-1"));
    expect(result.safe.map((b) => b.persona.id)).toEqual(["sauron"]);
    expect(result.collisions).toEqual([]);
  });
});
