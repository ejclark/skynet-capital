import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import type { Decision } from "../../src/live/desk";
import { DecisionPager } from "../../src/shell/decision-pager";
import { rangeGeometry } from "../../src/shell/outcome-range";

const decision = (over: Partial<Decision>): Decision => ({
  id: "at-risk-TSLA261017P00400000",
  kind: "at-risk",
  symbol: "TSLA261017P00400000",
  display: "TSLA Oct 17 400 Put",
  plainName: "Put option · profits if TSLA falls",
  pl: "-$6,240 · −55.3%",
  plTone: "neg",
  title: "Down 55% from what you paid",
  captionShort: "Needs TSLA below $385.90 by Oct 17 to profit.",
  caption: "TSLA Oct 17 400 Put has lost $6,240 of the $11,280 it cost.",
  why: "✦ it's down more than 10% from cost.",
  clocks: ["Expires in 24 days", "8 contracts · worth $5,040"],
  primary: {
    label: "Review on Trade ↗",
    href: "/app/trade?desk=eric&symbol=TSLA&strike=400&exp=2026-10-17",
  },
  secondary: { label: "Show in table", href: "#pos-TSLA261017P00400000" },
  stakeRaw: 5040,
  range: { type: "put", side: "long", strike: 400, breakeven: 385.9 },
  ...over,
});

const lockIn = decision({
  id: "lock-in-MSFT",
  kind: "lock-in",
  symbol: "MSFT",
  display: "MSFT",
  plainName: "Shares · profits if MSFT rises",
  title: "Up 30%: consider locking some of it in",
  range: undefined,
});

/** The header's › (the phone's copy in the action row is CSS-hidden on wide screens; jsdom has
 *  no CSS, so both are in the tree). */
const next = () => screen.getAllByRole("button", { name: "Next decision" })[0] as HTMLElement;

const wrap = (ui: ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe("DecisionPager", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows one card at a time and pages with wrap-around", () => {
    wrap(<DecisionPager accountId="eric" decisions={[decision({}), lockIn]} />);
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Down 55% from what you paid")).toBeInTheDocument();
    fireEvent.click(next());
    expect(screen.getByText("Up 30%: consider locking some of it in")).toBeInTheDocument();
    fireEvent.click(next());
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("only drafts: the primary action is a link to Trade, never an order", () => {
    wrap(<DecisionPager accountId="eric" decisions={[decision({})]} />);
    expect(screen.getByRole("link", { name: "Review on Trade ↗" })).toHaveAttribute(
      "href",
      "/app/trade?desk=eric&symbol=TSLA&strike=400&exp=2026-10-17",
    );
  });

  it("opens the card's lesson in place, and skips a term this build doesn't know", () => {
    const withLearn = decision({ learn: { term: "ivCrush", label: "What is IV crush?" } });
    const unknown = decision({ id: "x", learn: { term: "gammaScalp", label: "What is it?" } });
    wrap(<DecisionPager accountId="eric" decisions={[withLearn, unknown]} />);
    fireEvent.click(screen.getByRole("button", { name: /Why, and details/ }));
    expect(screen.getByRole("button", { name: "What is IV crush?" })).toBeInTheDocument();
    fireEvent.click(next());
    expect(screen.queryByText("What is it?")).not.toBeInTheDocument();
  });

  it("keeps details open across pages", () => {
    wrap(<DecisionPager accountId="eric" decisions={[decision({}), lockIn]} />);
    fireEvent.click(screen.getByRole("button", { name: /Why, and details/ }));
    expect(screen.getByText("Expires in 24 days")).toBeInTheDocument();
    fireEvent.click(next());
    expect(screen.getByRole("button", { name: /Why, and details/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("snoozes a card with ✕, remembers it for this account, and hides at zero", () => {
    const { unmount } = wrap(<DecisionPager accountId="eric" decisions={[decision({})]} />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("region", { name: "Needs a decision" })).not.toBeInTheDocument();
    unmount();
    wrap(<DecisionPager accountId="eric" decisions={[decision({})]} />);
    expect(screen.queryByRole("region", { name: "Needs a decision" })).not.toBeInTheDocument();
  });

  it("names the kind in words, not colour alone", () => {
    wrap(<DecisionPager accountId="eric" decisions={[decision({})]} />);
    const card = screen.getByRole("article", { name: "At risk: TSLA Oct 17 400 Put" });
    expect(within(card).getByText("At risk")).toBeInTheDocument();
  });
});

describe("rangeGeometry", () => {
  it("puts a long put's profit on the left and places now and the breakeven on the axis", () => {
    const g = rangeGeometry({ type: "put", side: "long", strike: 400, breakeven: 385.9 }, 412.8);
    expect(g.profitRight).toBe(false);
    expect(g.be).toBeGreaterThan(0);
    expect(g.now).toBeGreaterThan(g.be);
    expect(g.now).toBeLessThan(100);
  });

  it("draws without a spot rather than inventing one", () => {
    const g = rangeGeometry({ type: "call", side: "long", strike: 130, breakeven: 137.85 });
    expect(g.now).toBeUndefined();
    expect(g.profitRight).toBe(true);
  });
});
