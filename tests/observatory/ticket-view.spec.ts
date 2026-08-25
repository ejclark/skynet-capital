import { STARTER_PLAYS } from "../../src/domain/starter-plays.js";
import { defaultTradeType, tradeTypeByCode } from "../../src/domain/trade-types.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  renderTicketBody,
  type TicketProgression,
  type TicketState,
  ticketHref,
} from "../../src/observatory/ticket-view.js";

const ann: ParticipantSnapshot = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 100_000,
  equity: 100_000,
  positions: [],
  activity: [],
};

const state = (over: Partial<TicketState> = {}): TicketState => ({
  mode: "guided",
  play: defaultTradeType(),
  qty: 1,
  orderType: "limit",
  view: "chart",
  ...over,
});

const cspState = (over: Partial<TicketState> = {}): TicketState =>
  state({
    play: tradeTypeByCode("201") as never,
    symbol: "MSFT",
    expiration: "2026-09-18",
    strike: 420,
    ...over,
  });

const chain = [
  { occSymbol: "MSFT260918P00410000", strike: 410, closePrice: 7.2, openInterest: 120 },
  {
    occSymbol: "MSFT260918P00420000",
    strike: 420,
    bid: 10.5,
    ask: 10.9,
    delta: -0.42,
    openInterest: 812,
  },
  { occSymbol: "MSFT260918P00430000", strike: 430, closePrice: 14.1 },
];

describe("the trade ticket view", () => {
  const wheelsOn = (over: Partial<TicketProgression> = {}): TicketProgression => ({
    wheels: true,
    unlocked: new Set(["101"]),
    earned: new Map(),
    nextUp: "101",
    ...over,
  });

  it("lists every trade type risk-ordered, nothing locked without a signed-in progression", () => {
    const html = renderTicketBody({ state: state(), snapshot: ann, tradingEnabled: true });
    for (const code of ["101", "102", "201", "202", "301", "302"]) {
      expect(html).toContain(`<span class="tk-code">${code}</span>`);
    }
    expect(html).not.toContain("tk-row locked");
    expect(html).not.toContain("skynet.academy.done"); // the localStorage gate is gone for good
    expect(html).not.toContain('name="wheels"'); // nothing to toggle without a progression
  });

  it("locks every rung past the ladder with training wheels on — server truth, no script, no link", () => {
    const html = renderTicketBody({
      state: state(),
      snapshot: ann,
      tradingEnabled: true,
      progression: wheelsOn(),
    });
    expect(html.match(/<span class="tk-row locked/g)).toHaveLength(5); // all but 101
    expect(html).toContain("opens after your first filled 101");
    // lock truth is rendered, never computed client-side — the old script's hooks are gone
    expect(html).not.toContain("data-unlock-course");
    expect(html).not.toContain("data-href");
    expect(html).toContain("🛞 Training wheels ON");
    expect(html).toContain('name="wheels" value="off"'); // the toggle posts the OTHER state
  });

  it("marks earned rungs and unlocks everything with the wheels off", () => {
    const html = renderTicketBody({
      state: state(),
      snapshot: ann,
      tradingEnabled: true,
      progression: {
        wheels: false,
        unlocked: new Set(["101", "102", "201", "202", "301", "302"]),
        earned: new Map([["101", { at: "2026-08-25T14:00:00.000Z" }]]),
      },
    });
    expect(html).not.toContain("tk-row locked");
    expect(html).toContain("✓ earned");
    expect(html).toContain('name="wheels" value="on"');
  });

  it("renders the honest locked panel — no order form — when the selected play is locked", () => {
    const html = renderTicketBody({
      state: cspState(),
      snapshot: ann,
      tradingEnabled: true,
      progression: wheelsOn(),
      chain,
    });
    expect(html).toContain("Course 201");
    expect(html).toContain("is still locked");
    expect(html).toContain("opens after your first filled");
    expect(html).not.toContain("2 · Shape it");
    expect(html).not.toContain('name="confirm"');
  });

  it("is honest about a session with no linked account, and about trading being off", () => {
    const unlinked = renderTicketBody({ state: state(), tradingEnabled: true });
    expect(unlinked).toContain("No linked account");
    const off = renderTicketBody({ state: state(), snapshot: ann, tradingEnabled: false });
    expect(off).toContain("needs sign-in configured");
  });

  it("stock plays render the share ticket that POSTs to the review step", () => {
    const html = renderTicketBody({ state: state(), snapshot: ann, tradingEnabled: true });
    expect(html).toContain('name="action" value="buy"');
    expect(html).toContain('name="quantity"');
  });

  it("option plays render the chain with the chosen strike selected and honest numbers", () => {
    const html = renderTicketBody({
      state: cspState(),
      snapshot: ann,
      tradingEnabled: true,
      expirations: ["2026-09-18", "2026-10-16"],
      chain,
      spot: 428.6,
    });
    expect(html).toContain("Premium by strike");
    expect(html).toContain("2026-10-16"); // the other expiration chip is a link
    expect(html).toContain("cash-secured"); // the guided explainer
    expect(html).toContain("Max loss");
    expect(html).toContain("Review order");
    expect(html).toContain("review always comes first");
  });

  it("the table view lists bid/ask/delta/open interest with a gloss", () => {
    const html = renderTicketBody({
      state: cspState({ view: "table" }),
      snapshot: ann,
      tradingEnabled: true,
      chain,
      expirations: ["2026-09-18"],
    });
    expect(html).toContain("Δ delta");
    expect(html).toContain("◂ yours");
    expect(html).toContain("812");
  });

  it("renders the chain note instead of a dead chain when data can't load", () => {
    const html = renderTicketBody({
      state: cspState(),
      snapshot: ann,
      tradingEnabled: true,
      chainNote: "Couldn't load the option chain right now — offline.",
    });
    expect(html).toContain("Couldn't load the option chain");
  });
});

describe("ticketHref", () => {
  it("round-trips state into shareable URLs, omitting defaults", () => {
    expect(ticketHref(state())).toBe("/trade?play=101");
    expect(ticketHref(cspState({ qty: 2 }))).toBe(
      "/trade?play=201&symbol=MSFT&exp=2026-09-18&strike=420&qty=2",
    );
    expect(ticketHref(cspState(), { strike: "430", limit: undefined })).toContain("strike=430");
  });
});

describe("the starter-play bar", () => {
  it("offers all three starter plays as plain ?starter= links in guided mode", () => {
    const html = renderTicketBody({ state: state(), snapshot: ann, tradingEnabled: true });
    for (const p of STARTER_PLAYS) {
      expect(html).toContain(`href="/trade?starter=${p.id}"`);
      expect(html).toContain(p.title);
      expect(html).toContain(p.detail);
    }
  });

  it("marks the chip that filled the ticket as active", () => {
    const html = renderTicketBody({
      state: state({ starter: "qqq25", symbol: "QQQ", qty: 25 }),
      snapshot: ann,
      tradingEnabled: true,
    });
    expect(html).toContain('class="st-chip sel" aria-current="true" href="/trade?starter=qqq25"');
  });

  it("keeps the bar out of raw mode — the power-user surface stays clean", () => {
    const html = renderTicketBody({
      state: state({ mode: "raw" }),
      snapshot: ann,
      tradingEnabled: true,
    });
    expect(html).not.toContain('class="st-bar"');
  });
});
