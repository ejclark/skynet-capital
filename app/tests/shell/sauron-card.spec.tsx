import { render, screen } from "@testing-library/react";
import { SauronCard } from "../../src/shell/sauron-card";

// The league reads the board over the network; these cases are about the card's art only.
rstest.mock("../../src/shell/league-card", () => ({
  LeagueCard: () => <p>the league</p>,
}));

describe("the league card, in the page's flow (#8189 criterion 10)", () => {
  it("draws no tower art at any width: the shade and the league only", () => {
    const { container } = render(<SauronCard ownedIds={["a1"]} meId="a1" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("region", { name: "The league" })).toHaveClass("char-card--bare");
    expect(screen.getByText("the league")).toBeInTheDocument();
  });

  it("draws the same card with a landmark's dials: the dials set the home tower's mood, not art here", () => {
    const { container } = render(
      <SauronCard landmark={{ power: 0.62, health: -0.3 }} ownedIds={["a1"]} meId="a1" />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("region", { name: "The league" })).toBeInTheDocument();
  });
});
