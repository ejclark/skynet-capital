import { fireEvent, render, screen } from "@testing-library/react";
import type { ChainData } from "../../src/live/options";
import { StrikeField } from "../../src/shell/option-fields";

/**
 * `StrikeField` (#2017 Phase 0 task 4b): the numeric input always renders — a chain page is never
 * the only way to name a strike. When a chain has loaded rows, a `<datalist>` adds native
 * autocomplete suggestions on top of that same input; typing a value the chain doesn't list is
 * still a normal edit, not a blocked one.
 */

const noop = () => {
  // intentionally unused in specs that don't assert on this callback
};

const chainWithRows: ChainData = {
  symbol: "NVDA",
  optionType: "call",
  expirations: ["2026-10-16"],
  expiration: "2026-10-16",
  rows: [
    { strike: 40, occSymbol: "NVDA261016C00040000", premium: 2.35 },
    { strike: 42.5, occSymbol: "NVDA261016C00042500", premium: 1.1 },
  ],
};

const chainNoRows: ChainData = {
  symbol: "NVDA",
  optionType: "call",
  expirations: ["2026-10-16"],
  expiration: "2026-10-16",
  rows: [],
};

describe("StrikeField", () => {
  it("renders a plain number input with no list attribute or datalist when there's no chain", () => {
    const { container } = render(
      <StrikeField id="strike" chainData={undefined} value="" onEdit={noop} />,
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
    expect(input).not.toHaveAttribute("list");
    expect(container.querySelector("datalist")).not.toBeInTheDocument();
  });

  it("still renders the same editable number input when a chain has loaded, and free entry isn't blocked", () => {
    let edited: string | undefined;
    render(
      <StrikeField
        id="strike"
        chainData={chainWithRows}
        value=""
        onEdit={(v) => {
          edited = v;
        }}
      />,
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");

    fireEvent.change(input, { target: { value: "37.5" } });
    expect(edited).toBe("37.5");
  });

  it("wires the input's list attribute to a datalist of the chain's strikes when rows are present", () => {
    const { container } = render(
      <StrikeField id="strike" chainData={chainWithRows} value="" onEdit={noop} />,
    );

    const input = screen.getByRole("spinbutton");
    const listId = input.getAttribute("list");
    expect(listId).toBeTruthy();

    const datalist = container.querySelector(`datalist#${listId}`);
    expect(datalist).toBeInTheDocument();
    const options = datalist?.querySelectorAll("option") ?? [];
    expect(options.length).toBe(chainWithRows.rows.length);
    expect(Array.from(options).map((o) => o.getAttribute("value"))).toEqual(
      chainWithRows.rows.map((r) => String(r.strike)),
    );
  });

  it("omits the list attribute and datalist when the chain loaded but has no rows", () => {
    const { container } = render(
      <StrikeField id="strike" chainData={chainNoRows} value="" onEdit={noop} />,
    );

    const input = screen.getByRole("spinbutton");
    expect(input).not.toHaveAttribute("list");
    expect(container.querySelector("datalist")).not.toBeInTheDocument();
  });
});
