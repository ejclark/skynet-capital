import { render, screen } from "@testing-library/react";
import { EnvPill, PAPER_WORD } from "../../src/ui";

/**
 * The trading-mode pill (#5365). WHEN a mode is shown, it SHALL sit on the neutral `.env-pill` and
 * never on a kind chip — a LIVE check once drew as the green HUMAN chip — and the paper word SHALL
 * come from one constant, so the open pick on #5205 is a one-line change.
 */

describe("EnvPill", () => {
  it("says the paper word by default, from the one constant", () => {
    render(<EnvPill />);
    expect(PAPER_WORD).toBe("SIM");
    expect(screen.getByText(PAPER_WORD)).toHaveClass("env-pill");
  });

  it("draws a bot check's LIVE and OBSERVE on the same neutral pill, never a kind chip", () => {
    render(
      <>
        <EnvPill mode="live" />
        <EnvPill mode="observe" />
      </>,
    );
    for (const word of ["LIVE", "OBSERVE"]) {
      const pill = screen.getByText(word);
      expect(pill).toHaveClass("env-pill");
      expect(pill).not.toHaveClass("chip");
      expect(pill.className).not.toMatch(/chip-(human|bot)/);
    }
  });
});
