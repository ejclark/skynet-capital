import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { FilterChip } from "../../src/ui";

/**
 * The multi-select filter chip (#5365). WHEN a chip is pressed it SHALL say so to assistive tech
 * (`aria-pressed`) AND by a shape — a ✓ in its fixed slot — never by hue alone; WHEN it is not, the
 * slot SHALL stay but hold nothing; and a press SHALL be reported to the owner of the state.
 */

/** A chip that owns its own state, so a press can be seen to flip it. */
function Owned({ onPress }: { readonly onPress: () => void }) {
  const [on, setOn] = useState(false);
  return (
    <FilterChip
      pressed={on}
      onPress={() => {
        onPress();
        setOn(!on);
      }}
    >
      Options
    </FilterChip>
  );
}

describe("FilterChip", () => {
  it("toggles aria-pressed and calls onPress on every press", () => {
    const onPress = rstest.fn();
    render(<Owned onPress={onPress} />);
    const chip = screen.getByRole("button", { name: "Options" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("draws the ✓ only when pressed, in a slot that is always there and hidden from readers", () => {
    const { container, rerender } = render(
      <FilterChip pressed={false} onPress={() => undefined}>
        NVDA
      </FilterChip>,
    );
    const slot = () => container.querySelector(".filter-chip-check");
    expect(slot()).toHaveAttribute("aria-hidden", "true");
    expect(slot()).toHaveTextContent("");
    rerender(
      <FilterChip pressed onPress={() => undefined}>
        NVDA
      </FilterChip>,
    );
    expect(slot()).toHaveTextContent("✓");
    // The ✓ is decoration: the accessible name stays the label alone.
    expect(screen.getByRole("button", { name: "NVDA" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps a surface's layout class beside its own", () => {
    render(
      <FilterChip pressed={false} onPress={() => undefined} className="rx-symbol">
        AAPL
      </FilterChip>,
    );
    expect(screen.getByRole("button", { name: "AAPL" })).toHaveClass("filter-chip", "rx-symbol");
  });
});
