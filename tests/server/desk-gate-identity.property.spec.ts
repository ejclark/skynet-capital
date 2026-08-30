import fc from "fast-check";
import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { Participant } from "../../src/participants/participant.js";
import { bindAccountIdentityGate } from "../../src/server/account-identity-gate.js";
import { createOptionTradeService } from "../../src/server/option-trade-service.js";
import { createTradeService } from "../../src/server/trade-service.js";

/**
 * PROPERTY-BASED PROOF of `account-identity-gate.ts`'s one job: for ANY distinct
 * (participantId, requesterId) pair, no order reaches the broker. This is regression insurance,
 * not the enforcement mechanism itself — the enforcement is architectural (#928 slice 3):
 * `trade-service.ts`/`option-trade-service.ts` never hold a raw client factory, only a bound
 * `VerifyAccess` closure, so there is no code path in either open file that can construct an
 * unverified client at all. This suite exists to catch a regression INSIDE the gate itself
 * (`verifyOwnAccount`), which does still get edited from time to time and is worth checking
 * against a generated space of id strings, not a handful of hand-picked examples.
 *
 * A POSITIVE CONTROL sits alongside the negative property (requesterId === participantId, a
 * valid order) — a property suite that refused everything would vacuously pass the negative
 * property, so this suite is not trustworthy evidence unless it also proves the desk can say yes.
 */

const ann: Participant = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

const putContract = {
  symbol: "MSFT260918P00420000",
  expiration_date: "2026-09-18",
  strike_price: "420",
  close_price: "3.50",
  underlying_price: "418.00",
};

/** Tracks every order/contract call so the property can assert on absence, not just a refusal
 *  string — a refusal the code forgot to also skip the broker call would still show up here. */
function trackedTransport(orders: Array<{ path: string; body: unknown }>): AlpacaTradingTransport {
  const inner = new FixtureTradingTransport({
    account: {
      id: "acct",
      cash: "100000",
      portfolio_value: "100000",
      status: "ACTIVE",
      options_trading_level: 2,
    },
    positions: [],
  });
  return {
    get: (path): Promise<JsonResponse> => {
      if (path.startsWith("/v2/options/contracts")) {
        return Promise.resolve({ status: 200, body: { option_contracts: [putContract] } });
      }
      return inner.get(path);
    },
    post: (path, body): Promise<JsonResponse> => {
      orders.push({ path, body });
      return Promise.resolve({
        status: 200,
        body: { id: "order-1", symbol: "NVDA", status: "accepted" },
      });
    },
    delete: (path): Promise<JsonResponse> => inner.delete(path),
  };
}

function verifyAccessFor(t: AlpacaTradingTransport) {
  return bindAccountIdentityGate({
    tradingEnabled: true,
    findParticipant: (id) => (id === "ann" ? ann : undefined),
    clientFactory: () => new AlpacaTradingClient(t),
    optionsClientFactory: () => new AlpacaOptionsClient(t),
  });
}

/** Any string an id-shaped value could plausibly be, including the awkward ones a hand-picked
 *  example set tends to skip: empty, whitespace, unicode, and values differing only by case. */
const idArb = fc.oneof(
  fc.constantFrom("", " ", "ann", "Ann", "ANN", "ann ", " ann", "joe", "ann​", "🙂"),
  fc.string({ minLength: 0, maxLength: 20 }),
);

describe("desk identity invariant — share desk (createTradeService)", () => {
  it("never reaches the broker for ANY requester that isn't the account's own id", async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb,
        fc.option(idArb, { nil: undefined }),
        async (participantId, requesterId) => {
          fc.pre(requesterId !== participantId);
          const orders: Array<{ path: string; body: unknown }> = [];
          const submit = createTradeService({
            verifyAccess: verifyAccessFor(trackedTransport(orders)),
          });
          const result = await submit(
            { participantId, symbol: "NVDA", quantity: 1, action: "buy" },
            requesterId,
          );
          expect(orders).toHaveLength(0);
          expect(result.ok).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("POSITIVE CONTROL — the desk DOES place the order when the requester is the account owner", async () => {
    const orders: Array<{ path: string; body: unknown }> = [];
    const submit = createTradeService({ verifyAccess: verifyAccessFor(trackedTransport(orders)) });
    const result = await submit(
      { participantId: "ann", symbol: "NVDA", quantity: 1, action: "buy" },
      "ann",
    );
    expect(result).toMatchObject({ ok: true });
    expect(orders).toHaveLength(1);
  });
});

describe("desk identity invariant — options desk (createOptionTradeService)", () => {
  it("never reaches the broker for ANY requester that isn't the account's own id", async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb,
        fc.option(idArb, { nil: undefined }),
        async (participantId, requesterId) => {
          fc.pre(requesterId !== participantId);
          const orders: Array<{ path: string; body: unknown }> = [];
          const submit = createOptionTradeService({
            verifyAccess: verifyAccessFor(trackedTransport(orders)),
          });
          const result = await submit(
            {
              kind: "open",
              participantId,
              code: "201",
              underlying: "MSFT",
              contracts: 1,
              strike: 420,
              expiration: "2026-09-18",
              orderType: "market",
            },
            requesterId,
          );
          expect(orders).toHaveLength(0);
          expect(result.ok).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("POSITIVE CONTROL — the options desk DOES place the order when the requester is the account owner", async () => {
    const orders: Array<{ path: string; body: unknown }> = [];
    const submit = createOptionTradeService({
      verifyAccess: verifyAccessFor(trackedTransport(orders)),
    });
    const result = await submit(
      {
        kind: "open",
        participantId: "ann",
        code: "201",
        underlying: "MSFT",
        contracts: 1,
        strike: 420,
        expiration: "2026-09-18",
        orderType: "market",
      },
      "ann",
    );
    expect(result).toMatchObject({ ok: true });
    expect(orders).toHaveLength(1);
  });
});

describe("desk identity invariant — trading switched off refuses before identity even matters", () => {
  it("refuses every request, including the account's own owner, when tradingEnabled is false", async () => {
    const orders: Array<{ path: string; body: unknown }> = [];
    const verifyAccess = bindAccountIdentityGate({
      tradingEnabled: false,
      findParticipant: (id) => (id === "ann" ? ann : undefined),
      clientFactory: () => new AlpacaTradingClient(trackedTransport(orders)),
      optionsClientFactory: () => new AlpacaOptionsClient(trackedTransport(orders)),
    });
    const submit = createTradeService({ verifyAccess });
    const result = await submit(
      { participantId: "ann", symbol: "NVDA", quantity: 1, action: "buy" },
      "ann",
    );
    expect(result.ok).toBe(false);
    expect(orders).toHaveLength(0);
  });
});
