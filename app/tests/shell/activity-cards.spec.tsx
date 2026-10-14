import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render as mount, screen, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskActivityEvent } from "../../src/live/desk";
import { ActivityCards } from "../../src/shell/activity-cards";
import { ActivityLedger } from "../../src/shell/activity-ledger";

/** #5101 (round 2 of #5037, activity slice 1): on a phone the ledger is one card an order under a
 *  day header, two lines each — what happened with the cash it moved, then the bet with what it
 *  booked — and a tap opens the card in place, under its own row. */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}));
let quote: unknown = { last: 82.6 };
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve(quote),
}));

/** An opened card asks for the stock's quote (the price line's "now"), so it needs a client. */
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
  symbol: "NVDA",
  display: "NVDA",
  side: "buy",
  quantity: 40,
  filled: 40,
  price: "$226.10",
  status: "filled",
  at: "2026-10-05T15:20:00Z",
  backfilled: false,
  origin: "unknown",
  ...over,
});

const wheel = event({
  orderId: "put-1",
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  side: "sell",
  quantity: 1,
  filled: 1,
  price: "$2.55",
  at: "2026-10-06T14:31:00Z",
  reasoning: {
    reason:
      "Our study of CRWV: options price its next month to swing at a 69.9%-a-year pace, but in the past year its typical month swung at 88.7%. Puts priced at a 19% chance of being assigned would have been assigned 33% of the time in CRWV's own price history. So the study finds the market under-estimates how far CRWV moves, and says stand aside. Its owner runs this against the study, betting the market has CRWV about right: that its swings calm to the pace options price.",
    personaId: "sauron",
    playbookId: "CRWV-WHEEL",
    playbookMode: "aggressive",
  },
});

const close = event({
  orderId: "close-1",
  symbol: "META",
  display: "META",
  side: "sell",
  quantity: 15,
  filled: 15,
  price: "$761.00",
  at: "2026-10-01T19:30:00Z",
  realizedPl: "+$285",
  realizedTone: "pos",
  returnPct: "+2.6%",
});

const card = (orderId: string): HTMLElement => {
  const el = document.getElementById(`act-${orderId}`);
  if (!el) throw new Error(`no card act-${orderId}`);
  return el;
};

