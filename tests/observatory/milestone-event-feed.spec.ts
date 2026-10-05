import {
  type ActivityEvent,
  activityEventFromEarnedMilestone,
  activityEventFromLadderEntry,
  activityEventFromTradeRecord,
} from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import {
  collapseMilestoneEvents,
  deriveMilestoneEvents,
  mergeLadderLogIntoEvents,
  milestoneFromEvent,
  toMemberMilestones,
} from "../../src/observatory/milestone-event-feed.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { LadderProgressEntry } from "../../src/server/ladder-progress-log.js";

/**
 * The read half of #784's fourth kind (slice 5) — given envelopes and ledgers, who in the league earned
 * what? The contract this kind exists to keep is the plan's falsifier, both halves: a row for every
 * earn, and NO row for a milestone nobody earned (progression's rule: proof is a fill, never a claim).
 */

const OCC_PUT = "MSFT260918P00420000";

const fill = (over: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "ord-1",
  participantId: "eric",
  symbol: "AAPL",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-10-01T14:00:00.000Z",
  source: "stream",
  ...over,
});

const logged = (over: Partial<LadderProgressEntry> = {}): LadderProgressEntry => ({
  uuid: "u-1",
  participantId: "eric",
  milestoneId: "first-realized-profit",
  evidence: { kind: "realized-profit", orderId: "ord-9" },
  at: "2026-10-02T15:00:00.000Z",
  ...over,
});

const participant = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "eric",
  displayName: "Eric",
  kind: "human",
  cash: 1000,
  equity: 5000,
  positions: [],
  ...over,
});

describe("milestoneFromEvent", () => {
  it("decodes a logged earn, carrying the order that proved it", () => {
    expect(milestoneFromEvent(activityEventFromLadderEntry(logged()))).toEqual({
      participantId: "eric",
      milestoneId: "first-realized-profit",
      orderId: "ord-9",
      at: "2026-10-02T15:00:00.000Z",
    });
  });

  it("returns null for another kind's event — a mixed bus is the normal input", () => {
    expect(milestoneFromEvent(activityEventFromTradeRecord(fill()))).toBeNull();
  });

  it("drops an earn with no evidence, because an earn without proof is a claim", () => {
    const event = activityEventFromLadderEntry(logged());
    const claimed: ActivityEvent = { ...event, payload: { milestoneId: "first-buy" } };

    expect(milestoneFromEvent(claimed)).toBeNull();
  });

  it("drops a milestone event that is not on the public tier", () => {
    const event = activityEventFromLadderEntry(logged());

    expect(milestoneFromEvent({ ...event, visibility: "owner-only" })).toBeNull();
  });
});

describe("collapseMilestoneEvents", () => {
  it("keeps one row per member per milestone, at the EARLIEST instant it was logged", () => {
    const events = [
      activityEventFromLadderEntry(logged({ uuid: "late", at: "2026-10-03T00:00:00.000Z" })),
      activityEventFromLadderEntry(logged({ uuid: "early", at: "2026-10-01T00:00:00.000Z" })),
    ];

    const rows = collapseMilestoneEvents(events);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.at).toBe("2026-10-01T00:00:00.000Z");
  });

  it("keeps two members' earns of the same milestone apart", () => {
    const events = [
      activityEventFromLadderEntry(logged()),
      activityEventFromLadderEntry(logged({ participantId: "ada" })),
    ];

    expect(collapseMilestoneEvents(events)).toHaveLength(2);
  });

  it("orders earns newest first", () => {
    const events = [
      activityEventFromLadderEntry(logged({ at: "2026-10-01T00:00:00.000Z" })),
      activityEventFromLadderEntry(
        logged({ milestoneId: "first-otm-expiry", at: "2026-10-04T00:00:00.000Z" }),
      ),
    ];

    expect(collapseMilestoneEvents(events).map((r) => r.milestoneId)).toEqual([
      "first-otm-expiry",
      "first-realized-profit",
    ]);
  });
});

describe("mergeLadderLogIntoEvents", () => {
  it("keeps an earn logged before the detector published, which the bus alone would drop", () => {
    const rows = collapseMilestoneEvents(mergeLadderLogIntoEvents([], [logged()]));

    expect(rows).toHaveLength(1);
  });

  it("does not let a re-logged later line on the bus hide the log's earlier one", () => {
    const onBus = activityEventFromLadderEntry(logged({ at: "2026-10-05T00:00:00.000Z" }));

    const rows = collapseMilestoneEvents(
      mergeLadderLogIntoEvents([onBus], [logged({ at: "2026-10-02T00:00:00.000Z" })]),
    );

    expect(rows).toEqual([expect.objectContaining({ at: "2026-10-02T00:00:00.000Z" })]);
  });
});

