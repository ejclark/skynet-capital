import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render as mount, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskActivityEvent } from "../../src/live/desk";
import { orderStamp, orderTime } from "../../src/live/order-facts";
import { LANDED_MS } from "../../src/shell/landing";
import { LedgerTable } from "../../src/shell/ledger-table";

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
    search,
    hash,
    "aria-label": label,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string | number | undefined>;
    hash?: string;
    "aria-label"?: string;
  }) => {
    const path = params?.id ? to.replace("$id", params.id) : to;
    const set = Object.entries(search ?? {}).flatMap(([k, v]) =>
      v === undefined ? [] : [[k, String(v)]],
    );
    const query = new URLSearchParams(set).toString();
    return (
      <a href={`${path}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`} aria-label={label}>
        {children}
      </a>
    );
  },
}));

rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve({ last: 86.1 }),
}));

/** An opened row asks for the stock's quote (the price line's "now"), so it needs a client. */
function render(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return mount(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

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

describe("LedgerTable — each bot trade opens to its decision", () => {
  it("opens the decision beneath its row: why, who decided, and the playbook", () => {
    render(<LedgerTable events={[scouted]} />);
    expect(screen.queryByText(/BETA-PHASE FORCED PICK/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/BETA-PHASE FORCED PICK/)).toBeInTheDocument();
    expect(screen.getByText("beta-scout")).toBeInTheDocument();
    expect(screen.getByText("the forced daily pick · conservative")).toBeInTheDocument();
  });

  // #885: "at this time, we do not show what playbooks others are using" — a non-owner's page.
  it("keeps the playbook row off a page the viewer does not own, the rest of the why intact", () => {
    render(<LedgerTable events={[scouted]} showPlaybook={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/BETA-PHASE FORCED PICK/)).toBeInTheDocument();
    expect(screen.getByText("beta-scout")).toBeInTheDocument();
    expect(screen.queryByText("Playbook")).not.toBeInTheDocument();
    expect(screen.queryByText(/BETA-SCOUT/)).not.toBeInTheDocument();
  });

  it("gives a row with no resolved decision no toggle, in a table that has one", () => {
    render(<LedgerTable events={[scouted, event({ orderId: "ord-2" })]} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("adds no why column at all when no row carries a decision — a human account", () => {
    const { container } = render(<LedgerTable events={[event()]} />);
    expect(container.querySelector(".why-col")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

/** #3961 — a fill is one decision out of a round that usually weighed several. The why names how
 *  many ideas the round raised and how many cleared the guards, and links to the whole pass on
 *  Heartbeat rather than copying the trail into this row (`docs/IA.md` §8.1). */
describe("LedgerTable — the round behind a fill", () => {
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
    render(<LedgerTable events={[rounded]} deskId="sauron" />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/3 ideas → 2 past the guards/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "the whole pass" })).toHaveAttribute(
      "href",
      `/u/sauron/playbooks#cycle-${Date.parse("2026-09-22T18:59:00.000Z")}`,
    );
  });

  it("keeps the count but drops the link when the table merges several accounts' rows", () => {
    render(<LedgerTable events={[rounded]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText(/3 ideas → 2 past the guards/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("says one idea in the singular, the house's honest-copy habit", () => {
    render(
      <LedgerTable
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
    render(<LedgerTable events={[scouted]} deskId="sauron" />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.queryByText("The round")).not.toBeInTheDocument();
    // Its playbook is still a way in to its card (#5073); the round has no address to link.
    expect(screen.queryByRole("link", { name: "the whole pass" })).not.toBeInTheDocument();
  });
});

/** #4642 criterion 8 gave a bot's option fill its order in words, its cost and what proves it wrong
 *  here; #5262 (#5160 round 16) moved all three to Full detail. The row opens to the phone card's
 *  view instead: the price line on the left, Placed by and Why on the right. */
describe("LedgerTable — a bot's option fill", () => {
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

  it("opens to the price line beside Placed by and Why, leaving the rest to Full detail", async () => {
    const { container } = render(<LedgerTable events={[sold]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why CRWV $85 PUT · 6 NOV 26 was sold" }));
    const opened = container.querySelector(".row-why .oo");
    expect(opened).toHaveClass("oo-wide");
    expect(await screen.findByText("$86.10")).toBeInTheDocument();
    const pivots = [...container.querySelectorAll(".pv-pivot")].map((p) => p.textContent);
    expect(pivots).toEqual(["Breakeven $82.95", "Strike $85", "now $86.10"]);
    expect(container.querySelector(".pv-side-below")).toHaveTextContent("ITM · below $85");
    expect(screen.getByText("the wheel on CRWV · standard")).toBeInTheDocument();
    const labels = [...container.querySelectorAll(".oo-table dt")].map((dt) => dt.textContent);
    expect(labels).toEqual(["Placed by", "Why"]);
    expect(screen.queryByText(/limit \$2\.10/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$205\.00 received/)).not.toBeInTheDocument();
    expect(screen.queryByText("Proves it wrong")).not.toBeInTheDocument();
  });

  it("draws none of the three on a share fill", () => {
    render(<LedgerTable events={[scouted]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.queryByText("Order")).not.toBeInTheDocument();
    expect(screen.queryByText("Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Proves it wrong")).not.toBeInTheDocument();
  });

  // #4650: what the broker said about an order that never traded (the server sends the words only
  // then, `brokerWordsFor`) — the owner's alone, never a placeholder.
  const canceled = event({
    ...sold,
    filled: 0,
    price: "—",
    status: "canceled",
    reasoning: {
      reason: "sell a put a month out, below support",
      personaId: "sauron",
      contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
      brokerReason: "limit $2.10 not reached in 15s; canceled",
    },
  });

  it("says what the broker said about an order that never traded to its owner", () => {
    render(<LedgerTable events={[canceled]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why CRWV $85 PUT · 6 NOV 26 was sold" }));
    expect(screen.getByText("Broker said")).toBeInTheDocument();
    expect(screen.getByText("limit $2.10 not reached in 15s; canceled")).toBeInTheDocument();
  });

  it("draws no broker line on a page the viewer does not own, or when the broker said nothing", () => {
    render(<LedgerTable events={[canceled, { ...sold, orderId: "ord-9" }]} showPlaybook={false} />);
    for (const why of screen.getAllByRole("button")) fireEvent.click(why);
    expect(screen.getAllByText(/sell a put a month out, below support/)).toHaveLength(2);
    expect(screen.queryByText("Broker said")).not.toBeInTheDocument();
    expect(screen.queryByText(/not reached in 15s/)).not.toBeInTheDocument();
  });

  it("draws no broker line for a decision that carries no words", () => {
    render(<LedgerTable events={[sold]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why CRWV $85 PUT · 6 NOV 26 was sold" }));
    expect(screen.queryByText("Broker said")).not.toBeInTheDocument();
  });
});

/** #4650 — a bot's spread is one broker order whose fills arrive one per leg. Activity shows the
 *  spread once, its net once, and each leg beneath it: the contract, its side in words, and what it
 *  alone paid or received — visible without opening anything. */
describe("LedgerTable — a bot's spread and its legs", () => {
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
    const { container } = render(<LedgerTable events={[spread, event({ orderId: "ord-2" })]} />);
    const rows = [...container.querySelectorAll("tbody tr[id]")].map((tr) => tr.id);
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
    const { container } = render(<LedgerTable events={[spread]} />);
    const nets = () => container.textContent?.match(/\$335/g) ?? [];
    expect(container.querySelector("#act-mleg-1 td.num")).toHaveTextContent("−$335");
    expect(nets()).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Why NVDA $185/$200 CALL SPREAD · 13 NOV 26 was bought" }),
    );
    expect(screen.getByText("the call spread on NVDA · standard")).toBeInTheDocument();
    // A spread draws no price line (one strike can't describe it); its proof is Full detail's.
    expect(container.querySelector(".pv")).toBeNull();
    expect(screen.queryByText(/D-20→D-5/)).not.toBeInTheDocument();
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
    const { container } = render(<LedgerTable events={[partial]} />);
    const missing = container.querySelector(".row-leg-missing");
    expect(missing).toHaveTextContent("SELL");
    expect(missing).toHaveTextContent("NVDA $200 CALL · 13 NOV 26");
    expect(missing).toHaveTextContent("not in this account's ledger yet");
    expect(screen.getByText("◷ 1 of 2 legs")).toBeInTheDocument();
  });

  it("draws no leg rows for any other row", () => {
    const { container } = render(<LedgerTable events={[scouted]} />);
    expect(container.querySelector(".row-leg")).toBeNull();
    expect(container.querySelector(".row-leg-missing")).toBeNull();
  });
});

// #4046 item 1: a Thesis marker links `?section=activity#act-<orderId>`, but the ledger arrives
// after the router has tried the hash — the row has to bring itself into view once it exists.
describe("LedgerTable — the row a link points at", () => {
  const scroll = rstest.fn();
  beforeEach(() => {
    scroll.mockReset();
    Element.prototype.scrollIntoView = scroll;
  });
  afterEach(() => {
    window.location.hash = "";
    rstest.useRealTimers();
  });

  it("scrolls the targeted row into view when it renders", () => {
    window.location.hash = "#act-ord-2";
    render(<LedgerTable events={[event(), event({ orderId: "ord-2", symbol: "XLE" })]} />);
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toHaveAttribute("id", "act-ord-2");
  });

  it("leaves the page where it is with no row in the hash", () => {
    window.location.hash = "#cycle-1";
    render(<LedgerTable events={[event()]} />);
    expect(scroll).not.toHaveBeenCalled();
  });

  // #5022: a FORM square tapped from the Overview landed on its row with nothing to say which row
  // it was. It lands the way a position does: centred, and marked for a moment.
  it("marks the row it lands on, only for a moment", () => {
    rstest.useFakeTimers();
    window.location.hash = "#act-ord-2";
    const { container } = render(
      <LedgerTable events={[event(), event({ orderId: "ord-2", symbol: "XLE" })]} />,
    );
    const row = container.querySelector("#act-ord-2");
    expect(row).toHaveAttribute("data-landed");
    expect(container.querySelector("#act-ord-1")).not.toHaveAttribute("data-landed");
    act(() => {
      rstest.advanceTimersByTime(LANDED_MS);
    });
    expect(row).not.toHaveAttribute("data-landed");
  });

  it("lands on a spread's leg, which a Thesis marker for that fill links", () => {
    const leg = { ...event({ orderId: "leg-1", display: "NVDA $185 CALL · 13 NOV 26" }) };
    window.location.hash = "#act-leg-1";
    const { container } = render(<LedgerTable events={[event({ legs: [leg] })]} />);
    expect(scroll.mock.contexts[0]).toHaveAttribute("id", "act-leg-1");
    expect(container.querySelector("#act-leg-1")).toHaveAttribute("data-landed");
  });

  it("lands on the row once an older page brings it in, and not again on a refetch", () => {
    rstest.useFakeTimers();
    window.location.hash = "#act-ord-9";
    const first = [event()];
    const { rerender, container } = render(<LedgerTable events={first} />);
    expect(scroll).not.toHaveBeenCalled();
    const older = [...first, event({ orderId: "ord-9", symbol: "XLE" })];
    rerender(<LedgerTable events={older} />);
    const row = container.querySelector("#act-ord-9");
    expect(row).toHaveAttribute("data-landed");
    act(() => {
      rstest.advanceTimersByTime(LANDED_MS);
    });
    // A refetch handing back the same rows is not a new link: nothing is marked again.
    rerender(<LedgerTable events={[...older]} />);
    expect(row).not.toHaveAttribute("data-landed");
  });
});

/** #4650: an expiry or an assignment is not an order. Swept into Activity on its own, a $0 "SELL"
 *  under the put's real sale read as a second sale on a phone, stamped at a time it never had. */
describe("LedgerTable — what the broker reported instead of an order", () => {
  const PUT = "CRWV $85 PUT · 13 NOV 26";
  const OCC = "CRWV261113P00085000";
  const sold = event({
    orderId: "opt-put-1",
    symbol: OCC,
    display: PUT,
    side: "sell",
    quantity: 1,
    filled: 1,
    price: "$2.10",
  });
  const report = (lifecycle: DeskActivityEvent["lifecycle"], orderId: string) =>
    event({
      orderId,
      symbol: OCC,
      display: PUT,
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$0.00",
      status: lifecycle === "OPASN" ? "assigned" : "expired worthless",
      at: "2026-11-13T23:59:59.999Z",
      lifecycle,
    });

  it("names the event where a side would be — EXPIRED, ASSIGNED — never a second SOLD", () => {
    render(
      <LedgerTable
        events={[report("OPEXP", "lifecycle:a"), report("OPASN", "lifecycle:b"), sold]}
      />,
    );
    expect(screen.getByText("EXPIRED")).toHaveClass("act-side", "act-lifecycle");
    expect(screen.getByText("ASSIGNED")).toHaveClass("act-side", "act-lifecycle");
    // The one real sale keeps its SOLD; neither report borrows a side's word, cash or price.
    expect(screen.getAllByText("SOLD")).toHaveLength(1);
    const expired = document.getElementById("act-lifecycle:a");
    expect(expired).toHaveTextContent("EXPIRED 1 contract CRWV $85 PUT · Nov 13");
    expect(expired).not.toHaveTextContent("$0.00");
  });

  it("files a report under its own day, never the synthetic end-of-day instant's", () => {
    render(<LedgerTable events={[report("OPEXP", "lifecycle:a"), sold]} />);
    const days = [...document.querySelectorAll(".act-day-row th")].map((th) => th.textContent);
    expect(days).toEqual([
      expect.stringMatching(/^FRI · NOV 13/),
      expect.stringMatching(/^WED · SEP 23/),
    ]);
    expect(document.getElementById("act-lifecycle:a")?.querySelector("td[title]")).toHaveAttribute(
      "title",
      expect.stringMatching(/^Fri Nov 13/),
    );
  });
});

/** #5164: the table once printed "Oct 6, 09:31 AM" — the browser's zone, unnamed — for a fill the
 *  phone card read "10:31 AM ET". One order, one time, at every width; since #5317 the day is the
 *  divider's and the time waits on the row, one hover away. */
describe("LedgerTable — one fill, one time", () => {
  it("keeps an order's day and time in New York time, naming the zone, as the card does", () => {
    const fill = event({ orderId: "crwv-put", at: "2026-10-06T14:31:00Z" });
    render(<LedgerTable events={[fill]} />);
    const stamp = document
      .getElementById("act-crwv-put")
      ?.querySelector(".act-what-cell")
      ?.getAttribute("title");
    expect(stamp).toBe(orderStamp(fill));
    expect(stamp).toContain(orderTime(fill) as string);
    expect(stamp).toMatch(/^Tue Oct 6(, 2026)? · 10:31 AM ET$/);
  });
});

/** #5073 slice 4a (#5037 round 2, R2-act): on one bot's ledger the playbook that placed an order is
 *  a way in — it lands on that playbook's card on Playbooks, the order's mark ringed. */
describe("LedgerTable — the playbook, as a way in to its card", () => {
  const placed = event({
    orderId: "ord-1",
    reasoning: {
      reason: "panic fade",
      personaId: "sauron",
      playbookId: "SAURON",
      playbookMode: "aggressive",
      cycleAt: "2026-10-05T15:20:00.000Z",
    },
  });

  it("links the playbook to its card, naming the mode, the check and the order", () => {
    render(<LedgerTable events={[placed]} deskId="sauron" />);
    // The Playbook column names it bare; the opened order adds the mode it ran in.
    const [inList] = screen.getAllByRole("link", {
      name: "Sauron's own rules · aggressive — open its card on Playbooks",
    });
    expect(inList?.textContent).toBe("Sauron's own rules ›");
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    const [, link] = screen.getAllByRole("link", {
      name: "Sauron's own rules · aggressive — open its card on Playbooks",
    });
    if (!link) throw new Error("the opened order drew no playbook link");
    expect(link.textContent).toBe("Sauron's own rules · aggressive ›");
    expect(link).toHaveAttribute(
      "href",
      `/accounts?account=sauron&section=playbooks&card=SAURON&mode=aggressive&fill=${Date.parse("2026-10-05T15:20:00.000Z")}&from=ord-1`,
    );
  });

  it("keeps the playbook as plain words on a ledger that merges several accounts", () => {
    render(<LedgerTable events={[placed]} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.getByText("Sauron's own rules · aggressive")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("never names the playbook, linked or not, on a page the viewer does not own (#885)", () => {
    render(<LedgerTable events={[placed]} deskId="sauron" showPlaybook={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Why MSFT was bought" }));
    expect(screen.queryByText(/SAURON/)).not.toBeInTheDocument();
  });
});

/** #5317 (#5160 rounds 9–15, the receipt): no date column — a day divider per market day with the
 *  entries under it — and an entry is its legs. A close lists itself, then the buy it closed
 *  (quieter), then a total under a dashed rule; a single order is one row with where it stands. */
describe("LedgerTable — the Ledger as a receipt", () => {
  const bought = event({
    orderId: "buy-1",
    symbol: "META",
    display: "META",
    quantity: 15,
    filled: 15,
    price: "$742.00",
    at: "2026-09-22T14:00:00Z",
    closedOn: "2026-10-01T19:30:00Z",
  });
  const { realizedPl: _none, ...boughtLine } = bought;
  const sold = event({
    orderId: "sell-1",
    symbol: "META",
    display: "META",
    side: "sell",
    quantity: 15,
    filled: 15,
    price: "$761.00",
    at: "2026-10-01T19:30:00Z",
    realizedPl: "+$285",
    realizedTone: "pos",
    opened: [{ ...boughtLine, matched: 15 }],
  });
  const cells = (row: Element | null | undefined) =>
    [...(row?.querySelectorAll("td") ?? [])].map((td) => td.textContent?.trim());

  it("heads the columns What happened · Cash · Outcome, with no date column", () => {
    const { container } = render(<LedgerTable events={[sold, bought]} />);
    const heads = [...container.querySelectorAll("thead th")].map((th) => th.textContent);
    expect(heads).toEqual(["What happened", "Cash", "Outcome"]);
  });

  it("adds a Playbook column only when a row carries one the viewer may see", () => {
    const { container } = render(<LedgerTable events={[scouted]} deskId="beta-scout" />);
    const heads = [...container.querySelectorAll("thead th")].map((th) => th.textContent);
    expect(heads).toEqual(["Why", "What happened", "Playbook", "Cash", "Outcome"]);
  });

  it("starts each market day with a divider, newest first", () => {
    const { container } = render(<LedgerTable events={[sold, bought]} />);
    const days = [...container.querySelectorAll(".act-day-row th")].map((th) => th.textContent);
    expect(days).toEqual([
      expect.stringMatching(/^THU · OCT 1/),
      expect.stringMatching(/^TUE · SEP 22/),
    ]);
  });

  it("lists a round trip as the sale, then the buy it closed, then the total and its result", () => {
    const { container } = render(<LedgerTable events={[sold, bought]} />);
    const sale = container.querySelector("#act-sell-1");
    expect(cells(sale)).toEqual(["SOLD 15 shares META at $761.00", "+$11,415", ""]);
    const buy = sale?.nextElementSibling;
    expect(buy).toHaveClass("act-opened");
    expect(cells(buy)).toEqual(["BOUGHT 15 shares META at $742.00", "−$11,130", ""]);
    const total = buy?.nextElementSibling;
    expect(total).toHaveClass("act-total-row");
    expect(cells(total)).toEqual(["META · 9 days · Sep 22 → Oct 1", "+$285"]);
    expect(total?.querySelector(".tone-pos")).toHaveTextContent("+$285");
  });

  it("keeps the buy on its own day too, as closed on the sale's date — its anchor there only", () => {
    const { container } = render(<LedgerTable events={[sold, bought]} />);
    expect(cells(container.querySelector("#act-buy-1"))).toEqual([
      "BOUGHT 15 shares META at $742.00",
      "−$11,130",
      "closed Oct 1",
    ]);
    expect(container.querySelectorAll('[id="act-buy-1"]')).toHaveLength(1);
  });

  it("says a single order with nothing closing it is open, in one row", () => {
    const { container } = render(<LedgerTable events={[event({ orderId: "solo" })]} />);
    const row = container.querySelector("#act-solo");
    expect(cells(row)).toEqual(["BOUGHT 9 shares MSFT at $428.10", "−$3,853", "open"]);
    expect(row?.nextElementSibling).toBeNull();
  });

  it("names a dead order's status where open would be, and no cash it never moved", () => {
    const dead = event({ orderId: "dead", filled: 0, price: "—", status: "canceled" });
    const { container } = render(<LedgerTable events={[dead]} />);
    expect(cells(container.querySelector("#act-dead"))).toEqual([
      "BUY 9 shares MSFT",
      "",
      "✕ canceled",
    ]);
  });

  it("lists each lot a sale closed as its own leg, newest first, the part it took", () => {
    const early = {
      ...boughtLine,
      orderId: "buy-0",
      quantity: 5,
      filled: 5,
      price: "$700.00",
      matched: 5,
    };
    const later = {
      ...boughtLine,
      at: "2026-09-24T14:00:00Z",
      quantity: 15,
      filled: 15,
      matched: 10,
    };
    const both = { ...sold, opened: [later, early] };
    const { container } = render(<LedgerTable events={[both]} />);
    const legs = [...container.querySelectorAll(".act-opened")].map((tr) => cells(tr)[0]);
    expect(legs).toEqual([
      "BOUGHT 10 of 15 shares META at $742.00",
      "BOUGHT 5 shares META at $700.00",
    ]);
    // The range starts at the earliest buy.
    expect(container.querySelector(".act-total-row")).toHaveTextContent("Sep 22 → Oct 1");
  });
});
