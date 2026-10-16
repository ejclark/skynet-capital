import { render, screen } from "@testing-library/react";
import { KindChip } from "../../src/ui";

/**
 * The account-kind chip (#5365). WHEN an account's kind is shown, the chip SHALL say BOT or HUMAN
 * in one casing on every screen, wearing today's `.chip-bot` / `.chip-human` look; WHERE the row is
 * the viewer's own it SHALL say YOU instead; and a cohort SHALL read in the plural.
 */

describe("KindChip", () => {
  it("names a bot and a human in capitals, each in its own chip class", () => {
    render(
      <>
        <KindChip kind="bot" />
        <KindChip kind="human" />
      </>,
    );
    expect(screen.getByText("BOT")).toHaveClass("chip", "chip-bot");
    expect(screen.getByText("HUMAN")).toHaveClass("chip", "chip-human");
  });

  it("says YOU on the viewer's own row, in the you chip and not the kind's", () => {
    render(<KindChip kind="human" you />);
    const chip = screen.getByText("YOU");
    expect(chip).toHaveClass("chip", "chip-you");
    expect(chip).not.toHaveClass("chip-human");
  });

  it("names a cohort in the plural", () => {
    render(<KindChip kind="bot" plural />);
    expect(screen.getByText("BOTS")).toHaveClass("chip-bot");
  });

  it("follows the word with a detail after a middle dot, keeping a surface's layout class", () => {
    const { container } = render(<KindChip kind="human" detail="Eric" className="pmeta-who num" />);
    const chip = container.querySelector(".chip");
    expect(chip).toHaveTextContent("HUMAN · Eric");
    expect(chip).toHaveClass("chip", "chip-human", "pmeta-who", "num");
  });
});
