import { fireEvent, render, screen } from "@testing-library/react";
import { buysLabel, GLOSSARY } from "../../src/shell/glossary";
import { GlossaryTerm } from "../../src/shell/glossary-term";

describe("GlossaryTerm", () => {
  it("prints the plain label and describes it without opening anything", () => {
    render(<GlossaryTerm term="timeDecay" />);
    const term = screen.getByRole("button", { name: "Time decay" });
    expect(term).toHaveAccessibleDescription(/lose each day if prices don't move.*theta/);
    expect(screen.getByRole("tooltip", { hidden: true })).not.toBeVisible();
  });

  it("opens on focus, closes on Escape", () => {
    render(<GlossaryTerm term="onPaper" />);
    const term = screen.getByRole("button", { name: "On paper" });
    fireEvent.focus(term);
    expect(screen.getByRole("tooltip")).toBeVisible();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Traders call it unrealized P/L.");
    fireEvent.keyDown(term, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens on hover and a tap toggles it for touch", () => {
    render(<GlossaryTerm term="breakeven" />);
    const term = screen.getByRole("button", { name: "Breakeven" });
    fireEvent.mouseEnter(term);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.mouseLeave(term);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.click(term);
    expect(screen.getByRole("tooltip")).toBeVisible();
  });

  it("lets a caller print an inline form of the label", () => {
    render(<GlossaryTerm term="lockedIn">locked in</GlossaryTerm>);
    expect(screen.getByRole("button", { name: "locked in" })).toBeInTheDocument();
  });
});

describe("glossary copy", () => {
  it("never leads with jargon: every label is plain and every entry says what it means for you", () => {
    for (const entry of Object.values(GLOSSARY)) {
      expect(entry.label).not.toMatch(/theta|delta|DTE|lots?\b|unrealized|realized/i);
      expect(entry.plain.length).toBeGreaterThan(20);
    }
  });

  it("counts buys in plain English", () => {
    expect(buysLabel(1)).toBe("1 buy");
    expect(buysLabel(3)).toBe("3 buys");
  });
});
