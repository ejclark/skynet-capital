import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import * as actualDesk from "../../src/live/desk" with { rstest: "importActual" };
import type { DeskActivity, DeskPosition } from "../../src/live/desk";
import * as actualOptions from "../../src/live/options" with { rstest: "importActual" };
import type { OptionPositions } from "../../src/live/options";

/**
 * A POSITION'S FULL PAGE (#5070 slice 6; round 2 of #5037, R2's depth ladder step 4). "Full page ›"
 * sits inside a row's opened guidance; the page's one way back, "← Positions", returns to that
 * row, still open (Eric's More 5, 9cda6977: "a page is for a deliberate deep dive and can derail
 * you"). The page links only to its own sections — Picture · Three ways to play it · Fills · Dates
 * — leads with the opened row's own picture plus profit at price (V2, an addition here), and ends
 * in Buy back and Roll for the account's owner alone.
 */

const BOOK = {
  available: true,
  asOf: "2026-10-08T19:00:00.000Z",
  rows: [
    {
      symbol: "CRWV261106P00080000",
      display: "CRWV $80 PUT · 6 NOV 26",
      underlying: "CRWV",
      type: "put",
      strike: 80,
      expiration: "2026-11-06",
      daysToExpiry: 29,
      contracts: -1,
      spot: 82.6,
      impliedVol: 0.75,
      positionGreeks: { delta: 39.8, theta: 11.46 },
    },
  ],
} as unknown as OptionPositions;

const ACTIVITY: DeskActivity = {
  available: true,
  activity: [
    {
      orderId: "o-crwv",
      symbol: "CRWV",
      display: "CRWV",
      side: "buy",
      quantity: 55,
      filled: 55,
      price: "$90.10",
      status: "filled",
      at: "2026-09-21T14:00:00.000Z",
      backfilled: false,
      origin: "desk",
    },
    {
      orderId: "o-put",
      symbol: "CRWV261106P00080000",
      display: "CRWV $80 PUT · 6 NOV 26",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$2.55",
      status: "filled",
      at: "2026-10-08T14:31:00.000Z",
      backfilled: false,
      origin: "desk",
    },
  ],
};

const activityAsked: Array<{ id: string; symbol?: string | undefined }> = [];

rstest.mock("../../src/live/options", () => ({
  ...actualOptions,
  fetchOptionPositions: () => Promise.resolve(BOOK),
  fetchChain: () => Promise.resolve({ chainNote: "No chain in this test." }),
}));
rstest.mock("../../src/live/bars", () => ({
  fetchBars: () => Promise.resolve({ barsNote: "No bars in this test." }),
}));
rstest.mock("../../src/live/desk", () => ({
  ...actualDesk,
  fetchDeskActivity: (id: string, query: { symbol?: string } = {}) => {
    activityAsked.push({ id, symbol: query.symbol });
    return Promise.resolve(ACTIVITY);
  },
}));

/** What the router was asked to do, and the search the page reads. */
const navigations: Record<string, unknown>[] = [];

/** A step's `search` updater, applied to the search before it. */
const searchAfter = (step: Record<string, unknown> | undefined, prev: object): object => {
  const update = step?.search as ((p: object) => object) | undefined;
  if (!update) throw new Error("this step carried no search update");
  return update(prev);
};

const noop = () => undefined;
let search: Record<string, unknown> = {};
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="/app/trade" className={className}>
      {children}
    </a>
  ),
  useSearch: () => search,
  useNavigate: () => (to: Record<string, unknown>) => {
    navigations.push(to);
    return Promise.resolve();
  },
}));

const { PositionsBlotter } = await import("../../src/shell/positions-blotter");
const { PositionPage } = await import("../../src/shell/position-page");
const { usePositionPage } = await import("../../src/shell/use-position-page");

const pos = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: "SPY",
  display: "SPY",
  detail: "",
  isOption: false,
  quantity: "10",
  costPerShare: "$1.00",
  price: "$1.00",
  costBasis: "$1",
  value: "$1",
  dayPl: "+$0",
  dayPct: "+0.0%",
  dayTone: "flat",
  totalPl: "+$0",
  totalPlRaw: 0,
  returnPct: "+0.0%",
  totalTone: "flat",
  weightPct: 1,
  ...over,
});

