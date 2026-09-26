import { fireEvent, render, screen } from "@testing-library/react";
import { SymbolPrompt } from "../../src/shell/symbol-prompt";

/**
 * A Trade pane with no symbol asks for one itself (#3807 slice 2e, dead end 3). WHEN a pane needs
 * a symbol it does not have and the ticket is off screen, THE pane SHALL offer the symbol field
 * in the same note as its ask, and a commit SHALL reach the caller (which writes `?symbol=`).
 * WHILE the ticket is beside it (docked), THE pane SHALL say the ask alone — no second input.
 */
describe("SymbolPrompt", () => {
  it("puts the symbol field inside the note that asks for it, and commits what is typed", () => {
    const commits: string[] = [];
    render(
      <SymbolPrompt ask="Pick a symbol to see its chart." onCommit={(s) => commits.push(s)} />,
    );
    const field = screen.getByRole("combobox", { name: "Symbol" });
    expect(field.closest(".note")?.textContent).toContain("Pick a symbol to see its chart.");
    fireEvent.change(field, { target: { value: "nvda" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(commits).toEqual(["NVDA"]);
  });

  it("never commits an empty field", () => {
    const commits: string[] = [];
    render(
      <SymbolPrompt ask="Pick a symbol to see its chart." onCommit={(s) => commits.push(s)} />,
    );
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Symbol" }), { key: "Enter" });
    expect(commits).toEqual([]);
  });

  it("says the ask alone when there is no commit to make (the ticket is beside it)", () => {
    render(<SymbolPrompt ask="Pick a symbol on the Ticket to browse its options chain." />);
    expect(
      screen.getByText("Pick a symbol on the Ticket to browse its options chain."),
    ).toBeVisible();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
