import { describe, expect, it } from "@rstest/core";
import { VERDICT_WORDS } from "../../app/src/live/heartbeat";
import {
  dataNames,
  type Fact,
  factSheet,
  nyDate,
  occParts,
  parseAmount,
  rowStamp,
  shortDate,
  VERDICT_WORDS_MIRROR,
  weakRegion,
} from "../../scripts/study/worlds/facts-sheet.mjs";

// The world-facts sheet (#4943): what the blind task author may ask a member to find, taken from the
// payloads the member's page is served — so a fact can only be one the page could show — each with
// the oracle's answer shape and the text the page prints where it lives (`answerRegion`).

describe("reading the server's formatted values", () => {
  it("parses amounts, signs (both minus glyphs) and percents", () => {
    expect(parseAmount("$996,966")).toBe(996966);
    expect(parseAmount("+$1,056")).toBe(1056);
    expect(parseAmount("-$412")).toBe(-412);
    expect(parseAmount("−$7,745")).toBe(-7745);
    expect(parseAmount("$-3")).toBe(-3);
    expect(parseAmount("+0.20%")).toBe(0.2);
    expect(parseAmount("130")).toBe(130);
    expect(parseAmount("—")).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });

  it("splits an OCC option symbol", () => {
    expect(occParts("CRWV261106P00080000")).toEqual({
      root: "CRWV",
      expiry: "2026-11-06",
      type: "put",
      strike: 80,
    });
    expect(occParts("NVDA261218C00242500")?.strike).toBe(242.5);
    expect(occParts("NVDA")).toBeNull();
  });

  it("writes the app's short month-day: calendar days as days, instants on New York's clock", () => {
    expect(shortDate("2026-11-06")).toBe("Nov 6");
    // 01:30 UTC on Oct 7 is still Oct 6 in New York, where the world's page reads it.
    expect(shortDate("2026-10-07T01:30:00.000Z")).toBe("Oct 6");
    expect(nyDate("2026-10-07T01:30:00.000Z")).toBe("2026-10-06");
  });

  it("stamps an order as the activity ledger does, on New York's clock", () => {
    // ICU may space "AM" with a narrow no-break space; the oracle's match is whitespace-blind.
    expect(rowStamp("2026-10-05T15:20:00.000Z").replace(/\s/g, " ")).toBe("Oct 5, 11:20 AM");
    expect(rowStamp("2026-10-05T13:05:00.000Z").replace(/\s/g, " ")).toBe("Oct 5, 09:05 AM");
  });

  it("mirrors the app's verdict words exactly", () => {
    expect(VERDICT_WORDS_MIRROR).toEqual(VERDICT_WORDS);
  });

  it("calls a bare short number a weak region", () => {
    expect(weakRegion("130")).toBe(true);
    expect(weakRegion("$255")).toBe(false);
    expect(weakRegion("12,345")).toBe(false);
  });
});

const INSTANT = "2026-10-08T19:00:00.000Z";

const payloads = {
  "/api/accounts/networth": {
    accounts: [
      {
        id: "bot",
        name: "Bot",
        value: "$10,500",
        cash: "$9,000",
        dayChange: "+$50 · +0.48%",
        bookedPl: "+$20",
        onPaper: "-$5",
        windows: [{ label: "1M", value: "-0.64%" }],
      },
    ],
  },
  "/api/desk/bot": {
    desk: {
      id: "bot",
      positions: [
        {
          symbol: "ABC",
          display: "ABC",
          isOption: false,
          quantity: "10",
          costPerShare: "$100.00",
          price: "$105.00",
          totalPl: "+$50",
          nextEvent: { label: "Earnings Nov 1", at: "2026-11-01" },
        },
        {
          symbol: "ABC261106P00080000",
          display: "ABC $80 PUT · 6 NOV 26",
          plainName: "Sold put · profits if ABC stays above $80.00",
          isOption: true,
          quantity: "-1",
          costBasis: "-$255",
          totalPl: "-$295",
          nextEvent: { label: "Earnings Nov 1", at: "2026-11-01" },
        },
      ],
    },
  },
  "/api/desk/bot/heartbeat": {
    heartbeat: {
      playbooks: [
        { playbookId: "P-ONE", mode: "aggressive", state: "no-window" },
        { mode: "standard", state: "tactical" },
      ],
    },
  },
  "/api/desk/bot/activity": {
    activity: [
      {
        orderId: "o1",
        display: "ABC $80 PUT · 6 NOV 26",
        side: "sell",
        quantity: 1,
        filled: 1,
        price: "$2.55",
        at: "2026-10-06T14:31:00.000Z",
        reasoning: { playbookId: "P-ONE", playbookMode: "aggressive" },
      },
      {
        orderId: "o2",
        display: "ABC",
        side: "buy",
        quantity: 10,
        filled: 10,
        price: "$100.00",
        at: "2026-10-05T14:00:00.000Z",
      },
    ],
  },
  "/api/desk/other": { desk: { id: "other", positions: [] } },
  "/api/research/calendar": {
    events: [
      { id: "past", title: "Old print", date: "2026-10-01" },
      { id: "soon", title: "CPI release", date: "2026-10-14" },
      { id: "far", title: "Far print", date: "2026-12-01" },
    ],
  },
};

