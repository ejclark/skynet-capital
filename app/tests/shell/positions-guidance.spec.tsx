import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { stakeFingerprint } from "../../../src/options/position-guidance";
import type {
  Decision,
  DeskAllocation,
  DeskPosition,
  DeskSnapshot,
  DeskTiles,
} from "../../src/live/desk";
import { heldStake, writeSnapshot } from "../../src/live/guidance";
import type { NetWorthStatsView } from "../../src/live/networth";
import * as actualOptions from "../../src/live/options" with { rstest: "importActual" };
import type { OptionPositions } from "../../src/live/options";
import { useSavedViews } from "../../src/shell/saved-views";

/**
 * A GUIDANCE LINE ON EVERY ROW (#5070; round 2 of #5037, Eric picked R2). The landing view is the
 * closed list; every position carries one line under a divider, in a slot that keeps its height:
 * the fact badge ("◆ Review · $2.60 above strike") and, on the right, the row's guidance, which
 * opens in place. The "Needs a decision" pager retired with it: its job is these badges.
 *  - "Worth a look first" is a sort (Eric: "order is more of a sort precedence"), a chip ⇄ the
 *    `sort:look` token, savable as a view.
 *  - Filter opens in place (no pop-up) with a Mark line; the marks narrow the list, and what a
 *    mark filter hides is named under it with Clear.
 *  - Not now steps a row's mark aside until a stated return condition, with Undo.
 */

const BOOK: OptionPositions = {
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
      positionGreeks: { delta: 39.8, theta: 11.46 },
    },
  ],
} as unknown as OptionPositions;