const CRWV = pos({
  symbol: "CRWV",
  display: "CRWV",
  quantity: "55",
  price: "$82.60",
  costBasis: "$4,956",
  breakeven: "$90.10",
  value: "$4,543",
  totalPl: "-$412",
  totalPlRaw: -412.5,
  returnPct: "-8.32%",
  totalTone: "neg",
});
const PUT = pos({
  symbol: "CRWV261106P00080000",
  display: "CRWV $80 PUT · 6 NOV 26",
  isOption: true,
  quantity: "-1",
  price: "$550.00",
  breakeven: "$77.45",
  value: "-$550",
  totalPl: "-$295",
  totalPlRaw: -295,
  returnPct: "-116%",
  totalTone: "neg",
  costBasis: "-$255",
  plainName: "Sold put · profits if CRWV stays above $80",
  expiresIn: "29 days",
  expiresInDays: 29,
});
const BOOK_ROWS = [CRWV, PUT];

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function page(canTrade: boolean, onBack: () => void = noop) {
  return render(
    <QueryClientProvider client={client()}>
      <PositionPage
        deskId="sauron"
        position={PUT}
        positions={BOOK_ROWS}
        canTrade={canTrade}
        onBack={onBack}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  navigations.length = 0;
  activityAsked.length = 0;
  search = {};
  rstest.useFakeTimers({ toFake: ["Date"] });
  rstest.setSystemTime(new Date("2026-10-08T19:00:00Z"));
  localStorage.clear();
});
afterEach(() => {
  rstest.useRealTimers();
});