const sheet = factSheet({ viewer: "member", instant: INSTANT, payloads });
const byId = (id: string): Fact | undefined => sheet.find((f) => f.id === id);

describe("the sheet", () => {
  it("names every fact stably, from ids and symbols", () => {
    expect(sheet.map((f) => f.id)).toEqual(
      expect.arrayContaining([
        "bot.net-worth",
        "bot.cash",
        "bot.ABC.quantity",
        "bot.ABC.average-cost",
        "bot.option.ABC261106P00080000.premium",
        "bot.playbook.P-ONE.verdict",
        "bot.activity.o1.playbook",
        "bot.event.earnings-nov-1.date",
        "calendar.soon.date",
      ]),
    );
    expect(new Set(sheet.map((f) => f.id)).size).toBe(sheet.length);
  });

  it("answers in the oracle's shape, with the region the page prints", () => {
    expect(byId("bot.net-worth")).toMatchObject({
      answer: { kind: "number", value: 10500 },
      answerRegion: ["$10,500"],
      own: true,
    });
    expect(byId("bot.day-change")?.answer).toMatchObject({ value: 50 });
    expect(byId("bot.ABC.average-cost")?.answerRegion).toEqual(["cost $100.00"]);
    expect(byId("bot.ABC.price")?.answerRegion).toEqual(["now $105.00"]);
    expect(byId("bot.ABC.quantity")).toMatchObject({ answer: { value: 10 }, weak: true });
  });

  it("reads an option's side, premium and expiry from the position itself", () => {
    expect(byId("bot.option.ABC261106P00080000.side")?.answer).toEqual({
      kind: "text",
      value: "sold",
    });
    expect(byId("bot.option.ABC261106P00080000.premium")).toMatchObject({
      answer: { value: 255 },
      answerRegion: ["$255"],
    });
    expect(byId("bot.option.ABC261106P00080000.expiry")).toMatchObject({
      answer: { value: "2026-11-06" },
      display: "Nov 6",
    });
  });

  it("gives a playbook's mode and verdict in the app's words, as its table row reads", () => {
    expect(byId("bot.playbook.P-ONE.verdict")).toMatchObject({
      answer: { kind: "text", value: "waiting for its window" },
      answerRegion: ["P-ONE aggressive waiting for its window"],
    });
  });

  it("never invents a playbook the viewer's copy does not carry", () => {
    expect(sheet.filter((f) => f.id.includes(".playbook.")).map((f) => f.id)).toEqual([
      "bot.playbook.P-ONE.mode",
      "bot.playbook.P-ONE.verdict",
    ]);
    expect(byId("bot.activity.o2.playbook")).toBeUndefined();
    expect(byId("bot.activity.o1.playbook")?.answerRegion).toEqual(["P-ONE · aggressive"]);
  });

  it("finds an order's quantity by its row, from its date-and-time cell to the Qty cell", () => {
    const blank = (r?: string[]) => r?.map((x) => x.replace(/\s/g, " "));
    expect(blank(byId("bot.activity.o1.quantity")?.answerRegion)).toEqual([
      "Oct 6, 10:31 AM ABC $80 PUT · 6 NOV 26 SELL 1",
    ]);
    const partial = factSheet({
      viewer: "member",
      instant: INSTANT,
      payloads: {
        "/api/desk/bot": { desk: { id: "bot", positions: [] } },
        "/api/desk/bot/activity": {
          activity: [
            {
              orderId: "p",
              display: "ABC",
              side: "buy",
              quantity: 10,
              filled: 4,
              price: "$1.00",
              at: INSTANT,
            },
          ],
        },
      },
    });
    const p = partial.find((f) => f.id === "bot.activity.p.quantity");
    expect(p?.answer).toMatchObject({ value: 4 });
    expect(blank(p?.answerRegion)).toEqual(["Oct 8, 03:00 PM ABC BUY 4/10"]);
  });

  it("tells two orders of one symbol, side and size apart by their stamp", () => {
    const row = (orderId: string, at: string) => ({
      orderId,
      display: "NVDA",
      side: "buy",
      quantity: 40,
      filled: 40,
      price: "$226.10",
      at,
    });
    const two = factSheet({
      viewer: "member",
      instant: INSTANT,
      payloads: {
        "/api/desk/bot": { desk: { id: "bot", positions: [] } },
        "/api/desk/bot/activity": {
          activity: [row("a", "2026-10-05T15:20:00.000Z"), row("b", "2026-10-02T18:05:00.000Z")],
        },
      },
    });
    const regions = (id: string) => two.find((f) => f.id === id)?.answerRegion;
    for (const fact of ["side", "quantity", "price", "date"]) {
      expect(regions(`bot.activity.a.${fact}`)).not.toEqual(regions(`bot.activity.b.${fact}`));
      expect(two.find((f) => f.id === `bot.activity.a.${fact}`)?.weak).toBe(false);
    }
  });

  it("answers an order's date as the New York day the ledger shows, not the UTC one", () => {
    const late = factSheet({
      viewer: "member",
      instant: INSTANT,
      payloads: {
        "/api/desk/bot": { desk: { id: "bot", positions: [] } },
        "/api/desk/bot/activity": {
          activity: [
            {
              orderId: "late",
              display: "ABC",
              side: "buy",
              quantity: 1,
              filled: 1,
              price: "$1.00",
              // 9:30pm EDT on Oct 5 — already Oct 6 in UTC.
              at: "2026-10-06T01:30:00.000Z",
            },
          ],
        },
      },
    });
    expect(late.find((f) => f.id === "bot.activity.late.date")).toMatchObject({
      answer: { value: "2026-10-05" },
      display: "Oct 5",
    });
  });

  it("lists a shared event once, and calendar events only in the window after the instant", () => {
    expect(sheet.filter((f) => f.id.startsWith("bot.event."))).toHaveLength(1);
    expect(sheet.filter((f) => f.account === "calendar").map((f) => f.id)).toEqual([
      "calendar.soon.date",
    ]);
  });

  it("reads the calendar window on New York's days at both ends", () => {
    // 10:30pm EDT on Oct 7: the window is Oct 7 – Oct 14 in New York, though UTC is already Oct 8.
    const evening = factSheet({
      viewer: "member",
      instant: "2026-10-08T02:30:00.000Z",
      payloads: {
        "/api/research/calendar": {
          events: [
            { id: "first", title: "Day one", date: "2026-10-07" },
            { id: "last", title: "Day seven", date: "2026-10-14" },
            { id: "after", title: "Day eight", date: "2026-10-15" },
          ],
        },
      },
    });
    expect(evening.map((f) => f.id)).toEqual(["calendar.first.date", "calendar.last.date"]);
  });

  it("names the world's own data — accounts, tickers, contracts, playbooks, events", () => {
    expect(dataNames(payloads)).toEqual(
      expect.arrayContaining([
        "bot",
        "Bot",
        "ABC",
        "ABC261106P00080000",
        "ABC $80 PUT · 6 NOV 26",
        "P-ONE",
        "Earnings Nov 1",
        "CPI release",
      ]),
    );
  });

  it("marks a desk the viewer does not own", () => {
    const other = factSheet({
      viewer: "member",
      instant: INSTANT,
      payloads: {
        "/api/accounts/networth": { accounts: [] },
        "/api/desk/bot": payloads["/api/desk/bot"],
      },
    });
    expect(other.every((f) => f.own === false || f.account === "calendar")).toBe(true);
  });
});