describe("ActivityCards — one card an order, under its day", () => {
  it("heads each market day once, newest first, the date off the row", () => {
    render(<ActivityCards events={[wheel, event(), close]} />);
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual([
      expect.stringMatching(/^TUE · OCT 6/),
      expect.stringMatching(/^MON · OCT 5/),
      expect.stringMatching(/^THU · OCT 1/),
    ]);
  });

  it("says what happened and the cash it moved on line 1, the bet on line 2", () => {
    render(<ActivityCards events={[wheel]} />);
    const put = card("put-1");
    expect(put.querySelector(".act-what")).toHaveTextContent("SOLD 1 CRWV $80 PUT · Nov 6");
    expect(put.querySelector(".act-cash")).toHaveTextContent("received +$255");
    expect(put.querySelector(".act-bet")).toHaveTextContent("Stays above $80");
    expect(put.querySelector(".act-bet")).toHaveTextContent("CRWV-WHEEL");
    expect(put.querySelector(".bet-glyph")).not.toBeNull();
  });

  it("puts what a closing fill booked on the right of line 2, signed and worded", () => {
    render(<ActivityCards events={[close]} />);
    const meta = card("close-1");
    expect(meta.querySelector(".act-bet")).toHaveTextContent("Closed");
    expect(meta.querySelector(".act-result")).toHaveTextContent("booked +$285");
    expect(meta.querySelector(".act-cash")).toHaveTextContent("received +$11,415");
  });

  it("names a status only when the order is not filled", () => {
    render(
      <ActivityCards
        events={[wheel, event({ orderId: "dead", filled: 0, price: "—", status: "canceled" })]}
      />,
    );
    expect(card("put-1").querySelector(".act-status")).toBeNull();
    const dead = card("dead");
    expect(dead.querySelector(".act-what")).toHaveTextContent("BUY 40 NVDA");
    expect(dead.querySelector(".act-status")).toHaveTextContent("✕ canceled");
    expect(dead.querySelector(".act-cash")).toBeEmptyDOMElement();
  });

  // #885: "at this time, we do not show what playbooks others are using".
  it("keeps the playbook off a card the viewer does not own, the bet intact", () => {
    render(<ActivityCards events={[wheel]} showPlaybook={false} />);
    expect(card("put-1").querySelector(".act-bet")).toHaveTextContent("Stays above $80");
    expect(screen.queryByText("CRWV-WHEEL")).not.toBeInTheDocument();
    fireEvent.click(within(card("put-1")).getByRole("button"));
    expect(screen.queryByText(/CRWV-WHEEL/)).not.toBeInTheDocument();
  });

  it("opens in place under its own row: the time, the price a share, then the decision", () => {
    render(<ActivityCards events={[wheel]} />);
    const head = within(card("put-1")).getByRole("button");
    expect(head).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Our study of CRWV/)).not.toBeInTheDocument();
    fireEvent.click(head);
    expect(head).toHaveAttribute("aria-expanded", "true");
    const body = card("put-1").querySelector(".act-card-body");
    // The status is said once: the price already says it filled (#5262).
    expect(body?.querySelector(".act-receipt")?.textContent).toBe(
      "10:31 AM ET · filled at $2.55 a share",
    );
    expect(body).toHaveTextContent(/the market under-estimates how far CRWV moves/);
    expect(body).toHaveTextContent("CRWV-WHEEL · aggressive");
  });

  it("names an expiry report where a side would be, with no cash and no bet", () => {
    const expired = {
      ...wheel,
      orderId: "lifecycle:a",
      price: "$0.00",
      status: "expired worthless",
      at: "2026-11-06T23:59:59.999Z",
      lifecycle: "OPEXP" as const,
      reasoning: undefined,
    };
    render(<ActivityCards events={[expired]} />);
    const report = card("lifecycle:a");
    expect(report.querySelector(".act-what")).toHaveTextContent("EXPIRED 1 CRWV $80 PUT");
    expect(report.querySelector(".act-bet")).toHaveTextContent("expired worthless");
    expect(report.querySelector(".act-cash")).toBeEmptyDOMElement();
    expect(report.querySelector(".bet-glyph")).toBeNull();
  });
});

/** #5262 (#5160 round 16, "divider"): an opened order leads with its price line — the pivots on
 *  top, the bar named Loss · Premium under it, the outcome at expiry split by the strike's line —
 *  then Placed by, then Why. The order in words, its cost and what proves it wrong stay in Full
 *  detail. */
