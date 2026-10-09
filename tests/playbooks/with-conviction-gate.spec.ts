import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import type { PairLedger } from "../../src/playbooks/conviction-check.js";
import { withConvictionGate } from "../../src/playbooks/with-conviction-gate.js";
import { aContext, anOptionIntent, aPortfolio, aSubscription } from "../support/builders.js";

/**
 * #4469 criterion 12 — a failed conviction check stops NEW entries and nothing else. The gate is
 * Pause's rule (`pausedMayPlace`): exits and a covered call pass, every other open is dropped.
 */

const CHECK_DAY = "2027-01-29T15:00:00Z";
const conviction = { reason: "my call on CRWV", checkOn: "2027-01-29" };
const sub = aSubscription("sauron", "CRWV-WHEEL", { conviction });

const put = anOptionIntent();
const coveredCall = anOptionIntent({
  option: {
    structure: "covered-call",
    legs: [{ occSymbol: "CRWV270219C00090000", side: "sell", ratio: 1 }],
  },
});
const close = anOptionIntent({
  side: "buy",
  option: {
    effect: "close",
    structure: "close",
    legs: [{ occSymbol: "CRWV270219P00080000", side: "buy", ratio: 1 }],
  },
});
const shareSell: OrderIntent = {
  symbol: "CRWV",
  side: "sell",
  quantity: 100,
  type: "market",
  reason: "exit",
  playbookId: "CRWV-WHEEL",
  playbookMode: "standard",
};
const otherPlaybook = anOptionIntent({ playbookId: "NVDA-CALL-SPREAD" });
const bare: OrderIntent = { ...shareSell, side: "buy", reason: "reflex" };
delete (bare as { playbookId?: string }).playbookId;

const all = [put, coveredCall, close, shareSell, otherPlaybook, bare];
const inner = (intents: readonly OrderIntent[] = all): Persona => ({
  id: "sauron",
  name: "Sauron",
  thesis: "t",
  decide: () => [...intents],
});
const at = (iso: string): MarketContext => aContext({ CRWV: { last: 80 } }, iso);
const book = (): Portfolio => aPortfolio({ positions: [] });
const ledger = (overrides: Partial<PairLedger> = {}): PairLedger => ({
  realizedPl: 100,
  putsClosed: 0,
  putsAssigned: 0,
  ...overrides,
});

describe("withConvictionGate", () => {
  it("is the persona itself when no subscription states a conviction", () => {
    const persona = inner();
    expect(
      withConvictionGate(persona, { subscriptions: [aSubscription("sauron", "CRWV-WHEEL")] }),
    ).toBe(persona);
  });

  it("changes nothing before the check day, and does not read the ledger", () => {
    const ledgerOf = rstest.fn(() => ledger({ realizedPl: -999 }));
    const gated = withConvictionGate(inner(), { subscriptions: [sub], ledgerOf });
    expect(gated.decide(at("2027-01-28T15:00:00Z"), book())).toEqual(all);
    expect(ledgerOf).not.toHaveBeenCalled();
  });

  it("changes nothing when the check passes", () => {
    const gated = withConvictionGate(inner(), {
      subscriptions: [sub],
      ledgerOf: () => ledger({ realizedPl: 230 }),
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual(all);
  });

  it("on a failed check drops the pair's new opens and keeps exits, a covered call and everyone else's orders", () => {
    const log = rstest.fn();
    const gated = withConvictionGate(inner(), {
      subscriptions: [sub],
      ledgerOf: () => ledger({ realizedPl: -50 }),
      log,
    });
    const out = gated.decide(at(CHECK_DAY), book());
    expect(out).toEqual([coveredCall, close, shareSell, otherPlaybook, bare]);
    expect(out).not.toContain(put);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toContain("FAILED");
    expect(log.mock.calls[0]?.[0]).toContain("exits still run");
  });

  it("fails on the wheel's retire test even when the book is in profit", () => {
    const gated = withConvictionGate(inner([put]), {
      subscriptions: [sub],
      ledgerOf: () => ledger({ realizedPl: 900, putsClosed: 4, putsAssigned: 2 }),
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([]);
  });

  it("asks the ledger for the pair's put tag, so only the wheel's sold puts are counted", () => {
    const ledgerOf = rstest.fn(() => ledger());
    withConvictionGate(inner(), { subscriptions: [sub], ledgerOf }).decide(at(CHECK_DAY), book());
    expect(ledgerOf).toHaveBeenCalledWith("CRWV-WHEEL", "crwv-wheel-put");
  });

  it("reads the check once: a book that recovers does not resume the pair until its owner sets a new date", () => {
    let realizedPl = -50;
    const log = rstest.fn();
    const gated = withConvictionGate(inner([put]), {
      subscriptions: [sub],
      ledgerOf: () => ledger({ realizedPl }),
      log,
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([]);
    realizedPl = 5_000;
    expect(gated.decide(at("2027-02-03T15:00:00Z"), book())).toEqual([]);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("a new check date is a new reading: the owner re-dating a failed pair resumes it", () => {
    const redated = aSubscription("sauron", "CRWV-WHEEL", {
      conviction: { reason: "still my call", checkOn: "2027-04-30" },
    });
    const gated = withConvictionGate(inner([put]), {
      subscriptions: [redated],
      ledgerOf: () => ledger({ realizedPl: -50 }),
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
    expect(gated.decide(at("2027-04-30T15:00:00Z"), book())).toEqual([]);
  });

  it("an unread check is not a failed one: with no ledger entries continue, said once", () => {
    const log = rstest.fn();
    const gated = withConvictionGate(inner([put]), { subscriptions: [sub], log });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("leaves a disabled subscription's conviction alone, and passes the persona's other seams through", () => {
    const optionUnderlyings = ["CRWV"];
    const persona: Persona = { ...inner(), optionUnderlyings };
    const paused = aSubscription("sauron", "CRWV-WHEEL", { conviction, enabled: false });
    expect(withConvictionGate(persona, { subscriptions: [paused] })).toBe(persona);
    const gated = withConvictionGate(persona, {
      subscriptions: [sub],
      ledgerOf: () => ledger(),
    });
    expect(gated.optionUnderlyings).toBe(optionUnderlyings);
    expect(gated.id).toBe("sauron");
  });
});
