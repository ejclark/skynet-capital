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

  // #4650: what the broker said about the order — the owner's alone, never a placeholder.
  const partly = event({
    ...sold,
    quantity: 2,
    status: "canceled",
    reasoning: {
      reason: "sell a put a month out, below support",
      personaId: "sauron",
      contract: "SELL 2 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
      brokerReason: "partial fill; remainder canceled",
    },
  });

  it("says what the broker said about the order to its owner", () => {
    render(<ActivityTable events={[partly]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why CRWV $85 PUT · 6 NOV 26 was sold" }));
    expect(screen.getByText("Broker said")).toBeInTheDocument();
    expect(screen.getByText("partial fill; remainder canceled")).toBeInTheDocument();
  });

  it("draws no broker line on a page the viewer does not own, or when the broker said nothing", () => {
    render(<ActivityTable events={[partly, { ...sold, orderId: "ord-9" }]} showPlaybook={false} />);
    for (const why of screen.getAllByRole("button")) fireEvent.click(why);
    expect(screen.getAllByText(/sell a put a month out, below support/)).toHaveLength(2);
    expect(screen.queryByText("Broker said")).not.toBeInTheDocument();
    expect(screen.queryByText("partial fill; remainder canceled")).not.toBeInTheDocument();
  });

  it("draws no broker line for a decision that carries no words", () => {
    render(<ActivityTable events={[sold]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why CRWV $85 PUT · 6 NOV 26 was sold" }));
    expect(screen.queryByText("Broker said")).not.toBeInTheDocument();
  });
});

/** #4650 — a bot's spread is one broker order whose fills arrive one per leg. Activity shows the
 *  spread once, its net once, and each leg beneath it: the contract, its side in words, and what it
 *  alone paid or received — visible without opening anything. */
describe("ActivityTable — a bot's spread and its legs", () => {
  const spread = event({
    orderId: "mleg-1",
    symbol: "",
    display: "NVDA $185/$200 CALL SPREAD · 13 NOV 26",
    side: "buy",
    quantity: 1,
    filled: 1,
    price: "$3.35",
    net: "$335.00 paid",
    reasoning: {
      reason: "the options form of S1-NVDA's pre-earnings run-up",
      personaId: "sauron",
      playbookId: "NVDA-CALL-SPREAD",
      playbookMode: "standard",
      contract: "BUY 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26 · limit $3.40 debit",
      cost: "$335.00 paid — 1 spread × 100 shares × $3.35 net",
      invalidator: "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints",
    },
    legs: [
      {
        orderId: "leg-low",
        symbol: "NVDA261113C00185000",
        display: "NVDA $185 CALL · 13 NOV 26",
        side: "buy",
        quantity: 1,
        filled: 1,
        price: "$5.10",
        cost: "$510.00 paid — 1 contract × 100 shares × $5.10",
        status: "filled",
        at: "2026-10-27T15:00:00Z",
        backfilled: false,
        origin: "unknown",
      },
      {
        orderId: "leg-high",
        symbol: "NVDA261113C00200000",
        display: "NVDA $200 CALL · 13 NOV 26",
        side: "sell",
        quantity: 1,
        filled: 1,
        price: "$1.75",
        cost: "$175.00 received — 1 contract × 100 shares × $1.75",
        status: "filled",
        at: "2026-10-27T15:00:01Z",
        backfilled: false,
        origin: "unknown",
      },
    ],
  });

  it("shows each leg beneath the spread's row, its side in words and its own dollars", () => {
    const { container } = render(<ActivityTable events={[spread, event({ orderId: "ord-2" })]} />);
    const rows = [...container.querySelectorAll("tbody tr")].map((tr) => tr.id);
    expect(rows).toEqual(["act-mleg-1", "act-leg-low", "act-leg-high", "act-ord-2"]);
    const low = container.querySelector("#act-leg-low");
    expect(low).toHaveTextContent("BUY");
    expect(low).toHaveTextContent("NVDA $185 CALL · 13 NOV 26");
    expect(low).toHaveTextContent("$510.00 paid — 1 contract × 100 shares × $5.10");
    const high = container.querySelector("#act-leg-high");
    expect(high).toHaveTextContent("SELL");
    expect(high).toHaveTextContent("$175.00 received — 1 contract × 100 shares × $1.75");
  });

  it("says the spread's net once, on its own row, whether or not its decision is open", () => {
    const { container } = render(<ActivityTable events={[spread]} />);
    const nets = () => container.textContent?.match(/\$335\.00/g) ?? [];
    expect(screen.getByText("net $335.00 paid")).toBeInTheDocument();
    expect(nets()).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Why NVDA $185/$200 CALL SPREAD · 13 NOV 26 was bought" }),
    );
    expect(screen.getByText("NVDA-CALL-SPREAD · standard")).toBeInTheDocument();
    expect(
      screen.getByText("NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints"),
    ).toBeInTheDocument();
    expect(nets()).toHaveLength(1);
  });

  it("names a leg the ledger does not hold yet, beneath the ones it does", () => {
    const [low] = spread.legs ?? [];
    const partial = {
      ...spread,
      filled: 0,
      status: "1 of 2 legs",
      legs: low ? [low] : [],
      missingLegs: [{ display: "NVDA $200 CALL · 13 NOV 26", side: "sell" as const }],
    };
    const { container } = render(<ActivityTable events={[partial]} />);
    const missing = container.querySelector(".row-leg-missing");
    expect(missing).toHaveTextContent("SELL");
    expect(missing).toHaveTextContent("NVDA $200 CALL · 13 NOV 26");
    expect(missing).toHaveTextContent("not in this account's ledger yet");
    expect(screen.getByText("1 of 2 legs")).toBeInTheDocument();
  });

  it("draws no leg rows for any other row", () => {
    const { container } = render(<ActivityTable events={[scouted]} />);
    expect(container.querySelector(".row-leg")).toBeNull();
    expect(screen.queryByText(/^net /)).not.toBeInTheDocument();
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

/** #4650: an expiry or an assignment is not an order. Swept into Activity on its own, a $0 "SELL"
 *  under the put's real sale read as a second sale on a phone, stamped at a time it never had. */
describe("ActivityTable — what the broker reported instead of an order", () => {
  const PUT = "CRWV $85 PUT · 13 NOV 26";
  const sold = event({ orderId: "opt-put-1", display: PUT, side: "sell", quantity: 1, filled: 1 });
  const report = (lifecycle: DeskActivityEvent["lifecycle"], orderId: string) =>
    event({
      orderId,
      display: PUT,
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$0.00",
      status: lifecycle === "OPASN" ? "assigned" : "expired worthless",
      at: "2026-11-13T23:59:59.999Z",
      lifecycle,
    });

  it("names the event where a side would be — EXPIRED, ASSIGNED — never a second SELL", () => {
    const { container } = render(
      <ActivityTable
        events={[report("OPEXP", "lifecycle:a"), report("OPASN", "lifecycle:b"), sold]}
      />,
    );
    expect(screen.getByText("EXPIRED")).toHaveClass("tl-side", "tl-lifecycle");
    expect(screen.getByText("ASSIGNED")).toHaveClass("tl-side", "tl-lifecycle");
    // The one real sale keeps its SELL; neither report borrows the sell hue.
    expect(screen.getAllByText("SELL")).toHaveLength(1);
    expect(container.querySelectorAll(".tl-sell")).toHaveLength(1);
  });

  it("dates a report by its day alone, never the synthetic end-of-day time", () => {
    render(<ActivityTable events={[report("OPEXP", "lifecycle:a"), sold]} />);
    const reportRow = document.getElementById("act-lifecycle:a");
    expect(reportRow?.querySelector("td.num")?.textContent).toBe("Nov 13");
    // An order still carries its time of day.
    const saleStamp = document
      .getElementById("act-opt-put-1")
      ?.querySelector("td.num")?.textContent;
    expect(saleStamp).toMatch(/\d{1,2}:\d{2}/);
  });
});
