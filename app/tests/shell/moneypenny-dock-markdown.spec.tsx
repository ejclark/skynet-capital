import { act, within } from "@testing-library/react";
import { type MpMessage, useMoneypenny } from "../../src/live/moneypenny";
import { historySheet, mount } from "./moneypenny-dock-harness";

// #7166 — her reply showed "**CRWV earnings**", asterisks and all. The rail draws bold and
// lists as elements, keeps her links working inside them, and leaves the member's words alone.
// In the dock (#7487 slice 2) her formatted lines live in History; the dock's latest line is plain
// text, so every query here is scoped to the History sheet.

function show(messages: MpMessage[]) {
  mount();
  act(() => useMoneypenny.setState({ history: true, messages }));
  return historySheet();
}

describe("MoneypennyDock · her markdown", () => {
  beforeEach(() => {
    localStorage.clear();
    useMoneypenny.getState().reset();
  });

  it("draws **bold** as bold, with no asterisk left on screen", () => {
    const rail = show([{ role: "mp", text: "Watch **CRWV earnings** on Tuesday." }]);
    const bold = within(rail).getByText("CRWV earnings");
    expect(bold.closest("strong")).not.toBeNull();
    expect(rail.querySelector(".mp-list")?.textContent).not.toContain("*");
  });

  it("draws - and 1. lines as list items, with places and URLs still linked", () => {
    const sheet = within(
      show([
        {
          role: "mp",
          text: "## Next\n- **[open Trade](/trade)** first\n1. read https://github.com/x/y/issues/9",
        },
      ]),
    );
    expect(sheet.getByText("Next").closest("strong")).not.toBeNull();
    expect(sheet.queryByText(/#/)).not.toBeInTheDocument();
    const items = sheet.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const place = sheet.getByRole("link", { name: "open Trade" });
    expect(place).toHaveAttribute("href", "/app/trade");
    expect(place.closest("strong")).not.toBeNull();
    expect(place.closest("li")).toBe(items[0]);
    const url = sheet.getByRole("link", { name: "https://github.com/x/y/issues/9" });
    expect(url.closest("ol")).not.toBeNull();
  });

  it("builds elements, never injected HTML", () => {
    const rail = show([{ role: "mp", text: "**<img src=x onerror=alert(1)>**" }]);
    expect(rail.querySelector("img")).toBeNull();
    expect(within(rail).getByText("<img src=x onerror=alert(1)>").tagName).toBe("STRONG");
  });

  it("leaves the member's own words exactly as typed", () => {
    const rail = show([{ role: "user", text: "is **CRWV** a buy?" }]);
    expect(within(rail).getByText("is **CRWV** a buy?")).toBeInTheDocument();
  });
});
