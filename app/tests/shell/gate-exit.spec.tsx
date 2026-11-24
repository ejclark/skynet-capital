import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { TradeGate } from "../../src/shell/trade-gate";

// #8249 on the stock form. With the setting off (the committed value, and every session it does not
// admit), the form is exactly what it was: Market, Limit, Stop-Market, and no exit control on any
// order. Admitted, Stop-Limit joins the select with both prices, and a Limit buy offers "Add an
// exit" with two EMPTY fields: nothing prefilled, nothing preselected.

function renderGate(props: { exitAtEntry?: boolean; initialAction?: "buy" | "sell" } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TradeGate deskId="desk-1" {...props} />
    </QueryClientProvider>,
  );
}

const typeSelect = () => screen.getByLabelText("Order type") as HTMLSelectElement;
const optionNames = () =>
  within(typeSelect())
    .getAllByRole("option")
    .map((o) => o.textContent);

describe("the stock form with the setting off (#8249)", () => {
  it("offers exactly Market, Limit and Stop-Market, as on main", () => {
    renderGate();
    expect(optionNames()).toEqual(["Market", "Limit", "Stop-Market"]);
  });

  it("shows no exit control on any order type", () => {
    renderGate();
    for (const type of ["market", "limit", "stop"]) {
      fireEvent.change(typeSelect(), { target: { value: type } });
      expect(screen.queryByLabelText("Add an exit")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Take-profit")).not.toBeInTheDocument();
    }
  });
});

describe("the stock form for an admitted session (#8249)", () => {
  it("adds Stop-Limit to the select, with both of its prices", () => {
    renderGate({ exitAtEntry: true });
    expect(optionNames()).toEqual(["Market", "Limit", "Stop-Market", "Stop-Limit"]);
    fireEvent.change(typeSelect(), { target: { value: "stop_limit" } });
    expect(screen.getByLabelText("Stop price")).toHaveValue(null);
    expect(screen.getByLabelText("Limit price")).toHaveValue(null);
  });

  it("offers 'Add an exit' on a Limit buy, off, with two empty fields once turned on", () => {
    renderGate({ exitAtEntry: true });
    expect(screen.queryByLabelText("Add an exit")).not.toBeInTheDocument();
    fireEvent.change(typeSelect(), { target: { value: "limit" } });
    const toggle = screen.getByLabelText("Add an exit") as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(screen.queryByLabelText("Take-profit")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Take-profit")).toHaveValue(null);
    expect(screen.getByLabelText("Stop")).toHaveValue(null);
    expect(screen.getByText(/Guards regular hours only/)).toBeInTheDocument();
  });

  it("offers no exit on a sell, or on a Market or Stop-Market buy", () => {
    renderGate({ exitAtEntry: true, initialAction: "sell" });
    fireEvent.change(typeSelect(), { target: { value: "limit" } });
    expect(screen.queryByLabelText("Add an exit")).not.toBeInTheDocument();
  });
});