describe("Full page › inside a row's opened guidance", () => {
  function blotter(extra: { openRow?: string; onFullPage?: (symbol: string) => void } = {}) {
    return render(
      <QueryClientProvider client={client()}>
        <PositionsBlotter
          deskId="sauron"
          positions={BOOK_ROWS}
          query=""
          onFilterChange={noop}
          {...extra}
        />
      </QueryClientProvider>,
    );
  }

  it("appears only once the row is opened, and asks for that position's page", () => {
    const asked: string[] = [];
    const { container } = blotter({ onFullPage: (symbol) => asked.push(symbol) });
    const card = container.querySelector(".pos-cards") as HTMLElement;
    expect(within(card).queryByRole("button", { name: /Full page/ })).toBeNull();
    fireEvent.click(within(card).getByRole("button", { name: /Guidance for CRWV \$80 PUT/ }));
    fireEvent.click(
      within(card).getByRole("button", { name: "Full page for CRWV $80 PUT · 6 NOV 26" }),
    );
    expect(asked).toEqual([PUT.symbol]);
  });

  it("comes back with that row's guidance open, and the others closed", () => {
    const { container } = blotter({ openRow: PUT.symbol, onFullPage: noop });
    const card = container.querySelector(".pos-cards") as HTMLElement;
    expect(
      within(card).getByRole("button", { name: /Guidance for CRWV \$80 PUT/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(within(card).getByRole("button", { name: /Guidance for CRWV$/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("offers no Full page where the host gives it no way there", () => {
    const { container } = blotter();
    const card = container.querySelector(".pos-cards") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: /Guidance for CRWV \$80 PUT/ }));
    expect(within(card).queryByRole("button", { name: /Full page/ })).toBeNull();
  });
});

describe("the full page's URL steps", () => {
  function Host() {
    const { page, open, openPage, closePage } = usePositionPage();
    return (
      <>
        <p data-testid="state">{`${page ?? "-"} ${open ?? "-"}`}</p>
        <button type="button" onClick={() => openPage(PUT.symbol)}>
          open
        </button>
        <button type="button" onClick={closePage}>
          close
        </button>
      </>
    );
  }

  it("rewrites the list's entry to come back with the row open, then pushes the page on it", async () => {
    render(<Host />);
    fireEvent.click(screen.getByRole("button", { name: "open" }));
    await waitFor(() => expect(navigations).toHaveLength(2));
    const [list, pageStep] = navigations;
    expect(list?.replace).toBe(true);
    expect(list?.hash).toBe(`pos-${PUT.symbol}`);
    expect(searchAfter(list, { q: "is:option" })).toEqual({
      q: "is:option",
      open: PUT.symbol,
    });
    expect(pageStep?.replace).toBeUndefined();
    expect(searchAfter(pageStep, { q: "is:option", open: PUT.symbol })).toEqual({
      q: "is:option",
      open: PUT.symbol,
      position: PUT.symbol,
    });
  });

  it("reads the page and the open row from the URL", () => {
    search = { position: PUT.symbol, open: PUT.symbol };
    render(<Host />);
    expect(screen.getByTestId("state").textContent).toBe(`${PUT.symbol} ${PUT.symbol}`);
  });

  it("goes back from a linked page by replacing it with the list, the row open — never off-site", () => {
    search = { position: PUT.symbol, q: "is:option" };
    // A page arrived at by link: this visit pushed nothing, and the URL is the link's own.
    window.history.replaceState(null, "", `/app/u/sauron?position=${PUT.symbol}&q=is%3Aoption`);
    render(<Host />);
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    const [step] = navigations;
    expect(step?.replace).toBe(true);
    expect(step?.hash).toBe(`pos-${PUT.symbol}`);
    expect(searchAfter(step, search)).toEqual({
      q: "is:option",
      position: undefined,
      open: PUT.symbol,
    });
  });
});

describe("the position's full page", () => {
  it("links only to its own four sections, the ways counted for a sold option", () => {
    page(true);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(
      within(nav)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Picture", "Three ways to play it", "Fills", "Dates"]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("leads with the row's own picture, then profit at price with a line per date", async () => {
    page(true);
    expect(screen.getByRole("heading", { level: 2, name: PUT.display })).toHaveFocus();
    expect(screen.getByRole("region", { name: `The picture of ${PUT.display}` })).toBeTruthy();
    const chart = await screen.findByRole("img", { name: /^Profit at CRWV's price/ });
    expect(chart.getAttribute("aria-label")).toContain("At today's $82.60:");
    const key = chart.closest("figure")?.querySelector(".ppage-key");
    expect(key?.textContent).toContain("today");
    expect(key?.textContent).toContain("at expiry");
    expect(key?.textContent).toContain("strike $80");
    expect(key?.textContent).toContain("breakeven $77.45");
  });

  it("says each way to play it in one line of fact, its dollar figures never split", async () => {
    const { container } = page(true);
    const ways = () =>
      [...container.querySelectorAll(".ppage-way")].map((w) => [
        w.querySelector("dt")?.textContent,
        w.querySelector("dd")?.textContent,
      ]);
    await waitFor(() => expect(ways()[0]?.[1]).toContain("the P/L ends at +$255."));
    expect(ways().map(([way]) => way)).toEqual(["Keep", "Roll", "Buy back"]);
    expect(ways()[2]?.[1]).toBe("At today's mark: cash out $550 · locks in −$295 · frees $8,000.");
    const figures = [...container.querySelectorAll(".ppage-way .ppage-money")].map(
      (m) => m.textContent,
    );
    expect(figures).toContain("−$295");
  });

  it("lists this contract's fills alone, read from the stock's own narrowed ledger", async () => {
    const { container } = page(true);
    await waitFor(() => expect(container.querySelectorAll(".ppage-fills li")).toHaveLength(1));
    expect(activityAsked).toEqual([{ id: "sauron", symbol: "CRWV" }]);
    expect(container.querySelector(".ppage-fill-what")?.textContent).toBe(
      "SOLD 1 contract at $2.55",
    );
  });

  it("dates it: opened, then expiry", async () => {
    const { container } = page(true);
    await waitFor(() => expect(container.querySelectorAll(".ppage-dates li")).toHaveLength(2));
    const dates = [...container.querySelectorAll(".ppage-dates li")].map((li) => li.textContent);
    expect(dates).toEqual(["Thu Oct 8 Opened", "Fri Nov 6 Expires · in 29 days"]);
  });

  it("ends in Buy back and Roll for the owner, and in no act for anyone else", () => {
    const owner = page(true);
    const acts = owner.container.querySelector(".ppage-acts") as HTMLElement;
    expect(
      within(acts)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Buy back", "Roll"]);
    owner.unmount();
    const other = page(false);
    expect(other.container.querySelector(".ppage-acts")).toBeNull();
    expect(screen.queryByRole("button", { name: "Buy back" })).toBeNull();
  });

  it("has one way back, ← Positions", () => {
    let back = 0;
    page(true, () => {
      back += 1;
    });
    fireEvent.click(screen.getByRole("button", { name: "Back to Positions" }));
    expect(back).toBe(1);
  });
});