describe("deriveMilestoneEvents", () => {
  it("derives a member's first stock buy from the fill alone", () => {
    const rows = collapseMilestoneEvents(deriveMilestoneEvents([fill()], []));

    expect(rows).toEqual([
      { participantId: "eric", milestoneId: "first-buy", orderId: "ord-1", at: fill().at },
    ]);
  });

  it("derives NOTHING from an untagged option fill — the Learn page's own rule", () => {
    const optionFill = fill({ orderId: "p1", symbol: OCC_PUT, side: "sell" });

    expect(deriveMilestoneEvents([optionFill], [])).toEqual([]);
  });

  it("derives a cash-secured put from an option fill the ticket tagged as opening one", () => {
    const optionFill = fill({ orderId: "p1", symbol: OCC_PUT, side: "sell" });
    const tag = {
      participantId: "eric",
      orderId: "p1",
      at: optionFill.at,
      code: "201" as const,
      intent: "open" as const,
    };

    const ids = collapseMilestoneEvents(deriveMilestoneEvents([optionFill], [tag])).map(
      (r) => r.milestoneId,
    );

    expect(ids).toEqual(["first-cash-secured-put"]);
  });

  it("never credits one member's fill to another member", () => {
    const rows = collapseMilestoneEvents(
      deriveMilestoneEvents([fill(), fill({ orderId: "ord-2", participantId: "ada" })], []),
    );

    expect(rows.map((r) => `${r.participantId}:${r.orderId}`).sort()).toEqual([
      "ada:ord-2",
      "eric:ord-1",
    ]);
  });

  it("derives nothing from an order that never filled", () => {
    expect(deriveMilestoneEvents([fill({ filledQuantity: 0, status: "new" })], [])).toEqual([]);
  });

  it("is never stored: every derived event says it was derived, not logged", () => {
    const [event] = deriveMilestoneEvents([fill()], []);

    expect(event?.source).toBe("derived");
  });
});

describe("toMemberMilestones", () => {
  const earn = {
    participantId: "eric",
    milestoneId: "first-buy",
    orderId: "ord-1",
    at: "2026-10-01T14:00:00.000Z",
  };

  it("names the member and titles the milestone as the Learn page words it", () => {
    expect(toMemberMilestones([earn], [participant()])).toEqual([
      { ...earn, participantName: "Eric", title: "Buy your first stock", points: 25 },
    ]);
  });

  it("titles an outcome milestone without inventing points the course score never adds up", () => {
    const [row] = toMemberMilestones(
      [{ ...earn, milestoneId: "first-realized-profit" }],
      [participant()],
    );

    expect(row?.title).toBe("Book your first profit");
    expect(row).not.toHaveProperty("points");
  });

  it("leaves a bot's earn off — the ladder is a member's curriculum", () => {
    const bot = participant({ id: "sauron", displayName: "Sauron", kind: "bot" });

    expect(toMemberMilestones([{ ...earn, participantId: "sauron" }], [bot])).toEqual([]);
  });

  it("leaves off an earn whose participant is not on the roster, with no name to give it", () => {
    expect(toMemberMilestones([{ ...earn, participantId: "ghost" }], [participant()])).toEqual([]);
  });

  it("leaves off a milestone id this app cannot title, rather than render a bare id", () => {
    expect(toMemberMilestones([{ ...earn, milestoneId: "first-moon" }], [participant()])).toEqual(
      [],
    );
  });
});

describe("activityEventFromEarnedMilestone", () => {
  it("keys identity on member and milestone alone, so a re-derivation cannot mint a second row", () => {
    const first = activityEventFromEarnedMilestone("eric", {
      milestoneId: "first-buy",
      code: "101",
      orderId: "ord-1",
      at: "2026-10-01T14:00:00.000Z",
    });
    const backfilled = activityEventFromEarnedMilestone("eric", {
      milestoneId: "first-buy",
      code: "101",
      orderId: "ord-0",
      at: "2026-09-01T14:00:00.000Z",
    });

    expect(first.id).toBe(backfilled.id);
    expect(first.visibility).toBe("public");
  });
});
