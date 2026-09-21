import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { OptionDraft, OptionPreview } from "../../src/live/options";
import { OptionPositionsCard } from "../../src/shell/option-positions";

/**
 * The option positions card's close row (#3407 P1 slice 3): Market stays the default, Limit
 * reveals a premium field and the review carries both; any edit disarms a standing review.
 */

const reviewed: OptionDraft[] = [];
let nextPreview: Partial<OptionPreview> = {};
rstest.mock("../../src/live/options", () => ({
  reviewOption: (draft: OptionDraft) => {
    reviewed.push(draft);
    return Promise.resolve({
      preview: {
        ok: true,
        contracts: 2,
        side: "sell",
        orderType: "market",
        refusals: [],
        warnings: [],
        ...nextPreview,
      },
    });
  },
  submitOption: () => Promise.resolve({ ok: true, orderId: "o", status: "accepted", symbol: "x" }),
}));

const held: DeskPosition = {
  symbol: "MSFT260918P00420000",
  display: "MSFT 420 put · Sep 18",
  detail: "2 contracts",
  isOption: true,
  quantity: "2",
  costPerShare: "$10.70",
  price: "$12.00",
  costBasis: "$2,140",
  value: "$2,400",
  dayPl: "+$60",
  dayPct: "+2.5%",
  dayTone: "pos",
  totalPl: "+$260",
  totalPlRaw: 260,
  returnPct: "+12.1%",
  totalTone: "pos",
  weightPct: 3,
};

function withClient(node: ReactElement) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe("OptionPositionsCard — close order type", () => {
  beforeEach(() => {
    reviewed.length = 0;
    nextPreview = {};
  });

  it("reviews a market close by default and says so on the confirm button", async () => {
    render(withClient(<OptionPositionsCard deskId="human-eric" positions={[held]} />));
    fireEvent.click(screen.getByRole("button", { name: "Close…" }));
    await waitFor(() => expect(reviewed).toHaveLength(1));
    expect(reviewed[0]).toMatchObject({ kind: "close", orderType: "market" });
    expect(reviewed[0]).not.toHaveProperty("limitPrice");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Confirm — close 2 · market/ }),
      ).toBeInTheDocument(),
    );
  });

  it("reveals the premium field on Limit and reviews with the typed price", async () => {
    nextPreview = { orderType: "limit", limitPrice: 13.5, estNotional: 2_700 };
    render(withClient(<OptionPositionsCard deskId="human-eric" positions={[held]} />));
    fireEvent.click(screen.getByRole("button", { name: "Limit" }));
    const price = screen.getByLabelText("Limit price per share");
    expect(price).toHaveAttribute("placeholder", "≈ $12.00");
    fireEvent.change(price, { target: { value: "13.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Close…" }));
    await waitFor(() => expect(reviewed).toHaveLength(1));
    expect(reviewed[0]).toMatchObject({ orderType: "limit", limitPrice: 13.5 });
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /Confirm — close 2 · limit \$13\.50 · est \$2,700\.00/,
        }),
      ).toBeInTheDocument(),
    );
  });

  it("disarms a standing review when the order type changes", async () => {
    render(withClient(<OptionPositionsCard deskId="human-eric" positions={[held]} />));
    fireEvent.click(screen.getByRole("button", { name: "Close…" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Confirm/ })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Limit" }));
    expect(screen.queryByRole("button", { name: /Confirm/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close…" })).toBeInTheDocument();
  });
});
