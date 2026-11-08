import { existsSync, readFileSync } from "node:fs";
import {
  type Card,
  type Choice,
  choose,
  type EventsCard,
  FAST_TRACK_TAP_BUDGET,
  type FastTrackEvent,
  type FastTrackInput,
  type FieldCard,
  NOT_COVERED,
  NOT_RESEARCHED,
  nextStep,
  rankEvents,
  startFastTrack,
  type Walk,
  WHATS_COMING_UP,
} from "../../src/domain/fast-track.js";
import { eventsWithin, type MarketEvent } from "../../src/domain/market-events.js";
import { fastTrackEventOf } from "../../src/server/fast-track-ledger.js";

/** The first fast track (#7034 slice 1): one card per empty field of the outcome, 5 taps to a ticket. */

const ASOF = "2026-11-07";

const event = (over: Partial<MarketEvent> & Pick<MarketEvent, "id">): MarketEvent => ({
  kind: "earnings",
  title: `${over.id} title`,
  date: "2026-11-17",
  status: "confirmed",
  source: "IR: fixture",
  impact: "critical",
  symbols: [],
  ...over,
});

const nvda: FastTrackEvent = {
  event: event({ id: "nvda-print", title: "NVDA earnings print", symbols: ["NVDA"] }),
  stance: "Stand aside",
  killSwitches: [
    "Reaction-day open→close green on this print → two straight greens retire the fade",
  ],
};

const input = (over: Partial<FastTrackInput> = {}): FastTrackInput => ({
  asOf: ASOF,
  events: [nvda],
  book: { held: ["NVDA"], watched: [] },
  ...over,
});

const card = (walk: Walk, i: FastTrackInput): Card => {
  const step = nextStep(walk, i);
  if (!("card" in step)) throw new Error(`expected a card, got ${JSON.stringify(step)}`);
  return step.card;
};

const eventsCard = (walk: Walk, i: FastTrackInput): EventsCard => {
  const c = card(walk, i);
  if (c.field !== "event") throw new Error(`expected the events card, got ${c.field}`);
  return c;
};

const fieldCard = (walk: Walk, i: FastTrackInput): FieldCard => {
  const c = card(walk, i);
  if (c.field === "event") throw new Error("expected a field card, got the events card");
  return c;
};

/** Tap the first option on each field card until the outcome completes. */
function walkToTicket(i: FastTrackInput, planId: string): Walk {
  let walk = startFastTrack();
  walk = choose(walk, eventsCard(walk, i), { option: planId });
  for (let guard = 0; guard < 10; guard++) {
    const step = nextStep(walk, i);
    if ("complete" in step) return walk;
    const c = step.card;
    if (c.field === "event") throw new Error("walk fell back to the events card");
    const first = c.options[0];
    const choice: Choice = first ? { option: first.id } : { own: "my own answer" };
    walk = choose(walk, c, choice);
  }
  throw new Error("walk never completed");
}

