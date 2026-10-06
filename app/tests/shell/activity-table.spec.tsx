import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskActivityEvent } from "../../src/live/desk";
import { ActivityTable } from "../../src/shell/activity-table";

/** The Decisions tab folded into its trades (#3687 slice 4): a bot row opens to the decision that
 *  placed it; a row with no decision (a human's, or one the trail never resolved) has no toggle.
 *  Since #3961 the opened why also names the round's funnel and links to the whole pass. */

// The round link is a router Link (#3961); no router here, so render its href — the same stand-in
// `thesis-drawer.spec.tsx` uses for the same reason.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    hash,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    hash?: string;
  }) => {
    const path = params?.id ? to.replace("$id", params.id) : to;
    return <a href={`${path}${hash ? `#${hash}` : ""}`}>{children}</a>;
  },
}));

const event = (over: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: "ord-1",
  symbol: "MSFT",
  display: "MSFT",
  side: "buy",
  quantity: 9,
  filled: 9,
  price: "$428.10",
  status: "filled",
  at: "2026-09-23T19:02:00Z",
  backfilled: false,
  origin: "unknown",
  ...over,
});

const scouted = event({
  reasoning: {
    reason: "BETA-PHASE FORCED PICK — no organic trade fired today",
    personaId: "beta-scout",
    playbookId: "BETA-SCOUT",
    playbookMode: "conservative",
  },
});

describe("ActivityTable — each bot trade opens to its decision", () => {
  it("opens the decision beneath its row: why, who decided, and the playbook", () => {
    render(<ActivityTable events={[scouted]} />);
    expect(screen.queryByText(/BETA-PHASE FORCED PICK/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/BETA-PHASE FORCED PICK/)).toBeInTheDocument();
    expect(screen.getByText("beta-scout")).toBeInTheDocument();
    expect(screen.getByText("BETA-SCOUT · conservative")).toBeInTheDocument();
  });

  // #885: "at this time, we do not show what playbooks others are using" — a non-owner's page.
  it("keeps the playbook row off a page the viewer does not own, the rest of the why intact", () => {
    render(<ActivityTable events={[scouted]} showPlaybook={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/BETA-PHASE FORCED PICK/)).toBeInTheDocument();
    expect(screen.getByText("beta-scout")).toBeInTheDocument();
    expect(screen.queryByText("Playbook")).not.toBeInTheDocument();
    expect(screen.queryByText(/BETA-SCOUT/)).not.toBeInTheDocument();
  });

  it("gives a row with no resolved decision no toggle, in a table that has one", () => {
    render(<ActivityTable events={[scouted, event({ orderId: "ord-2" })]} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("adds no why column at all when no row carries a decision — a human account", () => {
    const { container } = render(<ActivityTable events={[event()]} />);
    expect(container.querySelector(".why-col")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

/** #3961 — a fill is one decision out of a round that usually weighed several. The why names how
 *  many ideas the round raised and how many cleared the guards, and links to the whole pass on
 *  Heartbeat rather than copying the trail into this row (`docs/IA.md` §8.1). */
describe("ActivityTable — the round behind a fill", () => {
  const rounded = event({
    reasoning: {
      reason: "panic fade",
      personaId: "sauron",
      cycleAt: "2026-09-22T18:59:00.000Z",
      rawCount: 3,
      guardedCount: 2,
    },
  });

  it("names the round's funnel and links to the whole pass, anchored at that round", () => {
    render(<ActivityTable events={[rounded]} deskId="sauron" />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/3 ideas → 2 past the guards/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "the whole pass" })).toHaveAttribute(
      "href",
      `/u/sauron/decisions#cycle-${Date.parse("2026-09-22T18:59:00.000Z")}`,
    );
  });

  it("keeps the count but drops the link when the table merges several accounts' rows", () => {
    render(<ActivityTable events={[rounded]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/3 ideas → 2 past the guards/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("says one idea in the singular, the house's honest-copy habit", () => {
    render(
      <ActivityTable
        events={[
          event({
            reasoning: { reason: "panic fade", personaId: "sauron", rawCount: 1, guardedCount: 1 },
          }),
        ]}
        deskId="sauron"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/1 idea → 1 past the guards/)).toBeInTheDocument();
  });

  it("draws no round row at all for a decision that carries neither counts nor an address", () => {
    render(<ActivityTable events={[scouted]} deskId="sauron" />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.queryByText("The round")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

/** #4642 criterion 8 — a bot's option fill opens to the order in words, the dollars that moved and
 *  what would prove it wrong, beside the playbook its owner already sees. */
describe("ActivityTable — a bot's option fill", () => {
  const sold = event({
    symbol: "CRWV261106P00085000",
    display: "CRWV $85 PUT · 6 NOV 26",
    side: "sell",
    quantity: 1,
    filled: 1,
    price: "$2.05",
    reasoning: {
      reason: "sell a put a month out, below support",
      personaId: "sauron",
      playbookId: "CRWV-WHEEL",
      playbookMode: "standard",
      contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
      cost: "$205.00 received — 1 contract × 100 shares × $2.05",
      invalidator: "CRWV settles below $85 on 2026-11-06",
    },
  });

  it("names the order, its cost, the playbook and what proves it wrong", () => {
    render(<ActivityTable events={[sold]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why CRWV $85 PUT · 6 NOV 26 was sold" }));
    expect(screen.getByText("SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10")).toBeInTheDocument();
    expect(
      screen.getByText("$205.00 received — 1 contract × 100 shares × $2.05"),
    ).toBeInTheDocument();
    expect(screen.getByText("CRWV-WHEEL · standard")).toBeInTheDocument();
    expect(screen.getByText("Proves it wrong")).toBeInTheDocument();
    expect(screen.getByText("CRWV settles below $85 on 2026-11-06")).toBeInTheDocument();
  });

  it("draws none of the three on a share fill", () => {
    render(<ActivityTable events={[scouted]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.queryByText("Order")).not.toBeInTheDocument();
    expect(screen.queryByText("Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Proves it wrong")).not.toBeInTheDocument();
  });
});

// #4046 item 1: a Thesis marker links `?section=activity#act-<orderId>`, but the ledger arrives
// after the router has tried the hash — the row has to bring itself into view once it exists.
describe("ActivityTable — the row a link points at", () => {
  const scroll = rstest.fn();
  beforeEach(() => {
    scroll.mockReset();
    Element.prototype.scrollIntoView = scroll;
  });
  afterEach(() => {
    window.location.hash = "";
  });

  it("scrolls the targeted row into view when it renders", () => {
    window.location.hash = "#act-ord-2";
    render(<ActivityTable events={[event(), event({ orderId: "ord-2", symbol: "XLE" })]} />);
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toHaveAttribute("id", "act-ord-2");
  });

  it("leaves the page where it is with no row in the hash", () => {
    window.location.hash = "#cycle-1";
    render(<ActivityTable events={[event()]} />);
    expect(scroll).not.toHaveBeenCalled();
  });
});
