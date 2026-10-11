import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskActivityEvent } from "../../src/live/desk";
import { ActivityCards } from "../../src/shell/activity-cards";
import { ActivityLedger } from "../../src/shell/activity-ledger";

/** #5101 (round 2 of #5037, activity slice 1): on a phone the ledger is one card an order under a
 *  day header, two lines each — what happened with the cash it moved, then the bet with what it
 *  booked — and a tap opens the card in place, under its own row. */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}));

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
      "Run on its owner's conviction — our study found CRWV's option premium underpays its moves.",
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
    expect(screen.queryByText(/our study found/)).not.toBeInTheDocument();
    fireEvent.click(head);
    expect(head).toHaveAttribute("aria-expanded", "true");
    const body = card("put-1").querySelector(".act-card-body");
    expect(body).toHaveTextContent("10:31 AM ET · filled at $2.55 a share · filled");
    expect(body).toHaveTextContent(/our study found CRWV's option premium underpays its moves/);
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
