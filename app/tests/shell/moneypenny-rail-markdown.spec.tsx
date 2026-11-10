import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { type MpMessage, useMoneypenny } from "../../src/live/moneypenny";
import { MoneypennyRail } from "../../src/shell/moneypenny-rail";

// #7166 — her reply showed "**CRWV earnings**", asterisks and all. The rail draws bold and
// lists as elements, keeps her links working inside them, and leaves the member's words alone.

function show(messages: MpMessage[]) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MoneypennyRail />
    </QueryClientProvider>,
  );
  act(() => useMoneypenny.setState({ open: true, messages }));
  return screen.getByRole("complementary", { name: "Moneypenny" });
}

describe("MoneypennyRail · her markdown", () => {
  beforeEach(() => {
    localStorage.clear();
    useMoneypenny.getState().reset();
  });

  it("draws **bold** as bold, with no asterisk left on screen", () => {
    const rail = show([{ role: "mp", text: "Watch **CRWV earnings** on Tuesday." }]);
    const bold = screen.getByText("CRWV earnings");
    expect(bold.closest("strong")).not.toBeNull();
    expect(rail.querySelector(".mp-list")?.textContent).not.toContain("*");
  });

  it("draws - and 1. lines as list items, with places and URLs still linked", () => {
    show([
      {
        role: "mp",
        text: "## Next\n- **[open Trade](/trade)** first\n1. read https://github.com/x/y/issues/9",
      },
    ]);
    expect(screen.getByText("Next").closest("strong")).not.toBeNull();
    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const place = screen.getByRole("link", { name: "open Trade" });
    expect(place).toHaveAttribute("href", "/app/trade");
    expect(place.closest("strong")).not.toBeNull();
    expect(place.closest("li")).toBe(items[0]);
    const url = screen.getByRole("link", { name: "https://github.com/x/y/issues/9" });
    expect(url.closest("ol")).not.toBeNull();
  });

  it("builds elements, never injected HTML", () => {
    const rail = show([{ role: "mp", text: "**<img src=x onerror=alert(1)>**" }]);
    expect(rail.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>").tagName).toBe("STRONG");
  });

  it("leaves the member's own words exactly as typed", () => {
    show([{ role: "user", text: "is **CRWV** a buy?" }]);
    expect(screen.getByText("is **CRWV** a buy?")).toBeInTheDocument();
  });
});
