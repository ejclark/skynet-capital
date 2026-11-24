import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { standingsBoardView } from "../../src/observatory/standings-board-view.js";
import { HOUSE_BOT_ID, partyView } from "../../src/observatory/standings-party.js";
import { standingsFieldOps } from "../../src/observatory/standings-patch.js";

/**
 * The party's table (#8253): members together against the house bot, seated by a first fill.
 * Names are placeholders — never a member's.
 */

function snap(over: Partial<ParticipantSnapshot> & { id: string }): ParticipantSnapshot {
  return {
    displayName: over.id,
    kind: "human",
    cash: 100_000,
    equity: 100_000,
    positions: [],
    ...over,
  };
}

const data = (...participants: ParticipantSnapshot[]): DashboardData => ({
  generatedAt: "2026-11-24T15:00:00.000Z",
  participants,
  collisions: [],
});

const house = (monthReturnPct?: number) =>
  snap({
    id: HOUSE_BOT_ID,
    displayName: "House",
    kind: "bot",
    ...(monthReturnPct === undefined ? {} : { monthReturnPct }),
  });

const seated =
  (...ids: string[]) =>
  (id: string) =>
    ids.includes(id);

describe("partyView", () => {
  const state = data(
    snap({ id: "m-b", displayName: "Member B", monthReturnPct: 3, realizedPl: 250 }),
    snap({ id: "m-a", displayName: "Member A", monthReturnPct: 1, realizedPl: -40 }),
    snap({ id: "m-c", displayName: "Member C" }),
    snap({ id: "bot-other", displayName: "Other bot", kind: "bot", monthReturnPct: 9 }),
    house(0.8),
  );

  it("seats members A to Z with their 1M return and booked P/L, formatted by the server", () => {
    const view = partyView(state, seated("m-a", "m-b"));
    expect(view.seats).toEqual([
      {
        key: "m-a",
        name: "Member A",
        monthReturn: "+1.00%",
        monthReturnTone: "pos",
        booked: "−$40",
        bookedTone: "neg",
      },
      {
        key: "m-b",
        name: "Member B",
        monthReturn: "+3.00%",
        monthReturnTone: "pos",
        booked: "+$250",
        bookedTone: "pos",
      },
    ]);
    expect(view.partyReturn).toBe("+2.00%");
    expect(view.partyCount).toBe("Average of 2 seated accounts");
    expect(view.houseReturn).toBe("+0.80%");
  });

  it("counts a member with no fill as an open seat and never names them", () => {
    const view = partyView(state, seated("m-a", "m-b"));
    expect(view.openSeats).toBe(1);
    expect(view.openLine).toBe("1 seat open");
    expect(JSON.stringify(view)).not.toContain("Member C");
  });

  it("leaves other bots off the table: neither party nor opponent", () => {
    const view = partyView(state, seated("m-a", "m-b"));
    expect(JSON.stringify(view)).not.toContain("Other bot");
  });

  it("seats nobody without evidence", () => {
    const view = partyView(state);
    expect(view.seats).toEqual([]);
    expect(view.openLine).toBe("3 seats open");
    expect(view.partyReturn).toBe("—");
    expect(view.lead).toBeUndefined();
  });

  it("reads an unsynced seat as — with words, and leaves it out of the average", () => {
    const view = partyView(state, seated("m-a", "m-c"));
    const row = view.seats.find((s) => s.key === "m-c");
    expect(row).toMatchObject({ monthReturn: "—", monthReturnNote: "not synced yet", booked: "—" });
    expect(view.partyReturn).toBe("+1.00%");
    expect(view.partyCount).toBe("Average of 1 seated account · 1 not synced yet");
  });

  it("names who leads in words, with a signed figure and a glyph", () => {
    const ahead = partyView(state, seated("m-a", "m-b")).lead;
    expect(ahead).toEqual({
      side: "party",
      line: "The party leads the house bot by 1.20 points",
      glyph: "▲",
      figure: "+1.20 pts",
      tone: "pos",
    });
    const behind = partyView(
      data(...state.participants.slice(0, 3), house(4.5)),
      seated("m-a"),
    ).lead;
    expect(behind).toMatchObject({
      side: "house",
      line: "The house bot leads the party by 3.50 points",
      glyph: "▼",
      figure: "−3.50 pts",
    });
    const level = partyView(
      data(state.participants[1] as ParticipantSnapshot, house(1)),
      () => true,
    ).lead;
    expect(level).toMatchObject({ side: "level", line: "The party and the house bot are level" });
  });

  it("says so in words and shows no lead when the house bot is missing or failed to read", () => {
    const missing = partyView(data(...state.participants.slice(0, 2)), () => true);
    expect(missing.lead).toBeUndefined();
    expect(missing.houseReturn).toBe("—");
    expect(missing.houseNote).toBe("The house bot isn't on the board right now");
    expect(missing.leadNote).toBe("The house bot isn't on the board right now");

    const failed = partyView(
      data(state.participants[0] as ParticipantSnapshot, { ...house(2), error: "boom" }),
      () => true,
    );
    expect(failed.lead).toBeUndefined();
    expect(failed.houseNote).toBe("The house bot's account didn't read this time");
  });
});

describe("the party block on the board", () => {
  const before = data(
    snap({ id: "m-a", displayName: "Member A", monthReturnPct: 1, realizedPl: 10 }),
    snap({ id: "m-b", displayName: "Member B" }),
    house(0.5),
  );

  it("rides /api/board's view whatever the metric", () => {
    for (const metric of ["equity", "return", "realized", "month"] as const) {
      const view = standingsBoardView(before, metric, undefined, seated("m-a"));
      expect(view.party.seats.map((s) => s.key)).toEqual(["m-a"]);
      expect(view.party.openSeats).toBe(1);
    }
  });

  it("moves the table and the Field from the same patch when a seated figure moves", () => {
    const after = data(
      snap({ id: "m-a", displayName: "Member A", monthReturnPct: 1, realizedPl: 60 }),
      snap({ id: "m-b", displayName: "Member B" }),
      house(0.5),
    );
    const ops = standingsFieldOps(before, after, { metric: "realized", isSeated: seated("m-a") });
    const keys = ops.flatMap((op) => (op.kind === "field" ? [op.key] : []));
    expect(keys).toContain("m-a");
    const party = ops.find((op) => op.kind === "field" && op.key === "party");
    expect(party).toMatchObject({ text: { "seat:m-a:booked": "+$60" } });
  });

  it("reframes when who sits at the table changes", () => {
    let seats = ["m-a"];
    const isSeated = (id: string) => seats.includes(id);
    const prev = standingsBoardView(before, "equity", undefined, isSeated).party;
    seats = ["m-a", "m-b"];
    const next = standingsBoardView(before, "equity", undefined, isSeated).party;
    expect(next.seats.length).toBe(prev.seats.length + 1);
    const errored = data(
      { ...(before.participants[0] as ParticipantSnapshot), error: "boom" },
      ...before.participants.slice(1),
    );
    // A seated account that fails to read leaves the table and the Field together: a reframe.
    expect(standingsFieldOps(before, errored, { metric: "equity", isSeated })[0]).toMatchObject({
      kind: "reframe",
    });
  });

  it("says nothing about the table when nothing on it moved", () => {
    const ops = standingsFieldOps(before, before, { metric: "equity", isSeated: seated("m-a") });
    expect(ops).toEqual([]);
  });
});
