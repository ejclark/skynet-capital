import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { WireMilestoneItem } from "../../src/live/wire";
import { MilestoneRow } from "../../src/shell/wire-milestone-row";

// No route tree is mounted in a component-level spec, so `Link` becomes a plain anchor (the same stub
// `wire-trade-row.spec.tsx` and `pnl-strip.spec.tsx` use).
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    params,
    children,
    ...rest
  }: {
    readonly params?: { readonly id?: string };
    readonly children?: ReactNode;
  }) => (
    <a href={`/u/${params?.id ?? ""}`} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * One member's earned milestone on the Activity feed (#784 slice 5) — the fourth kind. Behavioral
 * only: that the row says what it is in a word at its left edge, names who earned it with a way to
 * their standing, and says what they earned in the Learn page's own words.
 */

const earn = (over: Partial<WireMilestoneItem> = {}): WireMilestoneItem => ({
  key: "eric:first-buy",
  icon: "🏅",
  kindLabel: "Earned",
  who: "Eric",
  whoId: "eric",
  title: "Buy your first stock",
  points: 25,
  meta: "+25 pts · 10/2/2026",
  at: "2026-10-02T09:00:00.000Z",
  ...over,
});

const inList = (item: WireMilestoneItem) => (
  <ul>
    <MilestoneRow earn={item} />
  </ul>
);

describe("MilestoneRow", () => {
  it("leads with the kind as a WORD, not an icon alone", () => {
    render(inList(earn()));
    expect(screen.getByText(/Earned/)).toBeInTheDocument();
  });

  it("names the member and links to their standing", () => {
    render(inList(earn()));
    expect(screen.getByRole("link", { name: "Eric" })).toHaveAttribute("href", "/u/eric");
  });

  it("says what was earned, in the Learn page's words", () => {
    render(inList(earn()));
    expect(screen.getByText("Buy your first stock")).toBeInTheDocument();
  });

  it("shows the meta the server formatted, points and all", () => {
    render(inList(earn()));
    expect(screen.getByText("+25 pts · 10/2/2026")).toBeInTheDocument();
  });
});