describe("fast track — the card walk engine", () => {
  describe("the first card: what's coming up", () => {
    it("asks the fast track's own question, names what it does not cover, and offers both escapes", () => {
      const c = eventsCard(startFastTrack(), input());
      expect(c.question).toBe(WHATS_COMING_UP);
      expect(c.notCovered).toBe(NOT_COVERED);
      expect(c.ownAnswer && c.addContext).toBe(true);
    });

    it("shows at most 3 events, the member's names first, then by impact, and folds the rest", () => {
      const events: FastTrackEvent[] = [
        {
          event: event({ id: "cpi", kind: "macro-print", impact: "high", date: "2026-11-10" }),
          killSwitches: [],
        },
        {
          event: event({ id: "opex", kind: "opex", impact: "medium", date: "2026-11-08" }),
          killSwitches: [],
        },
        { event: event({ id: "late", impact: "critical", date: "2026-11-30" }), killSwitches: [] },
        { event: event({ id: "aapl", symbols: ["AAPL"], impact: "low" }), killSwitches: [] },
        nvda,
      ];
      const c = eventsCard(
        startFastTrack(),
        input({ events, book: { held: ["NVDA"], watched: ["AAPL"] } }),
      );
      // "late" is past the 14-day horizon, so four qualify and one folds.
      expect(c.rows.map((r) => r.id)).toEqual(["nvda-print", "aapl", "cpi"]);
      expect(c.more).toBe(1);
    });

    it("labels each date in words, and says so when the house has written no stance", () => {
      const est: FastTrackEvent = {
        event: event({ id: "est", status: "estimate", symbols: ["CRWV"] }),
        killSwitches: [],
      };
      const c = eventsCard(startFastTrack(), input({ events: [nvda, est] }));
      expect(c.rows.map((r) => [r.dateWords, r.stance])).toEqual([
        ["date confirmed", "Stand aside"],
        ["date is an estimate", NOT_RESEARCHED],
      ]);
    });

    it("offers an estimate-dated event only Watch and Ask what we know", () => {
      const est: FastTrackEvent = {
        event: event({ id: "est", status: "estimate", symbols: ["CRWV"] }),
        killSwitches: [],
      };
      const [row] = eventsCard(startFastTrack(), input({ events: [est] })).rows;
      expect(row?.actions.map((a) => a.label)).toEqual(["Watch CRWV", "Ask what we know"]);
    });

    it("offers a market-wide event only Ask what we know — there is no name to watch or trade", () => {
      const cpi: FastTrackEvent = {
        event: event({ id: "cpi", kind: "macro-print", symbols: [] }),
        killSwitches: [],
      };
      const [row] = eventsCard(startFastTrack(), input({ events: [cpi] })).rows;
      expect(row?.actions.map((a) => a.label)).toEqual(["Ask what we know"]);
    });

    it("offers a multi-name event's actions on the member's own names, so no tap asks which one", () => {
      const sector: FastTrackEvent = {
        event: event({ id: "auction", kind: "sector", symbols: ["VST", "CEG", "NRG", "TLN"] }),
        killSwitches: [],
      };
      const [row] = eventsCard(
        startFastTrack(),
        input({ events: [sector], book: { held: ["NRG"], watched: [] } }),
      ).rows;
      expect(row?.actions.map((a) => a.label)).toEqual([
        "Watch NRG",
        "Plan a move on NRG",
        "Ask what we know",
      ]);
    });

    it("drops an event its own lane retired as a re-slug", () => {
      const dup: FastTrackEvent = {
        event: event({ id: "dup", supersededBy: "nvda-print" }),
        killSwitches: [],
      };
      expect(rankEvents(input({ events: [nvda, dup] })).map((e) => e.event.id)).toEqual([
        "nvda-print",
      ]);
    });
  });

  describe("the fold and a moving calendar", () => {
    const many: FastTrackEvent[] = ["a", "b", "c", "d"].map((id) => ({
      event: event({ id, symbols: [id.toUpperCase()] }),
      killSwitches: [],
    }));

    it("keeps a folded event pickable once the member opens the fold", () => {
      const i = input({ events: many, book: { held: [], watched: [] } });
      const c = eventsCard(startFastTrack(), i);
      expect(c.folded.map((r) => r.id)).toEqual(["d"]);
      const walk = choose(startFastTrack(), c, { option: "plan:d:D" });
      expect(walk.kind).toBe("ticket");
      expect(fieldCard(walk, i).field).toBe("stop");
    });

    it("sends a planned move back to the event card when its date slips to an estimate", () => {
      let walk = startFastTrack();
      walk = choose(walk, eventsCard(walk, input()), { option: "plan:nvda-print:NVDA" });
      const slipped = { ...nvda, event: { ...nvda.event, status: "estimate" as const } };
      expect(card(walk, input({ events: [slipped] })).field).toBe("event");
    });

    it("reads a full ISO timestamp by its date, the way daysUntil does", () => {
      let walk = startFastTrack();
      const i = input({ asOf: "2026-11-16T14:00:00Z" });
      walk = choose(walk, eventsCard(walk, i), { option: "plan:nvda-print:NVDA" });
      walk = choose(walk, fieldCard(walk, i), { option: "stop:0" });
      expect(fieldCard(walk, i).options.map((o) => o.id)).toEqual(["exit:before", "exit:after"]);
    });

    it("cuts a long label at a sentence's end, never at an abbreviation", () => {
      const switches = {
        ...nvda,
        killSwitches: [
          "A notice from the U.S. Commerce Dept. on chip exports lands. Then re-assess.",
          `${"word ".repeat(40)}end`,
        ],
      };
      let walk = startFastTrack();
      walk = choose(walk, eventsCard(walk, input({ events: [switches] })), {
        option: "plan:nvda-print:NVDA",
      });
      const [abbrev, long] = fieldCard(walk, input({ events: [switches] })).options;
      expect(abbrev?.label).toBe("A notice from the U.S. Commerce Dept. on chip exports lands");
      expect(long?.label.length).toBeLessThanOrEqual(120);
      expect(long?.label.endsWith("…")).toBe(true);
    });
  });

  describe("planning a move: one card per empty exit field", () => {
    it("asks what would prove you wrong, from the ledger's kill switches, then where to take profit", () => {
      let walk = startFastTrack();
      walk = choose(walk, eventsCard(walk, input()), { option: "plan:nvda-print:NVDA" });
      const stop = fieldCard(walk, input());
      expect(stop.field).toBe("stop");
      expect(stop.question).toBe("What would prove you wrong?");
      expect(stop.options[0]?.label).toBe("Reaction-day open→close green on this print");
      expect(stop.options[0]?.detail).toBe(nvda.killSwitches[0]);

      walk = choose(walk, stop, { option: "stop:0" });
      const exit = fieldCard(walk, input());
      expect(exit.question).toBe("Where would you take profit, or by when?");
      expect(exit.options.map((o) => o.label)).toEqual([
        "Close before it, by the close on Nov 16",
        "Close the first session after it, Nov 18",
      ]);
      expect(exit.context).toMatch(/untested/);
    });

    it("shows the base rate with its sample size when the house has measured one", () => {
      const rated = { ...nvda, baseRate: { text: "up into the print 15 of 15 times", sample: 15 } };
      let walk = startFastTrack();
      walk = choose(walk, eventsCard(walk, input({ events: [rated] })), {
        option: "plan:nvda-print:NVDA",
      });
      walk = choose(walk, fieldCard(walk, input({ events: [rated] })), { option: "stop:0" });
      expect(fieldCard(walk, input({ events: [rated] })).context).toBe(
        "Base rate: up into the print 15 of 15 times (15 past cases)",
      );
    });

    it("says the house has written no kill switch, and still takes the member's own answer", () => {
      const bare = { ...nvda, killSwitches: [] };
      let walk = startFastTrack();
      walk = choose(walk, eventsCard(walk, input({ events: [bare] })), {
        option: "plan:nvda-print:NVDA",
      });
      const stop = fieldCard(walk, input({ events: [bare] }));
      expect(stop.options).toEqual([]);
      expect(stop.context).toMatch(/no kill switch/);
      walk = choose(walk, stop, { own: "NVDA closes under $180" });
      expect(fieldCard(walk, input({ events: [bare] })).field).toBe("exit");
    });

    it("keeps added context, and an own answer on the event card, as notes on the outcome", () => {
      let walk = startFastTrack();
      const first = eventsCard(walk, input());
      walk = choose(walk, first, { own: "something about chips" });
      walk = choose(walk, first, { option: "plan:nvda-print:NVDA" });
      walk = choose(walk, fieldCard(walk, input()), { context: "I already hold shares" });
      walk = choose(walk, fieldCard(walk, input()), { option: "stop:0" });
      walk = choose(walk, fieldCard(walk, input()), { option: "exit:before" });
      const step = nextStep(walk, input());
      expect("complete" in step && step.complete.notes).toEqual([
        "something about chips",
        "I already hold shares",
      ]);
    });

    it("spends no tap on an empty answer or an option the card does not carry", () => {
      const walk = startFastTrack();
      const c = eventsCard(walk, input());
      expect(choose(walk, c, { own: "   " })).toBe(walk);
      expect(choose(walk, c, { option: "plan:other:XYZ" })).toBe(walk);
    });
  });

  describe("the other outcomes", () => {
    it("completes a watch in one pick on the event card", () => {
      const i = input({ book: { held: [], watched: [] } });
      let walk = startFastTrack();
      walk = choose(walk, eventsCard(walk, i), { option: "watch:nvda-print:NVDA" });
      expect(nextStep(walk, i)).toEqual({
        complete: { kind: "watchlist", eventId: "nvda-print", symbol: "NVDA", notes: [] },
      });
    });

    it("completes a research ask about the event in one pick", () => {
      let walk = startFastTrack();
      walk = choose(walk, eventsCard(walk, input()), { option: "ask:nvda-print" });
      expect(nextStep(walk, input())).toEqual({
        complete: {
          kind: "research-ask",
          eventId: "nvda-print",
          question: "What do we know about NVDA earnings print?",
          notes: [],
        },
      });
    });
  });

  it("never says a time is good or great to buy, on any card", () => {
    let walk = startFastTrack();
    const copy: string[] = [];
    const c1 = eventsCard(walk, input());
    copy.push(JSON.stringify(c1));
    walk = choose(walk, c1, { option: "plan:nvda-print:NVDA" });
    copy.push(JSON.stringify(fieldCard(walk, input())));
    walk = choose(walk, fieldCard(walk, input()), { option: "stop:0" });
    copy.push(JSON.stringify(fieldCard(walk, input())));
    expect(copy.join(" ")).not.toMatch(/\b(good|great|perfect|best) time to buy\b/i);
  });

  describe("the first fast track, on the real calendar and the NVDA ledger", () => {
    const ledgerOf = (id: string) => {
      const path = `docs/research/events/${id}.md`;
      return existsSync(path) ? readFileSync(path, "utf8") : undefined;
    };
    const real: FastTrackInput = {
      asOf: ASOF,
      events: eventsWithin(ASOF, 14).map((e) => fastTrackEventOf(e, ledgerOf(e.id), ASOF)),
      book: { held: ["NVDA"], watched: [] },
    };

    it("puts the held name's print first and folds the rest of the fortnight", () => {
      const c = eventsCard(startFastTrack(), real);
      expect(c.rows[0]?.id).toBe("nvda-2026-11-18-print");
      expect(c.rows[0]?.dateWords).toBe("date confirmed");
      expect(c.rows).toHaveLength(3);
      expect(c.more).toBeGreaterThan(0);
    });

    it(`walks from the first tap to a pre-filled ticket the owner fires within ${FAST_TRACK_TAP_BUDGET} taps`, () => {
      const walk = walkToTicket(real, "plan:nvda-2026-11-18-print:NVDA");
      const step = nextStep(walk, real);
      if (!("complete" in step) || step.complete.kind !== "ticket") throw new Error("no ticket");
      expect(step.complete.symbol).toBe("NVDA");
      expect(step.complete.firedBy).toBe("owner");
      expect(step.complete.exit.by).toBe("2026-11-16");
      // The owner's own tap fires it: that tap counts against the budget too.
      expect(walk.taps + 1).toBeLessThanOrEqual(FAST_TRACK_TAP_BUDGET);
    });
  });
});