rstest.mock("../../src/live/options", () => ({
  ...actualOptions,
  fetchOptionPositions: () => Promise.resolve(BOOK),
}));
/** The Overview's `?lens=`: List unless a test sets it. */
let lensSearch: Record<string, unknown> = {};
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="/app/trade" className={className}>
      {children}
    </a>
  ),
  useSearch: () => lensSearch,
  useNavigate: () => () => Promise.resolve(),
}));
// The Overview's money and league cards read their own endpoints; the positions half is real.
rstest.mock("../../src/shell/networth-card", () => ({
  NetWorthCard: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
rstest.mock("../../src/shell/money-strip", () => ({ MoneyStrip: () => null }));
rstest.mock("../../src/shell/sauron-card", () => ({ SauronCard: () => null }));
rstest.mock("../../src/shell/council-line-card", () => ({ CouncilLineCard: () => null }));
rstest.mock("../../src/shell/new-high-ceremony", () => ({ NewHighCeremony: () => null }));
rstest.mock("../../src/shell/use-tower-column", () => ({ useTowerColumn: () => false }));

const { PositionsBlotter } = await import("../../src/shell/positions-blotter");
const { OverviewSection } = await import("../../src/shell/accounts-overview-section");

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

/** Sauron's book in the profile world, in the server's own order (largest first). */
const NVDA = pos({
  symbol: "NVDA",
  display: "NVDA",
  quantity: "130",
  price: "$232.10",
  breakeven: "$223.98",
  value: "$30,173",
  totalPl: "+$1,056",
  totalPlRaw: 1055.6,
  returnPct: "+3.63%",
  totalTone: "pos",
  nextPrint: { status: "estimate", at: "2026-11-18", label: "Earnings Nov 18 (estimated)" },
});
const CRWV = pos({
  symbol: "CRWV",
  display: "CRWV",
  quantity: "55",
  price: "$82.60",
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
  expiresInDays: 29,
});
const SAURON = [NVDA, CRWV, PUT];

/** The decision engine's card on the put (`decisions-view.ts` soldCopy) — its lesson rode the
 *  retired pager — and a playbook idea on NVDA, which only the Map lens used to show. */
const PUT_DECISION: Decision = {
  id: `at-risk-${PUT.symbol}`,
  kind: "at-risk",
  symbol: PUT.symbol,
  display: "CRWV Nov 6 $80 Put",
  plainName: "Sold put · profits if CRWV stays above $80",
  pl: "−$295 · −116.0%",
  plTone: "neg",
  title: "Collected $255; buying back costs $550",
  captionShort: "",
  caption: "",
  why: "",
  clocks: [],
  primary: { label: "Review on Trade ↗", href: "/app/trade?symbol=CRWV" },
  stakeRaw: 550,
  learn: { term: "breakeven", label: "What is a breakeven?" },
  due: { at: "2026-11-06", reason: "expiry", label: "Expires Nov 6" },
};
const NVDA_IDEA: Decision = {
  id: "idea-nvda-earnings",
  kind: "idea",
  symbol: "NVDA",
  display: "NVDA",
  plainName: "",
  pl: "3 days before earnings",
  plTone: "flat",
  title: "A playbook fits NVDA, which you already hold",
  captionShort: "",
  caption: "",
  why: "",
  clocks: [],
  primary: { label: "See the playbook ↗", href: "/app/playbooks/earnings-run-up" },
  stakeRaw: 0,
};
const DECISIONS = [PUT_DECISION, NVDA_IDEA];

const ALLOCATION: DeskAllocation = {
  shares: "$34,716",
  options: "$0",
  optionsSold: "-$550",
  cash: "$965,284",
  sharesPct: 3.5,
  optionsPct: 0,
  cashPct: 96.5,
  cashShare: "96.5%",
  shareCount: 185,
};

function blotter(query: string, extra: Record<string, unknown> = {}) {
  const seen: string[] = [];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const node = (q: string): ReactElement => (
    <QueryClientProvider client={client}>
      <PositionsBlotter
        deskId="sauron"
        positions={SAURON}
        query={q}
        onFilterChange={(next) => seen.push(next)}
        {...extra}
      />
    </QueryClientProvider>
  );
  const view = render(node(query));
  return { seen, rerender: (q: string) => view.rerender(node(q)), container: view.container };
}

/** What a sighted reader sees: text without the words only a screen reader hears. */
function seenText(el: Element): string {
  const copy = el.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll(".visually-hidden")) hidden.remove();
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** The phone cards' guidance lines, top to bottom. */
const lines = (container: Element) =>
  [...container.querySelectorAll(".pos-cards .pos-guide-mark")].map(seenText);

/** The phone cards' names, top to bottom. */
const order = (container: Element) =>
  [...container.querySelectorAll(".pos-cards .pos-card-name")].map(seenText);

// The profile world's instant: Thursday 2026-10-08, 3:00 PM ET.
beforeEach(() => {
  rstest.useFakeTimers({ toFake: ["Date"] });
  rstest.setSystemTime(new Date("2026-10-08T19:00:00Z"));
  localStorage.clear();
  useSavedViews.setState({ byDesk: {} });
});
afterEach(() => {
  rstest.useRealTimers();
});

describe("the guidance line on every row", () => {
  it("gives every position a fact badge under its numbers, the option's once its stock is priced", async () => {
    const { container } = blotter("");
    expect(await screen.findAllByText("$2.60 above strike")).not.toHaveLength(0);
    expect(lines(container)).toEqual([
      "○ On plan · earnings est. Nov 18",
      "◆ Review · below breakeven",
      "◆ Review · $2.60 above strike",
    ]);
  });

  it("keeps each card's link — and its accessible name — as #5061 drew it", () => {
    blotter("");
    expect(screen.getAllByRole("link", { name: /^NVDA ?, \$232\.10 a share/ })).toHaveLength(1);
  });

  it("draws the line on the desk table too, as a full-width row under each position", async () => {
    const { container } = blotter("");
    await screen.findAllByText("$2.60 above strike");
    const rows = [...container.querySelectorAll(".blotter .row-guide .pos-guide-mark")];
    expect(rows.map(seenText)).toEqual(lines(container));
  });

  it("says the call and its confidence once today's guidance read of this holding exists", async () => {
    const stake =
      heldStake({ desk: { positions: SAURON } } as unknown as DeskSnapshot, "NVDA") ?? {};
    writeSnapshot("NVDA", stakeFingerprint(stake), {
      asOf: "2026-10-08T18:00:00.000Z",
      spot: 232.1,
      calls: [
        { lever: "shares", call: "HOLD", confidence: "medium" },
        { lever: "covered-calls", call: "WAIT", confidence: "low" },
        { lever: "cash-secured-puts", call: "NOT AVAILABLE", confidence: "none" },
      ],
      richness: "middling",
    });
    const { container } = blotter("");
    await screen.findAllByText("$2.60 above strike");
    const cards = container.querySelector(".pos-cards") as HTMLElement;
    const nvda = within(cards).getByRole("button", { name: /^Guidance for NVDA: Hold/ });
    expect(seenText(nvda)).toBe("Hold · ▰▰▱ medium›");
    expect(within(cards).getByRole("button", { name: /^Guidance for CRWV$/ })).toBeTruthy();
    fireEvent.click(nvda);
    expect(
      screen.getByText(/Hold, medium confidence — from your guidance read at 2:00 PM ET/),
    ).toBeTruthy();
  });
});

/** The Overview section for Sauron's one account: the money cards stubbed, the rest real. */
function overview(lens?: "map") {
  lensSearch = lens ? { lens } : {};
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const desk: DeskSnapshot = {
    generatedAt: "2026-10-08T19:00:00.000Z",
    desk: {
      id: "sauron",
      name: "Sauron",
      kind: "bot",
      tiles: {} as DeskTiles,
      positions: SAURON,
      considerations: [],
      decisions: DECISIONS,
      allocation: ALLOCATION,
    },
  };
  return render(
    <QueryClientProvider client={client}>
      <OverviewSection
        stats={{ cashKnown: true, cash: "$965,284", positionCount: 3 } as NetWorthStatsView}
        caption="Sauron"
        owned={[]}
        allAccounts={false}
        roster={[]}
        loading={false}
        error={false}
        accountId="sauron"
        desks={[desk]}
        desksLoading={false}
        desksError={false}
        query=""
        onFilterChange={() => undefined}
      />
    </QueryClientProvider>,
  );
}

/** Eric retired these as verdicts (3a77c6db): the marks say a verb and a fact instead. */
const RETIRED = /Needs a decision|At risk/;

/** A polygon's corners: ▲ has three. */
const corners = (svg: Element | null) =>
  svg?.querySelector("polygon")?.getAttribute("points")?.trim().split(/\s+/).length;

describe("the Overview after the pager (#5083)", () => {
  it("says no retired word on List, and a row's guidance opens to the lesson the pager carried", async () => {
    const { container } = overview();
    await screen.findAllByText("$2.60 above strike");
    expect(container).not.toHaveTextContent(RETIRED);
    const cards = container.querySelector(".pos-cards") as HTMLElement;
    fireEvent.click(within(cards).getByRole("button", { name: /^Guidance for CRWV \$80 PUT/ }));
    const open = cards.querySelector(".pos-guide-open") as HTMLElement;
    expect(within(open).getByRole("button", { name: "What is a breakeven?" })).toBeTruthy();
  });

  it("wears each Map card's row badge in place of the retired words", async () => {
    const { container } = overview("map");
    const column = await screen.findByRole("complementary", { name: "Worth a look" });
    await within(column).findByText("$2.60 above strike");
    expect(container).not.toHaveTextContent(RETIRED);
    expect([...column.querySelectorAll(".map-decision-top > :first-child")].map(seenText)).toEqual([
      "◆ Review · $2.60 above strike",
      "Playbook idea",
    ]);
  });

  it("draws the next date's decide by as its own shape, never the ▲ a row's Consider wears", async () => {
    const { container } = overview();
    await screen.findAllByText("$2.60 above strike");
    const decide = container.querySelector(".held-next-line .lane-glyph--decide");
    expect(decide).not.toBeNull();
    expect(corners(decide)).not.toBe(3);
  });
});

describe("Worth a look first — a sort, a chip ⇄ the sort:look token", () => {
  it("is off until tapped, keeps the server's order, and counts the rows worth a look", async () => {
    const { container, seen } = blotter("");
    await screen.findAllByText("$2.60 above strike");
    const chip = screen.getByRole("button", { name: /Worth a look first/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(seenText(chip)).toBe("⇅ Worth a look first · 2");
    expect(order(container)).toEqual([
      "NVDA · $232.10",
      "CRWV · $82.60",
      "CRWV $80 SHORT PUT · 29d",
    ]);
    fireEvent.click(chip);
    expect(seen).toEqual(["sort:look"]);
  });

  it("puts Review first, then Consider, then On plan, and inside each the soonest expiry first", async () => {
    const { container } = blotter("sort:look");
    await screen.findAllByText("$2.60 above strike");
    // R2 drew the at-risk put first: it has a clock, the shares don't.
    expect(order(container)).toEqual([
      "CRWV $80 SHORT PUT · 29d",
      "CRWV · $82.60",
      "NVDA · $232.10",
    ]);
    expect(screen.getByRole("button", { name: /Worth a look first/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("orders shares with no clock by how far past their line they sit, the deepest loss first", async () => {
    const PLTR = pos({
      symbol: "PLTR",
      display: "PLTR",
      price: "$140.00",
      value: "$1,400",
      totalPl: "-$350",
      totalPlRaw: -350,
      returnPct: "-20.00%",
      totalTone: "neg",
    });
    const { container } = blotter("sort:look", { positions: [NVDA, CRWV, PUT, PLTR] });
    await screen.findAllByText("$2.60 above strike");
    expect(order(container)).toEqual([
      "CRWV $80 SHORT PUT · 29d",
      "PLTR · $140.00",
      "CRWV · $82.60",
      "NVDA · $232.10",
    ]);
  });

  it("says the token it wrote, and Save as a view keeps it as a tab", () => {
    blotter("sort:look");
    expect(screen.getByText("sort:look")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save as a view" }));
    expect(useSavedViews.getState().byDesk.sauron).toEqual([
      expect.objectContaining({ name: "Worth a look first", q: "sort:look" }),
    ]);
    const tabs = screen.getByRole("navigation", { name: "Saved views" });
    expect(within(tabs).getByRole("button", { name: "Worth a look first" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.queryByRole("button", { name: "Save as a view" })).not.toBeInTheDocument();
  });

  it("says why Save as a view can't save once the account holds eight views, like + New view", () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({
      id: `v${i}`,
      name: `View ${i}`,
      q: `v${i}`,
    }));
    useSavedViews.setState({ byDesk: { sauron: eight } });
    blotter("sort:look");
    const save = screen.getByRole("button", { name: "Save as a view" });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute("title", "Eight views is plenty — delete one first");
    expect(
      within(screen.getByRole("navigation", { name: "Saved views" })).getByRole("button", {
        name: "+ New view",
      }),
    ).toBeDisabled();
  });
});

describe("Filter — opens in place with a Mark line", () => {
  it("opens under the head, no dialog, with each mark's glyph, word and count", async () => {
    const { seen } = blotter("");
    await screen.findAllByText("$2.60 above strike");
    const toggle = screen.getByRole("button", { name: /^Filter/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const panel = screen.getByRole("group", { name: "Show by mark" });
    const marks = within(panel).getAllByRole("button");
    expect(marks.map(seenText)).toEqual([
      "◆ Review · 2",
      "▲ Consider · 0",
      "○ On plan · 1",
      "Done",
    ]);
    fireEvent.click(marks[0] as HTMLElement);
    expect(seen).toEqual(["is:review"]);
  });

  it("narrows to one mark, names what it hides, and Clear takes the mark off", async () => {
    const { container, seen } = blotter("is:review sort:look");
    await screen.findAllByText("$2.60 above strike");
    expect(order(container)).toEqual(["CRWV $80 SHORT PUT · 29d", "CRWV · $82.60"]);
    expect(seenText(screen.getByRole("button", { name: /^Filter/ }))).toBe("Filter · 1 ▾");
    expect(screen.getByText("1 hidden by Filter: NVDA (On plan)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(seen).toEqual(["sort:look"]);
  });

  it("lets All go while a mark narrows the list, and tapping it takes the mark off, the sort kept", () => {
    const { seen } = blotter("is:review sort:look");
    const all = screen.getByRole("button", { name: "All" });
    expect(all).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(all);
    expect(seen).toEqual(["sort:look"]);
  });
});

describe("the row's guidance opens in place, and Not now steps its mark aside", () => {
  /** Open a phone card's guidance (the desk table's sub-row has its own, closed). */
  const openGuidance = (container: Element, name: RegExp) =>
    fireEvent.click(
      within(container.querySelector(".pos-cards") as HTMLElement).getByRole("button", { name }),
    );

  it("opens under its own row with the return condition stated before anything is set aside", async () => {
    const { container } = blotter("");
    await screen.findAllByText("$2.60 above strike");
    openGuidance(container, /^Guidance for CRWV \$80 PUT/);
    const card = container.querySelector(".pos-cards .pos-guide-open") as HTMLElement;
    expect(seenText(card)).toContain(
      "Back after Friday's close, or sooner if CRWV trades below $80.00.",
    );
    expect(within(card).getByRole("link", { name: /Guidance for CRWV on Trade/ })).toBeTruthy();
  });

  it("opens with the decision engine's sentence on the position and its lesson, one tap away", async () => {
    const { container } = blotter("", { decisions: DECISIONS });
    await screen.findAllByText("$2.60 above strike");
    openGuidance(container, /^Guidance for CRWV \$80 PUT/);
    const card = container.querySelector(".pos-cards .pos-guide-open") as HTMLElement;
    expect(seenText(card)).toContain("Collected $255; buying back costs $550");
    fireEvent.click(within(card).getByRole("button", { name: "What is a breakeven?" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/stops losing money at expiry/);
  });

  it("hangs a playbook idea on the line of the name it fits, with the way to the playbook", async () => {
    const { container } = blotter("", { decisions: DECISIONS });
    await screen.findAllByText("$2.60 above strike");
    openGuidance(container, /^Guidance for NVDA/);
    const card = container.querySelector(".pos-cards .pos-guide-open") as HTMLElement;
    expect(seenText(card)).toContain("A playbook fits NVDA, which you already hold");
    expect(within(card).getByRole("link", { name: /See the playbook/ })).toHaveAttribute(
      "href",
      "/app/playbooks/earnings-run-up",
    );
  });

  it("sets the mark aside with Undo beside it, and the sort lets the row fall back", async () => {
    const { container } = blotter("sort:look");
    await screen.findAllByText("$2.60 above strike");
    openGuidance(container, /^Guidance for CRWV \$80 PUT/);
    const card = container.querySelector(".pos-cards .pos-guide-open") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: "Not now" }));
    expect(lines(container)).toEqual([
      "◆ Review · below breakeven",
      "○ On plan · earnings est. Nov 18",
      "◇ Not now · till Fri close",
    ]);
    expect(order(container)[2]).toBe("CRWV $80 SHORT PUT · 29d");
    fireEvent.click(screen.getAllByRole("button", { name: /^Undo/ })[0] as HTMLElement);
    expect(lines(container)).toContain("◆ Review · $2.60 above strike");
  });

  it("lets the mark back at Friday's close", async () => {
    const { container, rerender } = blotter("");
    await screen.findAllByText("$2.60 above strike");
    openGuidance(container, /^Guidance for CRWV \$80 PUT/);
    const card = container.querySelector(".pos-cards .pos-guide-open") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: "Not now" }));
    expect(lines(container)).toContain("◇ Not now · till Fri close");
    act(() => rstest.setSystemTime(new Date("2026-10-09T20:01:00Z")));
    rerender("sort:look");
    expect(lines(container)).toContain("◆ Review · $2.60 above strike");
  });

  it("offers no Not now on another member's account — the marks still show", async () => {
    const { container } = blotter("", { canTrade: false });
    await screen.findAllByText("$2.60 above strike");
    openGuidance(container, /^Guidance for CRWV \$80 PUT/);
    const card = container.querySelector(".pos-cards .pos-guide-open") as HTMLElement;
    expect(within(card).queryByRole("button", { name: "Not now" })).not.toBeInTheDocument();
    expect(lines(container)).toContain("◆ Review · $2.60 above strike");
  });
});