describe("ActivityCards — an opened order leads with its price line", () => {
  const sold = {
    ...wheel,
    reasoning: {
      ...(wheel.reasoning as NonNullable<DeskActivityEvent["reasoning"]>),
      contract: "SELL 1 CRWV $80 PUT · 6 NOV 26 · limit $2.55",
      cost: "$255.00 received — 1 contract × 100 shares × $2.55",
      strategy: "the wheel",
      expectation: "Below it, the bot buys 100 shares at $80.",
      invalidator: "the play retires if its net P/L is below 0 on 2027-01-29",
      rawCount: 3,
      guardedCount: 1,
    },
  };
  const open = (): HTMLElement => {
    fireEvent.click(within(card("put-1")).getByRole("button"));
    const body = card("put-1").querySelector<HTMLElement>(".act-card-body");
    if (!body) throw new Error("the card did not open");
    return body;
  };

  it("puts Breakeven · Strike · now above the bar, each price under its name", async () => {
    render(<ActivityCards events={[sold]} />);
    const body = open();
    await within(body).findByText("$82.60");
    const pivots = [...body.querySelectorAll(".pv-pivot")].map((p) => p.textContent);
    expect(pivots).toEqual(["Breakeven $77.45", "Strike $80", "now $82.60"]);
  });

  it("names the hatch Loss and the solid Premium under the bar, and leaves OTM to the outcome", () => {
    render(<ActivityCards events={[sold]} />);
    const body = open();
    const names = [...body.querySelectorAll(".pv-zname")].map((n) => n.textContent);
    expect(names).toEqual(["Loss", "Premium"]);
    expect(body.querySelector(".pv-loss")).not.toBeNull();
    expect(body.querySelector(".pv-premium")).not.toBeNull();
    expect(body.querySelector(".pv-otm")).not.toBeNull();
  });

  it("splits the outcome at expiry by the strike's line: ITM left, OTM right", () => {
    render(<ActivityCards events={[sold]} />);
    const body = open();
    expect(body.querySelector(".pv-at")).toHaveTextContent("At Nov 6");
    const divider = body.querySelector<HTMLElement>(".pv-divides");
    expect(divider?.style.left).toBe("50.00%");
    const [below, above] = [...body.querySelectorAll(".pv-side")];
    expect(below).toHaveClass("pv-side-below");
    expect([...(below?.children ?? [])].map((c) => c.textContent)).toEqual([
      "ITM · below $80",
      "assigned:",
      "$8,000 buys",
      "100 CRWV shares",
    ]);
    expect([...(above?.children ?? [])].map((c) => c.textContent)).toEqual([
      "OTM · above $80",
      "expires:",
      "the $8,000",
      "is freed",
    ]);
  });

  it("follows the picture with Placed by, then Why — and nothing Full detail keeps", () => {
    render(<ActivityCards events={[sold]} deskId="sauron" onDetail={() => undefined} />);
    const body = open();
    const labels = [...body.querySelectorAll(".oo-table dt")].map((dt) => dt.textContent);
    expect(labels).toEqual(["Placed by", "Why"]);
    const placed = body.querySelector(".oo-placed");
    expect(placed).toHaveTextContent("sauron");
    expect(placed).toHaveTextContent("CRWV-WHEEL · aggressive");
    expect(placed).toHaveTextContent("3 ideas → 1 past the guards");
    for (const gone of ["Order", "Cost", "Strategy", "Expected", "Proves it wrong"]) {
      expect(within(body).queryByText(gone)).not.toBeInTheDocument();
    }
    expect(within(body).queryByText(/limit \$2\.55/)).not.toBeInTheDocument();
    expect(within(body).queryByText(/retires if its net P\/L/)).not.toBeInTheDocument();
    // The picture comes first, the table under it, the door last.
    const order = [...(body.querySelector(".oo")?.children ?? [])].map((c) => c.className);
    expect(order).toEqual(["pv", "more-grid why-grid oo-table", "act-full"]);
  });

  it("says when there is no quote for now, and still draws the line", async () => {
    quote = { quoteNote: "no quote" };
    try {
      render(<ActivityCards events={[sold]} />);
      const body = open();
      expect(await within(body).findByText("now: no quote right now")).toBeInTheDocument();
      const pivots = [...body.querySelectorAll(".pv-pivot")].map((p) => p.textContent);
      expect(pivots).toEqual(["Breakeven $77.45", "Strike $80"]);
      expect(body.querySelector(".pv-now")).toBeNull();
    } finally {
      quote = { last: 82.6 };
    }
  });
});

/** happy-dom has no `matchMedia` — the desk-table default. A phone installs one that matches. */
function phone(): () => void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
  return () => Reflect.deleteProperty(window, "matchMedia");
}

describe("ActivityLedger — cards on a phone, the table above it, never both", () => {
  it("draws the desk table where the phone query does not match", () => {
    const { container } = render(<ActivityLedger events={[wheel]} />);
    expect(container.querySelector("table.blotter")).not.toBeNull();
    expect(container.querySelector(".act-cards")).toBeNull();
  });

  it("draws the cards at phone width, each order's anchor once", () => {
    const restore = phone();
    try {
      const { container } = render(<ActivityLedger events={[wheel, event()]} />);
      expect(container.querySelector("table")).toBeNull();
      expect(container.querySelectorAll('[id="act-put-1"]')).toHaveLength(1);
      expect(container.querySelector("#act-put-1")).toHaveClass("act-card");
    } finally {
      restore();
    }
  });
});
