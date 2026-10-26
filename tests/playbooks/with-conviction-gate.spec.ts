import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import type { PairLedger } from "../../src/playbooks/conviction-check.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { withConvictionGate } from "../../src/playbooks/with-conviction-gate.js";
import { pairView } from "../../src/subscriptions/pair-conviction.js";
import { aContext, anOptionIntent, aPortfolio, aSubscription } from "../support/builders.js";

/**
 * #4469 criterion 12 — a failed conviction check stops NEW entries and nothing else. The gate is
 * Pause's rule (`pausedMayPlace`): exits and a covered call pass, every other open is dropped.
 *
 * An owner's own reason and day are a view stated on its one pair (#5482 contract piece 3), and the
 * bots read pointers only (piece 4), so the owner's check here is a pointer at that view.
 */

const CHECK_DAY = "2027-01-29T15:00:00Z";
const conviction = { reason: "my call on CRWV", checkOn: "2027-01-29" };
const ownView = (checkOn = conviction.checkOn): Conviction =>
  pairView({
    accountId: "sauron",
    playbookId: "CRWV-WHEEL",
    conviction: { ...conviction, checkOn },
    owner: "Sauron",
    statedOn: "2026-10-16",
  });
const OWN = ownView();
const sub = aSubscription("sauron", "CRWV-WHEEL", { convictionId: OWN.id });
/** The gate over the owner's own view, with `checkOn` its stated day. */
const gateOwn = (
  persona: Persona,
  deps: Omit<Parameters<typeof withConvictionGate>[1], "convictionOf">,
  checkOn = conviction.checkOn,
) =>
  withConvictionGate(persona, {
    convictionOf: (id) => (id === OWN.id ? ownView(checkOn) : undefined),
    ...deps,
  });

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

  // A ◆ pair with no pointer gives no check day; the roster runs it exits-only.
  it("gives a ◆ pair with no pointer no check day, and says so once", () => {
    const log = rstest.fn();
    const persona = inner([put]);
    const inline = aSubscription("sauron", "CRWV-WHEEL");
    const gated = withConvictionGate(persona, {
      subscriptions: [inline],
      ledgerOf: () => ledger({ realizedPl: -50 }),
      log,
    });
    expect(gated).toBe(persona);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toContain("its conviction is not on a view yet");
    expect(log.mock.calls[0]?.[0]).toContain("opens nothing new meanwhile");
  });

  it("changes nothing before the check day, and does not read the ledger", () => {
    const ledgerOf = rstest.fn(() => ledger({ realizedPl: -999 }));
    const gated = gateOwn(inner(), { subscriptions: [sub], ledgerOf });
    expect(gated.decide(at("2027-01-28T15:00:00Z"), book())).toEqual(all);
    expect(ledgerOf).not.toHaveBeenCalled();
  });

  it("changes nothing when the check passes", () => {
    const gated = gateOwn(inner(), {
      subscriptions: [sub],
      ledgerOf: () => ledger({ realizedPl: 230 }),
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual(all);
  });

  it("on a failed check drops the pair's new opens and keeps exits, a covered call and everyone else's orders", () => {
    const log = rstest.fn();
    const gated = gateOwn(inner(), {
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
    const gated = gateOwn(inner([put]), {
      subscriptions: [sub],
      ledgerOf: () => ledger({ realizedPl: 900, putsClosed: 4, putsAssigned: 2 }),
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([]);
  });

  it("asks the ledger for the pair's put tag, so only the wheel's sold puts are counted", () => {
    const ledgerOf = rstest.fn(() => ledger());
    gateOwn(inner(), { subscriptions: [sub], ledgerOf }).decide(at(CHECK_DAY), book());
    expect(ledgerOf).toHaveBeenCalledWith("CRWV-WHEEL", "crwv-wheel-put");
  });

  it("reads the check once: a book that recovers does not resume the pair until its owner sets a new date", () => {
    let realizedPl = -50;
    const log = rstest.fn();
    const gated = gateOwn(inner([put]), {
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
    // Restating the day replaces the view in place: the same id, a new day.
    const gated = gateOwn(
      inner([put]),
      { subscriptions: [sub], ledgerOf: () => ledger({ realizedPl: -50 }) },
      "2027-04-30",
    );
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
    expect(gated.decide(at("2027-04-30T15:00:00Z"), book())).toEqual([]);
  });

  it("an unread check is not a failed one: with no ledger entries continue, said once", () => {
    const log = rstest.fn();
    const gated = gateOwn(inner([put]), { subscriptions: [sub], log });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("an unmarked held position leaves the check unread: entries continue, nothing latches, the next cycle reads it", () => {
    const log = rstest.fn();
    const shares = aPortfolio({
      positions: [{ symbol: "CRWV", quantity: 100, avgPrice: 80 }],
    });
    const gated = gateOwn(inner([put]), {
      subscriptions: [sub],
      ledgerOf: () => ledger({ realizedPl: 230 }),
      log,
    });
    const unquoted: MarketContext = { ...at(CHECK_DAY), quotes: {} };
    expect(gated.decide(unquoted, shares)).toEqual([put]);
    expect(gated.decide(unquoted, shares)).toEqual([put]);
    expect(log).toHaveBeenCalledTimes(1);
    // The mark arrives: shares bought at 80 now at 76.5 lose $350 against $230 of premium.
    expect(gated.decide(aContext({ CRWV: { last: 76.5 } }, CHECK_DAY), shares)).toEqual([]);
  });

  it("leaves a disabled subscription's conviction alone, and passes the persona's other seams through", () => {
    const optionUnderlyings = ["CRWV"];
    const persona: Persona = { ...inner(), optionUnderlyings };
    const paused = aSubscription("sauron", "CRWV-WHEEL", { convictionId: OWN.id, enabled: false });
    expect(gateOwn(persona, { subscriptions: [paused] })).toBe(persona);
    const gated = gateOwn(persona, {
      subscriptions: [sub],
      ledgerOf: () => ledger(),
    });
    expect(gated.optionUnderlyings).toBe(optionUnderlyings);
    expect(gated.id).toBe("sauron");
  });
});

/**
 * #5482 slice 2 — a subscription may point at a conviction record. When the record steers its pair,
 * the record's check date gates it; otherwise the subscription's own conviction does, as before.
 */
describe("withConvictionGate, with a conviction record", () => {
  const record = (steers: readonly string[], checkOn = "2027-03-31"): Conviction => ({
    id: "ai-dip-test",
    owner: "Eric",
    statedOn: "2026-10-16",
    checkOn,
    claims: [],
    steers,
  });
  const lookup = (steers: readonly string[]) => (id: string) =>
    id === "ai-dip-test" ? record(steers) : undefined;
  const failing = { ledgerOf: () => ledger({ realizedPl: -50 }) };

  it("checks a pointed subscription on the record's date, not its own", () => {
    const pointed = aSubscription("sauron", "CRWV-WHEEL", { convictionId: "ai-dip-test" });
    const gated = withConvictionGate(inner([put]), {
      subscriptions: [pointed],
      convictionOf: lookup(["CRWV-WHEEL"]),
      ...failing,
    });
    // Its own date (01-29) has passed, the record's (03-31) has not: entries continue.
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
    expect(gated.decide(at("2027-03-31T15:00:00Z"), book())).toEqual([]);
  });

  it("gates a pointed subscription that states no conviction of its own", () => {
    const pointed = aSubscription("sauron", "CRWV-WHEEL", { convictionId: "ai-dip-test" });
    const persona = inner([put]);
    const gated = withConvictionGate(persona, {
      subscriptions: [pointed],
      convictionOf: lookup(["CRWV-WHEEL"]),
      ...failing,
    });
    expect(gated).not.toBe(persona);
    expect(gated.decide(at("2027-03-31T15:00:00Z"), book())).toEqual([]);
  });

  it("one record's date gates every pair it steers", () => {
    const longCall = anOptionIntent({ playbookId: "CRWV-LONG-CALL" });
    const gated = withConvictionGate(inner([put, longCall]), {
      subscriptions: [
        aSubscription("sauron", "CRWV-WHEEL", { convictionId: "ai-dip-test" }),
        aSubscription("sauron", "CRWV-LONG-CALL", { convictionId: "ai-dip-test" }),
      ],
      convictionOf: lookup(["CRWV-WHEEL", "CRWV-LONG-CALL"]),
      ...failing,
    });
    expect(gated.decide(at("2027-03-30T15:00:00Z"), book())).toEqual([put, longCall]);
    expect(gated.decide(at("2027-03-31T15:00:00Z"), book())).toEqual([]);
  });

  it("never reads the subscription's own date, said once, when the record does not steer the pair", () => {
    // The contract step's piece 2: a pointed pair is checked on its pointer alone. One it cannot
    // use gives no check day here; the roster runs that pair exits-only (`steeredBy`).
    const log = rstest.fn();
    const persona = inner([put]);
    const pointed = aSubscription("sauron", "CRWV-WHEEL", { convictionId: "ai-dip-test" });
    const gated = withConvictionGate(persona, {
      subscriptions: [pointed],
      convictionOf: lookup(["CRWV-LONG-CALL"]),
      log,
      ...failing,
    });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toContain("does not steer it");
    expect(log.mock.calls[0]?.[0]).toContain("opens nothing new meanwhile");
    expect(gated).toBe(persona);
  });

  it("gates a pointed pair the same with or without its inline copy", () => {
    const bare = aSubscription("sauron", "CRWV-WHEEL", { convictionId: "ai-dip-test" });
    for (const subscriptions of [[bare], [{ ...bare, conviction }]]) {
      const gated = withConvictionGate(inner([put]), {
        subscriptions,
        convictionOf: lookup(["CRWV-WHEEL"]),
        ...failing,
      });
      expect(gated.decide(at(CHECK_DAY), book())).toEqual([put]);
      expect(gated.decide(at("2027-03-31T15:00:00Z"), book())).toEqual([]);
    }
  });

  it("an unknown pointer with no conviction of its own gates nothing", () => {
    const persona = inner([put]);
    const pointed = aSubscription("sauron", "CRWV-WHEEL", { convictionId: "gone" });
    expect(
      withConvictionGate(persona, { subscriptions: [pointed], convictionOf: lookup([]) }),
    ).toBe(persona);
  });
});

/**
 * #5482 criterion 5 — a record's check is read over every pair it steers, together. When it
 * fails, every one of them stops new entries; exits never stop.
 */
describe("withConvictionGate, a record's check across the pairs it steers", () => {
  const view: Conviction = {
    id: "ai-dip-test",
    owner: "Eric",
    statedOn: "2026-10-16",
    checkOn: "2027-01-29",
    claims: [],
    steers: ["CRWV-WHEEL", "CRWV-LONG-CALL"],
  };
  const convictionOf = (id: string) => (id === view.id ? view : undefined);
  const wheel = aSubscription("sauron", "CRWV-WHEEL", { convictionId: view.id });
  const longCall = aSubscription("sauron", "CRWV-LONG-CALL", { convictionId: view.id });
  const wheelPut = anOptionIntent({ playbookId: "CRWV-WHEEL" });
  const callOpen = anOptionIntent({ playbookId: "CRWV-LONG-CALL" });
  const callClose = anOptionIntent({
    playbookId: "CRWV-LONG-CALL",
    side: "sell",
    option: {
      effect: "close",
      structure: "close",
      legs: [{ occSymbol: "CRWV270318C00090000", side: "sell", ratio: 1 }],
    },
  });
  const orders = [wheelPut, callOpen, callClose, shareSell];
  const pairs = (realized: Readonly<Record<string, number>>) => ({
    ledgerOf: (id: string) => ledger({ realizedPl: realized[id] ?? 0 }),
  });
  const gate = (
    subscriptions = [wheel, longCall],
    intents: readonly OrderIntent[] = orders,
    deps: Partial<Parameters<typeof withConvictionGate>[1]> = {},
  ) => withConvictionGate(inner(intents), { subscriptions, convictionOf, ...deps });

  it("holds when the pairs together are in profit, even though one of them alone is under water", () => {
    const gated = gate(undefined, undefined, pairs({ "CRWV-WHEEL": -50, "CRWV-LONG-CALL": 200 }));
    expect(gated.decide(at(CHECK_DAY), book())).toEqual(orders);
  });

  it("fails every pair it steers when they are under water together, and keeps their exits", () => {
    const log = rstest.fn();
    const gated = gate(undefined, undefined, {
      ...pairs({ "CRWV-WHEEL": 100, "CRWV-LONG-CALL": -300 }),
      log,
    });
    // The wheel alone is in profit; the view is judged on both, so it stops too.
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([callClose, shareSell]);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toContain('conviction "ai-dip-test" (2027-01-29) check FAILED');
    expect(log.mock.calls[0]?.[0]).toContain("-$200.00 together");
    expect(log.mock.calls[0]?.[0]).toContain("exits still run");
  });

  it("does not touch orders for pairs the record does not steer", () => {
    const other = anOptionIntent({ playbookId: "NVDA-CALL-SPREAD" });
    const gated = gate(undefined, [wheelPut, other, bare], pairs({ "CRWV-WHEEL": -500 }));
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([other, bare]);
  });

  it("stops the wheel on its own retire test while the view holds, and leaves the long call open", () => {
    const log = rstest.fn();
    const gated = gate(undefined, undefined, {
      ledgerOf: (id: string) =>
        id === "CRWV-WHEEL"
          ? ledger({ realizedPl: 900, putsClosed: 4, putsAssigned: 2 })
          : ledger({ realizedPl: 10 }),
      log,
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([callOpen, callClose, shareSell]);
    // The line says the view held; it is the wheel's own test that stopped the wheel.
    const said = String(log.mock.calls[0]?.[0]);
    expect(said).toContain("check passed");
    expect(said).not.toContain("FAILED");
    expect(said).toContain("no new entries on CRWV-WHEEL");
  });

  it("keeps the wheel selling when the record's owner accepts assignment and the pairs are in profit", () => {
    const accepting: Conviction = { ...view, acceptsAssignment: true };
    const gated = gate(undefined, undefined, {
      convictionOf: (id: string) => (id === view.id ? accepting : undefined),
      ledgerOf: (id: string) =>
        id === "CRWV-WHEEL"
          ? ledger({ realizedPl: 900, putsClosed: 4, putsAssigned: 2 })
          : ledger({ realizedPl: 10 }),
    });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual(orders);
  });

  it("counts a paused pair's loss: pausing a loser does not hide it from the view", () => {
    const paused = aSubscription("sauron", "CRWV-LONG-CALL", {
      convictionId: view.id,
      enabled: false,
    });
    const gated = gate(
      [wheel, paused],
      undefined,
      pairs({ "CRWV-WHEEL": 100, "CRWV-LONG-CALL": -300 }),
    );
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([callClose, shareSell]);
  });

  it("is the persona itself when every pair the record steers is paused", () => {
    const persona = inner();
    const paused = aSubscription("sauron", "CRWV-WHEEL", { convictionId: view.id, enabled: false });
    expect(withConvictionGate(persona, { subscriptions: [paused], convictionOf })).toBe(persona);
  });

  it("reads nothing before the date and once after it: a recovered book does not resume the pairs", () => {
    let realized = -300;
    const ledgerOf = rstest.fn(() => ledger({ realizedPl: realized }));
    const gated = gate(undefined, undefined, { ledgerOf });
    expect(gated.decide(at("2027-01-28T15:00:00Z"), book())).toEqual(orders);
    expect(ledgerOf).not.toHaveBeenCalled();
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([callClose, shareSell]);
    realized = 5_000;
    expect(gated.decide(at("2027-02-03T15:00:00Z"), book())).toEqual([callClose, shareSell]);
  });

  it("leaves the check unread while a held position has no mark, then reads it", () => {
    const shares = aPortfolio({ positions: [{ symbol: "CRWV", quantity: 100, avgPrice: 80 }] });
    const gated = gate(undefined, undefined, pairs({ "CRWV-WHEEL": 100, "CRWV-LONG-CALL": 100 }));
    const unquoted: MarketContext = { ...at(CHECK_DAY), quotes: {} };
    expect(gated.decide(unquoted, shares)).toEqual(orders);
    // Both pairs read the one CRWV book: 100 shares at 80 now 76.5 lose $350 against $100 each.
    expect(gated.decide(aContext({ CRWV: { last: 76.5 } }, CHECK_DAY), shares)).toEqual([
      callClose,
      shareSell,
    ]);
  });

  it("with no decision store entries continue, said once", () => {
    const log = rstest.fn();
    const gated = gate(undefined, undefined, { log });
    expect(gated.decide(at(CHECK_DAY), book())).toEqual(orders);
    gated.decide(at(CHECK_DAY), book());
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("reads a pair on its owner's own view alone, beside a record's group", () => {
    const own = aSubscription("sauron", "CRWV-WHEEL", { convictionId: OWN.id });
    const gated = gate([own, longCall], undefined, {
      ...pairs({ "CRWV-WHEEL": -50, "CRWV-LONG-CALL": 500 }),
      convictionOf: (id: string) => (id === OWN.id ? OWN : convictionOf(id)),
    });
    // The wheel's own check fails by itself; the long call's record holds on its own book.
    expect(gated.decide(at(CHECK_DAY), book())).toEqual([callOpen, callClose, shareSell]);
  });
});
