import type { IncomingMessage, ServerResponse } from "node:http";
import { rstest } from "@rstest/core";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { servePreflight } from "../../src/server/subscriptions-preflight-route.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";

/**
 * The Store's preflight (#4469 slice 3b part 2): "what would Subscribe say to this pair at this
 * budget", asked before the owner submits. Read-only, owner-only, GET-only; it answers refusals as
 * 200 sentences (the form shows them) and malformed asks as 400. The spec drives the handler
 * directly, with a fake broker at the I/O boundary, on the real wheel / call-spread pair rows.
 */

interface Answer {
  status?: number;
  headers?: Record<string, string>;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function request(url: string, method = "GET"): IncomingMessage {
  return { method, url, headers: {} } as unknown as IncomingMessage;
}

const session = { email: "eric@example.com", name: "Eric Clark" } as never;

// Wed 2026-11-18, 11:00 ET: a regular session, and the first one after CRWV's November blackout.
const IN_SESSION = "2026-11-18T16:00:00Z";
// Sat 2026-11-14: no regular session, so no chain can clear the picker's freshness bar.
const WEEKEND = "2026-11-14T16:00:00Z";
// Far past every pair's shelf date.
const LONG_AFTER = "2031-01-01T16:00:00Z";

const LISTED = ["2026-11-20", "2026-12-04", "2026-12-18", "2026-12-31", "2027-01-15", "2027-02-19"];
// CRWV at $92: the Δ0.21 put is the one the wheel sells, and one contract of it ties up $7,500.
const PUTS: readonly (readonly [number, number, number, number])[] = [
  [70, -0.1, 1.1, 1.25],
  [75, -0.15, 1.65, 1.85],
  [80, -0.21, 2.2, 2.4],
  [85, -0.28, 3.3, 3.5],
  [90, -0.41, 4.8, 5.1],
];

interface Broker {
  price?: number;
  level?: number;
  /** Added to every ask: a wide spread no picker would call liquid. */
  extraSpread?: number;
}

/** The broker clients the dashboard holds per account, over a fixed CRWV put chain. */
function brokerFor({ level = 1, extraSpread = 0, ...rest }: Broker = {}) {
  // `price: undefined` is the feed's "no price", so a default must not swallow it.
  const price = "price" in rest ? rest.price : 92;
  const reads = { price: rstest.fn(), level: rstest.fn() };
  return {
    reads,
    config: {
      optionsClientFor: () => ({
        getUnderlyingPrice: () => {
          reads.price();
          return Promise.resolve(price);
        },
        getExpirations: async () => LISTED,
        getChain: async (_underlying: string, expiration: string, type: "call" | "put") =>
          type === "put"
            ? PUTS.map(([strike, delta, bid, ask]) => ({
                occSymbol: buildOccSymbol({
                  underlying: "CRWV",
                  expiration,
                  type: "put",
                  strike,
                }),
                strike,
                bid,
                ask: ask + extraSpread,
                delta,
                openInterest: 500,
                quotedAt: IN_SESSION,
              }))
            : [],
        getContractSnapshots: async () => new Map(),
      }),
      tradingClientFor: () => ({
        getAccount: () => {
          reads.level();
          return Promise.resolve({ options_trading_level: level });
        },
      }),
    },
  };
}

interface Held {
  playbookId: string;
  enabled?: boolean;
  capitalAllocated?: number;
}

function storeHolding(held: readonly Held[] = [], allocations: unknown = {}) {
  const writes: string[] = [];
  return {
    writes,
    store: {
      load: () => ({ "acct-mine": held }),
      loadAllocations: () => ({ "acct-mine": allocations }),
      subscribe: () => writes.push("subscribe"),
      unsubscribe: () => writes.push("unsubscribe"),
      setEnabled: () => writes.push("setEnabled"),
    },
  };
}

function configWith(over: Record<string, unknown> = {}, nowIso = IN_SESSION) {
  return {
    auth: { providerIds: ["google"] },
    resolveOwnerIds: () => ["acct-mine"],
    now: () => new Date(nowIso),
    subscriptions: storeHolding().store,
    ...over,
  } as unknown as DashboardServerConfig;
}

const WHEEL = "id=acct-mine&playbookId=CRWV-WHEEL&mode=standard&capital=75000";

const parsed = (raw: string | undefined): unknown => {
  try {
    return JSON.parse(raw ?? "null");
  } catch {
    return undefined; // the plain-text 405
  }
};

async function ask(
  query: string,
  config: DashboardServerConfig,
  options: { method?: string; as?: typeof session | undefined } = {},
) {
  const { res, out } = fakeRes();
  const as = "as" in options ? options.as : session;
  await servePreflight(
    request(`/api/playbook-store/preflight?${query}`, options.method),
    res,
    config,
    as,
  );
  return {
    status: out.status,
    headers: out.headers,
    raw: out.body,
    body: parsed(out.body),
  };
}

beforeEach(() => {
  // The option market stamps each read with the wall clock (a quote must be under two minutes old
  // as of the cycle), so the specs pin it to the same instant the handler is told it is.
  rstest.useFakeTimers({ toFake: ["Date"] });
  rstest.setSystemTime(new Date(IN_SESSION));
});
afterEach(() => {
  rstest.useRealTimers();
});

describe("the Store's preflight", () => {
  describe("when the request is not a well-formed GET", () => {
    it("answers a POST with 405 and says GET only", async () => {
      const answer = await ask(WHEEL, configWith(), { method: "POST" });
      expect(answer.status).toBe(405);
      expect(answer.headers?.allow).toBe("GET");
      expect(answer.raw).toBe("GET only");
    });

    it.each([
      ["no account id", "playbookId=CRWV-WHEEL&mode=standard&capital=75000"],
      ["no playbook id", "id=acct-mine&mode=standard&capital=75000"],
      ["no mode", "id=acct-mine&playbookId=CRWV-WHEEL&capital=75000"],
      ["an unknown mode", "id=acct-mine&playbookId=CRWV-WHEEL&mode=wild&capital=75000"],
      ["no capital", "id=acct-mine&playbookId=CRWV-WHEEL&mode=standard"],
      [
        "a capital that is not a number",
        "id=acct-mine&playbookId=CRWV-WHEEL&mode=standard&capital=lots",
      ],
      ["a negative capital", "id=acct-mine&playbookId=CRWV-WHEEL&mode=standard&capital=-1"],
      ["an infinite capital", "id=acct-mine&playbookId=CRWV-WHEEL&mode=standard&capital=Infinity"],
    ])("answers %s with a 400, before touching the broker", async (_label, query) => {
      const broker = brokerFor();
      const answer = await ask(query, configWith(broker.config));
      expect(answer.status).toBe(400);
      expect(answer.body).toEqual({ error: "malformed preflight query" });
      expect(broker.reads.price).not.toHaveBeenCalled();
    });

    it("takes a zero budget as well-formed — the answer is about the pair, not the number", async () => {
      const answer = await ask(
        "id=acct-mine&playbookId=S1-NVDA&mode=standard&capital=0",
        configWith(brokerFor({ price: 180 }).config),
      );
      expect(answer.status).toBe(200);
      expect(answer.body).toEqual({ ok: true });
    });
  });

  describe("when the viewer does not own the account", () => {
    const refusal = { ok: false, error: "You can only check your own account." };

    it("answers an account someone else owns with a sentence, never a broker read", async () => {
      const broker = brokerFor();
      const answer = await ask(
        WHEEL.replace("acct-mine", "acct-theirs"),
        configWith(broker.config),
      );
      expect(answer.status).toBe(200);
      expect(answer.body).toEqual(refusal);
      expect(broker.reads.price).not.toHaveBeenCalled();
      expect(broker.reads.level).not.toHaveBeenCalled();
    });

    it("answers a request with no session the same way", async () => {
      expect((await ask(WHEEL, configWith(), { as: undefined })).body).toEqual(refusal);
    });

    it("answers a server with no auth configured the same way — ownership cannot be shown", async () => {
      expect((await ask(WHEEL, configWith({ auth: undefined }))).body).toEqual(refusal);
    });
  });

  describe("when the account already holds the pair", () => {
    it.each([
      ["on", true],
      ["paused", false],
    ])("clears it while %s, without a broker read or any other check", async (_state, enabled) => {
      const broker = brokerFor({ price: undefined, level: 0 });
      const { store } = storeHolding([{ playbookId: "CRWV-WHEEL", enabled }]);
      // Run past the shelf date too: a held pair is never stranded by a rule added later.
      const config = configWith({ ...broker.config, subscriptions: store }, LONG_AFTER);
      expect((await ask(WHEEL, config)).body).toEqual({ ok: true });
      expect(broker.reads.price).not.toHaveBeenCalled();
      expect(broker.reads.level).not.toHaveBeenCalled();
    });
  });

  describe("when a NEW subscription would be refused on the code and the calendar", () => {
    it("says why an id no playbook answers to is refused", async () => {
      const answer = await ask(
        "id=acct-mine&playbookId=NOPE-1&mode=standard&capital=1000",
        configWith(),
      );
      expect(answer.body).toEqual({ ok: false, error: "No playbook is called NOPE-1." });
    });

    it("judges the research's shelf date against the server's own clock", async () => {
      const answer = await ask(
        "id=acct-mine&playbookId=S1-NVDA&mode=standard&capital=1000",
        configWith(brokerFor({ price: 180 }).config, LONG_AFTER),
      );
      expect(answer.body).toMatchObject({
        ok: false,
        error: expect.stringMatching(/research ran past its shelf date \(2027-03-31\)/),
      });
    });

    it("refuses a ticker another option pair on the account already trades", async () => {
      const { store } = storeHolding([{ playbookId: "CRWV-WHEEL" }]);
      const answer = await ask(
        "id=acct-mine&playbookId=CRWV-LONG-CALL&mode=standard&capital=75000",
        configWith({ ...brokerFor().config, subscriptions: store }),
      );
      expect(answer.body).toEqual({
        ok: false,
        error:
          "The wheel already trades CRWV options on this bot; a bot runs one option playbook per symbol.",
      });
    });

    it("counts a pair the bots' own roster runs for this account as held, even unsubscribed", async () => {
      const readHouseRoster = () => ({
        accounts: ["acct-mine"],
        roster: [{ playbookId: "CRWV-WHEEL", mode: "standard" }],
      });
      const answer = await ask(
        "id=acct-mine&playbookId=CRWV-LONG-CALL&mode=standard&capital=75000",
        configWith({ ...brokerFor().config, readHouseRoster }),
      );
      expect(answer.body).toMatchObject({
        ok: false,
        error: expect.stringMatching(/already trades CRWV options/),
      });
    });

    it("ignores a roster the bots reported for other accounts only", async () => {
      const readHouseRoster = () => ({
        accounts: ["acct-other-bot"],
        roster: [{ playbookId: "CRWV-WHEEL", mode: "standard" }],
      });
      const answer = await ask(
        "id=acct-mine&playbookId=CRWV-LONG-CALL&mode=standard&capital=75000",
        configWith({ readHouseRoster }, WEEKEND),
      );
      expect(answer.body).toEqual({ ok: true, options: true });
    });
  });

  describe("when the budget would not fit inside the strategy's allocation", () => {
    const allocations = { wheel: { capitalAllocated: 50_000, updatedAt: "2026-10-01T00:00:00Z" } };

    it("says how far over it goes and how much is left", async () => {
      const { store } = storeHolding([], allocations);
      const answer = await ask(WHEEL, configWith({ ...brokerFor().config, subscriptions: store }));
      expect(answer.body).toEqual({
        ok: false,
        error:
          "That would put $75,000 on the wheel, over the $50,000 you gave it; $50,000 is left for CRWV.",
      });
    });

    it("never reads the broker for a budget it already refuses", async () => {
      const broker = brokerFor();
      const { store } = storeHolding([], allocations);
      await ask(WHEEL, configWith({ ...broker.config, subscriptions: store }));
      expect(broker.reads.price).not.toHaveBeenCalled();
    });

    it("clears a budget that fits inside it", async () => {
      const { store } = storeHolding([], allocations);
      const answer = await ask(
        WHEEL.replace("75000", "50000"),
        configWith({ ...brokerFor().config, subscriptions: store }, WEEKEND),
      );
      expect(answer.body).toMatchObject({ ok: true });
    });
  });

  describe("when the live market and the account are asked", () => {
    it("says so in words when the feed has no price for the ticker", async () => {
      const answer = await ask(WHEEL, configWith(brokerFor({ price: undefined }).config));
      expect(answer.body).toMatchObject({
        ok: false,
        error: expect.stringMatching(/gave no price for CRWV just now.*Try again in a minute/),
      });
    });

    it("refuses an account whose options level is below what the playbook's opens need", async () => {
      const answer = await ask(WHEEL, configWith(brokerFor({ level: 0 }).config));
      expect(answer.body).toEqual({
        ok: false,
        error: "The wheel on CRWV needs options level 1 on this account, and it is at level 0.",
      });
    });

    it("refuses a chain with no liquid contract in session", async () => {
      const answer = await ask(WHEEL, configWith(brokerFor({ extraSpread: 2 }).config));
      expect(answer.body).toEqual({
        ok: false,
        error:
          "The wheel on CRWV can't be taken yet: CRWV's options have no liquid contract right now (a real bid, a tight spread, a fresh quote).",
      });
    });

    it("refuses a budget under one contract's cash, naming both numbers", async () => {
      const answer = await ask(WHEEL.replace("75000", "5000"), configWith(brokerFor().config));
      expect(answer.body).toEqual({
        ok: false,
        error:
          "One contract of the wheel on CRWV ties up about $7,500 right now, and the budget is $5,000. Raise the budget to at least that.",
      });
    });

    it("takes a server with no broker clients at all — nothing read is never a refusal", async () => {
      const answer = await ask(WHEEL, configWith({}, WEEKEND));
      expect(answer.body).toEqual({ ok: true, options: true });
    });
  });

  describe("when an option pair clears in session", () => {
    it("reports one contract's cash and the share of the budget it leaves idle", async () => {
      const answer = await ask(WHEEL, configWith(brokerFor().config));
      expect(answer.status).toBe(200);
      expect(answer.body).toEqual({
        ok: true,
        options: true,
        oneContractCash: 7_500,
        idleShare: 0.9,
      });
    });

    it("reports a budget one contract exactly fills as no idle share", async () => {
      const answer = await ask(WHEEL.replace("75000", "7500"), configWith(brokerFor().config));
      expect(answer.body).toEqual({
        ok: true,
        options: true,
        oneContractCash: 7_500,
        idleShare: 0,
      });
    });
  });

  describe("when an option pair clears outside the regular session", () => {
    it("says it sells options but reports no cash — judged at the open", async () => {
      const answer = await ask(WHEEL, configWith(brokerFor().config, WEEKEND));
      expect(answer.body).toEqual({ ok: true, options: true });
    });

    it("does not judge the budget against a contract nobody could price yet", async () => {
      const answer = await ask(
        WHEEL.replace("75000", "1000"),
        configWith(brokerFor().config, WEEKEND),
      );
      expect(answer.body).toEqual({ ok: true, options: true });
    });
  });

  describe("when a share pair clears", () => {
    it("carries neither the options flag nor a cash figure", async () => {
      const answer = await ask(
        "id=acct-mine&playbookId=S1-NVDA&mode=standard&capital=20000",
        configWith(brokerFor({ price: 180 }).config),
      );
      expect(answer.body).toEqual({ ok: true });
    });
  });

  it("writes nothing, whatever it answers", async () => {
    const held = storeHolding();
    const config = configWith({ ...brokerFor().config, subscriptions: held.store });
    await ask(WHEEL, config);
    await ask(WHEEL.replace("75000", "5000"), config);
    await ask(WHEEL.replace("acct-mine", "acct-theirs"), config);
    expect(held.writes).toEqual([]);
  });
});
