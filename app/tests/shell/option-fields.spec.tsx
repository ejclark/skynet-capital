import { fireEvent, render, screen } from "@testing-library/react";
import type { ChainData } from "../../src/live/options";
import { ExpirationField, StrikeField } from "../../src/shell/option-fields";

/**
 * `StrikeField` (#2017 Phase 0 task 4b): the numeric input always renders — a chain page is never
 * the only way to name a strike. When a chain has loaded rows, a `<datalist>` adds native
 * autocomplete suggestions on top of that same input; typing a value the chain doesn't list is
 * still a normal edit, not a blocked one.
 *
 * `ExpirationField` (#2017 Phase 0 task 4c): with no chain, the raw date input is unchanged. With
 * a chain, expiration renders as a horizontal strip of toggle buttons (one per
 * `chainData.expirations` entry) instead of a `<select>`.
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

const chainManyExpirations: ChainData = {
  symbol: "NVDA",
  optionType: "call",
  expirations: ["2026-09-08", "2026-09-11", "2026-09-18", "2026-10-16"],
  expiration: "2026-09-18",
  rows: [],
};

describe("ExpirationField", () => {
  it("renders the plain date input unchanged when there's no chain", () => {
    render(
      <ExpirationField
        id="exp"
        chainData={undefined}
        value="2026-09-20"
        onEdit={noop}
        zeroDteLocked={false}
      />,
    );

    const input = screen.getByDisplayValue("2026-09-20");
    expect(input).toHaveAttribute("type", "date");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders one tab per expiration, with the chain's resolved expiration marked active", () => {
    render(
      <ExpirationField
        id="exp"
        chainData={chainManyExpirations}
        value="2026-09-08"
        onEdit={noop}
        zeroDteLocked={false}
      />,
    );

    const tabs = screen.getAllByRole("button");
    expect(tabs.map((t) => t.textContent)).toEqual(chainManyExpirations.expirations);

    const active = screen.getByText("2026-09-18");
    expect(active).toHaveAttribute("aria-pressed", "true");
    for (const exp of chainManyExpirations.expirations.filter((e) => e !== "2026-09-18")) {
      expect(screen.getByText(exp)).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("calls onEdit with the clicked tab's date when an inactive tab is clicked", () => {
    let edited: string | undefined;
    render(
      <ExpirationField
        id="exp"
        chainData={chainManyExpirations}
        value="2026-09-08"
        onEdit={(v) => {
          edited = v;
        }}
        zeroDteLocked={false}
      />,
    );

    fireEvent.click(screen.getByText("2026-10-16"));
    expect(edited).toBe("2026-10-16");
  });

  it("disables today's tab with a visible non-colour cue and the lock reason when zero-DTE is locked", () => {
    const today = new Date().toISOString().slice(0, 10);
    const chainWithToday: ChainData = {
      ...chainManyExpirations,
      expirations: [today, "2026-10-16"],
      expiration: today,
    };
    render(
      <ExpirationField
        id="exp"
        chainData={chainWithToday}
        value={today}
        onEdit={noop}
        zeroDteLocked={true}
        zeroDteReason="course 501 isn't earned yet"
      />,
    );

    const lockedTab = screen.getByText((content) => content.startsWith(today));
    expect(lockedTab).toBeDisabled();
    expect(lockedTab).toHaveAttribute("title", "course 501 isn't earned yet");
    expect(lockedTab.textContent).toContain("locked");

    const openTab = screen.getByText("2026-10-16");
    expect(openTab).not.toBeDisabled();
  });
});
