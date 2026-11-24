import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { applyPatch, type BoardParty, type BoardSnapshot } from "../../src/live/board";
import { PartyTable, SEAT_LINE, scoreboardTileLine } from "../../src/shell/party-table";

/**
 * The party's table (#8253): the members together against the house bot, a seat earned by a first
 * fill. Every figure is the server's string; names here are placeholders, never a member's.
 */

// The table's one link is a router Link; a plain anchor stands in so the spec needs no router.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

const PARTY: BoardParty = {
  seats: [
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
      monthReturn: "—",
      monthReturnTone: "flat",
      monthReturnNote: "not synced yet",
      booked: "+$250",
      bookedTone: "pos",
    },
  ],
  partyReturn: "+1.00%",
  partyReturnTone: "pos",
  partyCount: "Average of 1 seated account · 1 not synced yet",
  houseReturn: "+0.80%",
  houseReturnTone: "pos",
  openSeats: 2,
  openLine: "2 seats open",
  lead: {
    line: "The party leads the house bot by 0.20 points",
    glyph: "▲",
    figure: "+0.20 pts",
    tone: "pos",
  },
  footnote: "Paper results.",
};

describe("PartyTable", () => {
  it("opens on the lead line in words, then the party beside the house bot", () => {
    render(<PartyTable party={PARTY} ownedIds={[]} />);
    expect(screen.getByText("The party leads the house bot by 0.20 points")).toBeTruthy();
    expect(screen.getByText("+0.20 pts")).toBeTruthy();
    expect(screen.getByText("The party")).toBeTruthy();
    expect(screen.getByText("The house bot")).toBeTruthy();
    expect(screen.getByText("2 seats open")).toBeTruthy();
  });

  it("lists seats A to Z with no rank, and an unsynced return in words", () => {
    render(<PartyTable party={PARTY} ownedIds={[]} />);
    const seats = within(screen.getByRole("list", { name: "Seated members, A to Z" }));
    const names = seats.getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(names[0]).toContain("Member A");
    expect(names[1]).toContain("Member B");
    expect(names[1]).toContain("not synced yet");
    expect(document.body.textContent).not.toMatch(/#1|1st|rank/i);
  });

  it("before a first fill: the seat line, linking to Trade, and no 'you' row", () => {
    render(<PartyTable party={PARTY} ownedIds={["m-z"]} />);
    const link = screen.getByRole("link", { name: SEAT_LINE });
    expect(link.getAttribute("href")).toBe("/trade");
    expect(screen.queryByText("you")).toBeNull();
  });

  it("once seated: the viewer's row carries a glyph and the word 'you', and the seat line goes", () => {
    render(<PartyTable party={PARTY} ownedIds={["m-b"]} />);
    const you = screen.getByText("you");
    expect(you.closest("li")?.textContent).toContain("Member B");
    expect(you.closest("li")?.textContent).toContain("◆");
    expect(screen.queryByText(SEAT_LINE)).toBeNull();
  });

  it("with no house bot read: says why in words and draws no lead line", () => {
    const { lead: _lead, ...rest } = PARTY;
    render(
      <PartyTable
        party={{ ...rest, leadNote: "The house bot isn't on the board right now" }}
        ownedIds={[]}
      />,
    );
    expect(screen.getByText("The house bot isn't on the board right now")).toBeTruthy();
    expect(screen.queryByText("+0.20 pts")).toBeNull();
  });
});

describe("scoreboardTileLine", () => {
  it("reads the seat line before the viewer's first fill, the lead line after, and lights", () => {
    expect(scoreboardTileLine(PARTY, [])).toEqual({ line: SEAT_LINE, lit: false });
    expect(scoreboardTileLine(undefined, ["m-a"])).toEqual({ line: SEAT_LINE, lit: false });
    expect(scoreboardTileLine(PARTY, ["m-a"])).toEqual({
      line: "The party leads the house bot by 0.20 points",
      lit: true,
    });
  });
});

describe("the party op", () => {
  const snapshot: BoardSnapshot = {
    seq: 1,
    generatedAt: "t",
    metric: "equity",
    rows: [],
    party: PARTY,
    opsApplied: 0,
  };

  it("moves a seat's figure and the lead from one op, and the browser sums nothing", () => {
    const next = applyPatch(snapshot, {
      seq: 2,
      at: "t2",
      ops: [
        {
          kind: "field",
          key: "party",
          text: {
            "seat:m-b:return": "+2.00%",
            "seat:m-b:returnNote": "",
            partyReturn: "+1.50%",
            lead: "The party leads the house bot by 0.70 points",
            leadFigure: "+0.70 pts",
          },
          tone: { "seat:m-b:return": "pos" },
        },
      ],
    });
    const seat = next?.party?.seats.find((s) => s.key === "m-b");
    expect(seat).toMatchObject({ monthReturn: "+2.00%", monthReturnTone: "pos" });
    expect(seat?.monthReturnNote).toBeUndefined();
    expect(next?.party?.partyReturn).toBe("+1.50%");
    expect(next?.party?.lead).toMatchObject({ glyph: "▲", figure: "+0.70 pts" });
  });

  it("drops the lead when the server says there is none", () => {
    const next = applyPatch(snapshot, {
      seq: 2,
      at: "t2",
      ops: [{ kind: "field", key: "party", text: { lead: "", leadNote: "No lead to call" } }],
    });
    expect(next?.party?.lead).toBeUndefined();
    expect(next?.party?.leadNote).toBe("No lead to call");
  });
});
